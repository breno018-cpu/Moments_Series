import React from "react";

/** Trig output is rounded so server and client render byte-identical markup. */
export const RETICLE_MARK_LINES = Array.from({ length: 24 }, (_, i) => {
  const a = -Math.PI / 2 + (i / 24) * Math.PI * 2;
  const cx = 18.5;
  const cy = 18;
  const inner = 6.6;
  const outer = 16.4;
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return {
    x1: round(cx + Math.cos(a) * inner),
    y1: round(cy + Math.sin(a) * inner),
    x2: round(cx + Math.cos(a) * outer),
    y2: round(cy + Math.sin(a) * outer),
  };
});

export function ReticleMark({
  className,
  color = "#D600BF",
}: {
  className?: string;
  color?: string;
}) {
  const lines = RETICLE_MARK_LINES;

  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 37 36"
    >
      {lines.map((line, i) => (
        <line
          key={i}
          stroke={color}
          strokeLinecap="round"
          strokeWidth="2.2"
          x1={line.x1}
          x2={line.x2}
          y1={line.y1}
          y2={line.y2}
        />
      ))}
    </svg>
  );
}

export function ReticleBrand({
  light = false,
}: {
  light?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <ReticleMark className="size-9" />
      <span
        className={
          light
            ? "text-[17px] leading-none text-white"
            : "text-[17px] leading-none text-[#10121c]"
        }
      >
        Reticle
      </span>
      <span
        className={
          light ? "h-6 w-px bg-white/25" : "h-6 w-px bg-black/15"
        }
      />
      <span
        className={
          light
            ? "text-[12px] tracking-[0.18em] text-white/55 uppercase"
            : "text-[12px] tracking-[0.18em] text-black/40 uppercase"
        }
      >
        Fab-native
      </span>
    </div>
  );
}
