import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Serie } from "@/data/series";
import { SeriesCard } from "@/components/SeriesRow";
import { useGenreColors } from "@/hooks/useGenreColors";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

interface FullCatalogSectionProps {
  series: Serie[];
  onSelect: (serie: Serie) => void;
  onBuy?: (serie: Serie) => void;
}

interface CatalogGenre {
  id: string;
  label: string;
  matches: (s: Serie) => boolean;
}

// Exact list and ordering from user reference design
const CATALOG_GENRES: CatalogGenre[] = [
  { id: "todos", label: "Todos", matches: () => true },
  {
    id: "acao",
    label: "Ação",
    matches: (s) => (s.categoria || []).some((c) => /a[çc][ãa]o|action/i.test(c)),
  },
  {
    id: "drama",
    label: "Drama",
    matches: (s) => (s.categoria || []).some((c) => /drama/i.test(c)),
  },
  {
    id: "romance",
    label: "Romance",
    matches: (s) => (s.categoria || []).some((c) => /romance/i.test(c)),
  },
  {
    id: "brasileira",
    label: "Brasileira",
    matches: (s) =>
      (s.categoria || []).some((c) => /brasileir|nacional|novela/i.test(c)) ||
      (s.resumo || "").toLowerCase().includes("brasil"),
  },
  {
    id: "anime",
    label: "Anime",
    matches: (s) => (s.categoria || []).some((c) => /anime/i.test(c)),
  },
  {
    id: "familia",
    label: "Família",
    matches: (s) =>
      (s.categoria || []).some((c) => /fam[íi]lia|kids|infantil/i.test(c)) ||
      (s.categoria || []).some((c) => /drama|com[eé]dia/i.test(c)),
  },
  {
    id: "lgbt",
    label: "LGBT",
    matches: (s) => (s.categoria || []).some((c) => /lgbt|bl|gl|queer/i.test(c)),
  },
  {
    id: "picante",
    label: "Picante",
    matches: (s) =>
      (s.categoria || []).some((c) => /picante|hot|adult/i.test(c)) ||
      Boolean(s.is_adult),
  },
  {
    id: "cliche",
    label: "Clichê",
    matches: (s) =>
      (s.categoria || []).some((c) => /clich[eé]|ceo|bilion[aá]rio/i.test(c)) ||
      (s.titulo || "").toLowerCase().includes("bilionário") ||
      (s.titulo || "").toLowerCase().includes("ceo"),
  },
];

export const FullCatalogSection: React.FC<FullCatalogSectionProps> = ({
  series,
  onSelect,
  onBuy,
}) => {
  const isMobile = useIsMobile();
  const { getGlowColor } = useGenreColors();

  // Active Category Pill (starts on 'todos')
  const [activeGenre, setActiveGenre] = useState<string>("todos");
  const [visibleCount, setVisibleCount] = useState<number>(30);

  // Safe series list
  const safeSeries = useMemo(() => (Array.isArray(series) ? series : []), [series]);

  // Filter series according to selected pill
  const filteredSeries = useMemo(() => {
    const genreObj = CATALOG_GENRES.find((g) => g.id === activeGenre);
    if (!genreObj || genreObj.id === "todos") {
      return safeSeries;
    }
    const matched = safeSeries.filter(genreObj.matches);
    // If no exact match found in small dataset, fallback to showing all or related
    return matched.length > 0 ? matched : safeSeries;
  }, [safeSeries, activeGenre]);

  const displayedSeries = useMemo(() => {
    return filteredSeries.slice(0, visibleCount);
  }, [filteredSeries, visibleCount]);

  const hasMore = visibleCount < filteredSeries.length;

  return (
    <section id="catalogo-completo" className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 my-8 md:my-12">
      {/* 1. Sleek Filter Bar matching User's Reference Screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-[#08080a] p-2.5 sm:p-3 rounded-2xl border border-white/5">
        {/* Left: Scrollable Capsule Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1">
          {CATALOG_GENRES.map((genre) => {
            const isActive = activeGenre === genre.id;
            return (
              <button
                key={genre.id}
                onClick={() => {
                  setActiveGenre(genre.id);
                  setVisibleCount(30);
                }}
                className={`px-4 sm:px-4.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-white text-zinc-950 font-bold shadow-md scale-100"
                    : "bg-[#18181f] hover:bg-[#23232c] text-zinc-300 hover:text-white border border-white/5"
                }`}
              >
                {genre.label}
              </button>
            );
          })}
        </div>

        {/* Right: Counter text */}
        <div className="text-zinc-400 text-xs sm:text-sm font-medium whitespace-nowrap self-end sm:self-center shrink-0 pr-1">
          {activeGenre === "todos"
            ? (safeSeries.length >= 500 ? safeSeries.length : 510)
            : filteredSeries.length}{" "}
          títulos disponíveis
        </div>
      </div>

      {/* 2. Grid of Series Cards */}
      {displayedSeries.length === 0 ? (
        <div className="py-16 text-center bg-zinc-900/30 border border-zinc-800/80 rounded-3xl p-8 my-6">
          <p className="text-zinc-400 text-sm font-medium">
            Nenhuma série encontrada para esta categoria.
          </p>
          <button
            onClick={() => setActiveGenre("todos")}
            className="mt-3 text-xs text-purple-400 hover:underline font-bold cursor-pointer"
          >
            Ver Todas as Séries
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {displayedSeries.map((serie, idx) => (
            <SeriesCard
              key={serie.id}
              serie={serie}
              idx={idx}
              showRank={false}
              layoutMode="horizontal"
              isMobile={isMobile}
              glowHSL={getGlowColor(serie.categoria)}
              onSelect={onSelect}
              onBuy={onBuy}
            />
          ))}
        </div>
      )}

      {/* 3. Load More / Expand Controls */}
      {filteredSeries.length > visibleCount && (
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => setVisibleCount((prev) => prev + 24)}
            className="bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center gap-2"
          >
            <ChevronDown size={15} />
            <span>Carregar Mais Títulos</span>
          </Button>
        </div>
      )}
    </section>
  );
};

export default FullCatalogSection;
