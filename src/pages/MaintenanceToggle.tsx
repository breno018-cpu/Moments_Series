import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2, Power } from "lucide-react";

type Status = "loading" | "success" | "error";

export default function MaintenanceToggle() {
  const { token, state } = useParams<{ token: string; state: string }>();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("toggle-maintenance", {
          body: null,
          method: "GET" as any,
          headers: {},
        });

        // supabase.functions.invoke não suporta query params em GET de forma direta;
        // usamos fetch manual para confiabilidade
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/toggle-maintenance?token=${encodeURIComponent(
          token ?? "",
        )}&state=${encodeURIComponent(state ?? "")}`;
        const res = await fetch(url, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setStatus("error");
          setMessage(json.error || "Falha ao alterar status");
          return;
        }
        setCurrent(json.current);
        setStatus("success");
        setMessage(
          json.previous === json.current
            ? `Status já estava como ${json.current.toUpperCase()}.`
            : `Status alterado: ${json.previous.toUpperCase()} → ${json.current.toUpperCase()}`,
        );
      } catch (e: any) {
        setStatus("error");
        setMessage(e.message || "Erro inesperado");
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, state]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
          {status === "success" && (
            <div className="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-primary" />
            </div>
          )}
          {status === "error" && (
            <div className="h-16 w-16 rounded-full bg-destructive/15 flex items-center justify-center">
              <XCircle className="h-9 w-9 text-destructive" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {status === "loading" && "Processando..."}
            {status === "success" && "Operação concluída"}
            {status === "error" && "Operação falhou"}
          </h1>
          <p className="text-muted-foreground">{message}</p>
          {current && (
            <div
              className={`inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full border ${
                current === "on"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-primary/40 bg-primary/10 text-primary"
              }`}
            >
              <Power className="h-4 w-4" />
              <span className="font-semibold uppercase text-sm">
                Manutenção: {current === "on" ? "ATIVADA" : "DESATIVADA"}
              </span>
            </div>
          )}
        </div>

        <Link
          to="/"
          className="inline-block text-sm text-muted-foreground hover:text-primary transition"
        >
          ← Ir para o site
        </Link>
      </div>
    </div>
  );
}
