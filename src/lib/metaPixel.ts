/**
 * Meta Pixel (Facebook Pixel) — Tracking Library
 *
 * O Pixel ID é gerenciado pelo painel administrativo (Configurações → Meta Pixel)
 * e armazenado em `site_settings` (chave: meta_pixel).
 */

import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: (...args: unknown[]) => void;
  }
}

let initialized = false;
let currentPixelId: string | null = null;

/** Carrega o Pixel ID salvo no banco (site_settings) */
export async function loadMetaPixelId(): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "meta_pixel")
      .maybeSingle();
    const value = data?.value as { pixel_id?: string; domain_verification?: string } | null;
    return value?.pixel_id || null;
  } catch {
    return null;
  }
}

/** Salva o Pixel ID no banco (admin) */
export async function saveMetaPixelConfig(config: { pixel_id: string; domain_verification?: string }): Promise<void> {
  const { data: existing } = await supabase
    .from("site_settings")
    .select("id")
    .eq("key", "meta_pixel")
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("site_settings")
      .update({ value: config as any } as any)
      .eq("key", "meta_pixel");
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("site_settings")
      .insert({ key: "meta_pixel", value: config as any } as any);
    if (error) throw error;
  }
}

/** Busca a configuração completa */
export async function fetchMetaPixelConfig(): Promise<{ pixel_id: string; domain_verification: string }> {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "meta_pixel")
      .maybeSingle();
    const value = (data?.value as { pixel_id?: string; domain_verification?: string }) || {};
    return { pixel_id: value.pixel_id || "", domain_verification: value.domain_verification || "" };
  } catch {
    return { pixel_id: "", domain_verification: "" };
  }
}

/** Inicializa o Meta Pixel — chamado no boot do App após carregar o ID */
export async function initMetaPixel(pixelId?: string) {
  const id = pixelId ?? (await loadMetaPixelId());
  if (!id || initialized) return;
  currentPixelId = id;

  const f = window;
  const b = document;
  if (f.fbq) {
    window.fbq("init", id);
    window.fbq("track", "PageView");
    initialized = true;
    return;
  }

  const n: any = (f.fbq = function (...args: unknown[]) {
    n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
  });
  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];

  const script = b.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  const firstScript = b.getElementsByTagName("script")[0];
  firstScript?.parentNode?.insertBefore(script, firstScript);

  window.fbq("init", id);
  window.fbq("track", "PageView");

  // Inject domain verification meta tag (if configured)
  const config = await fetchMetaPixelConfig();
  if (config.domain_verification) {
    let meta = document.querySelector('meta[name="facebook-domain-verification"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "facebook-domain-verification";
      document.head.appendChild(meta);
    }
    meta.content = config.domain_verification;
  }

  // noscript fallback
  const noscript = b.createElement("noscript");
  const img = b.createElement("img");
  img.height = 1;
  img.width = 1;
  img.style.display = "none";
  img.src = `https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`;
  noscript.appendChild(img);
  b.body.appendChild(noscript);

  initialized = true;
}

const ready = () => initialized && currentPixelId && typeof window.fbq === "function";

export function trackPageView() {
  if (!ready()) return;
  window.fbq("track", "PageView");
}

export function trackViewContent(params: { content_name: string; content_ids: string[]; content_type: string; value: number; currency?: string }) {
  if (!ready()) return;
  window.fbq("track", "ViewContent", { ...params, currency: params.currency || "BRL" });
}

export function trackAddToCart(params: { content_name: string; content_ids: string[]; content_type: string; value: number; currency?: string }) {
  if (!ready()) return;
  window.fbq("track", "AddToCart", { ...params, currency: params.currency || "BRL" });
}

export function trackInitiateCheckout(params: { content_ids: string[]; num_items: number; value: number; currency?: string }) {
  if (!ready()) return;
  window.fbq("track", "InitiateCheckout", { ...params, currency: params.currency || "BRL" });
}

export function trackPurchase(params: { content_ids: string[]; content_type: string; num_items: number; value: number; currency?: string }) {
  if (!ready()) return;
  window.fbq("track", "Purchase", { ...params, currency: params.currency || "BRL" });
}

export function trackSearch(searchString: string) {
  if (!ready()) return;
  window.fbq("track", "Search", { search_string: searchString });
}
