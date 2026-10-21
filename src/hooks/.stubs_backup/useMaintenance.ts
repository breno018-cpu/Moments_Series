import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMaintenance() {
  const { data, isLoading } = useQuery({
    queryKey: ['maintenance_mode'],
    staleTime: 60 * 1000,
    queryFn: async () => {
      try {
        const { data: row } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .maybeSingle();

        const { data: msgRow } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'maintenance_message')
          .maybeSingle();

        return {
          enabled: row?.value === 'true',
          message: msgRow?.value || 'Estamos realizando melhorias no sistema. Voltamos em instantes!',
        };
      } catch (e) {
        return { enabled: false, message: '' };
      }
    },
  });

  return {
    enabled: data?.enabled ?? false,
    message: data?.message ?? '',
    loading: isLoading,
  };
}
