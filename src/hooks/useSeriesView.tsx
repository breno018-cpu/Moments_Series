import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Dedupe: registra UMA visualização por série por sessão (sessionStorage).
// Antes: insert a cada mount/remount → muitas linhas em series_views.
export const useSeriesView = (seriesId: string | undefined) => {
  useEffect(() => {
    if (!seriesId) return;

    const storageKey = `sv_${seriesId}`;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, '1');

    const trackSeriesView = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from('series_views').insert({
        series_id: seriesId,
        user_id: session?.user?.id || null,
      });
    };

    trackSeriesView();
  }, [seriesId]);
};
