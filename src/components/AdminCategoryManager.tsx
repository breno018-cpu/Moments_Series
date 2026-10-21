import { useState } from 'react';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useSeriesCategories,
  useSetSeriesCategories,
  useAnimeCategories,
  useSetAnimeCategories,
  Category,
} from '@/hooks/useCategories';
import { useSeries } from '@/hooks/useSeries';
import { useAnimes } from '@/hooks/useAnimes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Tag, Loader2, Save, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const PRESET_COLORS = ['#8b5cf6', '#a855f7', '#ec4899', '#f59e0b', '#ef4444', '#10b981', '#06b6d4', '#6366f1', '#64748b', '#7c2d12'];

export const AdminCategoryManager = () => {
  const { data: categories = [], isLoading } = useCategories();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const { data: series = [] } = useSeries();
  const { data: animes = [] } = useAnimes();
  const { data: seriesCats = [] } = useSeriesCategories();
  const { data: animeCats = [] } = useAnimeCategories();
  const setSeriesCats = useSetSeriesCategories();
  const setAnimeCats = useSetAnimeCategories();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', color: '#8b5cf6' });

  const resetForm = () => { setEditing(null); setForm({ name: '', color: '#8b5cf6' }); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) {
      await updateCat.mutateAsync({ id: editing.id, name: form.name, color: form.color });
    } else {
      await createCat.mutateAsync({ name: form.name, color: form.color });
    }
    setOpen(false); resetForm();
  };

  const handleEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, color: cat.color });
    setOpen(true);
  };

  const handleDelete = async (cat: Category) => {
    if (confirm(`Excluir categoria "${cat.name}"? Vínculos com séries/animes serão removidos.`)) {
      await deleteCat.mutateAsync(cat.id);
    }
  };

  // Mapas para acesso rápido
  const seriesByCat = new Map<string, string[]>();
  seriesCats.forEach((sc) => {
    const list = seriesByCat.get(sc.category_id) || [];
    list.push(sc.series_id);
    seriesByCat.set(sc.category_id, list);
  });

  const animeByCat = new Map<string, string[]>();
  animeCats.forEach((ac) => {
    const list = animeByCat.get(ac.category_id) || [];
    list.push(ac.anime_id);
    animeByCat.set(ac.category_id, list);
  });

  const seriesCatIds = (sId: string) => seriesCats.filter(sc => sc.series_id === sId).map(sc => sc.category_id);
  const animeCatIds = (aId: string) => animeCats.filter(ac => ac.anime_id === aId).map(ac => ac.category_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-1 bg-primary rounded-full" />
          <div>
            <h2 className="text-xl font-bold">Categorias & Tags</h2>
            <p className="text-sm text-muted-foreground">
              Crie categorias fixas e atribua múltiplas a cada série/anime.
            </p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" /> Nova categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
              <DialogDescription>Defina nome e cor de exibição.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="cat-name">Nome</Label>
                <Input id="cat-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Suspense" required />
              </div>
              <div>
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                      aria-label={`cor ${c}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1" disabled={createCat.isPending || updateCat.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {editing ? 'Salvar' : 'Criar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Lista de categorias</TabsTrigger>
          <TabsTrigger value="series">Tags de Séries</TabsTrigger>
          <TabsTrigger value="animes">Tags de Animes</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-zinc-500">
              <span className="text-xs font-semibold">Carregando categorias...</span>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => {
                const sCount = seriesByCat.get(cat.id)?.length || 0;
                const aCount = animeByCat.get(cat.id)?.length || 0;
                return (
                  <Card key={cat.id} className="overflow-hidden border-zinc-200 bg-white hover:border-zinc-300 transition-colors shadow-sm">
                    <div className="h-2" style={{ backgroundColor: cat.color }} />
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <h3 className="font-semibold text-zinc-950 truncate">{cat.name}</h3>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100" onClick={() => handleEdit(cat)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDelete(cat)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Badge variant="secondary" className="text-xs bg-zinc-100 text-zinc-700 border-zinc-200">{sCount} séries</Badge>
                        <Badge variant="secondary" className="text-xs bg-zinc-100 text-zinc-700 border-zinc-200">{aCount} animes</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {categories.length === 0 && (
                <div className="col-span-full text-center py-12 border-2 border-dashed border-border rounded-lg">
                  <Tag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhuma categoria criada ainda</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="series" className="mt-4">
          <ItemTagAssigner
            items={series.map(s => ({ id: s.id, title: s.title }))}
            getSelected={seriesCatIds}
            categories={categories}
            onSave={(itemId, catIds) => setSeriesCats.mutateAsync({ seriesId: itemId, categoryIds: catIds })}
            isPending={setSeriesCats.isPending}
            label="série"
          />
        </TabsContent>

        <TabsContent value="animes" className="mt-4">
          <ItemTagAssigner
            items={animes.map(a => ({ id: a.id, title: a.title }))}
            getSelected={animeCatIds}
            categories={categories}
            onSave={(itemId, catIds) => setAnimeCats.mutateAsync({ animeId: itemId, categoryIds: catIds })}
            isPending={setAnimeCats.isPending}
            label="anime"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Sub-componente reutilizável para atribuir tags
const ItemTagAssigner = ({
  items, getSelected, categories, onSave, isPending, label,
}: {
  items: { id: string; title: string }[];
  getSelected: (id: string) => string[];
  categories: Category[];
  onSave: (id: string, catIds: string[]) => Promise<any>;
  isPending: boolean;
  label: string;
}) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const startEdit = (id: string) => {
    setDraft(new Set(getSelected(id)));
    setOpenId(id);
  };

  const toggle = (catId: string) => {
    const next = new Set(draft);
    if (next.has(catId)) {
      next.delete(catId);
    } else {
      next.add(catId);
    }
    setDraft(next);
  };

  const save = async () => {
    if (!openId) return;
    await onSave(openId, Array.from(draft));
    setOpenId(null);
  };

  const filtered = items.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <Card className="border-zinc-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-zinc-950 font-bold">Atribuir tags às {label}s</CardTitle>
        <CardDescription className="text-zinc-500">Clique em um item para selecionar suas categorias.</CardDescription>
      </CardHeader>
      <CardContent>
        <Input placeholder={`Buscar ${label}...`} value={search} onChange={e => setSearch(e.target.value)} className="mb-3 bg-white border-zinc-300 text-zinc-950" />
        <ScrollArea className="h-[420px] pr-2">
          <div className="space-y-2">
            {filtered.map((item) => {
              const selectedIds = getSelected(item.id);
              const selected = categories.filter(c => selectedIds.includes(c.id));
              return (
                <div key={item.id} className="border border-zinc-200 bg-white rounded-lg p-3 hover:border-zinc-300 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-zinc-950 truncate">{item.title}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {selected.length === 0 ? (
                          <span className="text-xs text-zinc-400">Sem categorias</span>
                        ) : selected.map(c => (
                          <Badge key={c.id} variant="outline" className="text-xs gap-1 font-medium" style={{ borderColor: c.color, color: c.color }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                            {c.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="border-zinc-300 text-zinc-800 hover:bg-zinc-100" onClick={() => startEdit(item.id)}>
                      <Tag className="h-3.5 w-3.5 mr-1.5" /> Editar
                    </Button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum item encontrado.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <Dialog open={openId !== null} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar categorias</DialogTitle>
            <DialogDescription>Marque todas as categorias que se aplicam.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 max-h-[50vh] overflow-y-auto">
            {categories.map((c) => {
              const active = draft.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 text-sm transition-all ${active ? 'text-white' : 'text-foreground bg-muted/40'}`}
                  style={active ? { backgroundColor: c.color, borderColor: c.color } : { borderColor: c.color + '60' }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: active ? '#fff' : c.color }} />
                  {c.name}
                  {active && <X className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 pt-3">
            <Button onClick={save} disabled={isPending} className="flex-1 bg-zinc-950 hover:bg-[#E31C25] text-white font-bold transition-colors">
              <Save className="h-4 w-4 mr-2" />
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="outline" onClick={() => setOpenId(null)}>Cancelar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
