"""Bazani to'ldirish.

    python -m app.seed.run          # faqat kontent (content/*.json → DB)
    python -m app.seed.run --demo   # + demo muassasalar, inspektor/admin, sun'iy o'quvchilar progressi

Demo ma'lumotlar `is_demo=True` bilan belgilanadi va faqat lokal ko'rsatish uchun.
"""
import argparse
import asyncio
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models import Institution, Lesson, LessonProgress, Module, ModuleVideoView, QuestionAttempt, Role, TestAttempt, User
from app.services.content_loader import sync_content
from app.services.learning import FIRST_TRY_XP, LESSON_BASE_XP, TEST_PASS_XP, pick_test_questions, record_review

DEMO_INSTITUTIONS = [
    ("Demo: Toshkent shahar tug'ruq kompleksi", "Toshkent sh."),
    ("Demo: Samarqand viloyat perinatal markazi", "Samarqand"),
    ("Demo: Farg'ona viloyat perinatal markazi", "Farg'ona"),
    ("Demo: Qashqadaryo viloyat tug'ruq kompleksi", "Qashqadaryo"),
    ("Demo: Xorazm tuman tug'ruq bo'limi", "Xorazm"),
]
FIRST = ["Dilfuza", "Gulnora", "Mohira", "Nodira", "Shahnoza", "Zarina", "Feruza", "Madina", "Sevara", "Umida", "Aziz", "Bobur", "Sardor", "Jamshid", "Otabek"]
LAST = ["Karimova", "Rahimova", "Yusupova", "Tursunova", "Aliyeva", "Ergasheva", "Nazarova", "Qodirova", "Saidova", "Xolmatova"]
POSITIONS = ["Akusherka", "Akusher-ginekolog", "Neonatolog", "Hamshira", "Anesteziolog-reanimatolog"]


async def seed_content() -> None:
    async with AsyncSessionLocal() as db:
        stats = await sync_content(db, settings.content_path)
        print("Kontent yuklandi:", stats)


async def _user(db, phone: str, name: str, password: str, role: Role, inst_id: int | None = None, position: str = "") -> User:
    u = await db.scalar(select(User).where(User.phone == phone))
    if u is None:
        u = User(phone=phone, full_name=name, password_hash=hash_password(password), role=role, institution_id=inst_id, position=position, is_demo=True)
        db.add(u)
    return u


