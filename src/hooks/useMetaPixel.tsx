import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteSettings } from './useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { captureUtms } from '@/lib/marketing';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

let initialized = false;
let currentPixelId: string | null = null;

const loadPixelScript = (pixelId: string) => {
  if (typeof window === 'undefined') return;
  if (initialized && currentPixelId === pixelId) return;

  if (!window.fbq) {
    /* eslint-disable */
    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
  }

  window.fbq?.('init', pixelId);
  initialized = true;
  currentPixelId = pixelId;
};

export const useMetaPixelInit = () => {
  const { data: settings } = useSiteSettings();
  const location = useLocation();
  const lastPath = useRef<string>('');
  const pixelId = settings?.meta_pixel_id?.trim();

  useEffect(() => {
    if (pixelId) loadPixelScript(pixelId);
  }, [pixelId]);

  useEffect(() => {
    if (!pixelId || !window.fbq) return;
    if (lastPath.current === location.pathname) return;
    lastPath.current = location.pathname;
    const eventId = generateEventId('PageView');
    window.fbq('track', 'PageView', {}, { eventID: eventId });
    sendCAPI('PageView', eventId, {});
  }, [pixelId, location.pathname]);
};

// === Util ===
const generateEventId = (event: string) =>
  `${event.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : undefined;
};

interface TrackOptions {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_type?: string;
  content_name?: string;
  contents?: Array<{ id: string; quantity: number; item_price?: number }>;
  num_items?: number;
  email?: string;
  phone?: string;
  external_id?: string;
  order_id?: string;
}

/**
 * Dispara evento no Pixel (browser) E na CAPI (server) deduplicado por event_id.
 */
export const trackPixel = (event: string, opts: TrackOptions = {}) => {
  const eventId = generateEventId(event);
  const customData: Record<string, any> = {
    currency: opts.currency || 'BRL',
  };
  if (opts.value !== undefined) customData.value = opts.value;
  if (opts.content_ids) customData.content_ids = opts.content_ids;
  if (opts.content_type) customData.content_type = opts.content_type;
  if (opts.content_name) customData.content_name = opts.content_name;
  if (opts.contents) customData.contents = opts.contents;
  if (opts.num_items) customData.num_items = opts.num_items;

  // 1) Browser Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('track', event, customData, { eventID: eventId });
    } catch (e) {
      console.warn('[Pixel] failed', e);
    }
  }

  // 2) CAPI server-side com mesmo event_id (deduplica)
  sendCAPI(event, eventId, customData, opts);
};

const sendCAPI = async (
  event: string,
  eventId: string,
  customData: Record<string, any>,
  opts: TrackOptions = {},
) => {
  try {
    const utms = captureUtms();
    await supabase.functions.invoke('meta-capi', {
      body: {
        event_name: event,
        event_id: eventId,
        event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
        user_data: {
          email: opts.email,
          phone: opts.phone,
          external_id: opts.external_id,
          fbp: getCookie('_fbp'),
          fbc: getCookie('_fbc'),
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        },
        custom_data: customData,
        order_id: opts.order_id,
        utm_source: utms.utm_source || undefined,
        utm_medium: utms.utm_medium || undefined,
        utm_campaign: utms.utm_campaign || undefined,
      },
    });
  } catch (err) {
    // silencioso — não pode quebrar UX
    console.warn('[CAPI] failed', err);
  }
};
