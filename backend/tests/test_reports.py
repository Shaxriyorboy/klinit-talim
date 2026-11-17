from tests.helpers import master_lesson


async def test_learner_cannot_see_reports(client, learner):
    assert (await client.get("/api/v1/reports/overview")).status_code == 403


async def test_inspector_overview(client, db, learner, inspector_client):
    await master_lesson(client, db, "partogramma", "nima-uchun")
    r = await inspector_client.get("/api/v1/reports/overview")
    assert r.status_code == 200, r.text
    rep = r.json()
    assert rep["totals"] == {
        "learners": 1,
        "active_learners": 1,
        "lessons_completed": 1,
        "tests_passed": 0,
        "confident_wrong_pct": 0.0,
        "review_due": 0,
    }
    parto = next(m for m in rep["modules"] if m["slug"] == "partogramma")
    assert parto["learners_started"] == 1 and parto["learners_completed_lessons"] == 0 and parto["lessons"] == 6
    assert rep["institutions"][0]["lessons_completed"] == 1
