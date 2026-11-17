"""P0: ishonch darajasi, variant izohlari, takrorlash (FSRS), bo'lim bo'yicha o'zlashtirish, boshlang'ich test."""
from datetime import datetime, timedelta, timezone

from sqlalchemy import update

from app.models import Question, ReviewCard, TestAttempt
from tests.conftest import register
from tests.helpers import lesson_questions, lesson_slugs, master_lesson, take_pretest, watch_video, wrong_answer

M = "partogramma"
L1 = "nima-uchun"


async def _session(client):
    await take_pretest(client, M)
    await watch_video(client, M)
    return (await client.post("/api/v1/practice/sessions", json={"module_slug": M, "lesson_slug": L1})).json()["session_id"]


async def test_confidently_wrong_and_option_notes(client, db, learner):
    qs = await lesson_questions(db, M, L1)
    q = next(x for x in qs if x.id == "p1-1")
    sid = await _session(client)
    r = await client.post(f"/api/v1/practice/sessions/{sid}/answer", json={"question_id": q.id, "answer": [1], "confidence": "sure"})
    body = r.json()
    assert body["correct"] is False and body["confidently_wrong"] is True
    # tanlangan noto'g'ri variant uchun izoh bor
    assert body["option_notes"][1]["uz"] and body["option_notes"][0] is None

    # noto'g'ri ishonch qiymati qabul qilinmaydi
    r = await client.post(f"/api/v1/practice/sessions/{sid}/answer", json={"question_id": q.id, "answer": [0], "confidence": "maybe"})
    assert r.status_code == 422


async def test_pretest_once_and_gain(client, db, learner):
    pre = await take_pretest(client, M)
    assert pre["kind"] == "pre" and pre["mistakes"] == [] and pre["passed"] is False
    assert await take_pretest(client, M) is None  # ikkinchi marta — 409

    for slug in await lesson_slugs(db, M):
        await master_lesson(client, db, M, slug)
    body = (await client.post(f"/api/v1/tests/{M}/start")).json()
    answers = []
    for q in body["questions"]:
        real = await db.get(Question, q["id"])
        answers.append({"question_id": q["id"], "answer": real.correct, "confidence": "sure"})
    res = (await client.post(f"/api/v1/tests/attempts/{body['attempt_id']}/submit", json={"answers": answers})).json()
    assert res["kind"] == "final" and res["score_pct"] == 100 and res["pre_score"] == pre["score_pct"]

    prog = (await client.get("/api/v1/progress/me")).json()
    assert prog["pretests"][M] == pre["score_pct"] and prog["tests"][M]["passed"]


async def test_started_module_needs_no_pretest(client, db, learner):
    """Boshlang'ich test joriy etilishidan oldin modulni boshlagan o'quvchi qulflanib qolmaydi."""
    await master_lesson(client, db, M, L1)
    await db.execute(update(TestAttempt).where(TestAttempt.kind == "pre").values(submitted_at=None))
    await db.commit()
    r = await client.post("/api/v1/practice/sessions", json={"module_slug": M, "lesson_slug": "boshlash-va-tuzilma"})
    assert r.status_code == 201


