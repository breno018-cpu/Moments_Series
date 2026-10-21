import { useQuery } from '@tanstack/react-query';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => [
      'Ação', 'Drama', 'Romance', 'Brasileira', 'Família', 'LGBT', 'Picante', 'Clichê'
    ],
  });
}

export function useAnimeCategories() {
  return useQuery({
    queryKey: ['anime_categories'],
    queryFn: async () => [
      'Ação', 'Fantasia', 'Sci-Fi', 'Romance', 'Shounen', 'Seinen', 'Dublado', 'Legendado'
    ],
  });
}
