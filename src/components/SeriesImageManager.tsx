import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSeries, useUpdateSeries } from "@/hooks/useSeries";

export function SeriesImageManager() {
  const { data: series = [] } = useSeries();
  const updateSeries = useUpdateSeries();
  const [selectedId, setSelectedId] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleUpdate = () => {
    if (!selectedId || !imageUrl) return toast.error("Selecione uma série e insira o link");
    updateSeries.mutate({ id: selectedId, image_url: imageUrl });
    setImageUrl("");
  };

  const selectedSeries = series.find(s => s.id === selectedId);

  return (
    <div className="space-y-4 p-6 border border-zinc-200/90 rounded-2xl bg-white shadow-xs">
      <div>
        <h3 className="font-black text-base text-zinc-950 flex items-center gap-2">
          <span>Gerenciar Imagens de Capa (Séries)</span>
        </h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Altere ou atualize o link da capa de qualquer série cadastrada sem precisar recadastrar.
        </p>
      </div>

      <div className="grid gap-4 max-w-xl">
        <div>
          <Label className="text-xs font-bold text-zinc-700">Selecione a Série</Label>
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              const found = series.find(s => s.id === e.target.value);
              if (found) setImageUrl(found.image_url || "");
            }}
            className="w-full bg-white border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-950 mt-1 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-950"
          >
            <option value="">Selecione uma série para ver ou trocar a capa...</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>

        {selectedSeries && (
          <div className="flex items-center gap-4 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
            <img
              src={imageUrl || selectedSeries.image_url}
              alt={selectedSeries.title}
              className="w-14 h-20 object-cover rounded-lg border border-zinc-200 shadow-xs shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Pré-visualização da Capa</span>
              <p className="text-xs font-bold text-zinc-900 truncate">{selectedSeries.title}</p>
              <p className="text-[11px] text-zinc-500 truncate max-w-md">{imageUrl || selectedSeries.image_url}</p>
            </div>
          </div>
        )}

        <div>
          <Label className="text-xs font-bold text-zinc-700">Nova URL da Capa</Label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/... ou link direto da imagem"
            className="mt-1 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs"
          />
        </div>

        <Button onClick={handleUpdate} className="w-full font-bold text-xs bg-zinc-950 hover:bg-[#E31C25] text-white transition-colors h-10 rounded-xl shadow-xs">
          Salvar Nova Capa da Série
        </Button>
      </div>
    </div>
  );
}
