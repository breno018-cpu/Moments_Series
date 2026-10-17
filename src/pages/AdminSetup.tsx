import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Mail, User, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const AdminSetup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Create the user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: name || email },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Erro ao criar conta");

      // 2. Call edge function to assign admin role
      const { error: fnError } = await supabase.functions.invoke("assign-admin-role", {
        body: { user_id: signUpData.user.id },
      });

      if (fnError) throw fnError;

      setSuccess(true);
      setTimeout(() => navigate("/admin"), 2000);
    } catch (err: any) {
      setError(err.message || "Erro ao configurar admin");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-5">
            <Check size={40} className="text-success" />
          </div>
          <h2 className="text-2xl font-display text-foreground mb-2">ADMIN CONFIGURADO!</h2>
          <p className="text-sm font-body text-muted-foreground">Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-card border border-border/30 rounded-lg p-8 shadow-2xl animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Shield size={28} className="text-primary" />
          </div>
          <h1 className="text-3xl font-display text-foreground tracking-wider">SETUP ADMIN</h1>
          <p className="text-sm font-body text-muted-foreground mt-1">Configure a primeira conta de administrador</p>
        </div>

        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <label className="text-xs font-body text-muted-foreground uppercase tracking-wider mb-1 block">Nome</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-secondary/50 border border-border/30 rounded-md px-4 py-2.5 text-sm font-body text-foreground outline-none focus:border-accent/50 pl-10"
                placeholder="Seu nome"
              />
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            </div>
          </div>

          <div>
            <label className="text-xs font-body text-muted-foreground uppercase tracking-wider mb-1 block">E-mail</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-secondary/50 border border-border/30 rounded-md px-4 py-2.5 text-sm font-body text-foreground outline-none focus:border-accent/50 pl-10"
                placeholder="admin@streamflix.com"
                required
              />
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            </div>
          </div>

          <div>
            <label className="text-xs font-body text-muted-foreground uppercase tracking-wider mb-1 block">Senha</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-secondary/50 border border-border/30 rounded-md px-4 py-2.5 text-sm font-body text-foreground outline-none focus:border-accent/50 pr-10"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs font-body text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2 animate-fade-in">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-body font-bold rounded-md">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Configurando...
              </span>
            ) : (
              "Criar conta Admin"
            )}
          </Button>
        </form>

        <button onClick={() => navigate("/")} className="mt-6 block mx-auto text-xs font-body text-muted-foreground hover:text-foreground transition-colors">
          ← Voltar ao site
        </button>
      </div>
    </div>
  );
};

export default AdminSetup;
