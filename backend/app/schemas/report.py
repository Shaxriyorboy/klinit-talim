from pydantic import BaseModel

I18n = dict[str, str]


class Totals(BaseModel):
    learners: int
    active_learners: int
    lessons_completed: int
    tests_passed: int
    confident_wrong_pct: float | None = None  # "aniq bilaman" deb xato javob berilgan javoblar ulushi
    review_due: int = 0  # o'quvchilarda takrorlash kutayotgan savollar


class ModuleStat(BaseModel):
    slug: str
    title: I18n
    protocol_id: int
    lessons: int
    learners_started: int
    learners_completed_lessons: int
    test_attempts: int
    learners_passed: int
    avg_best_score: float | None
    avg_pre_score: float | None = None
    avg_gain: float | None = None  # yakuniy (eng yaxshi) − boshlang'ich, foiz punktlarda


class InstitutionStat(BaseModel):
    id: int | None
    name: str
    region: str
    learners: int
    active_learners: int
    lessons_completed: int
    tests_passed: int
    avg_best_score: float | None
    confident_wrong_pct: float | None = None


class HardQuestion(BaseModel):
    id: str
    module_slug: str
    prompt: I18n
    case: I18n | None = None
    source: dict
    attempts: int
    error_rate: float
    confident_wrong_rate: float | None = None


class SectionStat(BaseModel):
    module_slug: str
    module_title: I18n
    protocol_id: int
    section: str
    lesson_title: I18n
    attempts: int
    error_rate: float
    confident_wrong_rate: float | None


class ReportOut(BaseModel):
    totals: Totals
    modules: list[ModuleStat]
    institutions: list[InstitutionStat]
    hardest_questions: list[HardQuestion]
    weak_sections: list[SectionStat] = []
