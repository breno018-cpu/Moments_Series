import { create } from 'zustand';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAStore {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDismissed: boolean;
  showModal: boolean;
  isInitialized: boolean;

  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  setIsInstalled: (installed: boolean) => void;
  setShowModal: (show: boolean) => void;
  promptInstall: () => Promise<void>;
  dismiss: () => void;
  initPWA: () => void;
}

export const usePWA = create<PWAStore>((set, get) => ({
  deferredPrompt: null,
  isInstalled: false,
  isIOS: false,
  isAndroid: false,
  isDismissed: false,
  showModal: false,
  isInitialized: false,

  setDeferredPrompt: (deferredPrompt) => set({ deferredPrompt }),
  setIsInstalled: (isInstalled) => set({ isInstalled }),
  setShowModal: (showModal) => set({ showModal }),

  promptInstall: async () => {
    const { deferredPrompt, isIOS } = get();

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          set({ isInstalled: true, deferredPrompt: null, showModal: false });
        }
      } catch (err) {
        console.warn('[PWA] Erro ao disparar prompt nativo:', err);
        set({ showModal: true });
      }
    } else if (isIOS && typeof navigator !== 'undefined' && 'share' in navigator) {
      // No iPhone, tenta abrir a gaveta de compartilhamento nativa imediatamente
      try {
        set({ showModal: true });
        await navigator.share({
          title: 'Moments Séries',
          text: 'Assista séries e animes completos no Moments Séries',
          url: window.location.href,
        });
      } catch {
        // Se o usuário fechar a gaveta de compartilhamento, o modal explicativo continua aberto
        set({ showModal: true });
      }
    } else {
      // Se não há prompt automático disponível
      set({ showModal: true });
    }
  },

  dismiss: () => {
    set({ isDismissed: true, showModal: false });
    try {
      localStorage.setItem('pwa_install_dismissed_at', Date.now().toString());
    } catch {}
  },

  initPWA: () => {
    if (get().isInitialized || typeof window === 'undefined') return;

    // 1. Detectar se já está rodando em modo standalone (App nativo)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    // 2. Detectar Sistema Operacional
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    const isAndroidDevice = /android/.test(ua);

    // 3. Checar se foi dispensado nos últimos 3 dias
    let isDismissed = false;
    try {
      const dismissedAt = localStorage.getItem('pwa_install_dismissed_at');
      if (dismissedAt) {
        const timeDiff = Date.now() - Number(dismissedAt);
        if (timeDiff < 3 * 24 * 60 * 60 * 1000) {
          isDismissed = true;
        }
      }
    } catch {}

    set({
      isInstalled: isStandalone,
      isIOS: isAppleDevice,
      isAndroid: isAndroidDevice,
      isDismissed,
      isInitialized: true,
    });

    // 4. Capturar evento de instalação nativa
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      set({ deferredPrompt: e as BeforeInstallPromptEvent });
    };

    const handleAppInstalled = () => {
      set({ isInstalled: true, deferredPrompt: null, showModal: false });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
  },
}));
