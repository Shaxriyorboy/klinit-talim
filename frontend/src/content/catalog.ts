import "server-only";
import type { L } from "@/lib/i18n";
import data from "../../../content/akusherlik.json";
import type { Module, PersonaId, PublicLesson, PublicModule, SectionId } from "./types";

// Kontent manbai — umumiy JSON (klinik-talim/content). Backend ham shu fayldan bazani to'ldiradi.
// Bu fayl faqat serverda: to'g'ri javoblar brauzer bundle'iga tushmaydi.
export const DIRECTION = data.direction as { title: L; subtitle: L };
export const SECTIONS = data.sections as { id: SectionId; title: L; persona: PersonaId }[];
export const MODULES = data.modules as unknown as Module[];
export const READY_MODULES = MODULES.filter((m) => m.status === "ready");

export function getModule(slug: string) {
  return MODULES.find((m) => m.slug === slug);
}

export function toPublicLesson(l: Module["lessons"][number]): PublicLesson {
  return {
    ...l,
    questions: l.questions.map((q) => ({ id: q.id, type: q.type, prompt: q.prompt, case: q.case, options: q.options })),
  };
}

export function toPublicModule(m: Module): PublicModule {
  return { ...m, lessons: m.lessons.map(toPublicLesson) };
}
