import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { triggerHaptic } from '@/lib/haptics';

export function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsReconnecting(false);
      triggerHaptic('success');
      toast.success('Conexão restabelecida! Conteúdo sincronizado.', {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
      triggerHaptic('warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualRetry = () => {
    setIsReconnecting(true);
    triggerHaptic('medium');
    setTimeout(() => {
      if (navigator.onLine) {
        setIsOffline(false);
        setIsReconnecting(false);
        toast.success('Você está online novamente!');
      } else {
        setIsReconnecting(false);
        toast.error('Ainda sem conexão à internet. Verifique seu Wi-Fi ou dados móveis.');
      }
    }, 1200);
  };

  if (!isOffline) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="p-4 rounded-2xl bg-[#160d1b]/95 border border-rose-500/40 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(244,63,94,0.25)] flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 ring-2 ring-rose-500/30">
            <WifiOff className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs sm:text-sm text-white truncate">Sem Conexão com a Internet</p>
            <p className="text-[11px] text-slate-300 truncate">Tentando reconectar automaticamente...</p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleManualRetry}
          disabled={isReconnecting}
          className="h-8 px-3 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md flex-shrink-0 gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReconnecting ? 'animate-spin' : ''}`} />
          <span>{isReconnecting ? 'Checando...' : 'Reconectar'}</span>
        </Button>
      </div>
    </div>
  );
}
