import { useState } from "react";
import { ShieldAlert, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgeVerificationModalProps {
  onVerified: () => void;
  onCancel: () => void;
}

const AgeVerificationModal = ({ onVerified, onCancel }: AgeVerificationModalProps) => {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");

  const handleVerify = () => {
    const d = parseInt(day), m = parseInt(month), y = parseInt(year);
    if (!d || !m || !y || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > new Date().getFullYear()) {
      setError("Data de nascimento inválida");
      return;
    }
    const birthDate = new Date(y, m - 1, d);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;

    if (age < 18) {
      setError("Você deve ter 18 anos ou mais para acessar este conteúdo");
      return;
    }

    // Store verification in session
    sessionStorage.setItem("age_verified", "true");
    onVerified();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={onCancel} />
      <div className="relative bg-card rounded-2xl border border-destructive/30 shadow-elevated w-full max-w-sm animate-fade-in overflow-hidden">
        <div className="bg-gradient-to-br from-destructive/20 to-destructive/5 p-6 text-center border-b border-destructive/20">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert size={32} className="text-destructive" />
          </div>
          <h3 className="text-xl font-display text-foreground tracking-wide">CONTEÚDO +18</h3>
          <p className="text-xs font-body text-muted-foreground mt-1">
            Este conteúdo é restrito para maiores de 18 anos
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1.5">
              <Calendar size={12} /> Data de Nascimento
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <input
                  type="number"
                  placeholder="Dia"
                  min={1} max={31}
                  value={day}
                  onChange={(e) => { setDay(e.target.value); setError(""); }}
                  className="w-full bg-secondary/50 border border-border/20 rounded-md px-3 py-2.5 text-sm font-body text-foreground text-center outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Mês"
                  min={1} max={12}
                  value={month}
                  onChange={(e) => { setMonth(e.target.value); setError(""); }}
                  className="w-full bg-secondary/50 border border-border/20 rounded-md px-3 py-2.5 text-sm font-body text-foreground text-center outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Ano"
                  min={1900} max={new Date().getFullYear()}
                  value={year}
                  onChange={(e) => { setYear(e.target.value); setError(""); }}
                  className="w-full bg-secondary/50 border border-border/20 rounded-md px-3 py-2.5 text-sm font-body text-foreground text-center outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs font-body text-destructive text-center bg-destructive/10 rounded-md py-2 px-3">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleVerify} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-body font-bold rounded-md">
              Verificar Idade
            </Button>
            <Button variant="outline" onClick={onCancel} className="border-border/30 text-foreground/70 font-body rounded-md">
              Voltar
            </Button>
          </div>

          <p className="text-[10px] font-body text-muted-foreground/50 text-center">
            Ao continuar, você confirma que tem 18 anos ou mais.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgeVerificationModal;
