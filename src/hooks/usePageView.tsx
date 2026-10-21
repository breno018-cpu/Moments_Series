import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  getOrCreateSessionId,
  captureUtms,
  captureLandingAndReferrer,
  detectDevice,
} from '@/lib/marketing';

export const usePageView = () => {
  const location = useLocation();
  const pageViewIdRef = useRef<string | null>(null);
  const enteredAtRef = useRef<number>(Date.now());

  useEffect(() => {
    let cancelled = false;

    const flushPrevious = async () => {
      const id = pageViewIdRef.current;
      if (!id) return;
      const seconds = Math.round((Date.now() - enteredAtRef.current) / 1000);
      if (seconds <= 0) return;
      try {
        await supabase.rpc('update_page_view_time', { _id: id, _seconds: seconds });
      } catch {
        // silencioso — analytics não deve quebrar UX
      }
    };

    const trackPageView = async () => {
      // Dedupe: ignora se a mesma rota foi registrada nos últimos 60s
      // (evita inserts duplicados por StrictMode, hot reload ou cliques rápidos).
      const dedupeKey = `pv_${location.pathname}`;
      const lastTs = Number(sessionStorage.getItem(dedupeKey) || 0);
      if (Date.now() - lastTs < 60_000) return;
      sessionStorage.setItem(dedupeKey, String(Date.now()));

      // grava tempo da página anterior antes de registrar a nova
      await flushPrevious();

      const { data: { session } } = await supabase.auth.getSession();
      const utms = captureUtms();
      const { referrer } = captureLandingAndReferrer();
      const device = detectDevice();
      const session_id = getOrCreateSessionId();

      enteredAtRef.current = Date.now();

      const { data, error } = await supabase
        .from('page_views')
        .insert({
          page_path: location.pathname,
          user_id: session?.user?.id || null,
          session_id,
          referrer: referrer || null,
          ...device,
          ...utms,
        })
        .select('id')
        .single();

      if (!error && data && !cancelled) {
        pageViewIdRef.current = data.id;
      }
    };

    trackPageView();


    const handleBeforeUnload = () => {
      const id = pageViewIdRef.current;
      if (!id) return;
      const seconds = Math.round((Date.now() - enteredAtRef.current) / 1000);
      // sendBeacon não suporta RPC do Supabase; usa fetch keepalive
      try {
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/update_page_view_time`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ _id: id, _seconds: seconds }),
          keepalive: true,
        });
      } catch { /* noop */ }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      cancelled = true;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location.pathname]);
};
