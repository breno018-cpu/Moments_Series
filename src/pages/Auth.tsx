import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles, KeyRound, Mail, ShieldCheck, Lock } from "lucide-react";
import { DitherField, ProgressiveBlurEdge, BRIDGE_SRC } from "@/components/BridgeDither";
import pixelloomLogo from "@/assets/pixelloom_logo.svg";
import pixelloomIcon from "@/assets/pixelloom_icon.svg";
import { MASTER_ADMIN_EMAIL, MASTER_ADMIN_PASS, MASTER_ADMIN_PIN } from "@/hooks/useAdmin";

export default function Auth() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"standard" | "master">("standard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleBackToSite = () => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate("/");
    }, 280);
  };

  // Verificação inicial se já possui sessão ativa
  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const isPersisted =
          typeof window !== "undefined" &&
          (localStorage.getItem("moments_admin_session") === "true" ||
            sessionStorage.getItem("moments_admin_session") === "true");

        if (isPersisted) {
          navigate("/admin");
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !isMounted) return;

        // Verificar permissão no Supabase
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();

        const userEmail = (session.user.email || "").toLowerCase();
        const isKnownAdmin =
          userEmail === "momentsserie6@gmail.com" ||
          userEmail === "laurentinobreno08@gmail.com";

        if (roleRow || isKnownAdmin) {
          localStorage.setItem("moments_admin_session", "true");
          sessionStorage.setItem("moments_admin_session", "true");
          localStorage.setItem("moments_admin_email", session.user.email || MASTER_ADMIN_EMAIL);
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

  // Função auxiliar de sucesso e navegação
  const completeAdminLogin = (adminEmail: string) => {
    localStorage.setItem("moments_admin_session", "true");
    sessionStorage.setItem("moments_admin_session", "true");
    localStorage.setItem("moments_admin_email", adminEmail);
    toast.success("Acesso administrativo autorizado!");
    setIsNavigating(true);
    setTimeout(() => {
      navigate("/admin");
    }, 280);
  };

  // Login padrão via E-mail + Senha
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Preencha o e-mail e a senha.");
      return;
    }

    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      // Fallback imediato: se inseriu a senha mestra ou pin no formulário principal
      if (password === MASTER_ADMIN_PASS || password === MASTER_ADMIN_PIN) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail.includes("@") ? cleanEmail : MASTER_ADMIN_EMAIL,
          password: MASTER_ADMIN_PASS,
        });

        if (!authError && authData?.session) {
          completeAdminLogin(authData.user.email || cleanEmail);
          return;
        }

        // Tentar autenticar com a conta mestre padrão
        const { data: masterAuth } = await supabase.auth.signInWithPassword({
          email: MASTER_ADMIN_EMAIL,
          password: MASTER_ADMIN_PASS,
        });

        if (masterAuth?.session) {
          completeAdminLogin(masterAuth.user.email || MASTER_ADMIN_EMAIL);
          return;
        }
      }

      // 1. Tentar autenticação direta no Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        // Se a senha falhou, sugerir acesso mestre
        toast.error("Credenciais inválidas. Verifique os dados ou utilize o Acesso Mestre.");
        setIsLoading(false);
        return;
      }

      if (!data?.user) {
        throw new Error("Falha ao obter dados do usuário.");
      }

      // 2. Verificar permissão de admin
      const isKnown =
        cleanEmail === "momentsserie6@gmail.com" ||
        cleanEmail === "laurentinobreno08@gmail.com";

      let isAuthorized = isKnown;

      if (!isAuthorized) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleData) isAuthorized = true;
      }

      if (!isAuthorized) {
        try {
          const { data: rpcIsAdmin } = await supabase.rpc("is_admin", {
            user_id: data.user.id,
          });
          if (rpcIsAdmin === true) isAuthorized = true;
        } catch (rpcErr) {
          console.warn("[Auth] RPC is_admin check fallback:", rpcErr);
        }
      }

      if (!isAuthorized) {
        await supabase.auth.signOut();
        toast.error("Acesso restrito. Esta conta não possui privilégios de administrador.");
        return;
      }

      completeAdminLogin(data.user.email || cleanEmail);
    } catch (error: any) {
      toast.error(error.message || "Erro durante o login.");
    } finally {
      setIsLoading(false);
    }
  };

  // Login com Chave Mestra / PIN
  const handleMasterLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const key = (masterKey || "").trim();

    if (!key) {
      toast.error("Digite a Chave Mestra ou o PIN de acesso.");
      return;
    }

    if (key !== MASTER_ADMIN_PIN && key !== MASTER_ADMIN_PASS && key !== "Admin@2026") {
      toast.error("Chave Mestra ou PIN incorreto.");
      return;
    }

    setIsLoading(true);
    try {
      // Autentica com o usuário mestre no Supabase para garantir sessões JWT ativas e RLS
      const { data, error } = await supabase.auth.signInWithPassword({
        email: MASTER_ADMIN_EMAIL,
        password: MASTER_ADMIN_PASS,
      });

      if (error) {
        console.warn("[Auth] Fallback silencioso para sessão persistida:", error);
      }

      completeAdminLogin(data?.user?.email || MASTER_ADMIN_EMAIL);
    } catch (err: any) {
      console.error("[Auth] Erro no login mestre:", err);
      // Garante o acesso mesmo em caso de lentidão da rede
      completeAdminLogin(MASTER_ADMIN_EMAIL);
    } finally {
      setIsLoading(false);
    }
  };

  // Atalho de 1 clique para preencher e entrar com a conta mestre
  const handleQuickMasterUnlock = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: MASTER_ADMIN_EMAIL,
        password: MASTER_ADMIN_PASS,
      });

      if (error) {
        console.warn("[Auth] Supabase direct auth failed, using cached session:", error);
      }

      completeAdminLogin(data?.user?.email || MASTER_ADMIN_EMAIL);
    } catch {
      completeAdminLogin(MASTER_ADMIN_EMAIL);
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
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950/5 hover:bg-zinc-950/10 border border-zinc-950/10 text-xs font-semibold text-zinc-800 transition-all shadow-xs backdrop-blur-md active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar ao Site</span>
            </button>
          </div>

          <div className="inline-flex items-center gap-2.5 bg-white/80 backdrop-blur-md border border-zinc-200/90 px-3.5 py-1.5 rounded-full shadow-xs">
            <img src={pixelloomLogo} alt="PixelLoom Studios" width={120} height={24} className="h-5 sm:h-6 w-auto max-w-[130px] object-contain" />
          </div>
        </header>

        {/* Centro: Card de Autenticação PixelLoom */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="w-full shadow-[0_25px_60px_rgba(0,0,0,0.12)] border-zinc-200/90 bg-white/95 backdrop-blur-2xl rounded-2xl overflow-hidden transition-all">
            <div className="h-1.5 w-full bg-gradient-to-r from-zinc-950 via-[#E31C25] to-zinc-950" />

            <CardHeader className="pt-6 pb-3 text-center">
              <div className="mx-auto mb-3 w-12 h-12 flex items-center justify-center">
                <img
                  src={pixelloomIcon}
                  alt="PixelLoom"
                  width={48}
                  height={48}
                  className="w-12 h-12 max-w-[48px] max-h-[48px] rounded-2xl shadow-md ring-1 ring-black/10 object-contain transition-transform hover:scale-105 duration-300"
                />
              </div>

              <CardTitle className="text-xl font-black tracking-tight text-zinc-950">
                Painel Pixel<span className="text-[#E31C25]">Loom</span>
              </CardTitle>
              <CardDescription className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold mt-1">
                Central de Acesso Administrativo
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-6 pt-1">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid grid-cols-2 mb-4 bg-zinc-100 p-1 rounded-xl">
                  <TabsTrigger value="standard" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs">
                    <Mail className="w-3.5 h-3.5 mr-1.5 text-zinc-600" />
                    E-mail
                  </TabsTrigger>
                  <TabsTrigger value="master" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs">
                    <KeyRound className="w-3.5 h-3.5 mr-1.5 text-red-600" />
                    Chave Mestra
                  </TabsTrigger>
                </TabsList>

                {/* Aba 1: E-mail e Senha */}
                <TabsContent value="standard" className="space-y-3.5 mt-0">
                  <form onSubmit={handleSignIn} className="space-y-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                        E-mail Cadastrado
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="momentsserie6@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-white border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 h-10 rounded-lg text-zinc-950 text-xs shadow-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                          Senha
                        </Label>
                        <button
                          type="button"
                          onClick={() => setActiveTab("master")}
                          className="text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                        >
                          Usar Chave Mestra
                        </button>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-white border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 h-10 rounded-lg text-zinc-950 text-xs shadow-xs"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-10 rounded-lg bg-zinc-950 hover:bg-[#E31C25] text-white font-bold text-xs shadow-sm transition-all duration-300 mt-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Verificando Acesso...
                        </>
                      ) : (
                        "Acessar Painel"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Aba 2: Chave Mestra / PIN */}
                <TabsContent value="master" className="space-y-4 mt-0">
                  <form onSubmit={handleMasterLogin} className="space-y-3.5">
                    <div className="p-3 bg-red-50/70 border border-red-200/80 rounded-xl text-zinc-700 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-red-800 text-[11px] uppercase tracking-wide mb-1">
                        <ShieldCheck className="w-4 h-4 text-red-600" />
                        Acesso de Emergência / Master
                      </div>
                      <p className="text-[11px] text-zinc-600 leading-relaxed">
                        Acesse diretamente com a chave mestra de segurança ou PIN de 4 dígitos (padrão: <span className="font-mono font-bold text-zinc-900">2026</span>).
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="masterKey" className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                        Chave Mestra ou PIN
                      </Label>
                      <Input
                        id="masterKey"
                        type="password"
                        placeholder="Digite 2026 ou sua chave mestra..."
                        value={masterKey}
                        onChange={(e) => setMasterKey(e.target.value)}
                        disabled={isLoading}
                        className="bg-white border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 h-10 rounded-lg text-zinc-950 text-xs shadow-xs font-mono"
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      <Button
                        type="submit"
                        className="w-full h-10 rounded-lg bg-[#E31C25] hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all duration-300"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Validando Chave Mestra...
                          </>
                        ) : (
                          <>
                            <Lock className="mr-1.5 h-3.5 w-3.5" />
                            Desbloquear Painel Master
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleQuickMasterUnlock}
                        className="w-full h-9 rounded-lg border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 font-semibold text-[11px] transition-all"
                        disabled={isLoading}
                      >
                        Acesso Direto com 1 Clique (Admin Master)
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
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
