"use client";

import { Character } from "./Character";
import type { PersonaId } from "@/content/types";
import type { Pose } from "./types";

// Personajlar varag'i — dizaynni tekshirish uchun (render qilinmaydi).
const ROWS: { id: PersonaId; pose: Pose; speaking?: boolean }[] = [
  { id: "dilnoza", pose: "explain", speaking: true },
  { id: "malika", pose: "clipboard" },
  { id: "jasur", pose: "point", speaking: true },
  { id: "bekzod", pose: "listen" },
  { id: "nigora", pose: "idle" },
  { id: "sardor", pose: "wave" },
];

export function CastSheet() {
  return (
    <div style={{ width: 1920, height: 1080, background: "linear-gradient(#eef5f7,#dbe8ec)", display: "flex", alignItems: "flex-end", justifyContent: "space-around", overflow: "hidden" }}>
      {ROWS.map((r) => (
        <div key={r.id} style={{ width: 300, height: 900, position: "relative" }}>
          <div style={{ position: "absolute", bottom: 0, left: -50, transform: "scale(1)", transformOrigin: "bottom center" }}>
            <Character id={r.id} t={1.1} pose={r.pose} speaking={r.speaking} />
          </div>
        </div>
      ))}
    </div>
  );
}
