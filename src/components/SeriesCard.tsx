import { Star, Plus, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Series } from "@/hooks/useSeries";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { useState, useMemo, memo, useEffect, useRef } from "react";
import placeholderImage from "@/assets/series-1.jpg";
import { WishlistButton } from "@/components/WishlistButton";
import { optimizedImage } from "@/lib/image";
import { SeriesDetailModal } from "@/components/SeriesDetailModal";
import { getDynamicSalesMetric } from "@/lib/salesCounter";
import { triggerHaptic } from "@/lib/haptics";

interface SeriesCardProps {
  series: Series;
  itemType?: 'series' | 'anime';
  copaActive?: boolean;
  halloweenActive?: boolean;
  christmasActive?: boolean;
  newyearActive?: boolean;
}

const SeriesCardComponent = ({
  series,
  itemType = 'series',
  copaActive = false,
  halloweenActive = false,
  christmasActive = false,
  newyearActive = false,
}: SeriesCardProps) => {
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
  const salesMetric = useMemo(() => getDynamicSalesMetric(seriesId, Boolean(series?.featured), itemType), [seriesId, series?.featured, itemType]);

  if (!series || !series.id) return null;

  const price = typeof series.price === 'number' ? series.price : Number(series.price) || 0;
  const rating = typeof series.rating === 'number' ? series.rating : Number(series.rating) || 0;
  const year = series.year || 0;

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
    handleOpenModal();
  };

  return (
    <>
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="group block cursor-pointer select-none"
      >
        {/* Poster — ultraleve e sem cortes, alinhado à proporção real 3:4 das capas */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted/80 ring-1 ring-white/10 group-hover:ring-purple-500/50 transition-colors duration-200">
          <img
            src={imgSrc}
            alt={series.title}
            onError={handleImageError}
            onLoad={() => setIsLoaded(true)}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover object-center transition-opacity duration-200 ${
              isLoaded || imgError ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Skeleton placeholder enquanto carrega a imagem do poster */}
          {!isLoaded && !imgError && (
            <div className="absolute inset-0 shimmer-placeholder-dark" />
          )}

          {/* Overlay sutil no hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Wishlist */}
          <WishlistButton itemType={itemType} itemId={series.id} className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Audio badge minimalista & Festive badges integrados */}
          <div className="absolute top-1.5 left-1.5 flex gap-1 items-center z-10 flex-wrap">
            <div className="bg-[#07080c]/90 border border-white/10 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] font-medium text-foreground/90">
              {series.audio_type === "dublado" ? "DUB" : "LEG"}
            </div>
            {copaActive && series.featured && (
              <div className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 text-slate-950 font-black rounded px-1.5 py-0.5 text-[8px] uppercase tracking-wider flex items-center gap-1 shadow-sm border border-yellow-300/40 select-none">
                <span>BRASIL 2026</span>
              </div>
            )}
            {halloweenActive && series.featured && (
              <div className="bg-gradient-to-r from-orange-600 to-purple-600 text-white font-black rounded px-1.5 py-0.5 text-[8px] uppercase tracking-wider flex items-center gap-1 shadow-sm border border-orange-400/40 select-none">
                <span>🎃 TERROR</span>
              </div>
            )}
            {christmasActive && series.featured && (
              <div className="bg-gradient-to-r from-red-600 to-emerald-600 text-white font-black rounded px-1.5 py-0.5 text-[8px] uppercase tracking-wider flex items-center gap-1 shadow-sm border border-red-400/40 select-none">
                <span>🎄 NATAL</span>
              </div>
            )}
            {newyearActive && series.featured && (
              <div className="bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black rounded px-1.5 py-0.5 text-[8px] uppercase tracking-wider flex items-center gap-1 shadow-sm border border-yellow-300/40 select-none">
                <span>✨ ANO NOVO</span>
              </div>
            )}
          </div>

          {/* Tag de vendas fictícias dinâmicas em cores alinhadas ao tema (sem backdrop-blur pesado no Safari) */}
          <div className={`absolute bottom-1.5 left-1.5 z-10 font-bold text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded shadow-sm border border-white/10 bg-[#07080c]/95 ${salesMetric.badgeClass}`}>
            <span>{salesMetric.label}</span>
          </div>

          {/* Quick add */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="absolute bottom-1.5 right-1.5 flex items-center justify-center h-7 w-7 rounded-full bg-foreground text-background opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300"
            aria-label="Adicionar"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Info — densidade alta, tipografia limpa */}
        <div className="pt-2 px-0.5">
          <h3 className="font-medium text-xs sm:text-sm line-clamp-1 text-foreground tracking-tight">
            {series.title}
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
          series={series}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          itemType={itemType}
        />
      )}
    </>
  );
};

export const SeriesCard = memo(SeriesCardComponent);
export default SeriesCard;
