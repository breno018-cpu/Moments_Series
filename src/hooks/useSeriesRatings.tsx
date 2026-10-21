import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export interface SeriesRatingStats {
  average: number;
  count: number;
  userRating: number | null;
}

export const useSeriesRatings = (seriesId: string | undefined, defaultBaseRating: number = 4.9) => {
  const [localRating, setLocalRating] = useState<number | null>(() => {
    if (!seriesId || typeof window === "undefined") return null;
    try {
      const localRatings = JSON.parse(localStorage.getItem("moments-ratings") || "{}");
      return localRatings[seriesId] || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!seriesId) return;
    try {
      const localRatings = JSON.parse(localStorage.getItem("moments-ratings") || "{}");
      setLocalRating(localRatings[seriesId] || null);
    } catch {
      // ignore
    }

    const handleStorageChange = () => {
      try {
        const localRatings = JSON.parse(localStorage.getItem("moments-ratings") || "{}");
        setLocalRating(localRatings[seriesId!] || null);
      } catch {
        // ignore
      }
    };
    window.addEventListener("ratings-changed", handleStorageChange);
    return () => window.removeEventListener("ratings-changed", handleStorageChange);
  }, [seriesId]);

  return useQuery({
    queryKey: ["series-ratings", seriesId, localRating],
    enabled: !!seriesId,
    queryFn: async (): Promise<SeriesRatingStats> => {
      let dbRatings: { rating: number; user_id: string }[] = [];
      let currentUserId: string | null = null;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id || null;

        const { data, error } = await supabase
          .from("series_ratings")
          .select("rating, user_id")
          .eq("series_id", seriesId!);

        if (!error && Array.isArray(data)) {
          dbRatings = data;
        }
      } catch (err) {
        console.warn("Sincronização de avaliações em modo local resiliente:", err);
      }

      // Base inicial consistente do título
      const baseSeedCount = 28;
      const baseSeedSum = (defaultBaseRating || 4.9) * baseSeedCount;

      let totalCount = baseSeedCount;
      let totalSum = baseSeedSum;

      // Adiciona avaliações reais do banco se existirem
      if (dbRatings.length > 0) {
        for (const item of dbRatings) {
          totalCount += 1;
          totalSum += item.rating;
        }
      }

      // Identifica nota do usuário (seja do banco ou local)
      const userRatingFromDb = currentUserId
        ? dbRatings.find((r) => r.user_id === currentUserId)?.rating ?? null
        : null;

      const effectiveUserRating = userRatingFromDb ?? localRating;

      // Se o usuário avaliou e não está computado no Supabase, adiciona ao cálculo
      if (effectiveUserRating !== null && !userRatingFromDb) {
        totalCount += 1;
        totalSum += effectiveUserRating;
      }

      const calculatedAverage = totalCount > 0 ? Number((totalSum / totalCount).toFixed(1)) : defaultBaseRating;

      return {
        average: Math.min(5, Math.max(1, calculatedAverage)),
        count: totalCount,
        userRating: effectiveUserRating,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });
};

export const useRateSeries = (seriesId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (rating: number) => {
      // 1. Persistência imediata e garantida no localStorage
      try {
        const localRatings = JSON.parse(localStorage.getItem("moments-ratings") || "{}");
        localRatings[seriesId] = rating;
        localStorage.setItem("moments-ratings", JSON.stringify(localRatings));
      } catch (err) {
        console.error("Erro ao salvar avaliação local", err);
      }

      // 2. Se houver usuário autenticado no Supabase, tenta persistir na nuvem
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from("series_ratings")
            .upsert(
              { series_id: seriesId, user_id: user.id, rating },
              { onConflict: "series_id,user_id" }
            );
          if (error) {
            console.warn("Nota salva localmente (aviso Supabase):", error.message);
          }
        }
      } catch (err) {
        console.warn("Falha de rede Supabase, mantendo persistência local:", err);
      }

      return rating;
    },
    onMutate: async (newRating: number) => {
      // Atualização otimista imediata na UI
      await qc.cancelQueries({ queryKey: ["series-ratings", seriesId] });
      const previousStats = qc.getQueryData<SeriesRatingStats>(["series-ratings", seriesId]);

      if (previousStats) {
        const isNewVote = previousStats.userRating === null;
        const newCount = isNewVote ? previousStats.count + 1 : previousStats.count;
        const oldSum = previousStats.average * previousStats.count;
        const newSum = isNewVote
          ? oldSum + newRating
          : oldSum - (previousStats.userRating || 0) + newRating;
        const newAverage = Number((newSum / newCount).toFixed(1));

        qc.setQueryData<SeriesRatingStats>(["series-ratings", seriesId], {
          average: Math.min(5, Math.max(1, newAverage)),
          count: newCount,
          userRating: newRating,
        });
      }

      return { previousStats };
    },
    onSuccess: (rating) => {
      toast.success(`Avaliação de ${rating} estrela${rating > 1 ? "s" : ""} registrada!`);
      window.dispatchEvent(new Event("ratings-changed"));
      qc.invalidateQueries({ queryKey: ["series-ratings", seriesId] });
    },
    onError: (_err, _rating, context) => {
      if (context?.previousStats) {
        qc.setQueryData(["series-ratings", seriesId], context.previousStats);
      }
      toast.error("Não foi possível salvar sua avaliação. Tente novamente.");
    },
  });
};

export const useHasPurchasedSeries = (seriesId: string | undefined) => {
  const [localPurchased, setLocalPurchased] = useState(false);

  useEffect(() => {
    if (!seriesId) return;
    try {
      const localPurchases = JSON.parse(localStorage.getItem("moments-purchases") || "[]");
      setLocalPurchased(localPurchases.includes(seriesId));
    } catch {
      // ignore
    }

    const handlePurchasesChanged = () => {
      try {
        const localPurchases = JSON.parse(localStorage.getItem("moments-purchases") || "[]");
        setLocalPurchased(localPurchases.includes(seriesId));
      } catch {
        // ignore
      }
    };
    window.addEventListener("purchases-changed", handlePurchasesChanged);
    return () => window.removeEventListener("purchases-changed", handlePurchasesChanged);
  }, [seriesId]);

  return useQuery({
    queryKey: ["has-purchased-series", seriesId, localPurchased],
    enabled: !!seriesId,
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return localPurchased;
        }

        const { data, error } = await supabase
          .from("orders")
          .select("id")
          .eq("series_id", seriesId!)
          .eq("payment_status", "completed")
          .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
          .limit(1);

        if (error) {
          console.warn("Erro ao verificar compra do usuário:", error.message);
          return localPurchased;
        }

        return (data && data.length > 0) || localPurchased;
      } catch {
        return localPurchased;
      }
    },
  });
};
