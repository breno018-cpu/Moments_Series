import React, { useEffect, useRef } from "react";

interface AnimatedCountUpProps {
  end: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCountUp: React.FC<AnimatedCountUpProps> = ({
  end,
  duration = 900,
  delay = 0,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}) => {
  const spanRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let startTime: number | null = null;
    let rafId: number | null = null;

    const format = (val: number) => {
      const formatted = val.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      return `${prefix}${formatted}${suffix}`;
    };

    // If 0, render immediately
    if (end === 0) {
      if (spanRef.current) spanRef.current.textContent = format(0);
      return;
    }

    // Set initial 0
    if (spanRef.current) {
      spanRef.current.textContent = format(0);
    }

    const timer = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Fast ease-out cubic curve (ultra smooth and responsive)
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = ease * end;

        if (spanRef.current) {
          spanRef.current.textContent = format(current);
        }

        if (progress < 1) {
          rafId = requestAnimationFrame(animate);
        } else if (spanRef.current) {
          spanRef.current.textContent = format(end);
        }
      };

      rafId = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [end, duration, delay, decimals, prefix, suffix]);

  const initialFormatted = (0).toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={spanRef} className={className}>
      {prefix}
      {initialFormatted}
      {suffix}
    </span>
  );
};

export default AnimatedCountUp;
