import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { DitherField, ProgressiveBlurEdge, BRIDGE_SRC } from "@/components/BridgeDither";
import pixelloomLogo from "@/assets/pixelloom_logo.svg";
import pixelloomIcon from "@/assets/pixelloom_icon.svg";

const authSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleBackToSite = () => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate("/");
    }, 280);
  };

  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !isMounted) return;

        // Verificar permissão no Supabase ou cache de sessão ativa
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!isMounted) return;

        const isCachedAdmin = typeof window !== 'undefined' && sessionStorage.getItem('moments_admin_session') === 'true';

        if (data || isCachedAdmin) {
          sessionStorage.setItem("moments_admin_session", "true");
          navigate("/admin");
        }
      } catch (err) {
        console.warn("[Auth] Erro ao verificar sessão prévia:", err);
      }
    };
    checkSession();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      authSchema.parse({ email, password });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verificar se é admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        toast.error("Acesso restrito. Sua conta não tem permissões administrativas.");
        return;
      }

      sessionStorage.setItem("moments_admin_session", "true");
      toast.success("Autenticação realizada com sucesso!");
      setIsNavigating(true);
      setTimeout(() => {
        navigate("/admin");
      }, 300);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Credenciais inválidas");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`auth-theme relative min-h-screen w-full overflow-hidden bg-white text-zinc-950 select-none transition-all duration-500 ease-out ${
        isNavigating ? "opacity-0 scale-[0.99] filter blur-xs" : "opacity-100 scale-100 animate-in fade-in duration-500"
      }`}
    >
      {/* 1. Bridge Dither Canvas com Partículas Interativas */}
      <div className="oasis-dither absolute inset-0 z-0">
        <DitherField
          src={BRIDGE_SRC}
          cellSize={3}
          disturbRadius={140}
          className="z-0"
        />
      </div>

      {/* 2. Bordas de Blur Progressivas Frameline */}
      <ProgressiveBlurEdge
        edge="top"
        className="h-[min(45vh,24rem)] sm:h-[min(50vh,28rem)] lg:h-[min(55vh,32rem)]"
      />
      <ProgressiveBlurEdge
        edge="bottom"
        className="h-[min(18vh,8rem)] sm:h-[min(15vh,7rem)] lg:h-[min(14vh,6.5rem)]"
      />

      {/* 3. Camada de Conteúdo e Formulário de Login */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 pointer-events-none">
        {/* Header Superior com Identidade PixelLoom */}
        <header className="w-full max-w-5xl mx-auto flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleBackToSite}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950/5 hover:bg-zinc-950/10 border border-zinc-950/10 text-xs font-semibold text-zinc-800 transition-all shadow-sm backdrop-blur-md active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar ao Site</span>
            </button>
          </div>

          <div className="inline-flex items-center gap-2.5 bg-white/80 backdrop-blur-md border border-zinc-200/90 px-3.5 py-1.5 rounded-full shadow-sm">
            <img src={pixelloomLogo} alt="PixelLoom Studios" className="h-5 sm:h-6 w-auto" />
          </div>
        </header>

        {/* Centro: Card de Autenticação PixelLoom */}
        <div className="w-full max-w-sm mx-auto my-auto pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="w-full shadow-[0_25px_60px_rgba(0,0,0,0.14)] border-zinc-200/90 bg-white/90 backdrop-blur-2xl rounded-2xl overflow-hidden transition-all">
            <div className="h-1.5 w-full bg-gradient-to-r from-zinc-950 via-[#E31C25] to-zinc-950" />

            <CardHeader className="pt-6 pb-4 text-center">
              <div className="mx-auto mb-3 flex items-center justify-center">
                <img 
                  src={pixelloomIcon} 
                  alt="PixelLoom" 
                  className="w-14 h-14 rounded-2xl shadow-lg ring-1 ring-black/10 transition-transform hover:scale-105 duration-300" 
                />
              </div>

              <CardTitle className="text-xl font-black tracking-tight text-zinc-950">
                Painel Pixel<span className="text-[#E31C25]">Loom</span>
              </CardTitle>
              <CardDescription className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold mt-1">
                Acesso Administrativo Restrito
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-6">
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@pixelloom.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-white border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 h-10 rounded-lg text-zinc-950 text-xs shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-white border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 h-10 rounded-lg text-zinc-950 text-xs shadow-sm"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 rounded-lg bg-zinc-950 hover:bg-[#E31C25] text-white font-bold text-xs shadow-md transition-all duration-300 mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Acessar Painel"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Dica interativa */}
          <p className="text-[10px] text-zinc-500 text-center mt-3 tracking-wide flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#E31C25]" />
            <span>Mova o cursor para interagir com o Dither Art</span>
          </p>
        </div>

        {/* Rodapé da tela de login */}
        <footer className="w-full max-w-5xl mx-auto flex items-center justify-between text-[11px] text-zinc-400 pointer-events-auto">
          <span>© PixelLoom Studios</span>
          <span>Interactive Dither Engine</span>
        </footer>
      </div>
    </div>
  );
}
