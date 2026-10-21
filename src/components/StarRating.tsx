import { useState } from "react";
import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

export interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number | "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  readonly?: boolean;
  showValue?: boolean;
  count?: number;
}

const SIZE_MAP = {
  xs: 13,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 30,
};

export function StarRating({
  rating = 0,
  maxStars = 5,
  size = "md",
  className,
  onRatingChange,
  interactive,
  readonly = false,
  showValue = false,
  count,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Determina se o componente é interativo
  const isInteractive = readonly ? false : interactive !== undefined ? interactive : Boolean(onRatingChange);

  // Calcula tamanho em pixels
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size] || 20;

  // Nota a ser exibida (se o usuário estiver passando o cursor, destaca a prévia)
  const activeRating = hoverRating !== null ? hoverRating : rating;

  const handleMouseEnter = (starValue: number) => {
    if (!isInteractive) return;
    setHoverRating(starValue);
    triggerHaptic("light");
  };

  const handleClick = (starValue: number) => {
    if (!isInteractive || !onRatingChange) return;
    triggerHaptic("success");
    onRatingChange(starValue);
  };

  return (
    <div
      className={cn("inline-flex items-center gap-1.5 select-none", className)}
      onMouseLeave={() => isInteractive && setHoverRating(null)}
      role={isInteractive ? "radiogroup" : "img"}
      aria-label={`Avaliação: ${rating.toFixed(1)} de ${maxStars} estrelas`}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }).map((_, index) => {
          const starValue = index + 1;
          const isFull = activeRating >= starValue;
          const isHalf = !isFull && activeRating >= starValue - 0.5 && hoverRating === null;

          return (
            <button
              key={index}
              type="button"
              disabled={!isInteractive}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              aria-label={`Classificar com ${starValue} estrela${starValue > 1 ? "s" : ""}`}
              className={cn(
                "relative p-0.5 rounded-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
                isInteractive
                  ? "cursor-pointer hover:scale-115 active:scale-95"
                  : "cursor-default pointer-events-none"
              )}
            >
              {isHalf ? (
                <div className="relative">
                  {/* Fundo da estrela vazia */}
                  <Star
                    size={pixelSize}
                    className="text-slate-700/80 stroke-[1.5]"
                  />
                  {/* Meia estrela preenchida sobreposta */}
                  <StarHalf
                    size={pixelSize}
                    className="absolute inset-0 fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] stroke-[1.5]"
                  />
                </div>
              ) : (
                <Star
                  size={pixelSize}
                  className={cn(
                    "transition-all duration-200 stroke-[1.5]",
                    isFull
                      ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                      : "text-slate-700/80 fill-transparent hover:text-amber-400/50"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {showValue && (
        <span
          className={cn(
            "font-bold tabular-nums tracking-tight ml-0.5 text-amber-400",
            pixelSize <= 16 ? "text-xs" : pixelSize <= 22 ? "text-sm" : "text-base"
          )}
        >
          {(activeRating || rating || 0).toFixed(1)}
        </span>
      )}

      {count !== undefined && (
        <span className="text-muted-foreground text-xs font-normal">
          ({count} {count === 1 ? "avaliação" : "avaliações"})
        </span>
      )}
    </div>
  );
}
