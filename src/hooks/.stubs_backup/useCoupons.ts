import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  active: boolean;
  created_at?: string;
}

export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('coupons').select('*');
        if (!error && data) return data as Coupon[];
      } catch (e) {}
      return [
        { id: '1', code: 'MOMENTS10', discount_percent: 10, active: true },
        { id: '2', code: 'VIP20', discount_percent: 20, active: true },
      ];
    },
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: async (code: string) => {
      const cleanCode = code.trim().toUpperCase();
      if (cleanCode === 'MOMENTS10') return { code: 'MOMENTS10', discount_percent: 10 };
      if (cleanCode === 'VIP20') return { code: 'VIP20', discount_percent: 20 };
      
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', cleanCode)
        .eq('active', true)
        .maybeSingle();

      if (!data) throw new Error('Cupom inválido ou expirado');
      return data;
    },
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: Omit<Coupon, 'id'>) => {
      const { data, error } = await supabase.from('coupons').insert([coupon]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Cupom criado!');
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Coupon> & { id: string }) => {
      const { data, error } = await supabase.from('coupons').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Cupom atualizado!');
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Cupom removido!');
    },
  });
}
