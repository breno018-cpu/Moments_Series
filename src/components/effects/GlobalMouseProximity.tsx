import React, { useEffect, useState } from "react";

export const GlobalMouseProximity: React.FC = () => {
  const [coords, setCoords] = useState<{ x: number; y: number; visible: boolean }>({
    x: -500,
    y: -500,
    visible: false,
  });

  useEffect(() => {
    // Only enable for desktop mice (not touch devices)
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setCoords({ x: e.clientX, y: e.clientY, visible: true });
        document.documentElement.style.setProperty("--cursor-x", `${e.clientX}px`);
        document.documentElement.style.setProperty("--cursor-y", `${e.clientY}px`);
      });
    };

    const handleMouseLeave = () => {
      setCoords((prev) => ({ ...prev, visible: false }));
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  if (!coords.visible) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-300 overflow-hidden"
      aria-hidden="true"
    >
      {/* 1. Primary Luxury Ambient Spotlight */}
      <div
        className="absolute rounded-full pointer-events-none transition-transform duration-75 ease-out"
        style={{
          width: 520,
          height: 520,
          left: coords.x - 260,
          top: coords.y - 260,
          background:
            "radial-gradient(circle, rgba(123, 63, 228, 0.09) 0%, rgba(245, 158, 11, 0.04) 40%, transparent 70%)",
          filter: "blur(35px)",
        }}
      />

      {/* 2. Micro Cursor Reticle Light (Fine Proximity Beam) */}
      <div
        className="absolute rounded-full pointer-events-none transition-transform duration-75 ease-out"
        style={{
          width: 160,
          height: 160,
          left: coords.x - 80,
          top: coords.y - 80,
          background:
            "radial-gradient(circle, rgba(192, 132, 252, 0.12) 0%, rgba(245, 158, 11, 0.06) 40%, transparent 75%)",
          filter: "blur(10px)",
        }}
      />
    </div>
  );
};

export default GlobalMouseProximity;
