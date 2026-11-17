"""Mashq (o'zlashtirish sikli), boshlang'ich/yakuniy test, takrorlash (FSRS) va shaxsiy progress."""
import uuid
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.deps import CurrentUser, DbDep
from app.models import (
    Lesson,
    LessonProgress,
    Module,
    ModuleVideoView,
    PracticeSession,
    Question,
    QuestionAttempt,
    ReviewCard,
    TestAttempt,
)
from app.schemas.learning import (
    AnswerIn,
    AnswerOut,
    LessonProgressOut,
    ModuleMastery,
    PracticeStartIn,
    PracticeStartOut,
    ProgressOut,
    ReviewAnswerOut,
    ReviewBatchOut,
    ReviewItem,
    SectionMastery,
    TestProgressOut,
    TestResultOut,
    TestStartOut,
    TestSubmitIn,
)
from app.api.content import question_public
from app.services.learning import (
    FIRST_TRY_XP,
    LESSON_BASE_XP,
    REVIEW_XP,
    TEST_PASS_XP,
    done_lesson_ids,
    is_correct,
    latest_signals,
    lesson_unlocked,
    level_of,
    mastery_level,
    pick_test_questions,
    pretest_done,
    record_review,
    section_key,
    video_watched,
)

router = APIRouter(tags=["learning"])


async def _module(db, slug: str) -> Module:
    m = await db.scalar(
        select(Module).where(Module.slug == slug).options(selectinload(Module.lessons).selectinload(Lesson.questions))
    )
    if m is None or m.status != "ready":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Modul topilmadi")
    return m


def _feedback(q: Question, ok: bool, confidence: str | None) -> dict:
    return dict(
        correct=ok,
        correct_answer=q.correct,
        explanation=q.explanation,
        option_notes=q.option_notes,
        source=q.source,
        confidently_wrong=(not ok) and confidence == "sure",
    )


async def _retention(db, q: Question) -> float:
    return await db.scalar(select(Module.retention).join(Lesson, Lesson.module_id == Module.id).where(Lesson.id == q.lesson_id)) or 0.9


# ---------------------------------------------------------------------------
# Mashq
# ---------------------------------------------------------------------------
@router.post("/practice/sessions", response_model=PracticeStartOut, status_code=status.HTTP_201_CREATED)
async def start_practice(body: PracticeStartIn, user: CurrentUser, db: DbDep):
    m = await _module(db, body.module_slug)
    lesson = next((x for x in m.lessons if x.slug == body.lesson_slug), None)
    if lesson is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dars topilmadi")
    unlocked = lesson_unlocked(
        m, lesson, await done_lesson_ids(db, user.id), await video_watched(db, user.id, m.id), await pretest_done(db, user.id, m.id)
    )
    if not unlocked:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Avval boshlang'ich testni topshiring, mavzu videosini ko'ring va oldingi darsni o'zlashtiring"
        )
    s = PracticeSession(user_id=user.id, lesson_id=lesson.id)
    db.add(s)
    await db.commit()
    ids = [q.id for q in lesson.questions]
    return PracticeStartOut(session_id=s.id, question_ids=ids, total=len(ids))


