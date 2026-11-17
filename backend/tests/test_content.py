import json

import pytest

from app.core.config import settings
from app.services.content_loader import ContentError, validate


async def test_modules_list(client):
    r = await client.get("/api/v1/content/modules")
    assert r.status_code == 200
    mods = r.json()
    assert len(mods) == 14
    assert sum(m["status"] == "ready" for m in mods) == 3


async def test_public_content_has_no_answers(client):
    r = await client.get("/api/v1/content/modules/partogramma")
    assert r.status_code == 200
    raw = r.text
    assert '"correct"' not in raw and '"explanation"' not in raw
    lesson = r.json()["lesson_list"][0]
    assert lesson["concepts"][0]["source"]["protocolId"] == 795


def test_every_item_has_source():
    data = json.loads((settings.content_path / "akusherlik.json").read_text())
    validate(data)  # xato bo'lmasligi kerak
    data["modules"][6]["lessons"][0]["questions"][0].pop("source")
    with pytest.raises(ContentError):
        validate(data)
