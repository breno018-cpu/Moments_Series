import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Lock, KeyRound, ArrowLeft, Loader2 } from "lucide-react";

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bem-vindo(a) de volta!");
    navigate("/conta/biblioteca");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-3 h-3" /> Voltar ao site
        </Link>

        <div className="bg-card/80 backdrop-blur border border-border/60 rounded-2xl shadow-xl p-7 space-y-6">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center mb-2">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Entrar na sua conta</h1>
            <p className="text-sm text-muted-foreground">
              Acesse sua biblioteca de séries adquiridas.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                placeholder="E-mail (o mesmo da compra)"
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
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-9 h-11"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 text-base">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                Primeira vez aqui?
              </span>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            className="w-full h-11 border-primary/40 hover:bg-primary/5"
          >
            <Link to="/conta/primeiro-acesso" className="flex items-center justify-center gap-2">
              <KeyRound className="w-4 h-4" />
              Primeiro acesso — criar senha
            </Link>
          </Button>

          <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
            Já comprou uma série? Use o mesmo e-mail da compra para liberar sua biblioteca automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
