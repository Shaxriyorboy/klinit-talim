from sqlalchemy import select

from app.models import Lesson, Module, Question


async def lesson_questions(db, module_slug: str, lesson_slug: str) -> list[Question]:
    rows = await db.execute(
        select(Question)
        .join(Lesson, Lesson.id == Question.lesson_id)
        .join(Module, Module.id == Lesson.module_id)
        .where(Module.slug == module_slug, Lesson.slug == lesson_slug)
        .order_by(Question.order_no)
    )
    return list(rows.scalars())


async def lesson_slugs(db, module_slug: str) -> list[str]:
    rows = await db.execute(
        select(Lesson.slug).join(Module, Module.id == Lesson.module_id).where(Module.slug == module_slug).order_by(Lesson.order_no)
    )
    return list(rows.scalars())


def wrong_answer(q: Question) -> list[int]:
    if q.type == "order":
        return list(reversed(q.correct))
    return [i for i in range(len(q.options)) if i not in q.correct][:1]


async def watch_video(client, module_slug: str) -> None:
    r = await client.post(f"/api/v1/progress/videos/{module_slug}")
    assert r.status_code == 204, r.text


async def take_pretest(client, module_slug: str) -> dict | None:
    """Boshlang'ich test (bir marta). Allaqachon topshirilgan bo'lsa — None."""
    r = await client.post(f"/api/v1/tests/{module_slug}/start?kind=pre")
    if r.status_code == 409:
        return None
    assert r.status_code == 201, r.text
    body = r.json()
    answers = [{"question_id": q["id"], "answer": [0]} for q in body["questions"]]
    r = await client.post(f"/api/v1/tests/attempts/{body['attempt_id']}/submit", json={"answers": answers})
    assert r.status_code == 200, r.text
    return r.json()


async def master_lesson(client, db, module_slug: str, lesson_slug: str, confidence: str | None = "sure") -> dict:
    await take_pretest(client, module_slug)
    await watch_video(client, module_slug)
    r = await client.post("/api/v1/practice/sessions", json={"module_slug": module_slug, "lesson_slug": lesson_slug})
    assert r.status_code == 201, r.text
    sid = r.json()["session_id"]
    last = None
    for q in await lesson_questions(db, module_slug, lesson_slug):
        last = (await client.post(f"/api/v1/practice/sessions/{sid}/answer", json={"question_id": q.id, "answer": q.correct, "confidence": confidence})).json()
    return last
