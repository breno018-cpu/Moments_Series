import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Converte uma série existente em anime:
 * - copia o registro para a tabela `animes`
 * - remove da tabela `series`
 * Requer permissão de admin (RLS).
 */
export const useConvertSeriesToAnime = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seriesId: string) => {
      // 1. ler série
      const { data: series, error: readErr } = await supabase
        .from('series')
        .select('*')
        .eq('id', seriesId)
        .single();
      if (readErr) throw readErr;
      if (!series) throw new Error('Série não encontrada');

      // 2. inserir como anime (novo id para evitar colisão)
      const newAnimeId = crypto.randomUUID();
      const animePayload = {
        id: newAnimeId,
        title: series.title,
        genre: series.genre || 'Anime',
        year: series.year,
        rating: series.rating,
        description: series.description,
        long_description: series.long_description,
        image: series.image,
        trailer: series.trailer,
        price: series.price,
        seasons: series.seasons,
        episodes: series.episodes,
        featured: series.featured,
        audio_type: series.audio_type || 'legendado',
      };
      const { error: insertErr } = await supabase
        .from('animes')
        .insert([animePayload]);
      if (insertErr) throw insertErr;

      // 2b. transferir o access_link (admin-only)
      const { data: linkRow } = await supabase
        .from('series_access_links')
        .select('access_link')
        .eq('series_id', seriesId)
        .maybeSingle();
      if (linkRow?.access_link) {
        await supabase.from('anime_access_links').upsert({
          anime_id: newAnimeId,
          access_link: linkRow.access_link,
        });
      }

      // 3. remover da tabela series
      const { error: delErr } = await supabase
        .from('series')
        .delete()
        .eq('id', seriesId);
      if (delErr) throw delErr;

      return animePayload.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] });
      queryClient.invalidateQueries({ queryKey: ['animes'] });
      toast.success('Série convertida em anime!');
    },
    onError: (e: any) => {
      toast.error(e?.message || 'Erro ao converter para anime');
    },
  });
};
