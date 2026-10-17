import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GenreColorMap {
  [genre: string]: string; // HSL values like "0 75% 50%"
}

const DEFAULT_COLORS: GenreColorMap = {
  "Ação": "0 75% 50%",
  "Aventura": "25 90% 55%",
  "Crime": "280 70% 50%",
  "Drama": "200 100% 55%",
  "Fantasia": "270 80% 60%",
  "Ficção Científica": "180 80% 50%",
  "Romance": "330 80% 55%",
  "Terror": "0 90% 35%",
  "Thriller": "45 100% 50%",
  "Suspense": "35 90% 50%",
  "Em Alta": "200 100% 55%",
  "Recomendados": "150 80% 45%",
  "Destaques": "0 75% 50%",
};

let cachedColors: GenreColorMap | null = null;
let loadingPromise: Promise<GenreColorMap> | null = null;

export const invalidateGenreColorsCache = () => {
  cachedColors = null;
  loadingPromise = null;
};

const loadGenreColors = async (): Promise<GenreColorMap> => {
  if (cachedColors) return cachedColors;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "genre_colors")
        .maybeSingle();

      const merged = data?.value && typeof data.value === "object"
        ? { ...DEFAULT_COLORS, ...(data.value as GenreColorMap) }
        : DEFAULT_COLORS;

      cachedColors = merged;
      return merged;
    } catch {
      return DEFAULT_COLORS;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
};

export function useGenreColors() {
  const [colors, setColors] = useState<GenreColorMap>(cachedColors ?? DEFAULT_COLORS);

  useEffect(() => {
    let mounted = true;
    loadGenreColors().then((loaded) => {
      if (mounted) setColors(loaded);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const getGlowColor = (categories: string[]): string => {
    for (const cat of categories) {
      if (colors[cat]) return colors[cat];
    }
    return "200 100% 55%";
  };

  return { colors, getGlowColor, DEFAULT_COLORS };
}

export { DEFAULT_COLORS };
