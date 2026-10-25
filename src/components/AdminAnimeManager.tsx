import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAnimes, useCreateAnime, useUpdateAnime, useDeleteAnime, Anime } from '@/hooks/useAnimes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Search, Sparkles, Star } from 'lucide-react';
import { StarRating } from '@/components/StarRating';
import { Badge } from '@/components/ui/badge';
import { ImageUploadField } from '@/components/ImageUploadField';
import { AdminCatalogSkeleton } from '@/components/AdminCatalogSkeleton';

export const AdminAnimeManager = () => {
  const { data: animes, isLoading } = useAnimes();
  const createAnime = useCreateAnime();
  const updateAnime = useUpdateAnime();
  const deleteAnime = useDeleteAnime();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    rating: 0,
    description: '',
    price: '',
    image_url: '',
    featured: false,
    access_link: '',
    audio_type: 'legendado' as 'dublado' | 'legendado',
  });

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = Number(numbers) / 100;
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return Number(numbers) / 100;
  };

  const resetForm = () => {
    setFormData({
      title: '', genre: '', rating: 0, description: '', price: '', image_url: '',
      featured: false, access_link: '', audio_type: 'legendado',
    });
    setEditingId(null);
  };

  const handleEdit = async (a: Anime) => {
    setEditingId(a.id);
    const { data: linkRow } = await supabase
      .from('anime_access_links')
      .select('access_link')
      .eq('anime_id', a.id)
      .maybeSingle();
    setFormData({
      title: a.title,
      genre: a.genre || '',
      rating: a.rating || 0,
      description: a.description || '',
      price: a.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      image_url: a.image_url || '',
      featured: a.featured,
      access_link: linkRow?.access_link || '',
      audio_type: a.audio_type || 'legendado',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const animeData = {
      ...formData,
      rating: formData.rating || 0,
      price: parseCurrency(formData.price),
    };
    if (editingId) {
      await updateAnime.mutateAsync({ id: editingId, ...animeData });
    } else {
      await createAnime.mutateAsync(animeData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este anime?')) {
      await deleteAnime.mutateAsync(id);
    }
  };

  const filtered = animes?.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.genre || '').toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="admin-theme space-y-6 text-zinc-950">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-teal-600" />
          <h2 className="text-xl font-bold text-zinc-950">Catálogo de Animes</h2>
          <Badge variant="secondary" className="bg-teal-50 text-teal-700 border border-teal-200 font-extrabold text-xs">
            {animes?.length || 0} Títulos
          </Badge>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} size="sm" className="h-10 px-4 rounded-xl bg-zinc-950 hover:bg-[#E31C25] text-white font-bold text-xs shadow-sm gap-2 transition-colors">
              <Plus className="h-4 w-4 stroke-[3]" /> Adicionar Anime
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[94vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-7 bg-white border-zinc-200 rounded-2xl shadow-2xl custom-scrollbar text-zinc-950">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-950">
                <Sparkles className="h-5 w-5 text-teal-600" />
                {editingId ? 'Editar Anime' : 'Adicionar Novo Anime ao Catálogo'}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Preencha as informações do anime. O link do Google Drive/Telegram será enviado automaticamente após aprovação do PIX.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 w-full max-w-full overflow-x-hidden">
              <div className="w-full min-w-0">
                <Label htmlFor="anime-title" className="text-xs font-bold text-zinc-700">Título do Anime</Label>
                <Input id="anime-title" placeholder="Ex: Naruto Shippuden" value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="mt-1 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
                <div className="min-w-0">
                  <Label htmlFor="anime-genre" className="text-xs font-bold text-zinc-700">Gênero / Categoria</Label>
                  <Input id="anime-genre" placeholder="Ex: Ação, Aventura" value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })} className="mt-1 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs" />
                </div>
                <div className="min-w-0">
                  <Label htmlFor="anime-audio" className="text-xs font-bold text-zinc-700">Idioma do Áudio</Label>
                  <select id="anime-audio"
                    className="mt-1 flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 shadow-xs"
                    value={formData.audio_type}
                    onChange={(e) => setFormData({ ...formData, audio_type: e.target.value as 'dublado' | 'legendado' })} required>
                    <option value="legendado">Legendado</option>
                    <option value="dublado">Dublado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
                <div className="min-w-0">
                  <Label className="text-xs font-bold text-zinc-700">Nota (Avaliação)</Label>
                  <div className="mt-2">
                    <StarRating rating={formData.rating} onRatingChange={(r) => setFormData({ ...formData, rating: r })} size="lg" showValue />
                  </div>
                </div>
                <div className="min-w-0">
                  <Label htmlFor="anime-price" className="text-xs font-bold text-zinc-700">Preço de Venda (R$)</Label>
                  <Input id="anime-price" type="text" placeholder="Ex: 19,90" value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: formatCurrency(e.target.value) })} required className="mt-1 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs" />
                </div>
              </div>

              <div className="w-full min-w-0">
                <Label htmlFor="anime-desc" className="text-xs font-bold text-zinc-700">Descrição do Anime</Label>
                <Textarea id="anime-desc" placeholder="Resumo envolvente do anime..." rows={3} value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-1 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs" />
              </div>

              <div className="w-full min-w-0">
                <ImageUploadField
                  label="Capa do Anime (Upload de Foto ou Link Direto)"
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  bucket="anime-images"
                  idPrefix="anime-cover-file"
                />
              </div>

              <div className="w-full min-w-0">
                <Label htmlFor="anime-link" className="text-xs font-bold flex items-center gap-1.5 text-teal-700">Link de Entrega (Google Drive ou Telegram)</Label>
                <Input id="anime-link" type="url" placeholder="https://drive.google.com/..." value={formData.access_link}
                  onChange={(e) => setFormData({ ...formData, access_link: e.target.value })} className="mt-1 bg-teal-50 border-teal-200 text-teal-900 font-mono text-xs shadow-xs" />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input type="checkbox" id="anime-featured" checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="rounded h-4 w-4 accent-amber-500" />
                <Label htmlFor="anime-featured" className="text-xs font-semibold cursor-pointer text-amber-700">Destacar no carrossel</Label>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-3 border-t border-zinc-200">
                <Button type="submit" className="flex-1 bg-zinc-950 text-white font-bold hover:bg-[#E31C25] shadow-xs transition-colors">
                  {editingId ? 'Salvar Alterações' : 'Adicionar ao Catálogo'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="flex-1 sm:flex-initial border-zinc-200 text-zinc-700 hover:bg-zinc-100">Cancelar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input placeholder="Pesquisar anime por título ou gênero..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs" />
      </div>

      {isLoading ? (
        <AdminCatalogSkeleton count={6} />
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <Card key={a.id} className="bg-white border-zinc-200 hover:border-zinc-300 transition-all hover:shadow-md overflow-hidden flex flex-col justify-between">
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3.5">
                  <img
                    src={a.image_url}
                    alt={a.title}
                    className="w-16 h-24 object-cover rounded-lg border border-zinc-200 flex-shrink-0 shadow-xs bg-zinc-50"
                    onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0.3')}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[9px] uppercase font-bold bg-teal-50 border-teal-200 text-teal-800">
                        ANIME
                      </Badge>
                      {a.featured && <Badge className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 font-bold">Destaque</Badge>}
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-zinc-950 truncate leading-tight">{a.title}</h3>
                    <p className="text-xs text-zinc-500 line-clamp-1">{a.genre || 'Geral'}</p>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-xs text-amber-600">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="font-bold">{a.rating > 0 ? a.rating.toFixed(1) : '—'}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-700">R$ {a.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 mt-auto">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(a)} className="h-8 px-3 text-xs border-zinc-200 gap-1.5 hover:bg-zinc-100 text-zinc-700">
                    <Edit className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(a.id)} className="h-8 px-2.5 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200">
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-zinc-200 rounded-2xl bg-white shadow-xs">
          <p className="text-zinc-500 mb-4 text-sm">Nenhum anime cadastrado no catálogo.</p>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2 bg-zinc-950 text-white hover:bg-[#E31C25] font-bold">
            <Plus className="h-4 w-4" /> Cadastrar Primeiro Anime
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminAnimeManager;