@router.post("/practice/sessions/{session_id}/answer", response_model=AnswerOut)
async def answer_practice(session_id: uuid.UUID, body: AnswerIn, user: CurrentUser, db: DbDep):
    s = await db.get(PracticeSession, session_id)
    if s is None or s.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Sessiya topilmadi")
    q = await db.get(Question, body.question_id)
    if q is None or q.lesson_id != s.lesson_id:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Savol bu darsga tegishli emas")
    if s.completed_at is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Mashq allaqachon yakunlangan")

    prev = await db.scalar(
        select(func.count()).select_from(QuestionAttempt).where(
            QuestionAttempt.practice_session_id == s.id, QuestionAttempt.question_id == q.id
        )
    )
    ok = is_correct(q, body.answer)
    db.add(
        QuestionAttempt(
            user_id=user.id,
            question_id=q.id,
            practice_session_id=s.id,
            context="practice",
            answer=body.answer,
            is_correct=ok,
            confidence=body.confidence,
        )
    )
    if prev == 0:
        # Faqat birinchi urinish — halol signal; takrorlash jadvaliga yoziladi
        await record_review(db, user.id, q, ok, body.confidence, await _retention(db, q))
        if ok:
            s.first_try += 1
    await db.flush()

    total = await db.scalar(select(func.count()).select_from(Question).where(Question.lesson_id == s.lesson_id))
    mastered = await db.scalar(
        select(func.count(func.distinct(QuestionAttempt.question_id))).where(
            QuestionAttempt.practice_session_id == s.id, QuestionAttempt.is_correct.is_(True)
        )
    )

    xp = 0
    completed = mastered >= total
    if completed:
        s.completed_at = datetime.now(timezone.utc)
        lp = await db.get(LessonProgress, (user.id, s.lesson_id))
        if lp is None:
            xp = LESSON_BASE_XP + FIRST_TRY_XP * s.first_try
            db.add(LessonProgress(user_id=user.id, lesson_id=s.lesson_id, first_try=s.first_try, total=total))
            user.xp += xp
        else:
            lp.first_try = max(lp.first_try, s.first_try)
    await db.commit()

    return AnswerOut(
        **_feedback(q, ok, body.confidence),
        mastered=mastered,
        total=total,
        lesson_completed=completed,
        first_try=s.first_try,
        xp_gained=xp,
    )


# ---------------------------------------------------------------------------
# Boshlang'ich va yakuniy test
# ---------------------------------------------------------------------------
@router.post("/tests/{module_slug}/start", response_model=TestStartOut, status_code=status.HTTP_201_CREATED)
async def start_test(module_slug: str, user: CurrentUser, db: DbDep, kind: Literal["pre", "final"] = "final"):
    m = await _module(db, module_slug)
    if kind == "pre":
        if await pretest_done(db, user.id, m.id):
            raise HTTPException(status.HTTP_409_CONFLICT, "Boshlang'ich test allaqachon topshirilgan")
        size = settings.pre_test_size
    else:
        done = await done_lesson_ids(db, user.id)
        if any(les.id not in done for les in m.lessons):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Yakuniy test barcha darslar o'zlashtirilgandan keyin ochiladi")
        size = settings.final_test_size
    qs = pick_test_questions(m, size)
    a = TestAttempt(user_id=user.id, module_id=m.id, kind=kind, question_ids=[q.id for q in qs])
    db.add(a)
    await db.commit()
    return TestStartOut(attempt_id=a.id, kind=kind, questions=[question_public(q) for q in qs], pass_percent=settings.pass_percent)


async def _pre_score(db, user_id: int, module_id: int) -> int | None:
    return await db.scalar(
        select(TestAttempt.score_pct)
        .where(TestAttempt.user_id == user_id, TestAttempt.module_id == module_id, TestAttempt.kind == "pre", TestAttempt.submitted_at.is_not(None))
        .order_by(TestAttempt.submitted_at)
        .limit(1)
    )


