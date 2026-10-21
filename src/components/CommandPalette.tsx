import { useState, useEffect } from "react";
import { Search, Film, Tv } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSeries } from "@/hooks/useSeries";
import { useAnimes } from "@/hooks/useAnimes";
import { useNavigate } from "react-router-dom";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data: series = [] } = useSeries();
  const { data: animes = [] } = useAnimes();
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const resultsSeries = query
    ? series.filter((s) => s.title.toLowerCase().includes(query.toLowerCase()))
    : series.slice(0, 3);
  const resultsAnimes = query
    ? animes.filter((a) => a.title.toLowerCase().includes(query.toLowerCase()))
    : animes.slice(0, 3);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl bg-[#0c0d14] border-white/10 text-white rounded-2xl p-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 px-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite para buscar séries ou animes..."
            className="border-0 bg-transparent focus-visible:ring-0 text-sm placeholder:text-muted-foreground"
          />
        </div>

        <div className="max-h-80 overflow-y-auto space-y-4 pt-2">
          {resultsSeries.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-1 flex items-center gap-1">
                <Film className="w-3 h-3" /> Séries
              </div>
              {resultsSeries.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setOpen(false);
                    navigate(`/series/${item.id}`);
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 cursor-pointer flex items-center justify-between text-xs font-semibold"
                >
                  <span>{item.title}</span>
                  <span className="text-purple-400">R$ {item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {resultsAnimes.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-1 flex items-center gap-1">
                <Tv className="w-3 h-3" /> Animes
              </div>
              {resultsAnimes.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setOpen(false);
                    navigate(`/anime/${item.id}`);
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 cursor-pointer flex items-center justify-between text-xs font-semibold"
                >
                  <span>{item.title}</span>
                  <span className="text-purple-400">R$ {item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
