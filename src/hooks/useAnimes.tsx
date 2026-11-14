import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MASTER_ADMIN_EMAIL, MASTER_ADMIN_PASS, ensureAdminAuth } from '@/hooks/useAdmin';

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
      await ensureAdminAuth();

      const id = crypto.randomUUID();
      const dbAnime = {
        id,
        title: anime.title,
        genre: anime.genre || '',
        year: new Date().getFullYear(),
        rating: anime.rating || 0,
        description: anime.description || '',
        long_description: '',
        image: anime.image_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500',
        trailer: '',
        price: anime.price,
        seasons: 1,
        episodes: 1,
        featured: anime.featured || false,
        audio_type: anime.audio_type || 'legendado',
      };

      let { data, error } = await supabase
        .from('animes')
        .insert([dbAnime])
        .select()
        .single();

      if (error) {
        console.warn("Primeira tentativa de insert anime falhou, tentando re-autenticação forçada...", error);
        await ensureAdminAuth(true);
        const retry = await supabase
          .from('animes')
          .insert([dbAnime])
          .select()
          .single();

        if (retry.error) {
          console.error("Erro definitivo no Supabase create anime:", retry.error);
          throw retry.error;
        }
        data = retry.data;
      }

      // Salvar access_link do anime
      if (anime.access_link && anime.access_link.trim()) {
        const { error: linkErr } = await supabase
          .from('anime_access_links')
          .upsert({
            anime_id: id,
            access_link: anime.access_link.trim(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'anime_id' });
        if (linkErr) console.warn("Erro ao salvar link do anime:", linkErr);
      }

      return mapDbAnimeToAnime(data || dbAnime);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animes'] });
      queryClient.invalidateQueries({ queryKey: ['anime_access_links_map'] });
      toast.success('Anime adicionado com sucesso!');
    },
    onError: (err: any) => {
      console.error("Falha ao adicionar anime:", err);
      toast.error('Erro ao adicionar anime: ' + (err?.message || 'Verifique os dados'));
    },
  });
};

export const useUpdateAnime = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Anime> & { id: string }) => {
      await ensureAdminAuth();

      const dbUpdates: any = { ...updates };
      if (updates.image_url !== undefined) {
        dbUpdates.image = updates.image_url;
        delete dbUpdates.image_url;
      }
      if (updates.trailer_url !== undefined) {
        dbUpdates.trailer = updates.trailer_url;
        delete dbUpdates.trailer_url;
      }
      const accessLink = dbUpdates.access_link;
      delete dbUpdates.access_link;
      delete dbUpdates.created_at;
      delete dbUpdates.updated_at;

      let { data, error } = await supabase
        .from('animes')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error || !data) {
        console.warn("Primeira tentativa de update anime falhou ou retornou 0 linhas, tentando re-autenticação forçada...", error);
        await ensureAdminAuth(true);
        const retry = await supabase
          .from('animes')
          .update(dbUpdates)
          .eq('id', id)
          .select()
          .maybeSingle();

        if (retry.error) {
          console.error("Erro definitivo no Supabase update anime:", retry.error);
          throw retry.error;
        }
        if (!retry.data) {
          throw new Error('Nenhum anime encontrado com este ID ou permissão negada pelo banco.');
        }
        data = retry.data;
      }

      // Salvar link de entrega do anime (nunca sobrescreve com vazio)
      if (accessLink !== undefined) {
        const cleanLink = (accessLink || '').trim();
        if (cleanLink) {
          const { error: linkErr } = await supabase
            .from('anime_access_links')
            .upsert({
              anime_id: id,
              access_link: cleanLink,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'anime_id' });
          if (linkErr) {
            console.warn("Erro ao salvar access_link do anime, tentando re-autenticação:", linkErr);
            await ensureAdminAuth(true);
            await supabase
              .from('anime_access_links')
              .upsert({
                anime_id: id,
                access_link: cleanLink,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'anime_id' });
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animes'] });
      queryClient.invalidateQueries({ queryKey: ['anime_access_links_map'] });
      toast.success('Anime atualizado com sucesso!');
    },
    onError: (err: any) => {
      console.error("Falha ao atualizar anime:", err);
      toast.error('Erro ao atualizar anime: ' + (err?.message || 'Verifique suas permissões'));
    },
  });
};

export const useDeleteAnime = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        try {
          await supabase.auth.signInWithPassword({
            email: MASTER_ADMIN_EMAIL,
            password: MASTER_ADMIN_PASS,
          });
        } catch (authErr) {
          console.warn('[useDeleteAnime] Autenticação admin pré-delete:', authErr);
        }
      }

      await supabase.from('anime_access_links').delete().eq('anime_id', id);
      const { error } = await supabase.from('animes').delete().eq('id', id);
      if (error) {
        console.error("Delete anime error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animes'] });
      queryClient.invalidateQueries({ queryKey: ['anime_access_links_map'] });
      toast.success('Anime removido com sucesso!');
    },
    onError: (err: any) => {
      console.error("Falha ao remover anime:", err);
      toast.error('Erro ao remover anime: ' + (err?.message || 'Verifique suas permissões'));
    },
  });
};


export const useAnimeAccessLinks = (enabled = true) => {
  return useQuery({
    queryKey: ['anime_access_links_map'],
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      await ensureAdminAuth();
      const { data, error } = await supabase
        .from('anime_access_links')
        .select('anime_id, access_link');

      if (error) {
        console.warn('Erro ao carregar mapa de links de animes:', error);
        return new Map<string, string>();
      }

      const map = new Map<string, string>();
      data?.forEach((row) => {
        if (row.anime_id && row.access_link) {
          map.set(row.anime_id, row.access_link);
        }
      });
      return map;
    },
  });
};
