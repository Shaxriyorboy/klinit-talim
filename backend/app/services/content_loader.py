"""Umumiy JSON kontentni (klinik-talim/content/*.json) bazaga yuklash (upsert).

Kontent manbai — JSON fayllar; baza ulardan to'ldiriladi. Har bir savol va tushunchada
`source` bo'lmasa, yuklash to'xtatiladi: platformada manbasiz ma'lumot bo'lmasligi kerak.
"""
import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Lesson, Module, Question


class ContentError(ValueError):
    pass


def _check_source(src: dict | None, where: str) -> None:
    if not src or not isinstance(src.get("protocolId"), int) or not src.get("section") or not isinstance(src.get("page"), int):
        raise ContentError(f"Manba (source) yo'q yoki noto'liq: {where}")


def validate(data: dict) -> None:
    seen_q: set[str] = set()
    for m in data["modules"]:
        for les in m["lessons"]:
            for i, c in enumerate(les["concepts"]):
                _check_source(c.get("source"), f"{m['slug']}/{les['slug']} tushuncha #{i + 1}")
            for q in les["questions"]:
                where = f"{m['slug']}/{les['slug']} savol {q['id']}"
                _check_source(q.get("source"), where)
                if q["id"] in seen_q:
                    raise ContentError(f"Savol ID takrorlangan: {q['id']}")
                seen_q.add(q["id"])
                n = len(q["options"])
                if not q["correct"] or any(not (0 <= c < n) for c in q["correct"]):
                    raise ContentError(f"To'g'ri javob indeksi noto'g'ri: {where}")
                if q["type"] == "order" and sorted(q["correct"]) != list(range(n)):
                    raise ContentError(f"Tartib savolida barcha variantlar bo'lishi kerak: {where}")
                if q["type"] == "single" and len(q["correct"]) != 1:
                    raise ContentError(f"Bitta javobli savolda faqat bitta to'g'ri javob: {where}")
                notes = q.get("optionNotes")
                if notes is not None and (q["type"] == "order" or len(notes) != n):
                    raise ContentError(f"optionNotes variantlar soniga teng bo'lishi kerak (tartib savolida yo'q): {where}")
        r = m.get("retention", 0.9)
        if not (0.7 <= r <= 0.97):
            raise ContentError(f"retention 0.70–0.97 oralig'ida bo'lishi kerak: {m['slug']}")


def load_files(content_dir: Path) -> list[dict]:
    files = sorted(content_dir.glob("*.json"))
    if not files:
        raise ContentError(f"Kontent topilmadi: {content_dir}")
    out = []
    for f in files:
        data = json.loads(f.read_text(encoding="utf-8"))
        data["_direction"] = f.stem
        validate(data)
        out.append(data)
    return out


async def sync_content(db: AsyncSession, content_dir: Path) -> dict[str, int]:
    """JSON → DB. Mavjud yozuvlar yangilanadi, JSONda yo'q dars/savollar o'chiriladi."""
    stats = {"modules": 0, "lessons": 0, "questions": 0}
    for data in load_files(content_dir):
        for m_order, m in enumerate(data["modules"]):
            mod = (
                await db.execute(
                    select(Module).where(Module.slug == m["slug"]).options(selectinload(Module.lessons).selectinload(Lesson.questions))
                )
            ).scalar_one_or_none()
            if mod is None:
                mod = Module(slug=m["slug"], lessons=[])
                db.add(mod)
            mod.direction = data["_direction"]
            mod.section = m["section"]
            mod.order_no = m_order
            mod.title = m["title"]
            mod.short = m["short"]
            mod.protocol_id = m["protocolId"]
            mod.standard_id = m.get("standardId")
            mod.icd = m.get("icd", "")
            mod.lead = m["lead"]
            mod.status = m["status"]
            mod.retention = m.get("retention", 0.9)
            stats["modules"] += 1

            by_slug = {les.slug: les for les in mod.lessons}
            keep: list[Lesson] = []
            for l_order, l in enumerate(m["lessons"]):
                les = by_slug.get(l["slug"]) or Lesson(slug=l["slug"], questions=[])
                les.order_no = l_order
                les.title = l["title"]
                les.summary = l["summary"]
                les.minutes = l["minutes"]
                les.scenes = l.get("scenes", [])
                les.concepts = l["concepts"]
                q_by_id = {q.id: q for q in les.questions}
                qs: list[Question] = []
                for q_order, q in enumerate(l["questions"]):
                    qq = q_by_id.get(q["id"]) or Question(id=q["id"])
                    qq.order_no = q_order
                    qq.type = q["type"]
                    qq.prompt = q["prompt"]
                    qq.case = q.get("case")
                    qq.options = q["options"]
                    qq.correct = q["correct"]
                    qq.explanation = q["explanation"]
                    qq.option_notes = q.get("optionNotes")
                    qq.source = q["source"]
                    qs.append(qq)
                les.questions = qs
                keep.append(les)
                stats["lessons"] += 1
                stats["questions"] += len(qs)
            mod.lessons = keep
    await db.commit()
    return stats
