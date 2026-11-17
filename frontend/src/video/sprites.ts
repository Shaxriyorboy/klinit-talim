import type { L } from "@/lib/i18n";
import type { PersonaId } from "@/content/types";
import type { Beat, CastMember, VideoScript } from "./types";

/**
 * 3D personaj rasmlari (fon kesilgan): dilnoza, malika — FLUX.1-schnell (Hugging Face); nigora, jasur, bekzod, sardor — ChatGPT.
 * Fon kesish: frontend/scripts/cutout-characters.py (manbalar: public/characters/_generated/raw/).
 * Fayllar: public/characters/<id>.png. Bu ro'yxatda bo'lmagan personajlar SVG chizmada qoladi.
 * Yangi personaj rasmi qo'shilganda shu yerga qo'shing — video va sayt avtomatik shundan foydalanadi.
 */
export const SPRITES: Partial<Record<PersonaId, { src: string; w: number; h: number; head: [number, number, number] }>> = {
  // head: [markaz X, markaz Y, yuz kengligi] — avatarni kesish uchun (rasm piksellarida)
  dilnoza: { src: "/characters/dilnoza.png", w: 830, h: 1182, head: [430, 420, 520] },
  malika: { src: "/characters/malika.png", w: 832, h: 1169, head: [470, 380, 500] },
  nigora: { src: "/characters/nigora.png", w: 945, h: 1511, head: [450, 350, 600] },
  jasur: { src: "/characters/jasur.png", w: 530, h: 957, head: [300, 235, 420] },
  bekzod: { src: "/characters/bekzod.png", w: 504, h: 956, head: [285, 245, 410] },
  sardor: { src: "/characters/sardor.png", w: 518, h: 967, head: [300, 240, 420] },
};

export const hasSprite = (id: PersonaId) => !!SPRITES[id];

// Rasmi yo'q personaj o'rniga kim chiqadi (protokol bo'yicha mos rol)
const PREFERRED: Partial<Record<PersonaId, PersonaId>> = {
  jasur: "malika", // tug'ruq zalida akusherka ham reanimatsiyada qatnashadi
  bekzod: "dilnoza",
};
const PATIENTS: PersonaId[] = ["nigora", "sardor"];

/** Bir bitda rasmi yo'q personajlarni mavjudlari bilan almashtirish. */
function resolveBeat(beat: Beat): Beat {
  const cast = beat.shot.cast ?? [];
  const map = new Map<PersonaId, PersonaId | null>();
  const used = new Set(cast.filter((c) => hasSprite(c.id)).map((c) => c.id));

  for (const c of cast) {
    if (hasSprite(c.id)) continue;
    if (PATIENTS.includes(c.id) && beat.speaker !== c.id) {
      map.set(c.id, null); // bemor kadrdan chiqariladi
      continue;
    }
    const pref = PREFERRED[c.id];
    if (pref && used.has(pref)) {
      // afzal ko'rilgan personaj band — uni boshqasiga suramiz
      const other = (["dilnoza", "malika"] as PersonaId[]).find((p) => hasSprite(p) && !used.has(p) && p !== pref);
      if (other) {
        map.set(pref, other);
        used.add(other);
      }
    }
    const sub = pref && hasSprite(pref) ? pref : (["malika", "dilnoza"] as PersonaId[]).find((p) => hasSprite(p) && !used.has(p));
    map.set(c.id, sub ?? null);
    if (sub) used.add(sub);
  }

  if (beat.speaker && !hasSprite(beat.speaker) && beat.fallback) {
    // bemor gapirgan bit — muqobil qator
    const fb = beat.fallback;
    const newCast: CastMember[] = cast
      .filter((c) => c.id !== beat.speaker && !PATIENTS.includes(c.id))
      .map((c) => ({ ...c, id: (map.get(c.id) ?? c.id) as PersonaId }));
    if (!newCast.some((c) => c.id === fb.speaker)) newCast.push({ id: fb.speaker, x: 640, pose: "explain" });
    return { ...beat, speaker: fb.speaker, line: fb.line, say: undefined, shot: { ...beat.shot, cast: newCast } };
  }

  const newCast = cast
    .map((c) => (map.has(c.id) ? (map.get(c.id) ? { ...c, id: map.get(c.id)! } : null) : c))
    .filter(Boolean) as CastMember[];
  const speaker = beat.speaker && map.has(beat.speaker) ? map.get(beat.speaker) ?? undefined : beat.speaker;
  return { ...beat, speaker, shot: { ...beat.shot, cast: newCast } };
}

export function resolveScript(script: VideoScript): VideoScript {
  return { ...script, beats: script.beats.map(resolveBeat) };
}

export type Fallback = { speaker: PersonaId; line: L };
