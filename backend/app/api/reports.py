"""Inspektor hisobotlari: kim o'qiyapti, qaysi protokol bo'yicha zaif, muassasalar kesimida."""
from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import case, distinct, func, select

from app.core.deps import DbDep, InspectorUser
from app.models import Institution, Lesson, LessonProgress, Module, Question, QuestionAttempt, ReviewCard, Role, TestAttempt, User
from app.schemas.report import HardQuestion, InstitutionStat, ModuleStat, ReportOut, SectionStat, Totals

QA = QuestionAttempt


def _pct(v) -> float | None:
    return round(float(v) * 100, 1) if v is not None else None

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/overview", response_model=ReportOut)
async def overview(_: InspectorUser, db: DbDep, institution_id: int | None = None):
    learner_q = select(User.id).where(User.role == Role.learner, User.is_active.is_(True))
    if institution_id is not None:
        learner_q = learner_q.where(User.institution_id == institution_id)
    learners = learner_q.subquery()
    in_scope = LessonProgress.user_id.in_(select(learners.c.id))

    # --- Umumiy ko'rsatkichlar ---
    n_learners = await db.scalar(select(func.count()).select_from(learners))
    n_active = await db.scalar(select(func.count(distinct(LessonProgress.user_id))).where(in_scope))
    n_lessons = await db.scalar(select(func.count()).select_from(LessonProgress).where(in_scope))
    passed_pairs = (
        select(TestAttempt.user_id, TestAttempt.module_id)
        .where(TestAttempt.passed.is_(True), TestAttempt.user_id.in_(select(learners.c.id)))
        .distinct()
        .subquery()
    )
    n_passed = await db.scalar(select(func.count()).select_from(passed_pairs))

    # "Halol" javoblar: test/takrorlash va mashqda faqat birinchi urinish (izohni ko'rgandan keyingi takror emas)
    rn = func.row_number().over(partition_by=(QA.user_id, QA.practice_session_id, QA.question_id), order_by=QA.id)
    raw = (
        select(QA.id, QA.user_id, QA.question_id, QA.context, QA.is_correct, QA.confidence, rn.label("rn"))
        .where(QA.user_id.in_(select(learners.c.id)), QA.context != "pretest")
        .subquery()
    )
    honest = select(raw).where((raw.c.context != "practice") | (raw.c.rn == 1)).subquery()
    wrong = case((honest.c.is_correct.is_(False), 1.0), else_=0.0)
    # ishonch bilan xato ulushi — faqat ishonch belgilangan javoblar orasida
    cw = func.avg(case((honest.c.confidence.is_(None), None), (honest.c.is_correct.is_(False) & (honest.c.confidence == "sure"), 1.0), else_=0.0))
    cw_total = await db.scalar(select(cw))
    review_due = await db.scalar(
        select(func.count()).select_from(ReviewCard).where(ReviewCard.user_id.in_(select(learners.c.id)), ReviewCard.due <= datetime.now(timezone.utc))
    )

    # --- Modullar bo'yicha ---
    best = (
        select(TestAttempt.user_id, TestAttempt.module_id, func.max(TestAttempt.score_pct).label("best"), func.bool_or(TestAttempt.passed).label("passed"), func.count().label("n"))
        .where(TestAttempt.submitted_at.is_not(None), TestAttempt.kind == "final", TestAttempt.user_id.in_(select(learners.c.id)))
        .group_by(TestAttempt.user_id, TestAttempt.module_id)
        .subquery()
    )
    pre = (
        select(TestAttempt.user_id, TestAttempt.module_id, func.min(TestAttempt.score_pct).label("pre"))
        .where(TestAttempt.submitted_at.is_not(None), TestAttempt.kind == "pre", TestAttempt.user_id.in_(select(learners.c.id)))
        .group_by(TestAttempt.user_id, TestAttempt.module_id)
        .subquery()
    )
    per_user_module = (
        select(LessonProgress.user_id, Lesson.module_id, func.count().label("done"))
        .join(Lesson, Lesson.id == LessonProgress.lesson_id)
        .where(in_scope)
        .group_by(LessonProgress.user_id, Lesson.module_id)
        .subquery()
    )
    lesson_counts = select(Lesson.module_id, func.count().label("n")).group_by(Lesson.module_id).subquery()

    modules = (await db.execute(select(Module).where(Module.status == "ready").order_by(Module.order_no))).scalars().all()
    module_stats: list[ModuleStat] = []
    for m in modules:
        n_les = await db.scalar(select(lesson_counts.c.n).where(lesson_counts.c.module_id == m.id)) or 0
        started, completed = (
            await db.execute(
                select(
                    func.count(),
                    func.count().filter(per_user_module.c.done >= n_les),
                ).where(per_user_module.c.module_id == m.id)
            )
        ).one()
        attempts, passed, avg_best = (
            await db.execute(
                select(func.coalesce(func.sum(best.c.n), 0), func.count().filter(best.c.passed.is_(True)), func.avg(best.c.best)).where(
                    best.c.module_id == m.id
                )
            )
        ).one()
        avg_pre, avg_gain = (
            await db.execute(
                select(func.avg(pre.c.pre), func.avg(best.c.best - pre.c.pre))
                .select_from(pre)
                .join(best, (best.c.user_id == pre.c.user_id) & (best.c.module_id == pre.c.module_id), isouter=True)
                .where(pre.c.module_id == m.id)
            )
        ).one()
        module_stats.append(
            ModuleStat(
                slug=m.slug,
                title=m.title,
                protocol_id=m.protocol_id,
                lessons=n_les,
                learners_started=started,
                learners_completed_lessons=completed,
                test_attempts=int(attempts),
                learners_passed=passed,
                avg_best_score=round(float(avg_best), 1) if avg_best is not None else None,
                avg_pre_score=round(float(avg_pre), 1) if avg_pre is not None else None,
                avg_gain=round(float(avg_gain), 1) if avg_gain is not None else None,
            )
        )

    # --- Muassasalar bo'yicha ---
    lp_by_user = select(LessonProgress.user_id, func.count().label("n")).group_by(LessonProgress.user_id).subquery()
    pass_by_user = (
        select(best.c.user_id, func.count().filter(best.c.passed.is_(True)).label("passed"), func.avg(best.c.best).label("avg"))
        .group_by(best.c.user_id)
        .subquery()
    )
    cw_by_user = (
        select(
            honest.c.user_id,
            func.count().filter(honest.c.confidence.is_not(None)).label("rated"),
            func.count().filter(honest.c.is_correct.is_(False) & (honest.c.confidence == "sure")).label("cw"),
        )
        .group_by(honest.c.user_id)
        .subquery()
    )
    inst_rows = await db.execute(
        select(
            Institution.id,
            Institution.name,
            Institution.region,
            func.count(User.id),
            func.count(lp_by_user.c.user_id),
            func.coalesce(func.sum(lp_by_user.c.n), 0),
            func.coalesce(func.sum(pass_by_user.c.passed), 0),
            func.avg(pass_by_user.c.avg),
            func.sum(cw_by_user.c.cw) / func.nullif(func.sum(cw_by_user.c.rated), 0),
        )
        .select_from(User)
        .join(Institution, Institution.id == User.institution_id, isouter=True)
        .join(lp_by_user, lp_by_user.c.user_id == User.id, isouter=True)
        .join(pass_by_user, pass_by_user.c.user_id == User.id, isouter=True)
        .join(cw_by_user, cw_by_user.c.user_id == User.id, isouter=True)
        .where(User.id.in_(select(learners.c.id)))
        .group_by(Institution.id, Institution.name, Institution.region)
        .order_by(func.coalesce(func.sum(lp_by_user.c.n), 0).desc())
    )
    institutions = [
        InstitutionStat(
            id=iid,
            name=name or "—",
            region=region or "",
            learners=n,
            active_learners=active,
            lessons_completed=int(les),
            tests_passed=int(p),
            avg_best_score=round(float(avg), 1) if avg is not None else None,
            confident_wrong_pct=_pct(cwp),
        )
        for iid, name, region, n, active, les, p, avg, cwp in inst_rows
    ]

    # --- Eng ko'p xato qilinadigan savollar ---
    err = func.avg(wrong)
    hard_rows = await db.execute(
        select(Question, Module.slug, func.count(), err, cw)
        .select_from(honest)
        .join(Question, Question.id == honest.c.question_id)
        .join(Lesson, Lesson.id == Question.lesson_id)
        .join(Module, Module.id == Lesson.module_id)
        .group_by(Question.id, Module.slug)
        .having(func.count() >= 5)
        .order_by(err.desc(), func.count().desc())
        .limit(10)
    )
    hardest = [
        HardQuestion(
            id=q.id, module_slug=slug, prompt=q.prompt, case=q.case, source=q.source, attempts=n, error_rate=round(float(e) * 100, 1), confident_wrong_rate=_pct(c)
        )
        for q, slug, n, e, c in hard_rows
    ]

    # --- Protokol bo'limlari bo'yicha zaif joylar ---
    sec = Question.source["section"].astext
    sec_rows = await db.execute(
        select(Module.slug, Module.protocol_id, Lesson.id, sec, func.count(), err, cw)
        .select_from(honest)
        .join(Question, Question.id == honest.c.question_id)
        .join(Lesson, Lesson.id == Question.lesson_id)
        .join(Module, Module.id == Lesson.module_id)
        .group_by(Module.slug, Module.protocol_id, Lesson.id, sec)
        .having(func.count() >= 10)
        .order_by(err.desc())
        .limit(10)
    )
    titles = {m.slug: m.title for m in modules}
    lesson_titles = dict((await db.execute(select(Lesson.id, Lesson.title))).all())
    weak_sections = [
        SectionStat(
            module_slug=slug,
            module_title=titles.get(slug, {}),
            protocol_id=pid,
            section=section or "",
            lesson_title=lesson_titles.get(lid, {}),
            attempts=n,
            error_rate=round(float(e) * 100, 1),
            confident_wrong_rate=_pct(c),
        )
        for slug, pid, lid, section, n, e, c in sec_rows
    ]

    return ReportOut(
        totals=Totals(
            learners=n_learners or 0,
            active_learners=n_active or 0,
            lessons_completed=n_lessons or 0,
            tests_passed=n_passed or 0,
            confident_wrong_pct=_pct(cw_total),
            review_due=review_due or 0,
        ),
        modules=module_stats,
        institutions=institutions,
        hardest_questions=hardest,
        weak_sections=weak_sections,
    )
