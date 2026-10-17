import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton } from "boneyard-js/react";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyOrders, fetchActiveSeries, DbOrder, DbSerie } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";


interface OwnedSerie {
  serie: DbSerie;
  order: DbOrder;
}

const Library = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<OwnedSerie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/conta/login", { replace: true });
      return;
    }
    (async () => {
      try {
        const [orders, series] = await Promise.all([fetchMyOrders(), fetchActiveSeries()]);
        const paidOrders = orders.filter((o) => o.status === "pago");
        const byId = new Map(series.map((s) => [s.id, s]));
        const owned: OwnedSerie[] = [];
        const seen = new Set<string>();
        for (const o of paidOrders) {
          const arr = Array.isArray(o.items) ? o.items : [];
          for (const it of arr) {
            const sid = it?.serie?.id || it?.id;
            if (!sid || seen.has(sid)) continue;
            const s = byId.get(sid);
            if (s) {
              owned.push({ serie: s, order: o });
              seen.add(sid);
            }
          }
        }
        setItems(owned);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Minha Biblioteca</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={async () => { await signOut(); navigate("/"); }}>Sair</Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton
                key={i}
                name="library-card"
                loading
                className="w-full"
                fallback={
                  <div className="w-full">
                    <div className="skeleton w-full aspect-[2/3] rounded-lg" />
                    <div className="skeleton h-3 w-4/5 rounded mt-2" />
                    <div className="skeleton h-3 w-1/2 rounded mt-2" />
                  </div>
                }
              >
                <div />
              </Skeleton>
            ))}
          </div>
        ) : items.length === 0 ? (

          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground">Você ainda não tem séries adquiridas com este e-mail.</p>
            <Link to="/" className="text-primary hover:underline text-sm mt-2 inline-block">Ver catálogo</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map(({ serie }) => (
              <Link
                key={serie.id}
                to={`/assistir/${serie.id}`}
                className="group bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition"
              >
                <div className="aspect-[2/3] bg-muted overflow-hidden">
                  {serie.capa_url && <img src={serie.capa_url} alt={serie.titulo} className="w-full h-full object-cover group-hover:scale-105 transition" />}
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium line-clamp-1">{serie.titulo}</p>
                  <div className="flex items-center gap-1 text-xs text-primary mt-1">
                    <Play className="w-3 h-3" /> Assistir
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
