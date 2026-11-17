from tests.helpers import lesson_questions, lesson_slugs, master_lesson, take_pretest, watch_video, wrong_answer

M = "partogramma"


async def test_lesson_lock(client, learner):
    # boshlang'ich test topshirilmaguncha va video ko'rilmaguncha birinchi dars ham yopiq
    r = await client.post("/api/v1/practice/sessions", json={"module_slug": M, "lesson_slug": "nima-uchun"})
    assert r.status_code == 403
    await watch_video(client, M)
    r = await client.post("/api/v1/practice/sessions", json={"module_slug": M, "lesson_slug": "nima-uchun"})
    assert r.status_code == 403
    await take_pretest(client, M)
    assert (await client.get("/api/v1/progress/me")).json()["videos"] == [M]
    r = await client.post("/api/v1/practice/sessions", json={"module_slug": M, "lesson_slug": "nima-uchun"})
    assert r.status_code == 201
    r = await client.post("/api/v1/practice/sessions", json={"module_slug": M, "lesson_slug": "boshlash-va-tuzilma"})
    assert r.status_code == 403


async def test_mastery_loop_requeue_and_xp(client, db, learner):
    qs = await lesson_questions(db, M, "nima-uchun")
    await take_pretest(client, M)
    await watch_video(client, M)
    sid = (await client.post("/api/v1/practice/sessions", json={"module_slug": M, "lesson_slug": "nima-uchun"})).json()["session_id"]
    url = f"/api/v1/practice/sessions/{sid}/answer"

    # 1-savol: avval xato → izoh va manba qaytadi, o'zlashtirilmagan
    r = (await client.post(url, json={"question_id": qs[0].id, "answer": wrong_answer(qs[0])})).json()
    assert r["correct"] is False and r["correct_answer"] == qs[0].correct
    assert r["source"]["protocolId"] == 795 and r["explanation"]["uz"]
    assert r["mastered"] == 0 and not r["lesson_completed"]

    # qolganlariga to'g'ri
    for q in qs[1:]:
        r = (await client.post(url, json={"question_id": q.id, "answer": q.correct})).json()
    assert not r["lesson_completed"] and r["mastered"] == len(qs) - 1

    # xato qilingan savol qaytib keladi → endi to'g'ri → dars yakunlanadi
    r = (await client.post(url, json={"question_id": qs[0].id, "answer": qs[0].correct})).json()
    assert r["lesson_completed"] and r["first_try"] == len(qs) - 1
    assert r["xp_gained"] == 50 + 10 * (len(qs) - 1)

    # yakunlangan sessiyaga javob qabul qilinmaydi
    assert (await client.post(url, json={"question_id": qs[0].id, "answer": qs[0].correct})).status_code == 409

    # takroran o'tish ball bermaydi, lekin keyingi dars ochiladi
    again = await master_lesson(client, db, M, "nima-uchun")
    assert again["lesson_completed"] and again["xp_gained"] == 0
    r = await client.post("/api/v1/practice/sessions", json={"module_slug": M, "lesson_slug": "boshlash-va-tuzilma"})
    assert r.status_code == 201

    prog = (await client.get("/api/v1/progress/me")).json()
    assert prog["lessons"][f"{M}/nima-uchun"]["done"] is True
    assert prog["xp"] == 50 + 10 * (len(qs) - 1)


async def test_question_from_other_lesson_rejected(client, db, learner):
    other = (await lesson_questions(db, M, "ona-kuzatuvi"))[0]
    await take_pretest(client, M)
    await watch_video(client, M)
    sid = (await client.post("/api/v1/practice/sessions", json={"module_slug": M, "lesson_slug": "nima-uchun"})).json()["session_id"]
    r = await client.post(f"/api/v1/practice/sessions/{sid}/answer", json={"question_id": other.id, "answer": other.correct})
    assert r.status_code == 422


async def test_final_test_flow(client, db, learner):
    assert (await client.post(f"/api/v1/tests/{M}/start")).status_code == 403
    for slug in await lesson_slugs(db, M):
        assert (await master_lesson(client, db, M, slug))["lesson_completed"]

    r = await client.post(f"/api/v1/tests/{M}/start")
    assert r.status_code == 201
    body = r.json()
    assert len(body["questions"]) == 15 and '"correct"' not in r.text

    from app.models import Question

    answers = []
    for i, q in enumerate(body["questions"]):
        real = await db.get(Question, q["id"])
        # 2 ta xato → 13/15 = 87% → o'tadi
        answers.append({"question_id": q["id"], "answer": [99] if i < 2 else real.correct})
    res = (await client.post(f"/api/v1/tests/attempts/{body['attempt_id']}/submit", json={"answers": answers})).json()
    assert res["score_pct"] == 87 and res["passed"] and res["xp_gained"] == 200
    assert len(res["mistakes"]) == 2 and res["mistakes"][0]["source"]["protocolId"] == 795

    assert (await client.post(f"/api/v1/tests/attempts/{body['attempt_id']}/submit", json={"answers": answers})).status_code == 409

    # ikkinchi muvaffaqiyatli urinish qayta ball bermaydi
    body2 = (await client.post(f"/api/v1/tests/{M}/start")).json()
    ans2 = [{"question_id": q["id"], "answer": (await db.get(Question, q["id"])).correct} for q in body2["questions"]]
    res2 = (await client.post(f"/api/v1/tests/attempts/{body2['attempt_id']}/submit", json={"answers": ans2})).json()
    assert res2["score_pct"] == 100 and res2["xp_gained"] == 0

    prog = (await client.get("/api/v1/progress/me")).json()
    assert prog["tests"][M] == {"best": 100, "passed": True, "attempts": 2}
