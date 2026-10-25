import { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "./ui/button";
import { useSeries } from "@/hooks/useSeries";
import placeholderImage from "@/assets/series-1.jpg";
import { optimizedImage } from "@/lib/image";

import { Series } from "@/hooks/useSeries";
import { SeriesDetailModal } from "@/components/SeriesDetailModal";

interface HeroCarouselProps {
  items: Series[];
}

export const HeroCarousel = ({ items }: HeroCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [imgError, setImgError] = useState<Record<string, boolean>>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const featuredSeries = items;

  useEffect(() => {
    setCurrentSlide(0);
  }, [items]);

  useEffect(() => {
    if (featuredSeries.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredSeries.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredSeries.length]);

  const nextIdx = (currentSlide + 1) % (featuredSeries.length || 1);
  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % featuredSeries.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + featuredSeries.length) % featuredSeries.length);

  // Suporte a swipe no mobile para rotacionar os slides do banner
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!featuredSeries.length) return null;

  const series = featuredSeries[currentSlide] || featuredSeries[0];
  if (!series) return null;

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const imageSrc = imgError[series.id]
    ? placeholderImage
    : optimizedImage(series.image_url, {
        width: isMobile ? 800 : 1400,
        quality: isMobile ? 65 : 75,
      });

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative h-[56vh] sm:h-[66vh] min-h-[420px] max-h-[640px] overflow-hidden bg-background select-none touch-pan-y"
    >
      <div key={series.id} className="absolute inset-0 animate-in fade-in duration-300">
        <img
          src={imageSrc}
          alt={series.title}
          onError={() => setImgError((p) => ({ ...p, [series.id]: true }))}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-top sm:object-center select-none"
        />

        {/* Sem névoa — apenas base inferior sólida para legibilidade do texto */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background/40 to-transparent pointer-events-none" />

        {/* Conteúdo — minimalista, hierarquia tipográfica clara */}
        <div className="relative h-full app-container flex items-end pb-12 sm:pb-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-purple-400 font-bold">
              <span className="bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded">DESTAQUE PREMIUM</span>
              {series.genre && (
                <>
                  <span className="h-px w-6 bg-purple-500/40" />
                  <span className="text-slate-300">{series.genre}</span>
                </>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-4 text-white leading-[1.05] tracking-tight drop-shadow-md">
              {series.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-xs sm:text-sm text-slate-300">
              <span className="flex items-center gap-1.5 font-bold text-yellow-400">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                {series.rating > 0 ? series.rating.toFixed(1) : "4.9"}
              </span>
              <span>{series.year || 2024}</span>
              <span className="uppercase tracking-[0.16em] text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                {series.audio_type === "dublado" ? "Dublado" : "Legendado"}
              </span>
              <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                ✓ Episódios Completos
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 mb-6 line-clamp-2 max-w-xl leading-relaxed">
              {series.description || "Acesso vitalício aos episódios completos em alta resolução. Assista agora no seu smartphone, tablet, smart TV ou computador."}
            </p>

            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                  R$ {series.price.toFixed(2)}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold hidden sm:inline">
                  Acesso Vitalício
                </span>
              </div>
              <Button
                onClick={() => setSelectedSeries(series)}
                className="h-11 px-6 text-xs font-black uppercase tracking-wider rounded-xl bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-400 text-slate-950 hover:from-yellow-400 hover:to-amber-300 shadow-xl shadow-yellow-500/20 border border-yellow-300/40 transition-all hover:scale-105"
              >
                Garantir Acesso
              </Button>
            </div>
          </div>
        </div>
      </div>

      {featuredSeries[nextIdx] && (
        <link rel="preload" as="image" href={optimizedImage(featuredSeries[nextIdx].image_url, { width: 1600, quality: 80 })} />
      )}

      {/* Setas minimalistas com suporte a toque tanto no mobile quanto no desktop */}
      <Button
        variant="ghost"
        size="icon"
        className="flex absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 backdrop-blur-md h-8 w-8 sm:h-10 sm:w-10 rounded-full z-20 border border-white/20 text-white"
        onClick={prevSlide}
        aria-label="Anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="flex absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 backdrop-blur-md h-8 w-8 sm:h-10 sm:w-10 rounded-full z-20 border border-white/20 text-white"
        onClick={nextSlide}
        aria-label="Próximo"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      {/* Indicadores com área de toque confortável */}
      <div className="absolute bottom-3 sm:bottom-6 inset-x-0 flex justify-center items-center gap-1.5 sm:gap-2 z-20 pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto px-3 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
          {featuredSeries.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentSlide
                  ? "w-8 sm:w-12 bg-white shadow-sm"
                  : "w-3 sm:w-6 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {selectedSeries && (
        <SeriesDetailModal
          series={selectedSeries}
          isOpen={!!selectedSeries}
          onClose={() => setSelectedSeries(null)}
        />
      )}
    </div>
  );
};

export default HeroCarousel;