@router.post("/tests/attempts/{attempt_id}/submit", response_model=TestResultOut)
async def submit_test(attempt_id: uuid.UUID, body: TestSubmitIn, user: CurrentUser, db: DbDep):
    a = await db.get(TestAttempt, attempt_id)
    if a is None or a.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Test topilmadi")
    if a.submitted_at is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Test allaqachon topshirilgan")
    pre = a.kind == "pre"
    retention = await db.scalar(select(Module.retention).where(Module.id == a.module_id)) or 0.9

    answers = {x.question_id: x for x in body.answers}
    qs = {q.id: q for q in (await db.execute(select(Question).where(Question.id.in_(a.question_ids)))).scalars()}
    correct = 0
    mistakes: list[ReviewItem] = []
    for qid in a.question_ids:
        q = qs[qid]
        given = answers.get(qid)
        ans = given.answer if given else []
        conf = given.confidence if given else None
        ok = is_correct(q, ans)
        correct += ok
        db.add(
            QuestionAttempt(
                user_id=user.id,
                question_id=qid,
                test_attempt_id=a.id,
                context="pretest" if pre else "test",
                answer=ans,
                is_correct=ok,
                confidence=conf,
            )
        )
        if pre:
            continue  # boshlang'ich test — faqat o'lchov: takrorlash jadvaliga ham, xatolar ro'yxatiga ham kirmaydi
        await record_review(db, user.id, q, ok, conf, retention)
        if not ok:
            mistakes.append(ReviewItem(question=question_public(q), your_answer=ans, **_feedback(q, ok, conf)))

    total = len(a.question_ids)
    pct = round(correct * 100 / total) if total else 0
    xp = 0
    passed = False
    if not pre:
        passed = pct >= settings.pass_percent
        already_passed = await db.scalar(
            select(func.count()).select_from(TestAttempt).where(
                TestAttempt.user_id == user.id,
                TestAttempt.module_id == a.module_id,
                TestAttempt.kind == "final",
                TestAttempt.passed.is_(True),
            )
        )
        xp = TEST_PASS_XP if passed and not already_passed else 0
        user.xp += xp
    a.submitted_at = datetime.now(timezone.utc)
    a.score_pct = pct
    a.passed = None if pre else passed
    await db.commit()
    return TestResultOut(
        kind=a.kind,
        pre_score=None if pre else await _pre_score(db, user.id, a.module_id),
        score_pct=pct,
        passed=passed,
        correct=correct,
        total=total,
        xp_gained=xp,
        mistakes=mistakes,
    )


# ---------------------------------------------------------------------------
# Takrorlash (spaced repetition)
# ---------------------------------------------------------------------------
def _due_query(user_id: int, now: datetime):
    """Takrorlash vaqti kelgan savollar — faqat o'quvchi o'zlashtirgan darslardan."""
    return (
        select(ReviewCard)
        .join(Question, Question.id == ReviewCard.question_id)
        .join(LessonProgress, (LessonProgress.lesson_id == Question.lesson_id) & (LessonProgress.user_id == ReviewCard.user_id))
        .where(ReviewCard.user_id == user_id, ReviewCard.due <= now)
    )


async def _due_count(db, user_id: int, now: datetime) -> int:
    return await db.scalar(select(func.count()).select_from(_due_query(user_id, now).subquery())) or 0


@router.get("/review", response_model=ReviewBatchOut)
async def review_batch(user: CurrentUser, db: DbDep):
    now = datetime.now(timezone.utc)
    rows = await db.execute(
        _due_query(user.id, now)
        .join(Lesson, Lesson.id == Question.lesson_id)
        .join(Module, Module.id == Lesson.module_id)
        .add_columns(Question)
        .order_by(Module.retention.desc(), ReviewCard.due)  # avval xavfli mavzular
        .limit(settings.review_batch)
    )
    questions = [question_public(q) for _, q in rows]
    next_due = await db.scalar(
        select(func.min(ReviewCard.due))
        .join(Question, Question.id == ReviewCard.question_id)
        .join(LessonProgress, (LessonProgress.lesson_id == Question.lesson_id) & (LessonProgress.user_id == ReviewCard.user_id))
        .where(ReviewCard.user_id == user.id, ReviewCard.due > now)
    )
    return ReviewBatchOut(due=await _due_count(db, user.id, now), next_due=next_due, questions=questions)


@router.post("/review/answer", response_model=ReviewAnswerOut)
async def review_answer(body: AnswerIn, user: CurrentUser, db: DbDep):
    now = datetime.now(timezone.utc)
    rc = await db.get(ReviewCard, (user.id, body.question_id))
    if rc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Bu savol takrorlash ro'yxatida yo'q")
    if rc.due > now:
        raise HTTPException(status.HTTP_409_CONFLICT, "Bu savolni takrorlash vaqti hali kelmagan")
    q = await db.get(Question, body.question_id)
    ok = is_correct(q, body.answer)
    db.add(QuestionAttempt(user_id=user.id, question_id=q.id, context="review", answer=body.answer, is_correct=ok, confidence=body.confidence))
    rc = await record_review(db, user.id, q, ok, body.confidence, await _retention(db, q), now)
    xp = REVIEW_XP if ok else 0
    user.xp += xp
    await db.commit()
    return ReviewAnswerOut(**_feedback(q, ok, body.confidence), next_review=rc.due, due_left=await _due_count(db, user.id, now), xp_gained=xp)


