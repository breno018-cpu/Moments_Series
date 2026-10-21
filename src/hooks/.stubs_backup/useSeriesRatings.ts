import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useSeriesRatings(seriesId: string) {
  return useQuery({
    queryKey: ['ratings', seriesId],
    queryFn: async () => {
      return { average: 4.9, count: 128 };
    },
  });
}

export function useRateSeries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ seriesId, rating }: { seriesId: string; rating: number }) => {
      return { seriesId, rating };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ratings', variables.seriesId] });
    },
  });
}

export function useHasPurchasedSeries(seriesId: string) {
  return useQuery({
    queryKey: ['purchased', seriesId],
    queryFn: async () => false,
  });
}
