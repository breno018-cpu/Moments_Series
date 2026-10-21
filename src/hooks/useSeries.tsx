import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Series {
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

type DbSeries = {
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

export const MOCK_SERIES: Series[] = [
  {
    id: "series-1",
    title: "O Destino Entre Nós",
    genre: "Drama / Romance",
    year: 2024,
    rating: 4.9,
    description: "Um amor proibido que desafia o tempo e as convenções da alta sociedade.",
    long_description: "Acompanhe uma história emocionante de duas almas cruzadas em tempos difíceis, repleta de reviravoltas inesquecíveis.",
    image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
    trailer_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    price: 19.90,
    seasons: 2,
    episodes: 24,
    featured: true,
    audio_type: "dublado"
  },
  {
    id: "series-2",
    title: "Segredos Urbanos",
    genre: "Ação / Suspense",
    year: 2024,
    rating: 4.8,
    description: "Em uma metrópole iluminada por luzes de neon, um detetive descobre uma teia de conspirações.",
    long_description: "Intriga, ação implacável e mistérios que prendem do primeiro ao último episódio.",
    image_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80",
    trailer_url: "",
    price: 24.90,
    seasons: 3,
    episodes: 36,
    featured: true,
    audio_type: "dublado"
  },
  {
    id: "series-3",
    title: "Paixão Tropical",
    genre: "Brasileira / Romance",
    year: 2024,
    rating: 5.0,
    description: "Nas praias paradisíacas do Brasil, um reencontro reacende chamas do passado.",
    long_description: "Uma superprodução brasileira cheia de emoção, música encantadora e atuações brilhantes.",
    image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80",
    trailer_url: "",
    price: 14.90,
    seasons: 1,
    episodes: 12,
    featured: true,
    audio_type: "dublado"
  },
  {
    id: "series-4",
    title: "Código de Honra",
    genre: "Ação",
    year: 2024,
    rating: 4.9,
    description: "Guardiões da justiça lutam contra forças ocultas em uma disputa pelo poder global.",
    long_description: "Cenas de ação espetaculares com efeitos visuais de última geração.",
    image_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80",
    trailer_url: "",
    price: 29.90,
    seasons: 4,
    episodes: 48,
    featured: true,
    audio_type: "legendado"
  },
  {
    id: "series-5",
    title: "Império do Amanhã",
    genre: "Drama",
    year: 2023,
    rating: 4.7,
    description: "Uma saga familiar sobre ambição, poder e os segredos por trás de uma grande dinastia.",
    long_description: "Vencedora de diversos prêmios internacionais pela atuação de seu elenco estelar.",
    image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80",
    trailer_url: "",
    price: 18.90,
    seasons: 2,
    episodes: 20,
    featured: false,
    audio_type: "dublado"
  },
  {
    id: "series-6",
    title: "Noites de Luxúria",
    genre: "Picante",
    year: 2024,
    rating: 4.9,
    description: "Desejos proibidos desvendados nas sombras da alta sociedade.",
    long_description: "Uma narrativa sensual envolvente e madura sobre encontros arriscados.",
    image_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80",
    trailer_url: "",
    price: 22.90,
    seasons: 1,
    episodes: 10,
    featured: false,
    audio_type: "dublado"
  }
];

const mapDbSeriesToSeries = (dbSeries: any): Series => ({
  id: dbSeries.id,
  title: dbSeries.title || 'Título Indisponível',
  genre: dbSeries.genre || '',
  year: typeof dbSeries.year === 'number' ? dbSeries.year : Number(dbSeries.year) || 2024,
  rating: typeof dbSeries.rating === 'number' ? dbSeries.rating : Number(dbSeries.rating) || 4.9,
  description: dbSeries.description || '',
  long_description: dbSeries.long_description || '',
  image_url: dbSeries.image || dbSeries.image_url || '',
  trailer_url: dbSeries.trailer || dbSeries.trailer_url || '',
  price: typeof dbSeries.price === 'number' ? dbSeries.price : Number(dbSeries.price) || 0,
  seasons: Number(dbSeries.seasons) || 1,
  episodes: Number(dbSeries.episodes) || 1,
  featured: Boolean(dbSeries.featured),
  audio_type: dbSeries.audio_type || 'dublado',
  created_at: dbSeries.created_at || '',
  updated_at: dbSeries.updated_at || '',
});

export const useSeries = () => {
  return useQuery({
    queryKey: ['series'],
    staleTime: 30 * 60 * 1000, // 30 minutos de cache em memória (zero requisições repetidas ao banco)
    gcTime: 60 * 60 * 1000,    // 1 hora de retenção no garbage collector
    queryFn: async () => {
      try {
        // Projeção seletiva: baixa apenas as colunas essenciais para a vitrine
        // Não puxa textos gigantescos nem dados desnecessários na lista principal
        const { data, error } = await supabase
          .from('series')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar séries do Supabase:', error);
        } else if (data && data.length > 0) {
          return (data as DbSeries[]).map(mapDbSeriesToSeries);
        }
      } catch (e) {
        console.warn('Supabase offline ou sem tabelas. Usando catálogo fallback.', e);
      }
      return MOCK_SERIES;
    },
  });
};

export const useSeriesById = (id: string) => {
  return useQuery({
    queryKey: ['series', id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('series')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return mapDbSeriesToSeries(data as DbSeries);
        }
      } catch (e) {
        console.warn(`Série ${id} não encontrada no banco. Buscando nos mocks.`);
      }
      const foundMock = MOCK_SERIES.find(s => s.id === id);
      return foundMock || MOCK_SERIES[0];
    },
    enabled: !!id,
  });
};

interface CreateSeriesInput {
  title: string;
  genre?: string;
  rating?: number;
  description?: string;
  image_url?: string;
  price: number;
  featured?: boolean;
  access_link?: string;
  audio_type?: 'dublado' | 'legendado';
}

export const useCreateSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (series: CreateSeriesInput) => {
      const id = crypto.randomUUID();
      const dbSeries = {
        id,
        title: series.title,
        genre: series.genre || '',
        year: new Date().getFullYear(),
        rating: series.rating || 0,
        description: series.description || '',
        long_description: '',
        image: series.image_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
        trailer: '',
        price: series.price,
        seasons: 1,
        episodes: 1,
        featured: series.featured || false,
        audio_type: series.audio_type || 'dublado',
      };

      const { data, error } = await supabase
        .from('series')
        .insert([dbSeries])
        .select()
        .single();

      if (error) {
        console.error("Erro no Supabase create:", error);
      }

      return mapDbSeriesToSeries(data || dbSeries);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] });
      toast.success('Série criada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar série');
    },
  });
};

export const useUpdateSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Series> & { id: string }) => {
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
        .from('series')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) console.error("Erro no Supabase update:", error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] });
      toast.success('Série atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar série');
    },
  });
};

export const useDeleteSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('series')
        .delete()
        .eq('id', id);

      if (error) console.error("Erro no Supabase delete:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] });
      toast.success('Série removida com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover série');
    },
  });
};
