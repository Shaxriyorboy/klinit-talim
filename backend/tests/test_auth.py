from tests.conftest import register


async def test_register_sets_cookie_and_me(client):
    data = await register(client, phone="90 111 22 33")
    assert data["user"]["phone"] == "+998901112233"
    assert data["user"]["role"] == "learner"
    assert "pa_token" in client.cookies
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 200 and r.json()["full_name"] == "Malika Karimova"


async def test_bad_phone_duplicate_and_wrong_password(client):
    r = await client.post("/api/v1/auth/register", json={"phone": "12345", "password": "parol123", "full_name": "Ism Familiya"})
    assert r.status_code == 422
    await register(client)
    r = await client.post("/api/v1/auth/register", json={"phone": "+998901112233", "password": "parol123", "full_name": "Ism Familiya"})
    assert r.status_code == 409
    r = await client.post("/api/v1/auth/login", json={"phone": "+998901112233", "password": "notogri"})
    assert r.status_code == 401


async def test_logout_and_unauthorized(client, learner):
    await client.post("/api/v1/auth/logout")
    client.cookies.clear()
    assert (await client.get("/api/v1/auth/me")).status_code == 401
    assert (await client.get("/api/v1/progress/me")).status_code == 401
