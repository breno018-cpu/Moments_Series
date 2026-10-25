/**
 * Transforma URLs do Supabase Storage, Unsplash e CDNs para usar redimensionamento on-the-fly.
 * Converte automaticamente para WebP ultra-leve (15KB - 30KB por poster) e reduz drasticamente o consumo de banda.
 */
export function optimizedImage(
  url: string | undefined | null,
  opts: { width?: number; quality?: number; format?: 'webp' | 'origin' } = {}
): string {
  if (!url) return "";

  const { width = 360, quality = 70, format = 'webp' } = opts;

  // Supabase Storage Render Image API (WebP + Resize)
  if (url.includes("/storage/v1/object/public/")) {
    const transformed = url.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    );
    const sep = transformed.includes("?") ? "&" : "?";
    return `${transformed}${sep}width=${width}&quality=${quality}&format=${format}`;
  }

  // Unsplash Image Optimization (usado nos mocks e banners)
  if (url.includes("images.unsplash.com")) {
    const base = url.split("?")[0];
    return `${base}?w=${width}&q=${quality}&auto=format&fit=crop&fm=webp`;
  }

  return url;
}
