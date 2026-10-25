import { Navbar } from "@/components/Navbar";
import { AnimeCard } from "@/components/AnimeCard";
import Footer from "@/components/Footer";
import { useAnimes, Anime } from "@/hooks/useAnimes";
import { usePageView } from "@/hooks/usePageView";
import { useCategories, useAnimeCategories } from "@/hooks/useCategories";
import { useSearchParams, Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Film,
  ChevronRight,
  ChevronLeft,
  Flame,
  Star,
  Tag,
  X,
  Play,
  Search as SearchIcon,
  TrendingUp,
  Volume2,
  Subtitles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StorefrontGridSkeleton, StorefrontRowSkeleton } from "@/components/StorefrontSkeleton";

/* ================================================================
   ROW — carrossel horizontal estilo Netflix com setas e gradientes
================================================================ */
const Row = ({
  title,
  items,
  icon,
  accent = "primary",
}: {
  title: string;
  items: Anime[];
  icon?: React.ReactNode;
  accent?: "primary" | "accent";
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  useEffect(() => {
    const el = ref.current;
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
  }, [items.length]);

  if (items.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.75, 240);
    const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 15;
    const isAtStart = el.scrollLeft <= 10;

    if (dir === "right") {
      if (isAtEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: amount, behavior: "smooth" });
      }
    } else {
      if (isAtStart) {
        el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
      } else {
        el.scrollBy({ left: -amount, behavior: "smooth" });
      }
    }
  };

  if (!items || items.length === 0) return null;
  const accentBar = accent === "accent" ? "bg-accent" : "bg-primary";

  return (
    <section className="mb-10 sm:mb-12 group/row">
      <div className="app-container">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-xl font-bold tracking-tight flex items-center gap-2.5">
            <span className={`h-5 sm:h-6 w-1 ${accentBar} rounded-full`} />
            {icon}
            {title}
            <span className="text-xs sm:text-sm font-normal text-muted-foreground">
              ({items.length})
            </span>
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Rotacionar para a esquerda"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-white/15 bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white shadow-md transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Rotacionar para a direita"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-white/15 bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white shadow-md transition-all cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative group/track">
          {/* Seta lateral esquerda */}
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Voltar no catálogo de animes"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-10 w-8 sm:h-12 sm:w-10 bg-black/80 hover:bg-black/95 text-white rounded-r-xl flex items-center justify-center border-y border-r border-white/20 backdrop-blur-sm shadow-2xl active:scale-95 transition-all opacity-80 hover:opacity-100 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Seta lateral direita */}
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Avançar no catálogo de animes"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-10 w-8 sm:h-12 sm:w-10 bg-black/80 hover:bg-black/95 text-white rounded-l-xl flex items-center justify-center border-y border-l border-white/20 backdrop-blur-sm shadow-2xl active:scale-95 transition-all opacity-80 hover:opacity-100 cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            ref={ref}
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y',
            }}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-3 overscroll-x-contain"
          >
            {items.map((a) => (
              <div
                key={a.id}
                className="flex-none w-[135px] xs:w-[150px] sm:w-[170px] md:w-[185px] lg:w-[195px] xl:w-[205px]"
              >
                <AnimeCard anime={a} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ================================================================
   HERO — rotação automática entre animes em destaque
================================================================ */
const HeroRotator = ({ items }: { items: Anime[] }) => {
  const [index, setIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const list = items.slice(0, 5);

  useEffect(() => {
    if (list.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % list.length), 6000);
    return () => clearInterval(t);
  }, [list.length]);

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
    if (distance > 40) {
      setIndex((i) => (i + 1) % list.length);
    } else if (distance < -40) {
      setIndex((i) => (i - 1 + list.length) % list.length);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (list.length === 0) return null;
  const hero = list[index];

  return (
    <section
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative h-[56vh] sm:h-[66vh] min-h-[420px] max-h-[640px] overflow-hidden select-none"
    >
      {list.map((a, i) => (
        <div
          key={a.id}
          className="absolute inset-0 transition-opacity duration-1000 bg-cover bg-center scale-105"
          style={{
            backgroundImage: `url(${a.image_url})`,
            opacity: i === index ? 1 : 0,
          }}
        />
      ))}
      {/* layered gradients for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute top-1/4 -left-10 w-96 h-96 bg-primary/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/25 rounded-full blur-3xl pointer-events-none" />

      <div className="relative h-full app-container flex items-end sm:items-center pb-12 sm:pb-0">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 backdrop-blur-sm animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Em Destaque
            </span>
          </div>
          <h1
            key={hero.id}
            className="text-3xl sm:text-5xl md:text-6xl font-black mb-3 sm:mb-4 leading-[1.05] drop-shadow-2xl bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-transparent animate-fade-in"
          >
            {hero.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 text-xs sm:text-sm text-foreground/80">
            <span className="flex items-center gap-1 font-semibold text-accent">
              <Star className="h-3.5 w-3.5 fill-current" />
              {hero.rating.toFixed(1)}
            </span>
            <span>•</span>
            <span>{hero.year}</span>
            <span>•</span>
            <span className="capitalize">{hero.audio_type || "legendado"}</span>
            <span>•</span>
            <span>{hero.genre}</span>
          </div>
          <p className="text-sm sm:text-lg mb-6 text-foreground/85 max-w-xl line-clamp-3 drop-shadow-lg">
            {hero.description}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to={`/anime/${hero.id}`}>
              <Button size="lg" className="gap-2 font-semibold shadow-button">
                <Play className="h-4 w-4 fill-current" />
                Ver detalhes
              </Button>
            </Link>
            <div className="flex gap-1.5">
              {list.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-8 bg-primary" : "w-2 bg-foreground/30 hover:bg-foreground/50"
                  }`}
                  aria-label={`Ir para slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ================================================================
   ANIMES PAGE — reconstruída do zero
================================================================ */
const Animes = () => {
  const { data: animes, isLoading } = useAnimes();
  const { data: categories = [] } = useCategories();
  const { data: animeCats = [] } = useAnimeCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [audioFilter, setAudioFilter] = useState<"all" | "dublado" | "legendado">("all");

  usePageView();

  // sync search input <-> URL
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (search) params.set("search", search);
      else params.delete("search");
      setSearchParams(params, { replace: true });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // map anime -> categoryIds
  const animeCatMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    animeCats.forEach((ac) => {
      const set = m.get(ac.anime_id) || new Set();
      set.add(ac.category_id);
      m.set(ac.anime_id, set);
    });
    return m;
  }, [animeCats]);

  const categoriesWithCount = useMemo(() => {
    return categories
      .map((c) => ({
        ...c,
        count: animeCats.filter((ac) => ac.category_id === c.id).length,
      }))
      .filter((c) => c.count > 0);
  }, [categories, animeCats]);

  const filteredAnimes = useMemo(() => {
    if (!animes) return [];
    let list = animes;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.genre.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q),
      );
    }
    if (activeCategoryId) {
      list = list.filter((a) => animeCatMap.get(a.id)?.has(activeCategoryId));
    }
    if (audioFilter !== "all") {
      list = list.filter((a) => (a.audio_type || "legendado") === audioFilter);
    }
    return list;
  }, [animes, search, activeCategoryId, animeCatMap, audioFilter]);

  const featured = useMemo(() => animes?.filter((a) => a.featured) ?? [], [animes]);
  const topRated = useMemo(
    () => [...(animes ?? [])].sort((a, b) => b.rating - a.rating).slice(0, 14),
    [animes],
  );
  const dublados = useMemo(
    () => animes?.filter((a) => (a.audio_type || "") === "dublado") ?? [],
    [animes],
  );
  const legendados = useMemo(
    () => animes?.filter((a) => (a.audio_type || "legendado") === "legendado") ?? [],
    [animes],
  );
  const recentes = useMemo(
    () =>
      [...(animes ?? [])]
        .sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
        )
        .slice(0, 14),
    [animes],
  );

  const isFiltering =
    !!search.trim() || !!activeCategoryId || audioFilter !== "all";

  // build per-category rows when not filtering
  const categoryRows = useMemo(() => {
    if (isFiltering || !animes) return [];
    return categoriesWithCount
      .map((c) => ({
        ...c,
        items: animes.filter((a) => animeCatMap.get(a.id)?.has(c.id)),
      }))
      .filter((c) => c.items.length > 0);
  }, [animes, categoriesWithCount, animeCatMap, isFiltering]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-[58px] sm:pt-[72px]">
        {/* HERO rotativo */}
        {featured.length > 0 ? (
          <HeroRotator items={featured} />
        ) : animes && animes.length > 0 ? (
          <HeroRotator items={animes.slice(0, 5)} />
        ) : (
          <section className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-accent/20 py-20">
            <div className="app-container text-center relative z-10">
              <h1 className="text-4xl sm:text-6xl font-bold mb-3 text-primary">
                Mundo Anime
              </h1>
              <p className="text-muted-foreground">Em breve novos títulos</p>
            </div>
          </section>
        )}

        {/* Barra de busca + filtros sticky */}
        <div className="sticky top-[58px] sm:top-[72px] z-30 bg-background/85 backdrop-blur-xl border-b border-border/60">
          <div className="app-container py-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="relative flex-1 max-w-xl">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar anime por título, gênero ou descrição..."
                  className="pl-9 h-11 bg-secondary/40 border-border focus-visible:ring-primary"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Limpar busca"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Audio toggle */}
              <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-full border border-border">
                {(
                  [
                    { v: "all", label: "Tudo", icon: null },
                    { v: "dublado", label: "Dublado", icon: <Volume2 className="h-3.5 w-3.5" /> },
                    {
                      v: "legendado",
                      label: "Legendado",
                      icon: <Subtitles className="h-3.5 w-3.5" />,
                    },
                  ] as const
                ).map((opt) => {
                  const active = audioFilter === opt.v;
                  return (
                    <button
                      key={opt.v}
                      onClick={() => setAudioFilter(opt.v)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        active
                          ? "bg-primary text-primary-foreground shadow-button"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chips de categorias */}
            {categoriesWithCount.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pt-3 -mx-4 px-4 sm:mx-0 sm:px-0">
                <button
                  onClick={() => setActiveCategoryId(null)}
                  className={`flex-none px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all border ${
                    !activeCategoryId
                      ? "bg-primary text-primary-foreground border-primary shadow-button"
                      : "bg-secondary/40 text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  Todas
                </button>
                {categoriesWithCount.map((c) => {
                  const active = activeCategoryId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveCategoryId(active ? null : c.id)}
                      className={`flex-none flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all border ${
                        active
                          ? "text-primary-foreground shadow-button"
                          : "bg-secondary/40 text-foreground border-border hover:border-primary/40"
                      }`}
                      style={
                        active
                          ? { backgroundColor: c.color || undefined, borderColor: c.color || undefined }
                          : { borderColor: (c.color || "") + "40" }
                      }
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: active ? "#fff" : c.color || undefined }}
                      />
                      {c.name}
                      <span className="opacity-70">({c.count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Estatísticas rápidas */}
        {!isFiltering && animes && animes.length > 0 && (
          <section className="app-container py-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="rounded-xl bg-card/60 border border-border p-3 sm:p-4 text-center">
                <Flame className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-xl sm:text-2xl font-bold">{animes.length}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
                  Títulos
                </p>
              </div>
              <div className="rounded-xl bg-card/60 border border-border p-3 sm:p-4 text-center">
                <Volume2 className="h-5 w-5 text-accent mx-auto mb-1" />
                <p className="text-xl sm:text-2xl font-bold">{dublados.length}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
                  Dublados
                </p>
              </div>
              <div className="rounded-xl bg-card/60 border border-border p-3 sm:p-4 text-center">
                <Subtitles className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-xl sm:text-2xl font-bold">{legendados.length}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
                  Legendados
                </p>
              </div>
              <div className="rounded-xl bg-card/60 border border-border p-3 sm:p-4 text-center">
                <Tag className="h-5 w-5 text-accent mx-auto mb-1" />
                <p className="text-xl sm:text-2xl font-bold">{categoriesWithCount.length}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
                  Categorias
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Conteúdo */}
        {isLoading ? (
          <div className="py-4 sm:py-6 space-y-6">
            <StorefrontRowSkeleton title="Recém adicionados" count={7} />
            <StorefrontRowSkeleton title="Em alta" count={7} />
            <section className="app-container mt-6">
              <div className="h-6 w-48 rounded bg-white/[0.08] mb-6 shimmer-placeholder-dark" />
              <StorefrontGridSkeleton count={12} />
            </section>
          </div>
        ) : !isFiltering ? (
          <div className="py-4 sm:py-6">
            <Row
              title="Recém adicionados"
              items={recentes}
              icon={<Sparkles className="h-5 w-5 text-primary" />}
            />
            <Row
              title="Em alta"
              items={featured}
              icon={<TrendingUp className="h-5 w-5 text-accent" />}
              accent="accent"
            />
            <Row
              title="Mais bem avaliados"
              items={topRated}
              icon={<Star className="h-5 w-5 text-accent fill-accent" />}
            />
            <Row
              title="Dublados em PT-BR"
              items={dublados}
              icon={<Volume2 className="h-5 w-5 text-primary" />}
            />
            <Row
              title="Legendados"
              items={legendados}
              icon={<Subtitles className="h-5 w-5 text-primary" />}
              accent="accent"
            />

            {/* Linhas por categoria */}
            {categoryRows.map((cat) => (
              <Row
                key={cat.id}
                title={cat.name}
                items={cat.items}
                icon={
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.color || undefined }}
                  />
                }
              />
            ))}

            {/* Catálogo grid completo */}
            <section className="app-container mt-6">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <span className="h-5 w-1 bg-primary rounded-full" />
                <h2 className="text-base sm:text-2xl font-bold">Explorar todo o catálogo</h2>
              </div>
              <div className="catalog-grid">
                {animes?.map((a) => (
                  <AnimeCard key={a.id} anime={a} />
                ))}
              </div>
            </section>
          </div>
        ) : (
          // Filtro/busca ativo
          <section className="app-container py-6 sm:py-10">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  {search
                    ? `Resultados para "${search}"`
                    : activeCategoryId
                    ? `Categoria: ${categories.find((c) => c.id === activeCategoryId)?.name}`
                    : "Filtrado"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredAnimes.length}{" "}
                  {filteredAnimes.length === 1 ? "anime encontrado" : "animes encontrados"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setActiveCategoryId(null);
                  setAudioFilter("all");
                }}
                className="gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Limpar filtros
              </Button>
            </div>
            {filteredAnimes.length === 0 ? (
              <div className="text-center py-20">
                <Sparkles className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-lg sm:text-xl mb-2">Nenhum anime encontrado</p>
                <p className="text-sm text-muted-foreground">
                  Tente outro termo ou remova os filtros
                </p>
              </div>
            ) : (
              <div className="catalog-grid">
                {filteredAnimes.map((a) => (
                  <AnimeCard key={a.id} anime={a} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* CTA voltar para séries */}
        <section className="app-container my-12 sm:my-16">
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 text-center sm:text-left">
              <Film className="h-8 w-8 sm:h-10 sm:w-10 text-primary flex-shrink-0" />
              <div>
                <h3 className="text-base sm:text-xl font-bold">Quer ver Séries também?</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Confira nosso catálogo completo de séries dubladas e legendadas
                </p>
              </div>
            </div>
            <Link to="/" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 font-semibold">
                <Film className="h-4 w-4" />
                Ver Catálogo de Séries
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Animes;
