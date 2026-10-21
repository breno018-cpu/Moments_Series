import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ExternalLink, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import pixelloomLogo from "@/assets/pixelloom_logo.svg";

export function AdminHeader({ onNavigateTransition }: { onNavigateTransition?: (to: string) => void } = {}) {
  const navigate = useNavigate();

  const handleGoToSite = () => {
    if (onNavigateTransition) {
      onNavigateTransition("/");
    } else {
      navigate("/");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      sessionStorage.removeItem("moments_admin_session");
      toast.success("Sessão encerrada com sucesso");
      if (onNavigateTransition) {
        onNavigateTransition("/");
      } else {
        navigate("/");
      }
    } catch {
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl shadow-xs transition-colors">
      <div className="app-container h-16 flex items-center justify-between gap-4">
        {/* Identidade PixelLoom Admin */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => navigate("/admin")} 
            className="cursor-pointer flex items-center gap-2 group"
          >
            <img 
              src={pixelloomLogo} 
              alt="PixelLoom Studios" 
              className="h-6 w-auto opacity-95 group-hover:opacity-100 transition-opacity" 
            />
          </div>
          <span className="h-4 w-px bg-zinc-200 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-700 bg-zinc-100 border border-zinc-200/90 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Admin Control</span>
          </div>
        </div>

        {/* Ações Administrativas */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoToSite}
            className="h-9 px-3 text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 gap-1.5 rounded-lg border border-zinc-200/80 shadow-xs"
            title="Ir para a loja pública"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ver Loja</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-9 px-3 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1.5 rounded-lg border border-rose-200"
            title="Encerrar sessão administrativa"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
