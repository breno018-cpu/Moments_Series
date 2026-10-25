import { useState, useMemo, memo, useEffect } from "react";
import { Star, Plus, Play, Flame, TrendingUp } from "lucide-react";
import { Series } from "@/hooks/useSeries";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import placeholderImage from "@/assets/series-1.jpg";
import { WishlistButton } from "@/components/WishlistButton";
import { optimizedImage } from "@/lib/image";
import { SeriesDetailModal } from "@/components/SeriesDetailModal";
import { getDynamicSalesMetric } from "@/lib/salesCounter";
import { triggerHaptic } from "@/lib/haptics";

interface FeaturedRankCardProps {
  series: Series;
  rank: number;
  itemType?: 'series' | 'anime';
  copaActive?: boolean;
}

const FeaturedRankCardComponent = ({
  series,
  rank,
  itemType = 'series',
  copaActive = false,
}: FeaturedRankCardProps) => {
  const { addItem } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const rawImageUrl = series?.image_url || '';
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

  const seriesId = series?.id || '';
  const salesMetric = useMemo(
    () => getDynamicSalesMetric(seriesId, true, itemType),
    [seriesId, itemType]
  );

  if (!series || !series.id) return null;

  const price = typeof series.price === 'number' ? series.price : Number(series.price) || 0;
  const rating = typeof series.rating === 'number' ? series.rating : Number(series.rating) || 4.9;
  const year = series.year || 2024;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic('success');
    addItem(series);
    toast.success("Adicionado à sua lista");
  };

  const handleOpenModal = () => {
    triggerHaptic('light');
    setIsModalOpen(true);
  };

  const handleImageError = () => {
    if (!imgError) {
      setImgError(true);
      setImgSrc(placeholderImage);
      setIsLoaded(true);
    }
  };

  return (
    <>
      <div
        onClick={handleOpenModal}
        className="group relative flex items-end cursor-pointer select-none transition-all duration-300 hover:-translate-y-2 py-2"
      >
        {/* Número do Rank estilo Netflix Top 10 (Gigante com profundidade 3D) */}
        <div className="relative z-0 -mr-6 sm:-mr-8 select-none pointer-events-none flex items-end mb-1">
          <span
            className="text-[6.5rem] xs:text-[7.5rem] sm:text-[9rem] md:text-[10.5rem] font-black leading-[0.8] tracking-tighter"
            style={{
              WebkitTextStroke: "3px rgba(255, 255, 255, 0.45)",
              color: "transparent",
              textShadow: "0 15px 35px rgba(0, 0, 0, 0.95)",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            {rank}
          </span>
        </div>

        {/* Card Poster do Destaque em formato ampliado e imponente */}
        <div className="relative z-10 flex-1 aspect-[3/4] overflow-hidden rounded-2xl bg-card/60 border-2 border-amber-500/40 group-hover:border-amber-400 shadow-[0_15px_40px_rgba(0,0,0,0.85)] group-hover:shadow-[0_20px_50px_rgba(245,158,11,0.35)] transition-all duration-300">
          <img
            src={imgSrc}
            alt={series.title}
            onError={handleImageError}
            onLoad={() => setIsLoaded(true)}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-105 ${
              isLoaded || imgError ? "opacity-100" : "opacity-0"
            }`}
          />

          {!isLoaded && !imgError && (
            <div className="absolute inset-0 bg-muted/90 animate-pulse" />
          )}

          {/* Gradiente de iluminação cinematográfica */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

          {/* Badge TOP 10 / FOGO */}
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1 items-start">
            <span className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-md">
              <Flame className="w-3 h-3 fill-slate-950" />
              TOP {rank}
            </span>
            {copaActive && (
              <span className="bg-yellow-400 text-slate-950 font-black text-[8px] px-1.5 py-0.5 rounded shadow tracking-wider uppercase">
                Edição Brasil
              </span>
            )}
          </div>

          {/* Wishlist */}
          <WishlistButton
            itemType={itemType}
            itemId={series.id}
            className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
          />

          {/* Informações na base do pôster */}
          <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 z-20">
            <div className="bg-[#07080c]/85 backdrop-blur-md border border-white/10 rounded-lg p-2 transition-all">
              <h4 className="font-bold text-xs sm:text-sm line-clamp-1 text-white tracking-tight">
                {series.title}
              </h4>
              <div className="flex items-center justify-between mt-1 text-[10px] sm:text-xs">
                <div className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{rating.toFixed(1)}</span>
                </div>
                <span className="text-white font-extrabold">
                  R$ {price.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Botão de Adicionar Rápido */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="absolute bottom-14 right-3 z-30 flex items-center justify-center h-8 w-8 rounded-full bg-amber-400 text-slate-950 font-bold shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:scale-110"
            aria-label="Adicionar ao carrinho"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {isModalOpen && (
        <SeriesDetailModal
          series={series}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          itemType={itemType}
        />
      )}
    </>
  );
};

export const FeaturedRankCard = memo(FeaturedRankCardComponent);
export default FeaturedRankCard;
