import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { StreamPlayer } from "@/components/StreamPlayer";
import { fetchSecretFeatures, saveSecretFeatures, fetchSeries, DbSerie } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Internal testing area restricted to authenticated administrators.

type Tab = "auth" | "player" | "flag";

const SysLab = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("auth");

  const [featEnabled, setFeatEnabled] = useState(false);
  const [featLoading, setFeatLoading] = useState(true);

  const [testUrl, setTestUrl] = useState("");
  const [series, setSeries] = useState<DbSerie[]>([]);
  const [selectedSerie, setSelectedSerie] = useState<string>("");

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      navigate("/", { replace: true });
      return;
    }
    fetchSecretFeatures()
      .then((c) => setFeatEnabled(c.enabled))
      .finally(() => setFeatLoading(false));
    fetchSeries().then(setSeries).catch(() => {});
  }, [isAdmin, authLoading, navigate]);

  const toggleFeat = async () => {
    const next = !featEnabled;
    setFeatEnabled(next);
    try {
      await saveSecretFeatures({ enabled: next });
      toast.success(next ? "Features ocultas liberadas em produção" : "Features ocultas escondidas novamente");
    } catch (e: any) {
      setFeatEnabled(!next);
      toast.error("Falha ao salvar: " + (e?.message ?? "erro"));
    }
  };

  const currentSerie = series.find((s) => s.id === selectedSerie);
  const effectiveUrl = testUrl || currentSerie?.stream_url || "";

  if (authLoading || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground/60 tracking-wider">/sys/lab</p>
            <h1 className="text-2xl font-bold">Laboratório interno</h1>
            <p className="text-xs text-muted-foreground">Área oculta — não indexada, não linkada em nenhum menu.</p>
          </div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Voltar ao site</Link>
        </header>

        <nav className="flex gap-2 border-b border-border">
          {([
            ["auth", "Auth Lab"],
            ["player", "Player Lab"],
            ["flag", "Flag & Publicação"],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3 py-2 text-sm border-b-2 -mb-px transition ${tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {l}
            </button>
          ))}
        </nav>

        {tab === "auth" && (
          <section className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h2 className="font-semibold mb-2">Sessão atual</h2>
              {user ? (
                <div className="text-sm space-y-1">
                  <p>Logado como <b>{user.email}</b></p>
                  <p className="text-xs text-muted-foreground">Admin: {isAdmin ? "sim" : "não"}</p>
                  <Button variant="outline" size="sm" onClick={() => signOut()}>Sair</Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum usuário logado.</p>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h2 className="font-semibold">Fluxos de conta (ocultos)</h2>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="secondary" size="sm"><Link to="/conta/login">Entrar</Link></Button>
                <Button asChild variant="secondary" size="sm"><Link to="/conta/cadastro">Cadastro</Link></Button>
                <Button asChild variant="secondary" size="sm"><Link to="/conta/primeiro-acesso">Primeiro acesso</Link></Button>
                <Button asChild variant="secondary" size="sm"><Link to="/conta/biblioteca">Minha Biblioteca</Link></Button>
              </div>
              <p className="text-xs text-muted-foreground">
                As rotas existem no site, mas nenhum link público aponta pra elas até a flag ser ligada.
              </p>
            </div>
          </section>
        )}

        {tab === "player" && (
          <section className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h2 className="font-semibold">Testar player (UpCloud / iframe)</h2>
              <Input
                placeholder="Cole aqui uma URL de embed (UpCloud, etc.)"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
              />
              <div className="text-xs text-muted-foreground">Ou selecione uma série existente com stream_url:</div>
              <select
                value={selectedSerie}
                onChange={(e) => setSelectedSerie(e.target.value)}
                className="w-full bg-background border border-border rounded px-2 py-2 text-sm"
              >
                <option value="">-- nenhuma --</option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.titulo}{s.stream_url ? " ✓" : " (sem stream_url)"}
                  </option>
                ))}
              </select>
              {selectedSerie && (
                <Link to={`/assistir/${selectedSerie}`} className="text-xs text-primary hover:underline">
                  → Abrir página /assistir/{selectedSerie}
                </Link>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <h2 className="font-semibold mb-3">Preview</h2>
              <StreamPlayer url={effectiveUrl} title="Preview do player" />
            </div>
          </section>
        )}

        {tab === "flag" && (
          <section className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h2 className="font-semibold">Publicação das features ocultas</h2>
              <p className="text-sm text-muted-foreground">
                Enquanto esta flag estiver <b>desligada</b>, nenhum botão de conta, biblioteca ou player aparece pro público.
                Ligue quando quiser liberar tudo.
              </p>
              {featLoading ? (
                <p className="text-xs text-muted-foreground">Carregando...</p>
              ) : (
                <div className="flex items-center gap-3">
                  <Button onClick={toggleFeat} variant={featEnabled ? "destructive" : "default"}>
                    {featEnabled ? "Desligar (esconder de novo)" : "Ligar (liberar em produção)"}
                  </Button>
                  <span className="text-sm">
                    Estado atual: <b>{featEnabled ? "LIBERADO" : "OCULTO"}</b>
                  </span>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SysLab;