async def seed_demo(learners_per_inst: int = 8) -> None:
    if not (settings.demo_inspector_password and settings.demo_admin_password and settings.demo_learner_password):
        raise SystemExit("DEMO_*_PASSWORD qiymatlari .env da berilmagan")
    rnd = random.Random(2026)
    async with AsyncSessionLocal() as db:
        # Avvalgi demo o'quvchilarni tozalash (kaskad bilan progress ham o'chadi)
        await db.execute(delete(User).where(User.is_demo.is_(True), User.role == Role.learner))

        insts = []
        for name, region in DEMO_INSTITUTIONS:
            inst = await db.scalar(select(Institution).where(Institution.name == name))
            if inst is None:
                inst = Institution(name=name, region=region)
                db.add(inst)
            insts.append(inst)
        await db.flush()

        await _user(db, settings.demo_inspector_phone, "Inspektor (demo)", settings.demo_inspector_password, Role.inspector)
        await _user(db, settings.demo_admin_phone, "Administrator (demo)", settings.demo_admin_password, Role.admin)

        modules = (
            await db.execute(
                select(Module).where(Module.status == "ready").options(selectinload(Module.lessons).selectinload(Lesson.questions)).order_by(Module.order_no)
            )
        ).scalars().all()
        difficulty = {q.id: rnd.uniform(0.0, 0.45) for m in modules for les in m.lessons for q in les.questions}

        now = datetime.now(timezone.utc)
        n = 0
        for inst_i, inst in enumerate(insts):
            engagement = [0.9, 0.7, 0.55, 0.4, 0.25][inst_i % 5]
            for _ in range(learners_per_inst):
                n += 1
                skill = rnd.uniform(0.55, 0.95)
                overconfidence = rnd.uniform(0.05, 0.6)  # xato javobda "aniq bilaman" deyish ehtimoli

                def conf(ok: bool) -> str:
                    if ok:
                        return rnd.choices(["sure", "unsure", "guess"], [0.65, 0.28, 0.07])[0]
                    return "sure" if rnd.random() < overconfidence else rnd.choice(["unsure", "guess"])
                u = User(
                    phone=f"+99890100{n:04d}",
                    full_name=f"{rnd.choice(LAST)} {rnd.choice(FIRST)}",
                    password_hash=hash_password(settings.demo_learner_password),
                    role=Role.learner,
                    institution_id=inst.id,
                    position=rnd.choice(POSITIONS),
                    is_demo=True,
                )
                db.add(u)
                await db.flush()
                for m in modules:
                    if rnd.random() > engagement:
                        continue
                    k = rnd.randint(1, len(m.lessons))
                    when = now - timedelta(days=rnd.randint(0, 6), hours=rnd.randint(0, 20))
                    db.add(ModuleVideoView(user_id=u.id, module_id=m.id, watched_at=when))
                    # boshlang'ich test — o'qishdan oldingi bilim
                    pqs = pick_test_questions(m, settings.pre_test_size)
                    pa = TestAttempt(user_id=u.id, module_id=m.id, kind="pre", question_ids=[q.id for q in pqs], started_at=when, submitted_at=when)
                    db.add(pa)
                    await db.flush()
                    pre_right = 0
                    for q in pqs:
                        ok = rnd.random() < skill - 0.3 - difficulty[q.id]
                        pre_right += ok
                        db.add(QuestionAttempt(user_id=u.id, question_id=q.id, test_attempt_id=pa.id, context="pretest", answer=[], is_correct=ok, confidence=conf(ok), created_at=when))
                    pa.score_pct = round(pre_right * 100 / len(pqs))
                    for les in m.lessons[:k]:
                        first = 0
                        for q in les.questions:
                            ok = rnd.random() < skill - difficulty[q.id]
                            c = conf(ok)
                            db.add(QuestionAttempt(user_id=u.id, question_id=q.id, context="practice", answer=[], is_correct=ok, confidence=c, created_at=when))
                            await record_review(db, u.id, q, ok, c, m.retention, when)
                            if ok:
                                first += 1
                            else:
                                db.add(QuestionAttempt(user_id=u.id, question_id=q.id, context="practice", answer=list(q.correct), is_correct=True, created_at=when))
                        db.add(LessonProgress(user_id=u.id, lesson_id=les.id, first_try=first, total=len(les.questions), completed_at=when))
                        await db.flush()
                        u.xp += LESSON_BASE_XP + FIRST_TRY_XP * first
                    if k == len(m.lessons):
                        passed_once = False
                        for _attempt in range(rnd.randint(1, 2)):
                            qs = pick_test_questions(m, settings.final_test_size)
                            a = TestAttempt(user_id=u.id, module_id=m.id, question_ids=[q.id for q in qs], started_at=when, submitted_at=when)
                            db.add(a)
                            await db.flush()
                            right = 0
                            for q in qs:
                                ok = rnd.random() < skill + 0.22 - difficulty[q.id]
                                right += ok
                                c = conf(ok)
                                db.add(QuestionAttempt(user_id=u.id, question_id=q.id, test_attempt_id=a.id, context="test", answer=[], is_correct=ok, confidence=c, created_at=when))
                                await record_review(db, u.id, q, ok, c, m.retention, when)
                            await db.flush()
                            a.score_pct = round(right * 100 / len(qs))
                            a.passed = a.score_pct >= settings.pass_percent
                            if a.passed and not passed_once:
                                u.xp += TEST_PASS_XP
                                passed_once = True
                            if a.passed:
                                break
        await db.commit()
        print(f"Demo: {len(insts)} muassasa, {n} o'quvchi, inspektor va admin hisoblari tayyor")


async def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--demo", action="store_true", help="demo muassasa/hisob/progress qo'shish")
    args = p.parse_args()
    await seed_content()
    if args.demo:
        await seed_demo()


if __name__ == "__main__":
    asyncio.run(main())
