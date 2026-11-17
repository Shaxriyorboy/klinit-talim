"use client";

import type { L } from "./i18n";
import type { PublicQuestion, Source } from "@/content/types";

// Brauzer /api/v1/* ga murojaat qiladi; Next uni FastAPI backendga yo'naltiradi (next.config rewrites).
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      method: opts.method ?? (opts.body ? "POST" : "GET"),
      headers: opts.body ? { "content-type": "application/json" } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Server bilan aloqa yo'q");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : res.statusText;
    throw new ApiError(res.status, detail);
  }
  return data as T;
}

// --- Javob tiplari (backend sxemalari bilan mos) --------------------------
export type Role = "learner" | "inspector" | "admin";
export type Institution = { id: number; name: string; region: string };
export type User = {
  id: number;
  phone: string;
  full_name: string;
  role: Role;
  institution: Institution | null;
  department: string;
  position: string;
  xp: number;
  level: number;
};

export type ProgressData = {
  xp: number;
  level: number;
  lessons: Record<string, { done: boolean; first_try: number; total: number }>;
  tests: Record<string, { best: number; passed: boolean; attempts: number }>;
  videos: string[];
  pretests: Record<string, number>;
  review_due: number;
};

/** Javob ishonchi: aniq bilaman · taxminan · bilmayman */
export type Confidence = "sure" | "unsure" | "guess";

/** Tekshirilgan javob bo'yicha izoh (mashq, test, takrorlash — umumiy). */
export type Feedback = {
  correct: boolean;
  correct_answer: number[];
  explanation: L;
  option_notes?: (L | null)[] | null;
  source: Source;
  confidently_wrong: boolean;
};

export type AnswerResult = Feedback & {
  mastered: number;
  total: number;
  lesson_completed: boolean;
  first_try: number;
  xp_gained: number;
};

export type TestKind = "pre" | "final";
export type TestStart = { attempt_id: string; kind: TestKind; questions: PublicQuestion[]; pass_percent: number };
export type TestResult = {
  kind: TestKind;
  pre_score: number | null;
  score_pct: number;
  passed: boolean;
  correct: number;
  total: number;
  xp_gained: number;
  mistakes: (Feedback & { question: PublicQuestion; your_answer: number[] })[];
};

export type ReviewBatch = { due: number; next_due: string | null; questions: PublicQuestion[] };
export type ReviewAnswer = Feedback & { next_review: string; due_left: number; xp_gained: number };

export type SectionMastery = { section: string; lesson_title: L; questions: number; correct: number; level: number; risky: boolean };
export type ModuleMastery = { slug: string; title: L; protocol_id: number; sections: SectionMastery[] };

export type Report = {
  totals: {
    learners: number;
    active_learners: number;
    lessons_completed: number;
    tests_passed: number;
    confident_wrong_pct: number | null;
    review_due: number;
  };
  modules: {
    slug: string;
    title: L;
    protocol_id: number;
    lessons: number;
    learners_started: number;
    learners_completed_lessons: number;
    test_attempts: number;
    learners_passed: number;
    avg_best_score: number | null;
    avg_pre_score: number | null;
    avg_gain: number | null;
  }[];
  institutions: {
    id: number | null;
    name: string;
    region: string;
    learners: number;
    active_learners: number;
    lessons_completed: number;
    tests_passed: number;
    avg_best_score: number | null;
    confident_wrong_pct: number | null;
  }[];
  hardest_questions: {
    id: string;
    module_slug: string;
    prompt: L;
    case?: L | null;
    source: Source;
    attempts: number;
    error_rate: number;
    confident_wrong_rate: number | null;
  }[];
  weak_sections: {
    module_slug: string;
    module_title: L;
    protocol_id: number;
    section: string;
    lesson_title: L;
    attempts: number;
    error_rate: number;
    confident_wrong_rate: number | null;
  }[];
};
