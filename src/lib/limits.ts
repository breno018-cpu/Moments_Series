/**
 * PixelLoom Platform Limits & Capacity Enforcement Rules
 * Centralized governance for catalog, storage, coupons, carousels, and emails.
 */

export const PLATFORM_LIMITS = {
  // Catalog capacity
  SERIES_MAX: 100,
  SERIES_EPISODES_MAX: 1000,

  // Promotional coupons limit
  COUPONS_MAX: 25,

  // Home carousels capacity
  CAROUSELS_MAX: 10,

  // Storage & file uploads
  STORAGE_MAX_MB: 500,
  IMAGE_MAX_BYTES: 5 * 1024 * 1024, // 5 Megabytes
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/jpg"],

  // PixelGateWay Transactional Email dispatch
  MONTHLY_EMAIL_MAX: 3000,
} as const;

export interface LimitCheckResult {
  allowed: boolean;
  message?: string;
  current: number;
  max: number;
}

/** Check if new series creation is allowed under the 100-item ceiling */
export function canCreateSerie(currentCount: number): LimitCheckResult {
  const allowed = currentCount < PLATFORM_LIMITS.SERIES_MAX;
  return {
    allowed,
    current: currentCount,
    max: PLATFORM_LIMITS.SERIES_MAX,
    message: allowed
      ? undefined
      : `Limite da capacidade do catálogo atingido (${PLATFORM_LIMITS.SERIES_MAX} títulos). Exclua uma obra para cadastrar uma nova.`,
  };
}

/** Check if new coupon creation is allowed under the 25-coupon ceiling */
export function canCreateCoupon(currentCount: number): LimitCheckResult {
  const allowed = currentCount < PLATFORM_LIMITS.COUPONS_MAX;
  return {
    allowed,
    current: currentCount,
    max: PLATFORM_LIMITS.COUPONS_MAX,
    message: allowed
      ? undefined
      : `Limite máximo de cupons atingido (${PLATFORM_LIMITS.COUPONS_MAX} cupons). Remova ou desative um cupom existente para criar um novo.`,
  };
}

/** Check if image file size and MIME type are strictly within policy */
export function validateImageUpload(file: File): { valid: boolean; error?: string } {
  if (!PLATFORM_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: "Formato de arquivo não suportado. Por favor, envie imagens JPG, PNG ou WEBP.",
    };
  }

  if (file.size > PLATFORM_LIMITS.IMAGE_MAX_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Imagem muito pesada (${sizeMB} MB). O limite máximo por upload é de 5 MB.`,
    };
  }

  return { valid: true };
}

/** Check if transactional email sending is permitted under monthly quota */
export function canSendEmail(monthlySentCount: number): LimitCheckResult {
  const allowed = monthlySentCount < PLATFORM_LIMITS.MONTHLY_EMAIL_MAX;
  return {
    allowed,
    current: monthlySentCount,
    max: PLATFORM_LIMITS.MONTHLY_EMAIL_MAX,
    message: allowed
      ? undefined
      : `Cota mensal de disparos de e-mail atingida (${PLATFORM_LIMITS.MONTHLY_EMAIL_MAX} e-mails/mês). Faça upgrade do plano para continuar os disparos.`,
  };
}

/** Tarifa por disparo de e-mail (R$ 0,15 por envio bem-sucedido) */
export const EMAIL_BILLING_RATE_BRL = 0.15;

/** Calcula a cobrança/custo total de e-mails enviados */
export function calculateEmailBilling(sentCount: number): number {
  return Math.round(sentCount * EMAIL_BILLING_RATE_BRL * 100) / 100;
}

/** Calcula o valor líquido do pedido descontando a tarifa de R$ 0,15 do e-mail */
export function calculateOrderNet(orderTotal: number, emailSent: boolean): number {
  const fee = emailSent ? EMAIL_BILLING_RATE_BRL : 0;
  return Math.max(0, Math.round((orderTotal - fee) * 100) / 100);
}
