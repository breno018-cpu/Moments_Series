import React from "react";
import { cn } from "@/lib/utils";

export const PROGRESSIVE_WHITE_STEPS = [
  { alpha: 0.72, from: "0%", to: "38%" },
  { alpha: 0.45, from: "8%", to: "52%" },
  { alpha: 0.28, from: "20%", to: "68%" },
  { alpha: 0.14, from: "36%", to: "84%" },
  { alpha: 0.06, from: "55%", to: "100%" },
] as const;

export function ProgressiveBlurEdge({
  edge,
  className,
}: {
  edge: "top" | "bottom";
  className?: string;
}) {
  const dir = edge === "top" ? "to bottom" : "to top";

  return (
    <div
      className={cn(
        "oasis-edge pointer-events-none absolute inset-x-0 z-0 w-full",
        edge === "top" ? "top-0" : "bottom-0",
        className,
      )}
      aria-hidden
    >
      {PROGRESSIVE_WHITE_STEPS.map((step) => (
        <div
          key={`${edge}-${step.alpha}`}
          className="absolute inset-0"
          style={{
            backgroundColor: `rgba(255,255,255,${step.alpha})`,
            maskImage: `linear-gradient(${dir}, black ${step.from}, transparent ${step.to})`,
            WebkitMaskImage: `linear-gradient(${dir}, black ${step.from}, transparent ${step.to})`,
          }}
        />
      ))}
    </div>
  );
}
