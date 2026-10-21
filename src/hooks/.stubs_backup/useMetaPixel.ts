import { useEffect } from 'react';
import { useSiteSettings } from './useSiteSettings';

export function useMetaPixelInit() {
  const { data: settings } = useSiteSettings();
  const pixelId = settings?.meta_pixel_id;

  useEffect(() => {
    if (!pixelId || typeof window === 'undefined') return;
    
    // Configura o Pixel no objeto global window se ainda não inicializado
    if (!(window as any).fbq) {
      const n: any = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!(window as any)._fbq) (window as any)._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      (window as any).fbq = n;
    }

    (window as any).fbq('init', pixelId);
    (window as any).fbq('track', 'PageView');
  }, [pixelId]);
}

export function trackPixel(eventName: string, data?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', eventName, data);
  }
}
