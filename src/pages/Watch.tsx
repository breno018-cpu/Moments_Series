import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyOrders, fetchActiveSeries, fetchSeriesAccessLinks, DbSerie } from "@/lib/api";
import { StreamPlayer } from "@/components/StreamPlayer";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const Watch = () => {
  const { serieId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [serie, setSerie] = useState<DbSerie | null>(null);
  const [owned, setOwned] = useState(false);
  const [fallbackLink, setFallbackLink] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(`/conta/login`, { replace: true });
      return;
    }
    (async () => {
      try {
        const [series, orders] = await Promise.all([fetchActiveSeries(), fetchMyOrders()]);
        const s = series.find((x) => x.id === serieId) ?? null;
        let ok = false;
        let link = "";
        for (const o of orders) {
          if (o.status !== "pago" || !Array.isArray(o.items)) continue;
          for (const it of o.items as any[]) {
            const sid = it?.serie?.id || it?.id;
            if (sid === serieId) {
              ok = true;
              link = it?.link_acesso || it?.serie?.link_acesso || link;
            }
          }
        }
        setOwned(ok);
        if (ok && s && serieId) {
          const accessMap = await fetchSeriesAccessLinks([serieId]);
          const access = accessMap[serieId];
          setSerie({ ...s, stream_url: access?.stream_url || null, link_acesso: access?.link_acesso || "" });
          setFallbackLink(link || access?.link_acesso || "");
        } else {
          setSerie(s);
          setFallbackLink("");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [serieId, user, authLoading, navigate]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando...</div>;

  if (!serie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-3">
        <p className="text-muted-foreground">Série não encontrada.</p>
        <Link to="/conta/biblioteca" className="text-primary hover:underline text-sm">Voltar</Link>
      </div>
    );
  }

  if (!owned) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-3 p-4 text-center">
        <p className="text-muted-foreground">Você ainda não adquiriu esta série com o e-mail logado.</p>
        <Link to="/" className="text-primary hover:underline text-sm">Ir para o catálogo</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{serie.titulo}</h1>
          <p className="text-sm text-muted-foreground line-clamp-2">{serie.resumo}</p>
        </div>
        {serie.stream_url ? (
          <StreamPlayer url={serie.stream_url} title={serie.titulo} />
        ) : (
          <div className="aspect-video w-full bg-black/60 rounded-lg flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-white/70 max-w-md">
              O player integrado ainda está sendo configurado para esta série. Enquanto isso, você pode acessar o conteúdo pelo link de entrega:
            </p>
            {fallbackLink ? (
              <Button asChild variant="secondary">
                <a href={fallbackLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" /> Abrir link de acesso
                </a>
              </Button>
            ) : (
              <p className="text-xs text-white/50">Nenhum link disponível — contate o suporte.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watch;
