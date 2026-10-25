import { Heart } from "lucide-react";
import { useWishlist, useToggleWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  itemId: string;
  itemType?: string;
  className?: string;
}

export function WishlistButton({ itemId, itemType = 'series', className }: WishlistButtonProps) {
  const { data: wishlist = [] } = useWishlist();
  const toggle = useToggleWishlist();

  const isFavorite = Array.isArray(wishlist) && wishlist.some(
    (item) => item.item_id === itemId && item.item_type === itemType
  );

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle.mutate({
          item_type: itemType === 'anime' ? 'anime' : 'series',
          item_id: itemId,
          isFavorite,
        });
      }}
      className={cn(
        "h-8 w-8 rounded-full border border-white/10 bg-black/60 backdrop-blur flex items-center justify-center text-foreground hover:scale-110 active:scale-95 transition-all",
        isFavorite && "text-red-500 border-red-500/40 bg-red-500/10",
        className
      )}
      aria-label="Favoritar"
    >
      <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500")} />
    </button>
  );
}
