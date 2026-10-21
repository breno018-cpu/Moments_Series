import { z } from 'zod';

export const checkoutSchema = z.object({
  fullName: z.string().min(3, 'Nome completo deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  cpf: z.string().min(11, 'CPF inválido').max(14),
  phone: z.string().min(10, 'Telefone inválido'),
  coupon: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
