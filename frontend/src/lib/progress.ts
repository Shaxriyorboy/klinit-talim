"use client";

import { useEffect, useSyncExternalStore } from "react";
import { api, ApiError, type ProgressData, type User } from "./api";

// Sessiya: joriy foydalanuvchi va uning progressi — backenddan (FastAPI) olinadi.
export type Progress = {
  lessons: Record<string, { done: boolean; firstTry: number; total: number }>;
  tests: Record<string, { best: number; passed: boolean; attempts: number }>;
  videos: string[];
  /** modul slug → boshlang'ich test natijasi (%) */
  pretests: Record<string, number>;
  /** hozir takrorlash kerak bo'lgan savollar */
  reviewDue: number;
  xp: number;
};
export type Session = { status: "loading" | "ready" | "offline"; user: User | null; progress: Progress };

const EMPTY: Progress = { lessons: {}, tests: {}, videos: [], pretests: {}, reviewDue: 0, xp: 0 };
const INITIAL: Session = { status: "loading", user: null, progress: EMPTY };

let state: Session = INITIAL;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(next: Session) {
  state = next;
  listeners.forEach((fn) => fn());
}

function mapProgress(p: ProgressData): Progress {
  const lessons: Progress["lessons"] = {};
  for (const [k, v] of Object.entries(p.lessons)) lessons[k] = { done: v.done, firstTry: v.first_try, total: v.total };
  return { lessons, tests: p.tests, videos: p.videos ?? [], pretests: p.pretests ?? {}, reviewDue: p.review_due ?? 0, xp: p.xp };
}

export function refreshSession(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const user = await api<User>("/auth/me");
      const progress = await api<ProgressData>("/progress/me");
      set({ status: "ready", user: { ...user, xp: progress.xp, level: progress.level }, progress: mapProgress(progress) });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) set({ status: "ready", user: null, progress: EMPTY });
      else set({ status: "offline", user: null, progress: EMPTY });
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export async function logout() {
  await api("/auth/logout", { method: "POST" }).catch(() => undefined);
  set({ status: "ready", user: null, progress: EMPTY });
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useSession(): Session {
  const s = useSyncExternalStore(subscribe, () => state, () => INITIAL);
  useEffect(() => {
    if (state.status === "loading" && !inflight) void refreshSession();
  }, []);
  return s;
}

export function useProgress(): Progress {
  return useSession().progress;
}

export const lessonKey = (moduleSlug: string, lessonSlug: string) => `${moduleSlug}/${lessonSlug}`;

export const LEVEL_XP = [0, 300, 800, 1500];
export function levelOf(xp: number) {
  let lvl = 0;
  LEVEL_XP.forEach((min, i) => {
    if (xp >= min) lvl = i;
  });
  const next = LEVEL_XP[lvl + 1];
  return { level: lvl, next, pct: next ? Math.round(((xp - LEVEL_XP[lvl]) / (next - LEVEL_XP[lvl])) * 100) : 100 };
}
