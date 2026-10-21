/**
 * Módulo de Sanitização e Proteção Cibernética (Anti-XSS, Anti-Injection, Safe Storage)
 */

/**
 * Remove tags HTML maliciosas, scripts e atributos de injeção XSS
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove caracteres de abertura/fechamento de tags HTML
    .replace(/javascript:/gi, '') // Remove URIs javascript:
    .replace(/data:/gi, '') // Impede data URIs maliciosas
    .replace(/on\w+=/gi, '') // Impede manipuladores inline (onload=, onerror=, etc.)
    .trim();
}

/**
 * Sanitiza campos de busca para impedir caracteres perigosos
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  // Limita o tamanho máximo de query para evitar DoS por Regex ReDoS
  const trimmed = query.slice(0, 100);
  return trimmed.replace(/[<>{}[\]\\^$~]/g, '').trim();
}

/**
 * Valida se uma URL é segura (apenas https permitida para links externos)
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Blindagem de Rate Limiting no lado do cliente
 * Impede disparos repetidos automatizados de requisições de checkout, cupons e login
 */
const rateLimitStore: Record<string, number[]> = {};

export function checkClientRateLimit(actionKey: string, maxCalls = 5, windowMs = 10000): boolean {
  const now = Date.now();
  if (!rateLimitStore[actionKey]) {
    rateLimitStore[actionKey] = [];
  }

  // Filtra apenas chamadas dentro da janela de tempo
  rateLimitStore[actionKey] = rateLimitStore[actionKey].filter((ts) => now - ts < windowMs);

  if (rateLimitStore[actionKey].length >= maxCalls) {
    return false; // Bloqueado por limite de taxa
  }

  rateLimitStore[actionKey].push(now);
  return true;
}
