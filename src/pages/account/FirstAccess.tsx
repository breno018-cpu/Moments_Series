import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Lock, KeyRound, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

// First-access flow: user who already purchased sets a password linked to
// the email used during checkout. Uses signUp so a Supabase account is
// created bound to that email, and future logins work.
const FirstAccess = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("As senhas não conferem");
    if (password.length < 6) return toast.error("Senha precisa ter ao menos 6 caracteres");
    setLoading(true);
    const { error } = await signUp(email.trim(), password);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha definida! Bem-vindo(a) à sua biblioteca.");
    navigate("/conta/biblioteca");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          to="/conta/login"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-3 h-3" /> Voltar para entrar
        </Link>

        <div className="bg-card/80 backdrop-blur border border-border/60 rounded-2xl shadow-xl p-7 space-y-6">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center mb-2">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Primeiro acesso</h1>
            <p className="text-sm text-muted-foreground">
              Use o mesmo e-mail da sua compra para vincular suas séries.
            </p>
          </div>

          <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Você só precisa criar senha uma única vez. Depois, é só entrar normalmente.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                placeholder="E-mail da compra"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9 h-11"
              />
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Nova senha (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-9 h-11"
              />
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Confirmar senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="pl-9 h-11"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 text-base">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Salvando...
                </>
              ) : (
                "Definir senha e entrar"
              )}
            </Button>
          </form>

          <p className="text-[11px] text-center text-muted-foreground">
            Já tem senha?{" "}
            <Link to="/conta/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirstAccess;
