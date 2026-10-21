import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Film, Sparkles, ShoppingBag, Download } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { usePWA } from '@/hooks/usePWA';
import { triggerHaptic } from '@/lib/haptics';

interface MobileBottomNavProps {
  onOpenCart?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenCart }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const cartItems = useCart((s) => s?.items || []);
  const { isInstalled, promptInstall } = usePWA();

  const totalCartCount = (cartItems || []).reduce((acc, item) => acc + (item?.quantity || 1), 0);

  const handleNavClick = (path: string) => {
    triggerHaptic('light');
    navigate(path);
  };

  const handleCartClick = () => {
    triggerHaptic('medium');
    if (onOpenCart) {
      onOpenCart();
    } else {
      navigate('/checkout/cart');
    }
  };

  const handleInstallClick = () => {
    triggerHaptic('medium');
    promptInstall();
  };

  // Não exibir no checkout para foco total na conversão
  if (
    !location ||
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/cart-checkout') ||
    location.pathname.startsWith('/pix-payment') ||
    location.pathname.startsWith('/admin')
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#090b10]/98 border-t border-white/[0.08] backdrop-blur-sm pb-[max(env(safe-area-inset-bottom),8px)] pt-1 px-2 select-none shadow-[0_-10px_25px_rgba(0,0,0,0.7)] transform-gpu">
      <nav className="flex items-center justify-around">
        {/* Início */}
        <button
          type="button"
          onClick={() => handleNavClick('/')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            location.pathname === '/'
              ? 'text-purple-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Início</span>
        </button>

        {/* Séries */}
        <button
          type="button"
          onClick={() => handleNavClick('/')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            location.pathname === '/' && location.search.includes('series')
              ? 'text-purple-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Film className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Séries</span>
        </button>

        {/* Animes */}
        <button
          type="button"
          onClick={() => handleNavClick('/animes')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            location.pathname === '/animes'
              ? 'text-purple-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Animes</span>
        </button>

        {/* Carrinho com Badge */}
        <button
          type="button"
          onClick={handleCartClick}
          className="relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#090b10] animate-in zoom-in-50">
                {totalCartCount > 9 ? '9+' : totalCartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Carrinho</span>
        </button>

        {/* Instalar App */}
        {!isInstalled && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-amber-400 hover:text-amber-300 transition-all animate-pulse"
          >
            <Download className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold tracking-tight">Instalar</span>
          </button>
        )}
      </nav>
    </div>
  );
};
