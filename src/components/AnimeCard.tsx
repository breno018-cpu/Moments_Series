import { Star, Plus, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Anime } from "@/hooks/useAnimes";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { useState, memo, useEffect, useRef } from "react";
import placeholderImage from "@/assets/series-1.jpg";
import { optimizedImage } from "@/lib/image";
import { WishlistButton } from "@/components/WishlistButton";
import { SeriesDetailModal } from "@/components/SeriesDetailModal";

interface AnimeCardProps {
  anime: Anime;
}

const AnimeCardComponent = ({ anime }: AnimeCardProps) => {
  const { addItem } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const rawImageUrl = anime?.image_url || '';
  const [imgSrc, setImgSrc] = useState(rawImageUrl ? optimizedImage(rawImageUrl, { width: 360, quality: 75 }) : placeholderImage);
  const [imgError, setImgError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (rawImageUrl) {
      setImgSrc(optimizedImage(rawImageUrl, { width: 360, quality: 75 }));
      setImgError(false);
    } else {
      setImgSrc(placeholderImage);
    }
  }, [rawImageUrl]);

  if (!anime || !anime.id) return null;

  const price = typeof anime.price === 'number' ? anime.price : Number(anime.price) || 0;
  const rating = typeof anime.rating === 'number' ? anime.rating : Number(anime.rating) || 0;
  const year = anime.year || 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: anime.id,
      title: anime.title,
      genre: anime.genre,
      year: anime.year,
      rating: anime.rating,
      description: anime.description,
      long_description: anime.long_description,
      image_url: anime.image_url,
      trailer_url: anime.trailer_url,
      price: price,
      seasons: anime.seasons,
      episodes: anime.episodes,
      featured: anime.featured,
      audio_type: anime.audio_type,
    });
    toast.success("Adicionado à sua lista");
  };

  const handleImageError = () => {
    if (!imgError) {
      setImgError(true);
      setImgSrc(placeholderImage);
      setIsLoaded(true);
    }
  };

  const pointerDownPos = useRef<{ x: number; y: number; time: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerDownPos.current) {
      const dx = Math.abs(e.clientX - pointerDownPos.current.x);
      const dy = Math.abs(e.clientY - pointerDownPos.current.y);
      const dt = Date.now() - pointerDownPos.current.time;
      pointerDownPos.current = null;
      if (dx > 6 || dy > 6 || dt > 500) {
        // O usuário estava rolando a página ou arrastando o catálogo. Não abre modal.
        return;
      }
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="group block cursor-pointer select-none"
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted/80 ring-1 ring-white/10 group-hover:ring-purple-500/50 transition-colors duration-200">
          <img
            src={imgSrc}
            alt={anime.title}
            onError={handleImageError}
            onLoad={() => setIsLoaded(true)}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover object-center transition-opacity duration-200 ${
              isLoaded || imgError ? "opacity-100" : "opacity-0"
            }`}
          />

          {!isLoaded && !imgError && <div className="absolute inset-0 shimmer-placeholder-dark" />}

          {/* Overlay sutil no hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="absolute top-1.5 left-1.5 flex gap-1 items-center z-10">
            <div className="bg-[#07080c]/90 border border-white/10 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] font-medium text-foreground/90">
              {anime.audio_type === "dublado" ? "DUB" : "LEG"}
            </div>
            {anime.featured && (
              <span className="bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5 uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" /> DESTAQUE
              </span>
            )}
          </div>

          <WishlistButton itemType="anime" itemId={anime.id} className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />

          <button
            type="button"
            onClick={handleAddToCart}
            className="absolute bottom-1.5 right-1.5 flex items-center justify-center h-7 w-7 rounded-full bg-foreground text-background opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300"
            aria-label="Adicionar"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="pt-2 px-0.5">
          <h3 className="font-medium text-xs sm:text-sm line-clamp-1 text-foreground tracking-tight">
            {anime.title}
          </h3>
          <div className="flex items-center justify-between mt-0.5 gap-2">
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground min-w-0">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 flex-shrink-0" />
              <span className="font-medium text-foreground/90">{rating > 0 ? rating.toFixed(1) : "4.9"}</span>
              {year > 0 && <span className="truncate">· {year}</span>}
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-foreground whitespace-nowrap tracking-tight">
              R$ {price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <SeriesDetailModal
          series={{
            id: anime.id,
            title: anime.title,
            genre: anime.genre,
            year: anime.year,
            rating: anime.rating,
            description: anime.description,
            long_description: anime.long_description,
            image_url: anime.image_url,
            trailer_url: anime.trailer_url,
            price: anime.price,
            seasons: anime.seasons,
            episodes: anime.episodes,
            featured: anime.featured,
            audio_type: anime.audio_type,
            created_at: '',
            updated_at: '',
          }}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          itemType="anime"
        />
      )}
    </>
  );
};

export const AnimeCard = memo(AnimeCardComponent);
export default AnimeCard;
