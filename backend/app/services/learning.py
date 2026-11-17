"""O'quv qoidalari: baholash, ball (XP), darslarning ketma-ket ochilishi."""
import random
from datetime import datetime, timedelta, timezone

from fsrs import Card, Rating, Scheduler
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Lesson, LessonProgress, Module, ModuleVideoView, Question, QuestionAttempt, ReviewCard, TestAttempt

LESSON_BASE_XP = 50
FIRST_TRY_XP = 10
TEST_PASS_XP = 200
LEVEL_XP = [0, 300, 800, 1500]


def is_correct(q: Question, answer: list[int]) -> bool:
    if q.type == "order":
        return list(answer) == list(q.correct)
    return sorted(set(answer)) == sorted(q.correct) and len(answer) == len(set(answer))


def level_of(xp: int) -> int:
    lvl = 0
    for i, need in enumerate(LEVEL_XP):
        if xp >= need:
            lvl = i
    return lvl


async def done_lesson_ids(db: AsyncSession, user_id: int) -> set[int]:
    rows = await db.execute(select(LessonProgress.lesson_id).where(LessonProgress.user_id == user_id))
    return set(rows.scalars())


async def video_watched(db: AsyncSession, user_id: int, module_id: int) -> bool:
    return await db.get(ModuleVideoView, (user_id, module_id)) is not None


async def pretest_done(db: AsyncSession, user_id: int, module_id: int) -> bool:
    n = await db.scalar(
        select(TestAttempt.id).where(
            TestAttempt.user_id == user_id, TestAttempt.module_id == module_id, TestAttempt.kind == "pre", TestAttempt.submitted_at.is_not(None)
        ).limit(1)
    )
    return n is not None


def lesson_unlocked(module: Module, lesson: Lesson, done: set[int], video_seen: bool, pre_done: bool = True) -> bool:
    """Dars ochiq: o'zi allaqachon o'tilgan; birinchi dars — boshlang'ich test topshirilgan va mavzu videosi ko'rilgan
    (modulni avval boshlaganlar uchun boshlang'ich test talab qilinmaydi); qolganlari — oldingi dars o'zlashtirilgan."""
    if lesson.id in done:
        return True
    idx = next(i for i, x in enumerate(module.lessons) if x.id == lesson.id)
    if idx == 0:
        started = any(les.id in done for les in module.lessons)
        return video_seen and (pre_done or started)
    return module.lessons[idx - 1].id in done


def pick_test_questions(module: Module, size: int) -> list[Question]:
    """Har bir darsdan navbatma-navbat, so'ng aralashtirish."""
    pools = [random.sample(les.questions, len(les.questions)) for les in module.lessons]
    out: list[Question] = []
    k = 0
    while len(out) < size and any(pools):
        p = pools[k % len(pools)]
        if p:
            out.append(p.pop())
        k += 1
    random.shuffle(out)
    return out


# ---------------------------------------------------------------------------
# Takrorlash (spaced repetition, FSRS)
# ---------------------------------------------------------------------------
# Javob + ishonch → FSRS bahosi. "Taxmin bilan to'g'ri" — bilim hali mustahkam emas.
CONFIDENCES = ("sure", "unsure", "guess")
REVIEW_XP = 5


def rating_for(ok: bool, confidence: str | None) -> Rating:
    if not ok:
        return Rating.Again
    if confidence in ("unsure", "guess"):
        return Rating.Hard
    return Rating.Good


def _scheduler(retention: float) -> Scheduler:
    # Ish kunlari bo'yicha takrorlash: daqiqalik "learning steps" kerak emas — birdan kunlik intervallar.
    return Scheduler(desired_retention=retention, learning_steps=(), relearning_steps=(), enable_fuzzing=False)


async def record_review(
    db: AsyncSession, user_id: int, q: Question, ok: bool, confidence: str | None, retention: float, now: datetime | None = None
) -> ReviewCard:
    """Javobni takrorlash kartochkasiga yozadi va keyingi takrorlash vaqtini hisoblaydi."""
    now = now or datetime.now(timezone.utc)
    rc = await db.get(ReviewCard, (user_id, q.id))
    card = Card.from_dict(rc.card) if rc else Card()
    card, _ = _scheduler(retention).review_card(card, rating_for(ok, confidence), now)
    # Bir kunda bir necha marta xato qilinsa ham, keyingi takrorlash kamida ertaga
    due = max(card.due, now + timedelta(hours=20))
    if rc is None:
        rc = ReviewCard(user_id=user_id, question_id=q.id, reps=0, lapses=0)
        db.add(rc)
    rc.card = card.to_dict()
    rc.due = due
    rc.reps += 1
    rc.lapses += 0 if ok else 1
    return rc


# ---------------------------------------------------------------------------
# Protokol bo'limi bo'yicha o'zlashtirish darajasi (Khan Academy uslubi)
# ---------------------------------------------------------------------------
# 0 — boshlanmagan · 1 — urinib ko'rdi (<70%) · 2 — tanish (70–99%) · 3 — mohir (100%)
# 4 — o'zlashtirdi: 100% va har bir savolga oxirgi marta test/takrorlashda "aniq bilaman" bilan to'g'ri javob.
# Keyin xato qilinsa daraja avtomatik tushadi (oxirgi javob hisobga olinadi).
MASTERY_LEVELS = 4


def section_key(source: dict) -> str:
    return str(source.get("section", "")).strip()


def latest_signals(attempts: list[QuestionAttempt]) -> dict[str, QuestionAttempt]:
    """Har bir savol bo'yicha eng so'nggi "halol" javob.

    Mashqda faqat sessiyadagi birinchi urinish hisoblanadi (keyingilari — izohni ko'rgandan keyingi takror).
    """
    seen_in_session: set[tuple] = set()
    out: dict[str, QuestionAttempt] = {}
    for a in sorted(attempts, key=lambda x: (x.created_at, x.id)):
        if a.context == "practice":
            key = (a.practice_session_id, a.question_id)
            if key in seen_in_session:
                continue
            seen_in_session.add(key)
        out[a.question_id] = a
    return out


def mastery_level(questions: list[Question], signals: dict[str, QuestionAttempt]) -> tuple[int, int, bool]:
    """(daraja, to'g'ri javoblar soni, ishonch bilan xato bormi)."""
    got = [signals[q.id] for q in questions if q.id in signals]
    if not got:
        return 0, 0, False
    right = sum(1 for a in got if a.is_correct)
    risky = any((not a.is_correct) and a.confidence == "sure" for a in got)
    score = right / len(questions)
    if score < 0.7:
        return 1, right, risky
    if score < 1:
        return 2, right, risky
    solid = all(a.context in ("test", "review") and a.confidence == "sure" for a in got)
    return (4 if solid else 3), right, risky
