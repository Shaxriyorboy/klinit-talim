import { PERSONAS } from "@/content/personas";
import type { PersonaId } from "@/content/types";
import { Character } from "@/video/Character";
import { SPRITES } from "@/video/sprites";

/** Personaj portreti — videodagi personajning o'zidan (bosh va yelka) kesib olinadi. */
export function Avatar({ id, size = 64, className = "", ring = false }: { id: PersonaId; size?: number; className?: string; ring?: boolean }) {
  const { look } = PERSONAS[id];
  const clip = `av-${id}`;
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-hidden="true"
      style={ring ? { filter: "drop-shadow(0 2px 6px rgba(12,92,110,.25))" } : undefined}
    >
      <defs>
        <clipPath id={clip}>
          <circle cx="60" cy="60" r="60" />
        </clipPath>
      </defs>
      <circle cx="60" cy="60" r="60" fill={look.bg} />
      <g clipPath={`url(#${clip})`}>
        {SPRITES[id] ? (
          (() => {
            const sp = SPRITES[id]!;
            const [cx, cy, size] = sp.head;
            const k = 120 / (size * 1.05);
            return <image href={sp.src} x={60 - cx * k} y={66 - cy * k} width={sp.w * k} height={sp.h * k} />;
          })()
        ) : (
          <svg x="-62" y="-6" width="244" height="366" viewBox="0 0 400 600">
            <Character id={id} t={0.6} />
          </svg>
        )}
      </g>
    </svg>
  );
}
