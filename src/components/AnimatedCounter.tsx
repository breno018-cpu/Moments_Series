import { useEffect, useState } from "react";
import { formatCurrencyBRL, formatNumberBRL } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number; // em milissegundos
  isCurrency?: boolean;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

/**
 * AnimatedCounter: Animação suave (60fps) de contagem progressiva do 0 até o valor final.
 * Utiliza easing cúbico suave (easeOutExpo) para garantir um início fluido e desaceleração natural.
 */
export function AnimatedCounter({
  value,
  duration = 1400,
  isCurrency = false,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: AnimatedCounterProps) {
  const [current, setCurrent] = useState<number>(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const target = isNaN(value) ? 0 : value;

    // Curva de aceleração solicitada pelo usuário:
    // Começa lentamente (slow start) e depois ganha velocidade/aceleração até cravar no valor final
    const easeInExpoOrQuad = (t: number): number => {
      // Easing cúbico/quártico progressivo: inicia suave e acelera até o final
      return Math.pow(t, 2.6);
    };

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInExpoOrQuad(progress);

      const nextVal = easedProgress * target;
      setCurrent(nextVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrent(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, duration]);

  if (isCurrency) {
    return <span className={className}>{formatCurrencyBRL(current)}</span>;
  }

  if (decimals > 0) {
    const formatted = current
      .toFixed(decimals)
      .replace(".", ",");
    return (
      <span className={className}>
        {prefix}
        {formatted}
        {suffix}
      </span>
    );
  }

  return (
    <span className={className}>
      {prefix}
      {formatNumberBRL(Math.round(current))}
      {suffix}
    </span>
  );
}
