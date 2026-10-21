import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCoupons = () => {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Coupon[];
    },
  });
};

export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: async ({ code, totalAmount, customerEmail }: { code: string; totalAmount: number; customerEmail: string }) => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Cupom não encontrado ou inválido');

      const coupon = data as Coupon;

      // Verificar validade
      const now = new Date();
      const validFrom = new Date(coupon.valid_from);
      const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

      if (now < validFrom) {
        throw new Error('Este cupom ainda não está válido');
      }

      if (validUntil && now > validUntil) {
        throw new Error('Este cupom expirou');
      }

      // Verificar quantas vezes este email já usou este cupom
      const { data: usageData, error: usageError } = await supabase
        .from('coupon_usage')
        .select('*')
        .eq('coupon_id', coupon.id)
        .eq('customer_email', customerEmail.toLowerCase());

      if (usageError) throw usageError;

      const emailUsageCount = usageData?.length || 0;

      // Cupom só pode ser usado 1 vez por pessoa
      if (emailUsageCount >= 1) {
        throw new Error('Você já utilizou este cupom anteriormente');
      }

      // Verificar valor mínimo
      if (totalAmount < coupon.min_purchase) {
        throw new Error(
          `Valor mínimo de compra para este cupom é R$ ${coupon.min_purchase.toFixed(2)}`
        );
      }

      // Calcular desconto
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = (totalAmount * coupon.discount_value) / 100;
      } else {
        discount = coupon.discount_value;
      }

      // Não permitir desconto maior que o total
      discount = Math.min(discount, totalAmount);

      return {
        coupon,
        discount,
      };
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (coupon: Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'current_uses'>) => {
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          ...coupon,
          code: coupon.code.toUpperCase(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Cupom criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar cupom: ' + error.message);
    },
  });
};

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...coupon }: Partial<Coupon> & { id: string }) => {
      const { data, error } = await supabase
        .from('coupons')
        .update({
          ...coupon,
          code: coupon.code ? coupon.code.toUpperCase() : undefined,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Cupom atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar cupom: ' + error.message);
    },
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Cupom excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir cupom: ' + error.message);
    },
  });
};
