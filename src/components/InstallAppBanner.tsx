import { useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { InstallAppModal } from './InstallAppModal';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import logo from '@/assets/logo.jpg';

export function InstallAppBanner() {
  const {
    isInstalled,
    isDismissed,
    isIOS,
    isAndroid,
    showModal,
    setShowModal,
    promptInstall,
    dismiss,
    deferredPrompt,
    initPWA,
  } = usePWA();

  useEffect(() => {
    initPWA();
  }, [initPWA]);

  // Se o modal estiver aberto, sempre exibe o modal
  // Se o banner tiver sido dispensado ou se já estiver instalado, não mostra o banner flutuante
  const canDirectInstall = Boolean(deferredPrompt && !isIOS);

  const showBanner = !isInstalled && !isDismissed;

  return (
    <>
      {showBanner && (
        <div className="fixed bottom-16 left-3 right-3 md:bottom-6 md:left-auto md:right-6 md:max-w-md z-40 animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0e101c]/95 border border-purple-500/30 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7),0_0_20px_rgba(168,85,247,0.15)] flex items-center justify-between gap-3 text-foreground">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <img
                  src={logo}
                  alt="Moments"
                  className="w-11 h-11 rounded-xl shadow-md ring-1 ring-white/10 object-cover"
                />
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0e101c]" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-white truncate">App Moments Séries</span>
                  <span className="text-[9px] px-1.5 py-0.2 font-bold uppercase rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Atalho Direto
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">Fixe na barra de tarefas para acesso rápido em 1 clique</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={promptInstall}
                className="h-8 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30 gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar</span>
              </Button>

              <button
                onClick={dismiss}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                aria-label="Dispensar aviso de instalação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <InstallAppModal
        open={showModal}
        onOpenChange={setShowModal}
        isIOS={isIOS}
        isAndroid={isAndroid}
        onDirectInstall={promptInstall}
        canDirectInstall={canDirectInstall}
      />
    </>
  );
}
