import { Heart } from "lucide-react";
import { useWishlist, useToggleWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  itemId: string;
  itemType?: string;
  className?: string;
}

export function WishlistButton({ itemId, itemType = 'series', className }: WishlistButtonProps) {
  const { isInWishlist } = useWishlist(itemType, itemId);
  const toggle = useToggleWishlist();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle.mutate({ itemId, itemType });
      }}
      className={cn(
        "h-8 w-8 rounded-full border border-white/10 bg-black/60 backdrop-blur flex items-center justify-center text-foreground hover:scale-110 active:scale-95 transition-all",
        isInWishlist && "text-red-500 border-red-500/40 bg-red-500/10",
        className
      )}
      aria-label="Favoritar"
    >
      <Heart className={cn("h-4 w-4", isInWishlist && "fill-red-500")} />
    </button>
  );
}
