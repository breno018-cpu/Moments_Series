import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useConvertSeriesToAnime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (seriesId: string) => {
      const { data: series } = await supabase.from('series').select('*').eq('id', seriesId).single();
      if (!series) throw new Error('Série não encontrada');

      const animeData = {
        ...series,
        id: crypto.randomUUID(),
      };
      await supabase.from('animes').insert([animeData]);
      await supabase.from('series').delete().eq('id', seriesId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] });
      queryClient.invalidateQueries({ queryKey: ['animes'] });
      toast.success('Convertido para Anime com sucesso!');
    },
  });
}
