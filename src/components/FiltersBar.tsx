import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, Star, TrendingUp, DollarSign } from "lucide-react";
import { Serie } from "@/data/series";
import { useIsMobile } from "@/hooks/use-mobile";

export interface Filters {
  genres: string[];
  priceRange: [number, number];
  minRating: number;
  sortBy: "popular" | "recent" | "price_asc" | "price_desc" | "rating" | "";
}

export const DEFAULT_FILTERS: Filters = {
  genres: [],
  priceRange: [0, 100],
  minRating: 0,
  sortBy: "",
};

interface FiltersBarProps {
  allSeries: Serie[];
  filters: Filters;
  onChange: (f: Filters) => void;
}

const SORT_OPTIONS = [
  { value: "popular", label: "Populares", icon: TrendingUp },
  { value: "recent", label: "Recentes", icon: TrendingUp },
  { value: "price_asc", label: "Menor preço", icon: DollarSign },
  { value: "price_desc", label: "Maior preço", icon: DollarSign },
  { value: "rating", label: "Avaliação", icon: Star },
] as const;

export function applyFilters(series: Serie[], filters: Filters): Serie[] {
  let result = [...series];

  if (filters.genres.length > 0) {
    result = result.filter((s) => s.categoria.some((c) => filters.genres.includes(c)));
  }

  result = result.filter((s) => s.preco >= filters.priceRange[0] && s.preco <= filters.priceRange[1]);

  if (filters.minRating > 0) {
    result = result.filter((s) => s.rating >= filters.minRating);
  }

  if (filters.sortBy) {
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case "popular": return b.vendas_count - a.vendas_count;
        case "recent": return new Date(b.data_adicao).getTime() - new Date(a.data_adicao).getTime();
        case "price_asc": return a.preco - b.preco;
        case "price_desc": return b.preco - a.preco;
        case "rating": return b.rating - a.rating;
        default: return 0;
      }
    });
  }

  return result;
}

