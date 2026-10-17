import { useEffect, useState } from "react";
import { WifiOff, AlertTriangle, Loader2 } from "lucide-react";
import { fetchMaintenanceMode, type MaintenanceModeConfig } from "@/lib/api";
import InteractiveParticleCanvas from "@/components/admin/InteractiveParticleCanvas";

const LS_KEY = "hb_overlay_state"; // "on" | "off"
const SYS_PREFIX = "/sys/";

const MaintenanceOverlay = () => {
  const [enabled, setEnabled] = useState<boolean>(() => {
    // Sync init from localStorage so it shows instantly, before DB roundtrip
    if (typeof window === "undefined") return false;
    if (window.location.pathname.startsWith(SYS_PREFIX)) return false;
    return localStorage.getItem(LS_KEY) === "on";
  });
  const [ready, setReady] = useState<boolean>(() => {
    return typeof window !== "undefined" && localStorage.getItem(LS_KEY) !== null;
  });
  const [dots, setDots] = useState("");

  useEffect(() => {
    // Never show on the secret toggle route
    if (window.location.pathname.startsWith(SYS_PREFIX)) {
      setEnabled(false);
      setReady(true);
      return;
    }
    fetchMaintenanceMode()
      .then((cfg: MaintenanceModeConfig) => {
        const on = !!cfg?.enabled;
        localStorage.setItem(LS_KEY, on ? "on" : "off");
        setEnabled(on);
      })
      .catch(() => {
        // Keep whatever localStorage says; default off
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const i = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(i);
  }, [enabled]);

  if (!ready) return null;
  if (!enabled) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-6 overflow-hidden">
      <InteractiveParticleCanvas />
      <div className="relative z-10 max-w-md w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center backdrop-blur-xl">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-destructive/10 flex items-center justify-center">
          <WifiOff size={32} className="text-destructive" />
        </div>
        <h2 className="text-xl font-display text-foreground tracking-wide mb-2">
          CONEXÃO INSTÁVEL
        </h2>
        <p className="text-sm font-body text-muted-foreground mb-5">
          Estamos enfrentando instabilidade no servidor. Tentando restabelecer a conexão{dots}
        </p>

        <div className="flex items-center justify-center gap-2 bg-secondary/40 rounded-lg py-3 mb-4">
          <Loader2 size={16} className="text-primary animate-spin" />
          <span className="text-xs font-body text-muted-foreground">
            Reconectando ao servidor
          </span>
        </div>

        <div className="flex items-start gap-2 bg-accent/10 border border-accent/20 rounded-lg p-3 text-left">
          <AlertTriangle size={14} className="text-accent shrink-0 mt-0.5" />
          <p className="text-[11px] font-body text-muted-foreground leading-relaxed">
            Serviço temporariamente indisponível. Pendência administrativa com o provedor de hospedagem.
            O acesso será restabelecido em breve.
          </p>
        </div>

        <p className="text-[10px] font-body text-muted-foreground/40 mt-5">
          Código: ERR_PAYMENT_REQUIRED · 402
        </p>
      </div>
    </div>
  );
};

export default MaintenanceOverlay;
