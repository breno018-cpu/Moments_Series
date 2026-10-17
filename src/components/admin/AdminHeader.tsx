import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ExternalLink,
  LogOut,
  ShieldCheck,
  Activity,
  User,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminHeaderProps {
  userEmail?: string;
  onLogout: () => Promise<void>;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  userEmail,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await onLogout();
      navigate("/auth");
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between shadow-xs">
        {/* Left: Brand & Badges */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <a href="/admin" className="flex items-center gap-2.5">
              <img src="/logo/pixelloom_logo.svg" alt="PixelLoom" className="h-7 w-auto" />
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider">
                <Sparkles size={10} />
                Painel
              </span>
            </a>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden md:block" />

          {/* System Status Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>API Supabase</span>
            <span className="text-slate-300">•</span>
            <Activity size={12} className="text-emerald-600" />
            <span className="text-emerald-700 font-semibold">Gateway Ativo</span>
          </div>
        </div>

        {/* Right: Actions and User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Store button in the SAME tab */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="h-9 gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-xl shadow-xs"
          >
            <ArrowLeft size={13} className="text-slate-500" />
            <span className="hidden sm:inline">Voltar à Loja</span>
            <span className="sm:hidden">Loja</span>
          </Button>

          {/* User identifier */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 text-xs shadow-xs">
              <User size={13} />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 max-w-[150px] truncate leading-none">
                {userEmail && !userEmail.includes("pixelloom.com") ? userEmail : "admin@hangarboxx.com.br"}
              </span>
              <span className="text-[10px] text-slate-500 leading-none mt-0.5">
                Super Admin
              </span>
            </div>
          </div>

          {/* Logout button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogoutConfirm(true)}
            className="h-9 px-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline text-xs font-medium ml-1.5">Sair</span>
          </Button>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-sm rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Encerrar Sessão</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs mt-1">
              Deseja realmente sair do painel administrativo? Você precisará se autenticar novamente para acessar o sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loggingOut}
              onClick={() => setShowLogoutConfirm(false)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={loggingOut}
              onClick={handleConfirmLogout}
              className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-xs"
            >
              {loggingOut ? "Saindo..." : "Confirmar Saída"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminHeader;
