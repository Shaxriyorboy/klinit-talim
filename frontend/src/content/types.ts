import type { L } from "@/lib/i18n";

export const PROTOCOL_BASE = "https://www.clinical-protocols.uz";

/** Har bir kontent bo'lagi protokoldagi aniq joyga bog'lanadi. */
export type Source = {
  protocolId: number;
  /** Protokoldagi bo'lim raqami yoki nomi, masalan "2.10" */
  section: string;
  /** PDF sahifasi (view-pdf#page=N) */
  page: number;
};

export function sourcePdfUrl(s: Source) {
  return `${PROTOCOL_BASE}/protocol/${s.protocolId}/view-pdf#page=${s.page}`;
}
export function protocolUrl(id: number) {
  return `${PROTOCOL_BASE}/protocol/${id}`;
}

export type PersonaId = "nigora" | "dilnoza" | "malika" | "jasur" | "bekzod" | "sardor";

export type Concept = {
  title: L;
  body: L;
  /** Kartochkadagi asosiy raqamlar / ro'yxat */
  points?: L[];
  source: Source;
};

export type Question = {
  id: string;
  type: "single" | "multi" | "order";
  prompt: L;
  /** Klinik vaziyat (ixtiyoriy) */
  case?: L;
  options: L[];
  /** single/multi: to'g'ri variant indekslari; order: to'g'ri tartib (options indekslari) */
  correct: number[];
  explanation: L;
  /** Har bir variant uchun "nega noto'g'ri" izohi (variantlar tartibida; to'g'ri variantlar uchun null) */
  optionNotes?: (L | null)[];
  source: Source;
};

export type Lesson = {
  slug: string;
  title: L;
  summary: L;
  minutes: number;
  concepts: Concept[];
  questions: Question[];
};

export type SectionId = "homiladorlik" | "tugruq" | "tugruqdan-keyin" | "chaqaloq";

export type Module = {
  slug: string;
  section: SectionId;
  title: L;
  short: L;
  protocolId: number;
  standardId?: number;
  icd: string;
  lead: PersonaId;
  status: "ready" | "soon";
  /** Takrorlash maqsadi (FSRS): xavfli mavzularda yuqoriroq */
  retention?: number;
  lessons: Lesson[];
};

// ---------------------------------------------------------------------------
// Brauzerga yuboriladigan versiya: to'g'ri javob, izoh va manba yo'q
// (ular faqat backend tekshiruvidan keyin qaytadi).
// ---------------------------------------------------------------------------
export type PublicQuestion = Omit<Question, "correct" | "explanation" | "source" | "optionNotes">;
export type PublicLesson = Omit<Lesson, "questions"> & { questions: PublicQuestion[] };
export type PublicModule = Omit<Module, "lessons"> & { lessons: PublicLesson[] };

export function moduleStats(m: { lessons: { minutes: number; questions: unknown[] }[] }) {
  const questions = m.lessons.reduce((n, x) => n + x.questions.length, 0);
  const minutes = m.lessons.reduce((n, x) => n + x.minutes, 0);
  return { lessons: m.lessons.length, questions, minutes };
}

export const FINAL_TEST_SIZE = 15;
export const PASS_PERCENT = 80;
