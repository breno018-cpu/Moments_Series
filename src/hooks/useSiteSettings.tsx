import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SettingKey =
  | 'whatsapp_number'
  | 'telegram_username'
  | 'instagram_url'
  | 'meta_pixel_id'
  | 'meta_capi_token'
  | 'meta_test_event_code'
  | 'copa_theme_active'
  | 'halloween_theme_active'
  | 'christmas_theme_active'
  | 'newyear_theme_active'
  | 'popup_active'
  | 'popup_title'
  | 'popup_message'
  | 'popup_button_text'
  | 'popup_button_link'
  | 'whatsapp_sales_template'
  | 'whatsapp_pix_template'
  | 'whatsapp_auto_dispatch_enabled';

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ['site_settings'],
    staleTime: 30 * 60 * 1000, // 30 min — settings raramente mudam
    gcTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((row: any) => {
        map[row.key] = row.value;
      });
      return map as Record<SettingKey, string> & Record<string, string>;
    },
  });
};


export const useUpdateSiteSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: SettingKey; value: string }) => {
      // tenta atualizar; se não existir, insere
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{ key, value }]);
        if (error) throw error;
      }
      return { key, value };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_settings'] });
      toast.success('Configuração salva!');
    },
    onError: () => toast.error('Erro ao salvar configuração'),
  });
};