async def test_review_queue(client, db, learner):
    qs = await lesson_questions(db, M, L1)
    sid = await _session(client)
    # birinchi savolga xato, qolganlariga to'g'ri
    await client.post(f"/api/v1/practice/sessions/{sid}/answer", json={"question_id": qs[0].id, "answer": wrong_answer(qs[0]), "confidence": "sure"})
    for q in qs:
        await client.post(f"/api/v1/practice/sessions/{sid}/answer", json={"question_id": q.id, "answer": q.correct, "confidence": "sure"})

    # darhol takrorlash kerak emas — kamida ertaga
    batch = (await client.get("/api/v1/review")).json()
    assert batch["due"] == 0 and batch["questions"] == [] and batch["next_due"]
    assert (await client.post("/api/v1/review/answer", json={"question_id": qs[0].id, "answer": qs[0].correct})).status_code == 409

    # vaqtni "o'tkazamiz": hamma kartochka muddati keldi
    await db.execute(update(ReviewCard).values(due=datetime.now(timezone.utc) - timedelta(minutes=1)))
    await db.commit()
    batch = (await client.get("/api/v1/review")).json()
    assert batch["due"] == len(qs) and len(batch["questions"]) == len(qs)
    assert (await client.get("/api/v1/progress/me")).json()["review_due"] == len(qs)

    q = qs[0]
    r = (await client.post("/api/v1/review/answer", json={"question_id": q.id, "answer": q.correct, "confidence": "sure"})).json()
    assert r["correct"] and r["xp_gained"] == 5 and r["due_left"] == len(qs) - 1
    assert datetime.fromisoformat(r["next_review"]) > datetime.now(timezone.utc) + timedelta(hours=12)

    # ishonchsiz to'g'ri javob — interval "aniq bilaman"dan qisqa
    a, b = qs[1], qs[2]
    ra = (await client.post("/api/v1/review/answer", json={"question_id": a.id, "answer": a.correct, "confidence": "sure"})).json()
    rb = (await client.post("/api/v1/review/answer", json={"question_id": b.id, "answer": b.correct, "confidence": "guess"})).json()
    assert datetime.fromisoformat(rb["next_review"]) <= datetime.fromisoformat(ra["next_review"]) + timedelta(seconds=5)


async def test_section_mastery_levels_and_demotion(client, db, learner):
    await master_lesson(client, db, M, L1, confidence="unsure")
    mods = (await client.get("/api/v1/progress/mastery")).json()
    assert [m["slug"] for m in mods] == [M]
    secs = {s["section"]: s for s in mods[0]["sections"]}
    assert secs["2.2"]["level"] == 3  # hammasi to'g'ri, lekin mashqda → "mohir"
    assert secs["2.4"]["level"] == 0 if "2.4" in secs else True

    # takrorlashda "aniq bilaman" bilan to'g'ri → "o'zlashtirdi"
    await db.execute(update(ReviewCard).values(due=datetime.now(timezone.utc) - timedelta(minutes=1)))
    await db.commit()
    s22 = [q for q in await lesson_questions(db, M, L1) if q.source["section"] == "2.2"]
    for q in s22:
        await client.post("/api/v1/review/answer", json={"question_id": q.id, "answer": q.correct, "confidence": "sure"})
    secs = {s["section"]: s for s in (await client.get("/api/v1/progress/mastery")).json()[0]["sections"]}
    assert secs["2.2"]["level"] == 4 and not secs["2.2"]["risky"]

    # keyin ishonch bilan xato → daraja tushadi va xavf belgisi
    await db.execute(update(ReviewCard).values(due=datetime.now(timezone.utc) - timedelta(minutes=1)))
    await db.commit()
    await client.post("/api/v1/review/answer", json={"question_id": s22[0].id, "answer": wrong_answer(s22[0]), "confidence": "sure"})
    secs = {s["section"]: s for s in (await client.get("/api/v1/progress/mastery")).json()[0]["sections"]}
    assert secs["2.2"]["level"] < 3 and secs["2.2"]["risky"]


async def test_report_new_metrics(client, db, inspector_client):
    # 4 o'quvchi bitta darsni o'tadi → har bo'limda yetarli javob
    for i in range(4):
        await register(client, phone=f"+99890111000{i}")
        await master_lesson(client, db, M, L1, confidence="sure")
    rep = (await inspector_client.get("/api/v1/reports/overview")).json()
    assert rep["totals"]["confident_wrong_pct"] == 0.0
    mod = next(m for m in rep["modules"] if m["slug"] == M)
    assert mod["avg_pre_score"] is not None and mod["avg_gain"] is None  # yakuniy test hali yo'q
    assert rep["weak_sections"], "kamida 10 ta javobli bo'lim bo'lishi kerak"
    assert {"section", "error_rate", "confident_wrong_rate"} <= set(rep["weak_sections"][0])
