import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Play, Plus, Check } from "lucide-react";
import { Series } from "@/hooks/useSeries";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { WishlistButton } from "@/components/WishlistButton";
import { useNavigate } from "react-router-dom";
import { optimizedImage } from "@/lib/image";
import { StarRating } from "@/components/StarRating";
import { useSeriesRatings, useRateSeries } from "@/hooks/useSeriesRatings";

interface SeriesDetailModalProps {
  series: Series;
  isOpen: boolean;
  onClose: () => void;
  itemType?: 'series' | 'anime';
}

export function SeriesDetailModal({ series, isOpen, onClose, itemType = 'series' }: SeriesDetailModalProps) {
  const { addItem, items } = useCart();
  const navigate = useNavigate();

  const seriesRating = typeof series?.rating === 'number' && series.rating > 0 ? series.rating : 4.9;
  const { data: ratingStats } = useSeriesRatings(series?.id, seriesRating);
  const rateMutation = useRateSeries(series?.id || '');

  if (!series) return null;

  const inCart = items.some((i) => i.id === series.id);
  const price = typeof series.price === 'number' ? series.price : Number(series.price) || 0;

  const handleBuyNow = () => {
    addItem(series);
    onClose();
    navigate(`/checkout/${series.id}`);
  };

  const handleAddToCart = () => {
    addItem(series);
    toast.success("Adicionado à lista!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden bg-[#0c0d14] border-white/10 text-white p-0 gap-0 rounded-2xl shadow-2xl">
        <div className="relative aspect-video w-full overflow-hidden bg-black select-none">
          <img
            src={series.image_url ? optimizedImage(series.image_url, { width: 720, quality: 75 }) : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=720&q=75&auto=format&fit=crop'}
            alt={series.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d14] via-[#0c0d14]/40 to-transparent" />
          <WishlistButton itemId={series.id} itemType={itemType} className="absolute top-3 right-12 z-10" />
        </div>

        <div className="p-4 sm:p-6 space-y-4 w-full min-w-0 max-w-full overflow-x-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 w-full min-w-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight break-words text-white">{series.title}</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5 flex-wrap">
                <StarRating
                  rating={ratingStats?.average ?? seriesRating}
                  readonly
                  size="xs"
                  showValue
                  count={ratingStats?.count}
                />
                <span>·</span>
                <span className="truncate">{series.genre}</span>
                <span>·</span>
                <span>{series.year || 2024}</span>
                <span>·</span>
                <span className="uppercase">{series.audio_type || 'Dublado'}</span>
              </div>
            </div>
            <div className="sm:text-right flex items-baseline sm:flex-col justify-between sm:justify-start gap-1 flex-shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-white/5">
              <span className="text-xs text-muted-foreground">Acesso Vitalício</span>
              <div className="text-xl sm:text-2xl font-black text-purple-400">R$ {price.toFixed(2)}</div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed break-words">
            {series.description || series.long_description || "Acompanhe essa produção imperdível disponível em alta definição com áudio original e dublado."}
          </p>

          {/* Mini-box de avaliação direta */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs flex-wrap">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <span>{ratingStats?.userRating ? "Sua nota salva:" : "Avalie este título:"}</span>
              {ratingStats?.userRating && (
                <span className="text-amber-400 font-bold">({ratingStats.userRating}/5)</span>
              )}
            </span>
            <StarRating
              rating={ratingStats?.userRating ?? 0}
              onRatingChange={(r) => rateMutation.mutate(r)}
              size="sm"
              interactive
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-white/10 w-full min-w-0">
            <Button onClick={handleBuyNow} size="lg" className="flex-1 font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 shadow-md hover:shadow-purple-500/20">
              <Play className="w-4 h-4 mr-2 fill-current" />
              Comprar Agora
            </Button>
            <Button
              onClick={handleAddToCart}
              variant="outline"
              size="lg"
              className="font-semibold border-white/15 hover:bg-white/5"
            >
              {inCart ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <Plus className="w-4 h-4 mr-2" />}
              {inCart ? "Na Lista" : "Adicionar à Lista"}
            </Button>
            <Button
              onClick={() => {
                onClose();
                navigate(itemType === 'anime' ? `/animes` : `/series/${series.id}`);
              }}
              variant="secondary"
              size="lg"
              className="font-semibold bg-white/10 hover:bg-white/15 text-white"
            >
              Página Completa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
