import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SaleRecord {
  id: string;
  series_id: string;
  series_title: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_cpf: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  mp_payment_id: string | null;
  email_status: string;
}

export const useAdminSales = (enabled = true) => {
  return useQuery({
    queryKey: ['admin-sales'],
    enabled,
    staleTime: 3 * 60 * 1000, // 3 minutos de cache ultra-rápido (renderização instantânea ao alternar abas)
    queryFn: async (): Promise<SaleRecord[]> => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!orders || orders.length === 0) return [];

      const seriesIds = [...new Set(orders.map(o => o.series_id))];

      // Busca paralela otimizada de títulos de séries e animes
      const [seriesRes, animeRes] = await Promise.all([
        supabase.from('series').select('id, title').in('id', seriesIds),
        supabase.from('animes').select('id, title').in('id', seriesIds),
      ]);

      const itemsMap = new Map<string, string>();
      seriesRes.data?.forEach(s => itemsMap.set(s.id, s.title));
      animeRes.data?.forEach(a => itemsMap.set(a.id, a.title));

      return orders.map(o => ({
        id: o.id,
        series_id: o.series_id,
        series_title: itemsMap.get(o.series_id) || 'Conteúdo removido',
        customer_name: o.customer_name,
        customer_email: o.customer_email,
        customer_phone: o.customer_phone,
        customer_cpf: o.customer_cpf,
        total_amount: Number(o.total_amount || 0),
        payment_status: o.payment_status,
        payment_method: o.payment_method,
        created_at: o.created_at,
        updated_at: o.updated_at,
        mp_payment_id: o.mp_payment_id,
        email_status: (o as any).email_status || 'pending',
      }));
    },
  });
};
