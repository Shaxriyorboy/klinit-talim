import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Confidence = Literal["sure", "unsure", "guess"]

# Ko'p tilli matn: {"uz": ..., "ru": ...}
I18n = dict[str, str]


class SourceOut(BaseModel):
    protocolId: int
    section: str
    page: int


class QuestionPublic(BaseModel):
    """O'quvchiga yuboriladigan savol — to'g'ri javob va izohsiz."""

    id: str
    type: str
    prompt: I18n
    case: I18n | None = None
    options: list[I18n]


class LessonPublic(BaseModel):
    slug: str
    title: I18n
    summary: I18n
    minutes: int
    scenes: list[dict]
    concepts: list[dict]
    questions: list[QuestionPublic]


class ModuleBrief(BaseModel):
    slug: str
    section: str
    title: I18n
    short: I18n
    protocol_id: int
    standard_id: int | None
    icd: str
    lead: str
    status: str
    lessons: int
    questions: int


class ModulePublic(ModuleBrief):
    lesson_list: list[LessonPublic]


# --- Mashq ---------------------------------------------------------------
class PracticeStartIn(BaseModel):
    module_slug: str
    lesson_slug: str


class PracticeStartOut(BaseModel):
    session_id: uuid.UUID
    question_ids: list[str]
    total: int


class AnswerIn(BaseModel):
    question_id: str
    answer: list[int] = Field(max_length=20)
    confidence: Confidence | None = None


class Feedback(BaseModel):
    """Javob tekshirilgandan keyingi izoh (barcha rejimlar uchun umumiy)."""

    correct: bool
    correct_answer: list[int]
    explanation: I18n
    option_notes: list[I18n | None] | None = None
    source: SourceOut
    confidently_wrong: bool = False


class AnswerOut(Feedback):
    mastered: int
    total: int
    lesson_completed: bool
    first_try: int
    xp_gained: int


# --- Yakuniy test --------------------------------------------------------
class TestStartOut(BaseModel):
    attempt_id: uuid.UUID
    kind: Literal["pre", "final"] = "final"
    questions: list[QuestionPublic]
    pass_percent: int


class TestSubmitIn(BaseModel):
    answers: list[AnswerIn]


class ReviewItem(BaseModel):
    question: QuestionPublic
    your_answer: list[int]
    correct_answer: list[int]
    explanation: I18n
    option_notes: list[I18n | None] | None = None
    source: SourceOut
    confidently_wrong: bool = False


class TestResultOut(BaseModel):
    kind: Literal["pre", "final"] = "final"
    pre_score: int | None = None  # boshlang'ich test natijasi (bilim o'sishini ko'rsatish uchun)
    score_pct: int
    passed: bool
    correct: int
    total: int
    xp_gained: int
    mistakes: list[ReviewItem]


# --- Progress ------------------------------------------------------------
class LessonProgressOut(BaseModel):
    done: bool
    first_try: int
    total: int


class TestProgressOut(BaseModel):
    best: int
    passed: bool
    attempts: int


class ProgressOut(BaseModel):
    xp: int
    level: int
    lessons: dict[str, LessonProgressOut]  # "modul/dars"
    tests: dict[str, TestProgressOut]  # modul slug
    videos: list[str] = []  # ko'rilgan mavzu videolari (modul slug)
    pretests: dict[str, int] = {}  # modul slug → boshlang'ich test natijasi (%)
    review_due: int = 0  # hozir takrorlash kerak bo'lgan savollar soni


# --- Takrorlash ------------------------------------------------------------
class ReviewBatchOut(BaseModel):
    due: int
    next_due: datetime | None
    questions: list[QuestionPublic]


class ReviewAnswerOut(Feedback):
    next_review: datetime
    due_left: int
    xp_gained: int


# --- O'zlashtirish darajasi --------------------------------------------------
class SectionMastery(BaseModel):
    section: str
    lesson_title: I18n
    questions: int
    correct: int
    level: int  # 0..4
    risky: bool  # ishonch bilan xato javob bor


class ModuleMastery(BaseModel):
    slug: str
    title: I18n
    protocol_id: int
    sections: list[SectionMastery]