# ---------------------------------------------------------------------------
# Mavzu videosi
# ---------------------------------------------------------------------------
@router.post("/progress/videos/{module_slug}", status_code=status.HTTP_204_NO_CONTENT)
async def video_done(module_slug: str, user: CurrentUser, db: DbDep):
    m = await _module(db, module_slug)
    if not await video_watched(db, user.id, m.id):
        db.add(ModuleVideoView(user_id=user.id, module_id=m.id))
        await db.commit()


# ---------------------------------------------------------------------------
# Progress
# ---------------------------------------------------------------------------
@router.get("/progress/me", response_model=ProgressOut)
async def my_progress(user: CurrentUser, db: DbDep):
    rows = await db.execute(
        select(Module.slug, Lesson.slug, LessonProgress.first_try, LessonProgress.total)
        .join(Lesson, Lesson.id == LessonProgress.lesson_id)
        .join(Module, Module.id == Lesson.module_id)
        .where(LessonProgress.user_id == user.id)
    )
    lessons = {f"{m}/{l}": LessonProgressOut(done=True, first_try=ft, total=t) for m, l, ft, t in rows}

    submitted = (TestAttempt.user_id == user.id) & TestAttempt.submitted_at.is_not(None)
    trows = await db.execute(
        select(
            Module.slug,
            func.max(TestAttempt.score_pct),
            func.bool_or(TestAttempt.passed),
            func.count(TestAttempt.id),
        )
        .join(Module, Module.id == TestAttempt.module_id)
        .where(submitted, TestAttempt.kind == "final")
        .group_by(Module.slug)
    )
    tests = {slug: TestProgressOut(best=best or 0, passed=bool(p), attempts=n) for slug, best, p, n in trows}
    prows = await db.execute(
        select(Module.slug, func.min(TestAttempt.score_pct))
        .join(Module, Module.id == TestAttempt.module_id)
        .where(submitted, TestAttempt.kind == "pre")
        .group_by(Module.slug)
    )
    vrows = await db.execute(
        select(Module.slug).join(ModuleVideoView, ModuleVideoView.module_id == Module.id).where(ModuleVideoView.user_id == user.id)
    )
    return ProgressOut(
        xp=user.xp,
        level=level_of(user.xp),
        lessons=lessons,
        tests=tests,
        videos=list(vrows.scalars()),
        pretests={slug: pct for slug, pct in prows},
        review_due=await _due_count(db, user.id, datetime.now(timezone.utc)),
    )


@router.get("/progress/mastery", response_model=list[ModuleMastery])
async def my_mastery(user: CurrentUser, db: DbDep):
    """Protokol bo'limlari bo'yicha o'zlashtirish darajasi (faqat boshlangan modullar)."""
    attempts = (
        await db.execute(select(QuestionAttempt).where(QuestionAttempt.user_id == user.id, QuestionAttempt.context != "pretest"))
    ).scalars().all()
    signals = latest_signals(list(attempts))
    modules = (
        await db.execute(
            select(Module)
            .where(Module.status == "ready")
            .options(selectinload(Module.lessons).selectinload(Lesson.questions))
            .order_by(Module.order_no)
        )
    ).scalars().all()
    out: list[ModuleMastery] = []
    for m in modules:
        groups: dict[str, tuple[Lesson, list[Question]]] = {}
        for les in m.lessons:
            for q in les.questions:
                groups.setdefault(section_key(q.source), (les, []))[1].append(q)
        sections = []
        for sec, (les, qs) in groups.items():
            level, right, risky = mastery_level(qs, signals)
            sections.append(SectionMastery(section=sec, lesson_title=les.title, questions=len(qs), correct=right, level=level, risky=risky))
        if any(s.level > 0 for s in sections):
            out.append(ModuleMastery(slug=m.slug, title=m.title, protocol_id=m.protocol_id, sections=sections))
    return out
