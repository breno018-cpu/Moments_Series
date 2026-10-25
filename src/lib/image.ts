/**
 * Transforma e normaliza URLs de imagem para o catálogo.
 * Mantém a URL original sem distorções de aspecto causadas por transformações externas.
 */
export function optimizedImage(
  url: string | undefined | null,
  _opts: { width?: number; quality?: number; format?: 'webp' | 'origin' } = {}
): string {
  if (!url) return "";

  // Unsplash Image Optimization (usado nos mocks e banners)
  if (url.includes("images.unsplash.com")) {
    const { width = 600, quality = 80 } = _opts;
    const base = url.split("?")[0];
    return `${base}?w=${width}&q=${quality}&auto=format&fm=webp`;
  }

  // Para imagens do Supabase Storage e CDNs próprios, retorna a URL original íntegra
  // para preservar a proporção exata e evitar cortes arbitrários de cabeça e texto.
  return url;
}
