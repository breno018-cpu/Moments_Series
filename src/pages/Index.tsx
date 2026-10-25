import { Navbar } from "@/components/Navbar";
import { SeriesCard } from "@/components/SeriesCard";
import Footer from "@/components/Footer";
import { HeroCarousel } from "@/components/HeroCarousel";
import { useSeries, Series } from "@/hooks/useSeries";
import { useAnimes } from "@/hooks/useAnimes";
import { usePageView } from "@/hooks/usePageView";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { QuickFilterBar, FilterCategory } from "@/components/QuickFilterBar";
import trophyImg from "@/assets/trophy.jpg";
import ballImg from "@/assets/ball.jpg";
import { useEffect, useMemo, useRef, useState, memo } from "react";
import { Sparkles, ChevronRight, ChevronLeft, Film, Trophy, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeaturedRankCard } from "@/components/FeaturedRankCard";
import { StorefrontGridSkeleton, StorefrontRowSkeleton } from "@/components/StorefrontSkeleton";

interface RowProps {
  title: string;
  items: Series[];
  accent?: boolean;
  copaActive?: boolean;
  halloweenActive?: boolean;
  christmasActive?: boolean;
  newyearActive?: boolean;
}

const RowComponent = ({
  title,
  items,
  accent,
  copaActive,
  halloweenActive,
  christmasActive,
  newyearActive,
}: RowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  // Limita a 24 itens na linha horizontal para fluidez total de 120fps no iOS/Safari
  const displayItems = useMemo(() => (items ? items.slice(0, 24) : []), [items]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanLeft(el.scrollLeft > 8);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [displayItems.length]);

  if (!items || items.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.85;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="mb-8 sm:mb-12 group/row">
      <div className="app-container">
        <div className="flex items-end justify-between mb-3">
          <div className="flex items-baseline gap-3">
            <h2 className="text-base sm:text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {items.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll("left")}
              disabled={!canLeft}
              aria-label="Anterior"
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-white/10 bg-white/5 backdrop-blur flex items-center justify-center text-foreground/80 hover:text-foreground hover:bg-white/15 hover:border-white/20 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canRight}
              aria-label="Próximo"
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-white/10 bg-white/5 backdrop-blur flex items-center justify-center text-foreground/80 hover:text-foreground hover:bg-white/15 hover:border-white/20 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>

        <div className="relative">
          {canLeft && (
            <div className="hidden sm:block pointer-events-none absolute left-0 top-0 bottom-2 w-12 bg-gradient-to-r from-background to-transparent z-[1]" />
          )}
          {canRight && (
            <div className="hidden sm:block pointer-events-none absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent z-[1]" />
          )}

          <div
            ref={scrollRef}
            style={{ WebkitOverflowScrolling: 'touch' }}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 touch-pan-x scroll-smooth"
          >
            {displayItems.map((s) => (
              <div key={s.id} className="flex-none w-[135px] xs:w-[150px] sm:w-[170px] md:w-[185px] lg:w-[195px] xl:w-[205px]">
                <SeriesCard
                  series={s}
                  copaActive={copaActive}
                  halloweenActive={halloweenActive}
                  christmasActive={christmasActive}
                  newyearActive={newyearActive}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Row = memo(RowComponent);

const Index = () => {
  const { data: series, isLoading } = useSeries();
  const { data: animes = [] } = useAnimes();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const [selectedGenre, setSelectedGenre] = useState("Todos");
  const [quickFilter, setQuickFilter] = useState<FilterCategory>("all");

  usePageView();

  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const { data: settings } = useSiteSettings();
  const copaActive = isLoaded && settings ? settings.copa_theme_active === 'true' : false;
  const halloweenActive = isLoaded && settings ? settings.halloween_theme_active === 'true' : false;
  const christmasActive = isLoaded && settings ? settings.christmas_theme_active === 'true' : false;
  const newyearActive = isLoaded && settings ? settings.newyear_theme_active === 'true' : false;

  const filteredSeries = useMemo(() => {
    if (!series) return [];
    if (!searchQuery) return series;
    const q = searchQuery.toLowerCase();
    return series.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.genre.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [series, searchQuery]);

  // Destaques: Top 10 títulos com featured=true ou os primeiros do catálogo
  const featured = useMemo(() => {
    if (!series || series.length === 0) return [];
    const feat = series.filter(s => s.featured);
    return feat.length > 0 ? feat.slice(0, 10) : series.slice(0, 10);
  }, [series]);

  // Contagens para os Chips de Filtro Rápido
  const quickCounts = useMemo(() => {
    const sList = series || [];
    return {
      all: sList.length + animes.length,
      featured: sList.filter((s) => s.featured).length,
      recent: Math.min(sList.length, 20),
      dublado: sList.filter((s) => s.audio_type === "dublado").length,
      legendado: sList.filter((s) => s.audio_type === "legendado").length,
      anime: animes.length,
      top_rated: sList.filter((s) => (s.rating || 0) >= 4.8).length,
    };
  }, [series, animes]);

  // Lista dinâmica ao ativar um filtro rápido
  const quickFilteredSection = useMemo(() => {
    if (quickFilter === 'all') return null;
    const sList = series || [];
    switch (quickFilter) {
      case "featured":
        return { items: sList.filter((s) => s.featured), type: 'series' as const, title: 'Mais Vendidos da Semana' };
      case "recent":
        return { items: sList.slice(0, 24), type: 'series' as const, title: 'Lançamentos Recentes' };
      case "dublado":
        return { items: sList.filter((s) => s.audio_type === "dublado"), type: 'series' as const, title: 'Produções Dubladas em Português' };
      case "legendado":
        return { items: sList.filter((s) => s.audio_type === "legendado"), type: 'series' as const, title: 'Produções Legendadas em HD' };
      case "anime":
        return { items: animes as any[], type: 'anime' as const, title: 'Catálogo de Animes Exclusivos' };
      case "top_rated":
        return { items: [...sList].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 24), type: 'series' as const, title: 'Títulos Mais Bem Avaliados' };
      default:
        return null;
    }
  }, [quickFilter, series, animes]);

  // Lista limpa de categorias (gêneros) válidas, evitando descrições longas
  const genres = ["Todos", "Ação", "Drama", "Romance", "Brasileira", "Anime", "Família", "LGBT", "Picante", "Clichê"];

  const displayedCatalog = useMemo(() => {
    if (selectedGenre === "Todos") return filteredSeries;
    return filteredSeries.filter((s) => {
      const genreText = s.genre?.toLowerCase() || "";
      if (selectedGenre === "Brasileira") {
        return genreText.includes("brasileira") || genreText.includes("brasilera") || genreText.includes("brasileiras");
      }
      if (selectedGenre === "Ação") {
        return genreText.includes("ação") || genreText.includes("acao");
      }
      return genreText.includes(selectedGenre.toLowerCase());
    });
  }, [filteredSeries, selectedGenre]);

  // Carregamento progressivo para fluidez de 120fps no iPhone e mobile
  const [visibleCount, setVisibleCount] = useState(24);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(24);
  }, [selectedGenre, searchQuery, quickFilter]);

  const visibleCatalog = useMemo(() => {
    return displayedCatalog.slice(0, visibleCount);
  }, [displayedCatalog, visibleCount]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 24, displayedCatalog.length));
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [displayedCatalog.length]);

  const dublados = useMemo(
    () => series?.filter((s) => s.audio_type === "dublado") ?? [],
    [series]
  );
  const legendados = useMemo(
    () => series?.filter((s) => s.audio_type === "legendado") ?? [],
    [series]
  );
  const recentes = useMemo(() => series?.slice(0, 20) ?? [], [series]);
  const brasileiras = useMemo(
    () => series?.filter((s) => s.genre?.toUpperCase().includes("BRASILEIRA")) ?? [],
    [series]
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-[58px] sm:pt-[72px]">
        {!searchQuery && <HeroCarousel items={featured} />}

        {!searchQuery && (
          <QuickFilterBar
            activeFilter={quickFilter}
            onSelectFilter={setQuickFilter}
            counts={quickCounts}
          />
        )}

        {searchQuery ? (
          <section className="app-container py-8 sm:py-14">
            <h2 className="text-xl sm:text-3xl font-bold mb-2">
              Resultados para "{searchQuery}"
            </h2>
            <p className="text-sm text-muted-foreground mb-6 sm:mb-8">
              {filteredSeries.length} {filteredSeries.length === 1 ? "título encontrado" : "títulos encontrados"}
            </p>
            {isLoading ? (
              <StorefrontGridSkeleton count={8} />
            ) : filteredSeries.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg sm:text-xl mb-2">Nenhum resultado encontrado</p>
                <p className="text-sm text-muted-foreground">
                  Tente outro título, gênero ou descrição
                </p>
              </div>
            ) : (
              <div className="catalog-grid">
                {filteredSeries.map((s) => (
                  <SeriesCard key={s.id} series={s} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <div className="py-6 sm:py-10">
            {isLoading ? (
              <div className="space-y-6">
                <StorefrontRowSkeleton title="Recentemente adicionados" count={7} />
                <StorefrontRowSkeleton title="Dubladas em português" count={7} />
                <section className="app-container mt-6">
                  <div className="h-5 w-48 rounded bg-white/[0.08] mb-6 shimmer-placeholder-dark" />
                  <StorefrontGridSkeleton count={12} />
                </section>
              </div>
            ) : quickFilteredSection ? (
              /* Visualização quando um Chip de Filtro Rápido está Ativo */
              <section className="app-container py-4 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6 pb-3 border-b border-white/[0.06]">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                      {quickFilteredSection.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {quickFilteredSection.items.length} {quickFilteredSection.items.length === 1 ? 'título disponível nesta seleção' : 'títulos disponíveis nesta seleção'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuickFilter('all')}
                    className="text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 self-start sm:self-auto"
                  >
                    Ver Todo o Catálogo →
                  </Button>
                </div>

                {quickFilteredSection.items.length === 0 ? (
                  <div className="text-center py-16">
                    <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-base text-slate-300">Nenhum título encontrado nesta categoria.</p>
                  </div>
                ) : (
                  <div className="catalog-grid">
                    {quickFilteredSection.items.map((item: any) => (
                      <SeriesCard
                        key={item.id}
                        series={item}
                        itemType={quickFilteredSection.type}
                        copaActive={copaActive}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <>
                {copaActive && (
                  <div className="app-container mb-8 animate-in fade-in duration-700">
                    <div className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-r from-emerald-950/50 via-yellow-950/20 to-blue-950/45 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-xl shadow-[0_0_30px_rgba(234,179,8,0.08)] copa-glow-card copa-border-rainbow">
                      {/* Ambient blur lights */}
                      <div className="absolute top-0 right-1/4 w-40 h-40 bg-yellow-500/15 rounded-full blur-[80px] pointer-events-none" />
                      <div className="absolute bottom-0 left-10 w-40 h-40 bg-emerald-500/15 rounded-full blur-[80px] pointer-events-none" />
                      {/* Grid overlay pattern */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                      <div className="flex items-center gap-5 relative z-10 text-center sm:text-left flex-col sm:flex-row">
                        <div className="flex -space-x-3.5 flex-shrink-0">
                          <img src={trophyImg} alt="Taça da Copa" className="h-14 w-auto object-contain rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-yellow-500/30 animate-float-cup" />
                          <img src={ballImg} alt="Bola da Copa" className="h-14 w-auto object-contain rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-white/10 animate-float-ball" />
                        </div>
                        <div>
                          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                            <span className="text-[9px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full uppercase tracking-widest">EDIÇÃO ESPECIAL LIMITADA</span>
                            <span className="text-emerald-400 text-xs font-bold animate-pulse">● Live</span>
                          </div>
                          <h4 className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-emerald-300 to-blue-300 tracking-tight">Clima de Copa do Mundo 2026!</h4>
                          <p className="text-xs sm:text-sm text-zinc-300 font-medium mt-0.5">Torcendo juntos pelo Brasil. Que venha o Hexa!</p>
                        </div>
                      </div>
                      <div className="text-[10px] font-extrabold text-slate-950 bg-gradient-to-r from-yellow-400 to-yellow-300 border border-yellow-400/20 px-4.5 py-2.5 rounded-xl uppercase tracking-wider select-none relative z-10 shadow-lg hover:scale-105 transition-transform duration-300 cursor-default">
                        Torcida Moments
                      </div>
                    </div>
                  </div>
                )}
                {halloweenActive && (
                  <div className="app-container mb-8 animate-in fade-in duration-700">
                    <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-[#1c0d2e] via-zinc-950/60 to-[#2e1305] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-xl shadow-[0_0_30px_rgba(249,115,22,0.08)] halloween-glow-card">
                      {/* Ambient blur lights */}
                      <div className="absolute top-0 right-1/4 w-40 h-40 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />
                      <div className="absolute bottom-0 left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
                      {/* Grid overlay pattern */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                      <div className="flex items-center gap-5 relative z-10 text-center sm:text-left flex-col sm:flex-row">
                        <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex-shrink-0 select-none">
                          <Flame className="w-8 h-8" />
                        </div>
                        <div>
                          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                            <span className="text-[9px] font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-0.5 rounded-full uppercase tracking-widest">TEMPORADA DE TERROR</span>
                            <span className="text-purple-400 text-xs font-bold animate-pulse">● Live</span>
                          </div>
                          <h4 className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-purple-400 tracking-tight">Portal das Sombras Moments!</h4>
                          <p className="text-xs sm:text-sm text-zinc-300 font-medium mt-0.5">Séries de mistério e suspense para maratonar no escuro.</p>
                        </div>
                      </div>
                      <div className="text-[10px] font-extrabold text-white bg-gradient-to-r from-orange-600 to-purple-600 border border-orange-500/20 px-4.5 py-2.5 rounded-xl uppercase tracking-wider select-none relative z-10 shadow-lg hover:scale-105 transition-transform duration-300 cursor-default animate-pulse">
                        Especial Halloween
                      </div>
                    </div>
                  </div>
                )}
                {christmasActive && (
                  <div className="app-container mb-8 animate-in fade-in duration-700">
                    <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-r from-[#2b0c0c] via-zinc-950/60 to-[#0c2b18] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-xl shadow-[0_0_30px_rgba(239,68,68,0.08)] christmas-glow-card">
                      {/* Ambient blur lights */}
                      <div className="absolute top-0 right-1/4 w-40 h-40 bg-red-500/10 rounded-full blur-[80px] pointer-events-none" />
                      <div className="absolute bottom-0 left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
                      {/* Grid overlay pattern */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                      <div className="flex items-center gap-5 relative z-10 text-center sm:text-left flex-col sm:flex-row">
                        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex-shrink-0 select-none">
                          <Sparkles className="w-8 h-8" />
                        </div>
                        <div>
                          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                            <span className="text-[9px] font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full uppercase tracking-widest">MAGIA DE NATAL</span>
                            <span className="text-emerald-400 text-xs font-bold animate-pulse">● Live</span>
                          </div>
                          <h4 className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-200 to-emerald-400 tracking-tight">Feliz Natal & Boas Festas!</h4>
                          <p className="text-xs sm:text-sm text-zinc-300 font-medium mt-0.5">Aproveite a época mais acolhedora com os romances e dramas mais emocionantes.</p>
                        </div>
                      </div>
                      <div className="text-[10px] font-extrabold text-white bg-gradient-to-r from-red-600 to-emerald-600 border border-red-500/20 px-4.5 py-2.5 rounded-xl uppercase tracking-wider select-none relative z-10 shadow-lg hover:scale-105 transition-transform duration-300 cursor-default animate-pulse">
                        Moments Natalino
                      </div>
                    </div>
                  </div>
                )}
                {newyearActive && (
                  <div className="app-container mb-8 animate-in fade-in duration-700">
                    <div className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-r from-[#17140b] via-zinc-950/60 to-[#2b2718] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-xl shadow-[0_0_30px_rgba(234,179,8,0.08)] newyear-glow-card">
                      {/* Ambient blur lights */}
                      <div className="absolute top-0 right-1/4 w-40 h-40 bg-yellow-500/10 rounded-full blur-[80px] pointer-events-none" />
                      <div className="absolute bottom-0 left-10 w-40 h-40 bg-zinc-500/10 rounded-full blur-[80px] pointer-events-none" />
                      {/* Grid overlay pattern */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                      <div className="flex items-center gap-5 relative z-10 text-center sm:text-left flex-col sm:flex-row">
                        <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex-shrink-0 select-none">
                          <Trophy className="w-8 h-8" />
                        </div>
                        <div>
                          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                            <span className="text-[9px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full uppercase tracking-widest">ANO NOVO 2027</span>
                            <span className="text-yellow-400 text-xs font-bold animate-pulse">● Live</span>
                          </div>
                          <h4 className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-amber-400 tracking-tight">Celebre a virada com a Moments!</h4>
                          <p className="text-xs sm:text-sm text-zinc-300 font-medium mt-0.5">Um novo ciclo repleto de novas séries e momentos inesquecíveis.</p>
                        </div>
                      </div>
                      <div className="text-[10px] font-extrabold text-black bg-gradient-to-r from-yellow-400 to-yellow-300 border border-yellow-400/20 px-4.5 py-2.5 rounded-xl uppercase tracking-wider select-none relative z-10 shadow-lg hover:scale-105 transition-transform duration-300 cursor-default">
                        Boas Festas
                      </div>
                    </div>
                  </div>
                )}
                {/* Seção Exclusiva: Top 10 Mais Assistidos & Destaques da Semana */}
                <section className="app-container mb-12 sm:mb-20">
                  <div className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-b from-amber-950/25 via-[#0b0c16]/95 to-[#07080c] p-6 sm:p-10 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.75)]">
                    {/* Luzes atmosféricas de fundo */}
                    <div className="absolute top-0 right-10 w-[450px] h-[450px] bg-amber-500/15 rounded-full blur-[150px] pointer-events-none" />
                    <div className="absolute bottom-0 left-10 w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[130px] pointer-events-none" />

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 relative z-10 border-b border-white/[0.08] pb-6">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/35 text-amber-300 text-xs font-black uppercase tracking-wider mb-2.5">
                          <Flame className="w-4 h-4 fill-amber-400" />
                          Ranking Oficial dos Assinantes
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2.5">
                          Top 10 Mais Assistidos & Destaques
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 mt-1">
                          Os títulos em alta com maior audiência e repercussão no Brasil nesta semana
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-amber-300 font-bold bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 self-start sm:self-auto">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        Atualizado em tempo real
                      </div>
                    </div>
                    
                    {/* Carrossel Horizontal Expandido com cards gigantes e números Top 10 */}
                    <div className="relative z-10">
                      <div
                        style={{ WebkitOverflowScrolling: 'touch' }}
                        className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 pt-2 touch-pan-x scroll-smooth"
                      >
                        {featured.map((s, idx) => (
                          <div
                            key={s.id}
                            className="flex-none w-[200px] xs:w-[225px] sm:w-[255px] md:w-[280px]"
                          >
                            <FeaturedRankCard
                              series={s}
                              rank={idx + 1}
                              copaActive={copaActive}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
                <Row
                  title="Recentemente adicionados"
                  items={recentes}
                  copaActive={copaActive}
                  halloweenActive={halloweenActive}
                  christmasActive={christmasActive}
                  newyearActive={newyearActive}
                />
                <Row
                  title="Dubladas em português"
                  items={dublados}
                  accent
                  copaActive={copaActive}
                  halloweenActive={halloweenActive}
                  christmasActive={christmasActive}
                  newyearActive={newyearActive}
                />
                {brasileiras.length > 0 && (
                  <Row
                    title="Produções brasileiras"
                    items={brasileiras}
                    copaActive={copaActive}
                    halloweenActive={halloweenActive}
                    christmasActive={christmasActive}
                    newyearActive={newyearActive}
                  />
                )}
                <Row
                  title="Legendadas"
                  items={legendados}
                  copaActive={copaActive}
                  halloweenActive={halloweenActive}
                  christmasActive={christmasActive}
                  newyearActive={newyearActive}
                />

                {/* Catálogo completo - grid */}
                <section className="app-container mt-8 sm:mt-12">
                  {/* Filtro de Categorias / Gêneros com quantidade */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-3 border-b border-white/[0.04]">
                    <div className="flex flex-wrap gap-1.5 overflow-x-auto scrollbar-hide max-w-full">
                      {genres.map((g) => (
                        <button
                          key={g}
                          onClick={() => setSelectedGenre(g)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-300 ${
                            selectedGenre === g
                              ? "bg-foreground text-background shadow-md"
                              : "bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 border border-white/[0.03]"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground/80 font-medium tracking-tight tabular-nums whitespace-nowrap self-end sm:self-auto">
                      {displayedCatalog.length} {displayedCatalog.length === 1 ? 'título disponível' : 'títulos disponíveis'}
                    </span>
                  </div>

                  <div className="catalog-grid">
                    {visibleCatalog.map((s) => (
                      <SeriesCard
                        key={s.id}
                        series={s}
                        copaActive={copaActive}
                        halloweenActive={halloweenActive}
                        christmasActive={christmasActive}
                        newyearActive={newyearActive}
                      />
                    ))}
                  </div>

                  {/* Sentinela invisível para scroll infinito suave no iPhone/mobile */}
                  <div ref={sentinelRef} className="h-6 w-full pointer-events-none" />

                  {visibleCount < displayedCatalog.length && (
                    <div className="flex justify-center mt-6 mb-2">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((prev) => Math.min(prev + 24, displayedCatalog.length))}
                        className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs font-semibold text-foreground tracking-wide transition-all shadow-sm"
                      >
                        Carregar mais títulos ({displayedCatalog.length - visibleCount} restantes)
                      </button>
                    </div>
                  )}

                  {/* CTA Animes — minimalista */}
                  <div className="mt-14 sm:mt-20 border-t border-border/60 pt-10 sm:pt-12 flex flex-col sm:flex-row items-center justify-between gap-5">
                    <div className="text-center sm:text-left">
                      <div className="text-[10px] uppercase tracking-[0.28em] text-foreground/50 mb-1.5">
                        Coleção
                      </div>
                      <h3 className="text-lg sm:text-2xl font-semibold tracking-tight">Animes</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Coleção exclusiva, dublados e legendados.
                      </p>
                    </div>
                    <Link to="/animes" className="w-full sm:w-auto">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 font-medium rounded-full border-foreground/20 hover:bg-foreground hover:text-background">
                        Explorar
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
