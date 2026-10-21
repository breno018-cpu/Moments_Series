import { z } from "zod";

// Validação de CPF
export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false; // CPF com todos dígitos iguais
  
  // Validar primeiro dígito
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Validar segundo dígito
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

// Formatar CPF: 12345678909 -> 123.456.789-09
export const formatCPF = (cpf: string): string => {
  const clean = cpf.replace(/\D/g, '');
  return clean
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

// Validar telefone brasileiro
export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  // Deve ter 10 ou 11 dígitos (com DDD)
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

// Formatar telefone progressivamente:
// Ex: "1" -> "(1"
//     "11" -> "(11) "
//     "119" -> "(11) 9"
//     "1198765432" -> "(11) 9876-5432" (10 dígitos - fixo)
//     "11987654321" -> "(11) 98765-4321" (11 dígitos - celular)
export const formatPhone = (phone: string): string => {
  const clean = phone.replace(/\D/g, '').slice(0, 11);
  if (!clean) return '';

  if (clean.length <= 2) {
    return `(${clean}`;
  }
  if (clean.length <= 6) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  }
  if (clean.length <= 10) {
    // Formato Fixo: (00) 0000-0000
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  // Formato Celular: (00) 00000-0000
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
};

import { sanitizeText } from "./security";

// Schema para checkout PIX com sanitização cibernética ativa
export const checkoutSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo')
    .transform((val) => sanitizeText(val)),
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email muito longo')
    .transform((val) => sanitizeText(val).toLowerCase()),
  phone: z.string()
    .refine((val) => validatePhone(val), {
      message: 'Telefone inválido',
    })
    .transform((val) => sanitizeText(val)),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
