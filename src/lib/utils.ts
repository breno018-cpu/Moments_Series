import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata valores monetários no padrão rigoroso pt-BR: R$ 1.250,90 */
export function formatCurrencyBRL(value: number | string): string {
  const num = typeof value === "number" ? value : parseFloat(value) || 0;
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Formata números com separador de milhar pt-BR: 1000 -> 1.000 */
export function formatNumberBRL(value: number | string): string {
  const num = typeof value === "number" ? value : parseInt(value, 10) || 0;
  return num.toLocaleString("pt-BR");
}
