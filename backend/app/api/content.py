"""Ochiq kontent: to'g'ri javoblar va izohlar hech qachon qaytarilmaydi."""
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.deps import DbDep
from app.models import Lesson, Module, Question
from app.schemas.learning import LessonPublic, ModuleBrief, ModulePublic, QuestionPublic

router = APIRouter(prefix="/content", tags=["content"])


def question_public(q: Question) -> QuestionPublic:
    return QuestionPublic(id=q.id, type=q.type, prompt=q.prompt, case=q.case, options=q.options)


def _brief(m: Module) -> dict:
    return dict(
        slug=m.slug,
        section=m.section,
        title=m.title,
        short=m.short,
        protocol_id=m.protocol_id,
        standard_id=m.standard_id,
        icd=m.icd,
        lead=m.lead,
        status=m.status,
        lessons=len(m.lessons),
        questions=sum(len(les.questions) for les in m.lessons),
    )


def _with_tree():
    return selectinload(Module.lessons).selectinload(Lesson.questions)


@router.get("/modules", response_model=list[ModuleBrief])
async def modules(db: DbDep):
    rows = await db.execute(select(Module).options(_with_tree()).order_by(Module.order_no))
    return [ModuleBrief(**_brief(m)) for m in rows.scalars()]


@router.get("/modules/{slug}", response_model=ModulePublic)
async def module(slug: str, db: DbDep):
    m = await db.scalar(select(Module).where(Module.slug == slug).options(_with_tree()))
    if m is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Modul topilmadi")
    return ModulePublic(
        **_brief(m),
        lesson_list=[
            LessonPublic(
                slug=les.slug,
                title=les.title,
                summary=les.summary,
                minutes=les.minutes,
                scenes=les.scenes,
                concepts=les.concepts,
                questions=[question_public(q) for q in les.questions],
            )
            for les in m.lessons
        ],
    )