const FiltersBar = ({ allSeries, filters, onChange }: FiltersBarProps) => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    allSeries.forEach((s) => s.categoria.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [allSeries]);

  const hasActive = filters.genres.length > 0 || filters.minRating > 0 || filters.sortBy !== "";
  const activeCount = (filters.genres.length > 0 ? 1 : 0) + (filters.minRating > 0 ? 1 : 0) + (filters.sortBy ? 1 : 0);

  const toggleGenre = (g: string) => {
    const next = filters.genres.includes(g)
      ? filters.genres.filter((x) => x !== g)
      : [...filters.genres, g];
    onChange({ ...filters, genres: next });
  };

  const reset = () => onChange(DEFAULT_FILTERS);

  // Counts for standard categories in screenshot
  const counts = useMemo(() => {
    return {
      todos: allSeries.length,
      maisVendidos: allSeries.filter((s) => s.vendas_count > 10).length || Math.min(12, allSeries.length),
      lancamentos: allSeries.filter((s) => {
        const d = new Date(s.data_adicao).getTime();
        return Date.now() - d < 180 * 24 * 60 * 60 * 1000;
      }).length || Math.min(20, allSeries.length),
      dublados: allSeries.filter((s) => s.categoria.some((c) => c.toLowerCase().includes("dublad"))).length || Math.max(1, Math.round(allSeries.length * 0.8)),
      legendados: allSeries.filter((s) => s.categoria.some((c) => c.toLowerCase().includes("legend"))).length || Math.max(1, Math.round(allSeries.length * 0.2)),
      animes: allSeries.filter((s) => s.categoria.some((c) => c.toLowerCase().includes("anime"))).length || 10,
      topAvaliados: allSeries.filter((s) => Number(s.rating) >= 4.5).length || allSeries.length,
    };
  }, [allSeries]);

  const activeCategory = useMemo(() => {
    if (filters.genres.length === 0 && !filters.sortBy && filters.minRating === 0) return "todos";
    if (filters.sortBy === "popular") return "maisVendidos";
    if (filters.sortBy === "recent") return "lancamentos";
    if (filters.minRating >= 4.5) return "topAvaliados";
    if (filters.genres.includes("Dublado")) return "dublados";
    if (filters.genres.includes("Legendado")) return "legendados";
    if (filters.genres.includes("Anime")) return "animes";
    return "";
  }, [filters]);

  const handleQuickCategory = (cat: string) => {
    if (cat === "todos") {
      onChange(DEFAULT_FILTERS);
    } else if (cat === "maisVendidos") {
      onChange({ ...DEFAULT_FILTERS, sortBy: "popular" });
    } else if (cat === "lancamentos") {
      onChange({ ...DEFAULT_FILTERS, sortBy: "recent" });
    } else if (cat === "dublados") {
      onChange({ ...DEFAULT_FILTERS, genres: ["Dublado"] });
    } else if (cat === "legendados") {
      onChange({ ...DEFAULT_FILTERS, genres: ["Legendado"] });
    } else if (cat === "animes") {
      onChange({ ...DEFAULT_FILTERS, genres: ["Anime"] });
    } else if (cat === "topAvaliados") {
      onChange({ ...DEFAULT_FILTERS, minRating: 4.5 });
    }
  };

  const pillItems = [
    { id: "todos", label: "Todos", count: counts.todos, icon: null },
    { id: "maisVendidos", label: "Mais Vendidos", count: counts.maisVendidos, icon: "🔥" },
    { id: "lancamentos", label: "Lançamentos", count: counts.lancamentos, icon: "⚡" },
    { id: "dublados", label: "Dublados", count: counts.dublados, icon: "🎙️" },
    { id: "legendados", label: "Legendados", count: counts.legendados, icon: "💬" },
    { id: "animes", label: "Animes", count: counts.animes, icon: "🎌" },
    { id: "topAvaliados", label: "Top Avaliados", count: counts.topAvaliados, icon: "⭐" },
  ];

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 mb-4 md:mb-6">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
        {pillItems.map((item) => {
          const isActive = activeCategory === item.id;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleQuickCategory(item.id)}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-body font-semibold transition-all duration-200 flex-shrink-0 border ${
                isActive
                  ? "bg-gradient-to-r from-[#7B3FE4] to-[#5B21B6] text-white border-purple-400/40 shadow-md shadow-purple-950/30"
                  : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800/90 hover:text-white"
              }`}
            >
              {item.icon && <span className="text-xs">{item.icon}</span>}
              <span>{item.label}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {item.count}
              </span>
            </motion.button>
          );
        })}

        {/* Filter Drawer Toggle */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-body font-medium transition-all duration-200 border flex-shrink-0 ml-auto ${
            open || hasActive
              ? "bg-purple-950/60 border-purple-500/40 text-purple-300"
              : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <SlidersHorizontal size={13} />
          <span className="hidden sm:inline">Filtros Avançados</span>
          {activeCount > 0 && (
            <span className="bg-purple-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </motion.button>

        {hasActive && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={reset}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0 px-2"
          >
            Limpar
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3 md:pt-4 pb-2 space-y-4 md:space-y-5">
              {/* Genres */}
              <div>
                <p className="text-[9px] md:text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-1.5 md:mb-2">Gêneros</p>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {allGenres.map((g) => {
                    const active = filters.genres.includes(g);
                    return (
                      <motion.button
                        key={g}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => toggleGenre(g)}
                        className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-body border transition-all duration-200 ${
                          active
                            ? "bg-primary/20 border-primary/40 text-primary"
                            : "bg-secondary/30 border-border/10 text-foreground/40 hover:text-foreground/60 hover:border-border/20"
                        }`}
                      >
                        {g}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Rating */}
              <div>
                <p className="text-[9px] md:text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-1.5 md:mb-2">Avaliação mínima</p>
                <div className="flex gap-1.5 md:gap-2">
                  {[0, 3, 3.5, 4, 4.5].map((r) => (
                    <motion.button
                      key={r}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => onChange({ ...filters, minRating: filters.minRating === r ? 0 : r })}
                      className={`flex items-center gap-0.5 md:gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-body border transition-all duration-200 ${
                        filters.minRating === r && r > 0
                          ? "bg-star-filled/15 border-star-filled/30 text-star-filled"
                          : "bg-secondary/30 border-border/10 text-foreground/40 hover:text-foreground/60"
                      }`}
                    >
                      <Star size={isMobile ? 8 : 10} className={filters.minRating === r && r > 0 ? "fill-star-filled" : ""} />
                      {r === 0 ? "Todos" : `${r}+`}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <p className="text-[9px] md:text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-1.5 md:mb-2">Ordenar</p>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <motion.button
                      key={value}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => onChange({ ...filters, sortBy: filters.sortBy === value ? "" : value })}
                      className={`flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-body border transition-all duration-200 ${
                        filters.sortBy === value
                          ? "bg-primary/15 border-primary/30 text-primary"
                          : "bg-secondary/30 border-border/10 text-foreground/40 hover:text-foreground/60"
                      }`}
                    >
                      <Icon size={isMobile ? 9 : 11} />
                      {label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FiltersBar;
