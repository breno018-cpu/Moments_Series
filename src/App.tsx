import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import React, { Component, lazy, Suspense, useEffect, ErrorInfo } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";

// Lazy-load de todas as páginas secundárias para dividir o bundle de 828KB e acelerar o carregamento inicial
const SeriesDetail = lazy(() => import("./pages/SeriesDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CartCheckout = lazy(() => import("./pages/CartCheckout"));
const PixPayment = lazy(() => import("./pages/PixPayment"));
const PixPaymentError = lazy(() => import("./pages/PixPaymentError"));
const PurchaseSuccess = lazy(() => import("./pages/PurchaseSuccess"));
const AccessSeries = lazy(() => import("./pages/AccessSeries"));
const Animes = lazy(() => import("./pages/Animes"));
const Auth = lazy(() => import("./pages/Auth"));
const Termos = lazy(() => import("./pages/Termos"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Favoritos = lazy(() => import("./pages/Favoritos"));
const MaintenanceToggle = lazy(() => import("./pages/MaintenanceToggle"));
const NotFound = lazy(() => import("./pages/NotFound"));
import { useMetaPixelInit } from "./hooks/useMetaPixel";
import { useMaintenance } from "./hooks/useMaintenance";
import { MaintenanceScreen } from "./components/MaintenanceScreen";
import { WorldCupEffects } from "./components/WorldCupEffects";
import ScrollToTop from "./components/ScrollToTop";
import { WhatsAppBubble } from "./components/WhatsAppBubble";
import { SupportNoticeModal } from "./components/SupportNoticeModal";
import { InstallAppBanner } from "./components/InstallAppBanner";
import { OfflineDetector } from "./components/OfflineDetector";
import { MobileBottomNav } from "./components/MobileBottomNav";

// Lazy-load painéis admin pesados — só baixa o bundle quando acessados.
const Admin = lazy(() => import("./pages/Admin"));
const AdminCoupons = lazy(() => import("./pages/AdminCoupons"));
const AdminSales = lazy(() => import("./pages/AdminSales"));

// Defaults globais de cache para reduzir chamadas ao backend.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — dados ficam "frescos" por 5 minutos
      gcTime: 30 * 60 * 1000, // 30 min em cache
      refetchOnWindowFocus: false, // não refaz request ao voltar para a aba
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const PixelTracker = () => {
  useMetaPixelInit();
  return null;
};

const AuthListener = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      queryClient.setQueryData(['session'], session);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        queryClient.invalidateQueries({ queryKey: ['admin-status'] });
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  return null;
};

const BYPASS_PREFIXES = ["/admin", "/auth", "/m/"];

const MaintenanceGate = ({ children }: { children: React.ReactNode }) => {
  const { enabled, message, loading } = useMaintenance();
  const location = useLocation();
  const bypass = BYPASS_PREFIXES.some((p) => location.pathname.startsWith(p));
  if (loading || bypass || !enabled) return <>{children}</>;
  return <MaintenanceScreen message={message} />;
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Moments Error Boundary]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07080c] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white/[0.04] border border-white/10 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 mx-auto flex items-center justify-center text-xl font-bold">
              ✦
            </div>
            <h1 className="text-xl font-bold">Moments Séries</h1>
            <p className="text-xs text-slate-300">
              {this.state.error?.message || "Ocorreu uma pequena instabilidade ao carregar a página."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-xs text-white shadow-lg hover:scale-105 transition-transform"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const RouteTransitionFallback = () => (
  <div className="min-h-screen bg-transparent flex items-center justify-center">
    <div className="h-6 w-6 rounded-full border-2 border-zinc-400 opacity-40" />
  </div>
);

class SilentWidgetBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn('[FloatingWidgets Error Suppressed]:', error);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const ClientFloatingWidgets = () => {
  const location = useLocation();
  const isBackstage = location.pathname.startsWith('/admin') || location.pathname === '/auth';

  if (isBackstage) return null;

  return (
    <SilentWidgetBoundary>
      <WorldCupEffects />
      <WhatsAppBubble />
      <SupportNoticeModal />
      <InstallAppBanner />
    </SilentWidgetBoundary>
  );
};

const AppContent = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <OfflineDetector />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ClientFloatingWidgets />
        <ScrollToTop />
        <PixelTracker />
        <AuthListener />
        <MaintenanceGate>
          <Suspense fallback={<RouteTransitionFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/animes" element={<Animes />} />
              <Route path="/series/:id" element={<SeriesDetail />} />
              <Route path="/anime/:id" element={<SeriesDetail />} />
              <Route path="/checkout/:id" element={<Checkout />} />
              <Route path="/checkout/cart" element={<CartCheckout />} />
              <Route path="/cart-checkout" element={<CartCheckout />} />
              <Route path="/pix-payment/:orderId" element={<PixPayment />} />
              <Route path="/pix-payment-error" element={<PixPaymentError />} />
              <Route path="/purchase-success" element={<PurchaseSuccess />} />
              <Route path="/access" element={<AccessSeries />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/admin/sales" element={<AdminSales />} />
              <Route path="/termos" element={<Termos />} />
              <Route path="/privacidade" element={<Privacidade />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/favoritos" element={<Favoritos />} />
              <Route path="/m/:token/:state" element={<MaintenanceToggle />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </MaintenanceGate>
        <MobileBottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

const App = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);

export default App;
