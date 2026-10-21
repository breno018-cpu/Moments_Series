import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageView() {
  const location = useLocation();

  useEffect(() => {
    // Registra navegação para analytics
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView');
    }
  }, [location.pathname]);
}
