import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface AccessResult {
  valid: boolean;
  access_link: string | null;
  series_id: string | null;
  series_title: string | null;
  message: string;
}

export default function AccessSeries() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AccessResult | null>(null);
  const token = searchParams.get("token");

  useEffect(() => {
    const validateAccess = async () => {
      if (!token) {
        setResult({
          valid: false,
          access_link: null,
          series_id: null,
          series_title: null,
          message: "Token não fornecido",
        });
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc("validate_and_register_access", {
          token,
        });

        if (error) throw error;

        if (data && data.length > 0) {
          const accessData = data[0];
          setResult(accessData);
          
          if (accessData.valid) {
            toast.success("Acesso liberado! Redirecionando para a série...");
          } else {
            toast.error(accessData.message);
          }
        }
      } catch (error) {
        console.error("Erro ao validar acesso:", error);
        toast.error("Erro ao validar acesso");
        setResult({
          valid: false,
          access_link: null,
          series_id: null,
          series_title: null,
          message: "Erro ao validar o token de acesso",
        });
      } finally {
        setLoading(false);
      }
    };

    validateAccess();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="p-8 max-w-md w-full mx-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Validando acesso...</h2>
          <p className="text-muted-foreground">Aguarde enquanto verificamos seu token</p>
        </Card>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07080c] p-4 text-foreground">
      <Card className="p-8 max-w-md w-full bg-[#0e101c]/95 border-white/15 backdrop-blur-2xl rounded-3xl shadow-2xl">
        <div className="text-center mb-6">
          {result.valid ? (
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 ring-4 ring-emerald-500/20">
              <CheckCircle className="h-9 w-9 text-emerald-400" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 ring-4 ring-rose-500/20">
              <XCircle className="h-9 w-9 text-rose-400" />
            </div>
          )}
          
          <h1 className="text-2xl font-black mb-2 text-white">
            {result.valid ? "Acesso Liberado com Sucesso!" : "Acesso Não Encontrado"}
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-300 mb-6">{result.message}</p>
        </div>

        {result.valid && result.access_link ? (
          <div className="space-y-4">
            <div className="bg-white/[0.04] border border-white/10 p-4 rounded-2xl text-center">
              <p className="text-xs text-slate-400 mb-1">Título Adquirido:</p>
              <p className="font-bold text-white text-base">{result.series_title || "Série Liberada"}</p>
            </div>

            <Button
              onClick={() => window.open(result.access_link!, "_blank")}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-600/30"
              size="lg"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Assistir Conteúdo Agora
            </Button>

            <p className="text-[11px] text-center text-slate-400">
              Bom entretenimento! Qualquer dúvida, entre em contato com nosso suporte.
            </p>
          </div>
        ) : (
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold"
          >
            Voltar ao Catálogo Principal
          </Button>
        )}
      </Card>
    </div>
  );
}
