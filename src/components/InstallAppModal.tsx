import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share, PlusSquare, Smartphone, Monitor, Sparkles, CheckCircle2, Download } from 'lucide-react';
import logo from '@/assets/logo.jpg';

interface InstallAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isIOS: boolean;
  isAndroid: boolean;
  onDirectInstall?: () => void;
  canDirectInstall?: boolean;
}

export function InstallAppModal({
  open,
  onOpenChange,
  isIOS,
  isAndroid,
  onDirectInstall,
  canDirectInstall,
}: InstallAppModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-[#0c0e17]/95 border-white/15 backdrop-blur-2xl rounded-3xl shadow-2xl text-foreground">
        <DialogHeader className="flex flex-col items-center text-center space-y-3 pb-2">
          <div className="relative">
            <img
              src={logo}
              alt="Moments Séries"
              className="w-16 h-16 rounded-2xl shadow-xl ring-2 ring-purple-500/40 object-cover"
            />
            <div className="absolute -bottom-1 -right-1 bg-purple-600 rounded-full p-1 shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <DialogTitle className="text-xl font-extrabold text-white tracking-tight">
            Instalar Moments Séries
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-300">
            Adicione o app à sua tela inicial ou barra de atalhos para acesso instantâneo em tela cheia e sem barras de navegação.
          </DialogDescription>
        </DialogHeader>

        {canDirectInstall && onDirectInstall ? (
          <div className="space-y-4 py-2">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 space-y-1.5">
              <p className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Vantagens do App Instalado:
              </p>
              <ul className="space-y-1 text-slate-300 list-disc list-inside">
                <li>Acesso rápido direto pelo ícone no seu celular</li>
                <li>Experiência em tela cheia idêntica à Netflix / Max</li>
                <li>Carregamento ultra-rápido de séries e episódios</li>
              </ul>
            </div>

            <Button
              onClick={onDirectInstall}
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 gap-2"
            >
              <Download className="w-4 h-4" />
              Instalar Aplicativo Agora
            </Button>
          </div>
        ) : isIOS ? (
          /* Fluxo Otimizado para iPhone / iPad (Safari) */
          <div className="space-y-4 py-2">
            {'share' in navigator && (
              <Button
                onClick={async () => {
                  try {
                    await navigator.share({
                      title: 'Moments Séries',
                      text: 'Assista séries e animes completos no Moments Séries',
                      url: window.location.href,
                    });
                  } catch {}
                }}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 text-sm animate-pulse"
              >
                <Share className="w-4 h-4" />
                <span>Toque aqui para abrir o menu do iPhone</span>
              </Button>
            )}

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
              <p className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-400" />
                Passo a passo no iPhone:
              </p>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                    1
                  </div>
                  <p className="pt-0.5">
                    No menu que abrir (ou na barra inferior do Safari), toque no botão <strong className="text-white">Compartilhar</strong>{' '}
                    <Share className="w-3.5 h-3.5 inline text-purple-400 mx-0.5" />.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-purple-500/15 border border-purple-500/30">
                  <div className="w-6 h-6 rounded-full bg-purple-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                    2
                  </div>
                  <p className="pt-0.5 text-white font-medium">
                    Role um pouco e toque em <strong className="text-purple-300 font-bold">"Adicionar à Tela de Início"</strong>{' '}
                    <PlusSquare className="w-4 h-4 inline text-purple-300 ml-1" />.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                    3
                  </div>
                  <p className="pt-0.5">
                    Toque em <strong className="text-white font-bold">"Adicionar"</strong> no topo direito. O app aparecerá junto dos seus outros aplicativos!
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl"
            >
              Fechar
            </Button>
          </div>
        ) : (
          /* Instruções para Android / Computador (Chrome, Edge, Windows, Mac) */
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
              <p className="text-xs font-bold text-slate-200 flex items-center gap-2">
                {isAndroid ? <Smartphone className="w-4 h-4 text-emerald-400" /> : <Monitor className="w-4 h-4 text-purple-400" />}
                {isAndroid ? "Como adicionar no celular:" : "Como fixar na Barra de Tarefas do Windows:"}
              </p>

              {isAndroid ? (
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      1
                    </div>
                    <p>
                      Toque no menu do navegador (<strong className="text-white font-bold">os três pontinhos ⋮</strong> no canto superior).
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      2
                    </div>
                    <p>
                      Clique em <strong className="text-white font-bold">"Instalar aplicativo"</strong> ou <strong className="text-white font-bold">"Adicionar à tela inicial"</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      1
                    </div>
                    <p>
                      Na barra de endereço do Chrome ou Edge, clique no ícone de <strong className="text-white font-bold">computador com seta ⬇️ ("Instalar")</strong> ou nos <strong className="text-white font-bold">três pontinhos ⋮</strong>.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      2
                    </div>
                    <p>
                      Clique em <strong className="text-purple-300 font-bold">"Instalar Moments Séries"</strong>.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      3
                    </div>
                    <p className="text-white">
                      Quando a janela abrir, marque a caixa <strong className="text-emerald-400">"Fixar na barra de tarefas"</strong> (ou clique com o botão direito no ícone aberto e selecione <strong>"Fixar na barra de tarefas"</strong>).
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl"
            >
              Entendi
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
