export interface ImageOptions {
  width?: number;
  quality?: number;
}

export function optimizedImage(url: string, options: ImageOptions = {}): string {
  if (!url) return '';
  // Se for uma imagem externa sem suporte a param, retorna original
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  
  // Se a URL suporta transformação ou é do Supabase Storage / Unsplash
  if (url.includes('unsplash.com')) {
    const width = options.width || 400;
    const quality = options.quality || 75;
    return `${url}&w=${width}&q=${quality}&auto=format&fit=crop`;
  }

  return url;
}
