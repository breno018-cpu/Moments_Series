import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Anime {
  id: string;
  title: string;
  genre: string;
  year: number;
  rating: number;
  description: string;
  long_description: string;
  image_url: string;
  trailer_url: string;
  price: number;
  seasons: number;
  episodes: number;
  featured: boolean;
  audio_type?: 'dublado' | 'legendado';
  access_link?: string;
  created_at?: string;
  updated_at?: string;
}

type DbAnime = {
  id: string;
  title: string;
  genre: string;
  year: number;
  rating: number;
  description: string;
  long_description: string;
  image: string;
  trailer: string;
  price: number;
  seasons: number;
  episodes: number;
  featured: boolean;
  audio_type?: 'dublado' | 'legendado';
  created_at: string;
  updated_at: string;
};

export const MOCK_ANIMES: Anime[] = [
  {
    id: "anime-1",
    title: "Chrono Blade: A Saga Lendária",
    genre: "Ação / Fantasia",
    year: 2024,
    rating: 5.0,
    description: "Espadachins lendários viajam pelas eras para impedir o colapso dos reinos.",
    long_description: "Animação espetacular em 60fps com batalhas e trilha sonora inesquecível.",
    image_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80",
    trailer_url: "",
    price: 19.90,
    seasons: 2,
    episodes: 24,
    featured: true,
    audio_type: "dublado"
  },
  {
    id: "anime-2",
    title: "Cyber City 2099",
    genre: "Sci-Fi / Cyberpunk",
    year: 2024,
    rating: 4.9,
    description: "Hacks de alta frequência e rebeldes em uma Metrópole futurista imersa em néon.",
    long_description: "Superprodução visual sci-fi aclamada pela crítica internacional.",
    image_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80",
    trailer_url: "",
    price: 24.90,
    seasons: 1,
    episodes: 12,
    featured: true,
    audio_type: "legendado"
  }
];

const mapDbAnimeToAnime = (db: any): Anime => ({
  id: db.id,
  title: db.title || 'Título Indisponível',
  genre: db.genre || '',
  year: typeof db.year === 'number' ? db.year : Number(db.year) || 2024,
  rating: typeof db.rating === 'number' ? db.rating : Number(db.rating) || 4.9,
  description: db.description || '',
  long_description: db.long_description || '',
  image_url: db.image || db.image_url || '',
  trailer_url: db.trailer || db.trailer_url || '',
  price: typeof db.price === 'number' ? db.price : Number(db.price) || 0,
  seasons: Number(db.seasons) || 1,
  episodes: Number(db.episodes) || 1,
  featured: Boolean(db.featured),
  audio_type: db.audio_type || 'dublado',
  created_at: db.created_at || '',
  updated_at: db.updated_at || '',
});

export const useAnimes = () => {
  return useQuery({
    queryKey: ['animes'],
    staleTime: 30 * 60 * 1000, // 30 minutos de cache
    gcTime: 60 * 60 * 1000,
    queryFn: async () => {
      try {
        // Projeção seletiva para animes
        const { data, error } = await supabase
          .from('animes')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Erro ao buscar animes do Supabase:', error);
        } else if (data && data.length > 0) {
          return (data as DbAnime[]).map(mapDbAnimeToAnime);
        }
      } catch (e) {
        console.warn('Supabase animes fallback ativo');
      }
      return MOCK_ANIMES;
    },
  });
};

export const useAnimeById = (id: string) => {
  return useQuery({
    queryKey: ['animes', id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('animes')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) {
          return mapDbAnimeToAnime(data as DbAnime);
        }
      } catch (e) {
        console.warn(`Anime ${id} não encontrado no banco`);
      }
      return MOCK_ANIMES.find(a => a.id === id) || MOCK_ANIMES[0];
    },
    enabled: !!id,
  });
};

interface CreateAnimeInput {
  title: string;
  genre?: string;
  rating?: number;
  description?: string;
  price: number;
  featured?: boolean;
  access_link?: string;
  audio_type?: 'dublado' | 'legendado';
}

export const useCreateAnime = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (anime: CreateAnimeInput) => {
      const id = crypto.randomUUID();
      const dbAnime = {
        id,
        title: anime.title,
        genre: anime.genre || '',
        year: new Date().getFullYear(),
        rating: anime.rating || 0,
        description: anime.description || '',
        long_description: '',
        image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500',
        trailer: '',
        price: anime.price,
        seasons: 1,
        episodes: 1,
        featured: anime.featured || false,
        audio_type: anime.audio_type || 'legendado',
      };
      const { data, error } = await supabase
        .from('animes')
        .insert([dbAnime])
        .select()
        .single();
      if (error) console.error("Create anime error:", error);
      return mapDbAnimeToAnime(data || dbAnime);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animes'] });
      toast.success('Anime adicionado com sucesso!');
    },
    onError: () => toast.error('Erro ao adicionar anime'),
  });
};

export const useUpdateAnime = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Anime> & { id: string }) => {
      const dbUpdates: any = { ...updates };
      if (updates.image_url !== undefined) {
        dbUpdates.image = updates.image_url;
        delete dbUpdates.image_url;
      }
      if (updates.trailer_url !== undefined) {
        dbUpdates.trailer = updates.trailer_url;
        delete dbUpdates.trailer_url;
      }
      delete dbUpdates.access_link;
      delete dbUpdates.created_at;
      delete dbUpdates.updated_at;
      const { data, error } = await supabase
        .from('animes')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) console.error("Update anime error:", error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animes'] });
      toast.success('Anime atualizado com sucesso!');
    },
    onError: () => toast.error('Erro ao atualizar anime'),
  });
};

export const useDeleteAnime = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('animes').delete().eq('id', id);
      if (error) console.error("Delete anime error:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animes'] });
      toast.success('Anime removido com sucesso!');
    },
    onError: () => toast.error('Erro ao remover anime'),
  });
};
