import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { useSeries, useCreateSeries, useUpdateSeries, useDeleteSeries } from '@/hooks/useSeries';
import { useConvertSeriesToAnime } from '@/hooks/useConvertSeriesToAnime';
import { AdminHeader } from '@/components/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import {
  Plus, Edit, Trash2, LogOut, Tag, BarChart3, FileText, Search,
  Film, Sparkles, Image as ImageIcon, Settings2, Wand2, ShieldCheck, Activity, Tags,
  Target, Mail, KeyRound, Loader2, Wrench, Star, HelpCircle, TrendingUp, MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminDashboard } from '@/components/AdminDashboard';
import { ImageUploadField } from '@/components/ImageUploadField';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StarRating } from '@/components/StarRating';
import { formatCurrencyBRL, formatNumberBRL } from '@/lib/utils';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { AdminAnimeManager } from '@/components/AdminAnimeManager';
import { AdminContactSettings } from '@/components/AdminContactSettings';
import { AdminMarketingSettings } from '@/components/AdminMarketingSettings';
import { AdminCategoryManager } from '@/components/AdminCategoryManager';
import { MetaAdsDashboard } from '@/components/MetaAdsDashboard';
import { AdminNewsletterPanel } from '@/components/AdminNewsletterPanel';
import { AdminPasswordChange } from '@/components/AdminPasswordChange';
import { AdminMaintenanceSettings } from '@/components/AdminMaintenanceSettings';
import { AdminWhatsAppMessageSettings } from '@/components/AdminWhatsAppMessageSettings';
import AdminSales from '@/pages/AdminSales';
import AdminCoupons from '@/pages/AdminCoupons';
import { AdminCatalogSkeleton } from '@/components/AdminCatalogSkeleton';

export default function Admin() {
  const navigate = useNavigate();
  const { data: adminStatus, isLoading: adminLoading } = useAdmin();
  const { data: series, isLoading: seriesLoading } = useSeries();
  const isRayane = (adminStatus?.email || '').toLowerCase().includes('rayane');
  const createSeries = useCreateSeries();
  const updateSeries = useUpdateSeries();
  const deleteSeries = useDeleteSeries();
  const convertToAnime = useConvertSeriesToAnime();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredSearchQuery, setFeaturedSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<'sales' | 'catalog' | 'coupons' | 'marketing' | 'settings'>('sales');
  const [isNavigating, setIsNavigating] = useState(false);

  const handleTransitionNavigate = (to: string) => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate(to);
    }, 280);
  };

  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    rating: 0,
    description: '',
    price: '',
    image_url: '',
    featured: false,
    access_link: '',
    audio_type: 'dublado' as 'dublado' | 'legendado',
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

  useEffect(() => {
    if (adminLoading) return;
    if (!adminStatus?.isAdmin) {
      navigate('/auth');
    }
  }, [navigate, adminStatus, adminLoading]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      sessionStorage.removeItem('moments_admin_session');
      toast.success('Logout realizado com sucesso');
      handleTransitionNavigate('/');
    } catch {
      navigate('/');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', genre: '', rating: 0, description: '', price: '', image_url: '',
      featured: false, access_link: '', audio_type: 'dublado',
    });
    setEditingId(null);
  };

  const handleEdit = async (s: any) => {
    setEditingId(s.id);
    const { data: linkRow } = await supabase
      .from('series_access_links')
      .select('access_link')
      .eq('series_id', s.id)
      .maybeSingle();
    setFormData({
      title: s.title,
      genre: s.genre || '',
      rating: s.rating || 0,
      description: s.description || '',
      price: s.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      image_url: s.image_url || '',
      featured: s.featured,
      access_link: linkRow?.access_link || '',
      audio_type: s.audio_type || 'dublado',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const seriesData = {
      ...formData,
      rating: formData.rating || 0,
      price: parseCurrency(formData.price),
    };
    if (editingId) {
      await updateSeries.mutateAsync({ id: editingId, ...seriesData });
    } else {
      await createSeries.mutateAsync(seriesData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta série?')) {
      await deleteSeries.mutateAsync(id);
    }
  };

  const handleConvert = async (id: string, title: string) => {
    if (confirm(`Mover "${title}" para o catálogo de Animes? A série será removida da lista de séries.`)) {
      await convertToAnime.mutateAsync(id);
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbfbfd]">
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <div className="w-10 h-10 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-zinc-800">Carregando Painel Administrativo...</p>
          <div className="w-36 h-1.5 bg-zinc-200 rounded-full overflow-hidden mt-1">
            <div className="w-full h-full bg-zinc-900 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  const seriesCount = series?.length || 0;
  const featuredCount = series?.filter((s) => s.featured).length || 0;

  return (
    <div className="admin-theme min-h-screen bg-[#fbfbfd] text-zinc-950 relative overflow-x-hidden">
      <AdminHeader onNavigateTransition={handleTransitionNavigate} />

      <main className="app-container py-4 sm:py-6 mt-1 relative z-10 max-w-7xl">
        
        {/* Cabeçalho Limpo e Compacto */}
        <div className="relative rounded-2xl border border-zinc-200/90 bg-white p-5 sm:p-6 mb-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <Badge variant="secondary" className="uppercase tracking-widest text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Painel Administrativo
                </Badge>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950">
                Central de Controle Moments
              </h1>
              <p className="text-zinc-500 mt-0.5 text-xs sm:text-sm max-w-xl">
                Acompanhe vendas PIX, gerencie o catálogo de séries/animes, cupons e configurações do sistema.
              </p>
            </div>

            {/* Ações de Topo */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} size="sm" className="h-11 px-6 rounded-xl bg-zinc-950 text-white hover:bg-[#E31C25] font-black text-xs shadow-md gap-2 hover:scale-[1.02] active:scale-95 transition-all">
                    <Plus className="h-4 w-4 stroke-[3]" />
                    Nova Série
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 bg-white border-zinc-200 rounded-2xl shadow-2xl custom-scrollbar text-zinc-950">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-950">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      {editingId ? 'Editar Série do Catálogo' : 'Adicionar Nova Série ao Catálogo'}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500">
                      Preencha os dados da série. O link de acesso do Google Drive/Telegram será enviado automaticamente após o PIX.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="title" className="text-xs font-bold text-zinc-700">Título da Série</Label>
                      <Input id="title" placeholder="Ex: Amor Proibido" value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="mt-1 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="genre" className="text-xs font-bold text-zinc-700">Gênero / Categoria</Label>
                        <Input id="genre" placeholder="Ex: Romance, Drama" value={formData.genre}
                          onChange={(e) => setFormData({ ...formData, genre: e.target.value })} className="mt-1 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs" />
                      </div>
                      <div>
                        <Label htmlFor="audio_type" className="text-xs font-bold text-zinc-700">Idioma do Áudio</Label>
                        <select id="audio_type"
                          className="mt-1 flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 shadow-xs"
                          value={formData.audio_type}
                          onChange={(e) => setFormData({ ...formData, audio_type: e.target.value as 'dublado' | 'legendado' })} required>
                          <option value="dublado">Dublado</option>
                          <option value="legendado">Legendado</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-zinc-700">Avaliação (0 a 5 Estrelas)</Label>
                        <div className="mt-2">
                          <StarRating rating={formData.rating} onRatingChange={(r) => setFormData({ ...formData, rating: r })} size="lg" showValue />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="price" className="text-xs font-bold text-zinc-700">Preço de Venda (R$)</Label>
                        <Input id="price" type="text" placeholder="Ex: 29,90" value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: formatCurrency(e.target.value) })} required className="mt-1 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs" />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-xs font-bold text-zinc-700">Descrição da Série</Label>
                      <Textarea id="description" placeholder="Resumo envolvente da história..." rows={3} value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-1 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs" />
                    </div>

                    <ImageUploadField
                      label="Capa da Série (Upload de Foto ou Link Direto)"
                      value={formData.image_url}
                      onChange={(url) => setFormData({ ...formData, image_url: url })}
                      bucket="series-images"
                      idPrefix="series-cover-file"
                    />

                    <div>
                      <Label htmlFor="access_link" className="text-xs font-bold flex items-center gap-1.5 text-purple-700">
                        Link de Entrega (Google Drive ou Telegram)
                      </Label>
                      <Input id="access_link" type="url" placeholder="https://drive.google.com/..." value={formData.access_link}
                        onChange={(e) => setFormData({ ...formData, access_link: e.target.value })} className="mt-1 bg-purple-50/50 border-purple-200 text-purple-900 font-mono text-xs shadow-xs" />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <input type="checkbox" id="featured" checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="rounded h-4 w-4 accent-amber-500" />
                      <Label htmlFor="featured" className="text-xs font-semibold cursor-pointer text-amber-700">Destacar no carrossel</Label>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-3 border-t border-zinc-200">
                      <Button type="submit" className="flex-1 bg-zinc-950 hover:bg-[#E31C25] text-white font-bold shadow-sm transition-colors">
                        {editingId ? 'Salvar Alterações' : 'Adicionar ao Catálogo'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}
                        className="flex-1 sm:flex-initial border-zinc-200 text-zinc-700 hover:bg-zinc-100">Cancelar</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button variant="ghost" size="sm" onClick={handleLogout} className="h-11 px-3.5 text-xs text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                <LogOut className="h-4 w-4" />
                <span className="ml-1.5 hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 5 Abas de Navegação Responsivas */}
        <div className="flex sm:grid sm:grid-cols-5 gap-2 mb-6 overflow-x-auto pb-1 sm:pb-0 no-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveModule('sales')}
            className={`min-w-[140px] sm:min-w-0 flex-1 p-2.5 sm:p-3 rounded-xl border text-left transition-colors flex flex-col gap-1 sm:gap-1.5 flex-shrink-0 sm:flex-shrink ${
              activeModule === 'sales'
                ? 'bg-emerald-50/80 border-emerald-500 shadow-xs'
                : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-950 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-1.5 rounded-lg ${activeModule === 'sales' ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <Badge variant="outline" className={`text-[9px] uppercase font-extrabold ${activeModule === 'sales' ? 'border-emerald-300 text-emerald-800 bg-emerald-100/60' : 'border-zinc-200 text-zinc-600'}`}>
                PIX
              </Badge>
            </div>
            <div>
              <span className="font-extrabold text-xs text-zinc-950 block">1. Vendas & PIX</span>
              <span className="text-[10px] text-zinc-500 block">Relatório & Faturamento</span>
            </div>
          </button>

          <button
            onClick={() => setActiveModule('catalog')}
            className={`min-w-[140px] sm:min-w-0 flex-1 p-2.5 sm:p-3 rounded-xl border text-left transition-colors flex flex-col gap-1 sm:gap-1.5 flex-shrink-0 sm:flex-shrink ${
              activeModule === 'catalog'
                ? 'bg-purple-50/80 border-purple-500 shadow-xs'
                : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-950 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-1.5 rounded-lg ${activeModule === 'catalog' ? 'bg-purple-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                <Film className="h-3.5 w-3.5" />
              </div>
              <Badge variant="outline" className={`text-[9px] uppercase font-extrabold ${activeModule === 'catalog' ? 'border-purple-300 text-purple-800 bg-purple-100/60' : 'border-zinc-200 text-zinc-600'}`}>
                <AnimatedCounter value={seriesCount} duration={1000} /> Séries
              </Badge>
            </div>
            <div>
              <span className="font-extrabold text-xs text-zinc-950 block">2. Séries & Animes</span>
              <span className="text-[10px] text-zinc-500 block">Grid Proporcional</span>
            </div>
          </button>

          <button
            onClick={() => setActiveModule('coupons')}
            className={`min-w-[140px] sm:min-w-0 flex-1 p-2.5 sm:p-3 rounded-xl border text-left transition-colors flex flex-col gap-1 sm:gap-1.5 flex-shrink-0 sm:flex-shrink ${
              activeModule === 'coupons'
                ? 'bg-amber-50/80 border-amber-500 shadow-xs'
                : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-950 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-1.5 rounded-lg ${activeModule === 'coupons' ? 'bg-amber-500 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                <Tag className="h-3.5 w-3.5" />
              </div>
              <Badge variant="outline" className={`text-[9px] uppercase font-extrabold ${activeModule === 'coupons' ? 'border-amber-300 text-amber-800 bg-amber-100/60' : 'border-zinc-200 text-zinc-600'}`}>
                Descontos
              </Badge>
            </div>
            <div>
              <span className="font-extrabold text-xs text-zinc-950 block">3. Cupons</span>
              <span className="text-[10px] text-zinc-500 block">Gerenciador de Cupons</span>
            </div>
          </button>

          <button
            onClick={() => setActiveModule('marketing')}
            className={`min-w-[140px] sm:min-w-0 flex-1 p-2.5 sm:p-3 rounded-xl border text-left transition-colors flex flex-col gap-1 sm:gap-1.5 flex-shrink-0 sm:flex-shrink ${
              activeModule === 'marketing'
                ? 'bg-pink-50/80 border-pink-500 shadow-xs'
                : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-950 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-1.5 rounded-lg ${activeModule === 'marketing' ? 'bg-pink-500 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <Badge variant="outline" className={`text-[9px] uppercase font-extrabold ${activeModule === 'marketing' ? 'border-pink-300 text-pink-800 bg-pink-100/60' : 'border-zinc-200 text-zinc-600'}`}>
                Anúncios
              </Badge>
            </div>
            <div>
              <span className="font-extrabold text-xs text-zinc-950 block">4. Pop-up & E-mails</span>
              <span className="text-[10px] text-zinc-500 block">Avisos e Newsletter</span>
            </div>
          </button>

          <button
            onClick={() => setActiveModule('settings')}
            className={`min-w-[140px] sm:min-w-0 flex-1 p-2.5 sm:p-3 rounded-xl border text-left transition-colors flex flex-col gap-1 sm:gap-1.5 flex-shrink-0 sm:flex-shrink ${
              activeModule === 'settings'
                ? 'bg-indigo-50/80 border-indigo-500 shadow-xs'
                : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-950 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-1.5 rounded-lg ${activeModule === 'settings' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                <Settings2 className="h-3.5 w-3.5" />
              </div>
              <Badge variant="outline" className={`text-[9px] uppercase font-extrabold ${activeModule === 'settings' ? 'border-indigo-300 text-indigo-800 bg-indigo-100/60' : 'border-zinc-200 text-zinc-600'}`}>
                Sistema
              </Badge>
            </div>
            <div>
              <span className="font-extrabold text-xs text-zinc-950 block">5. Configurações</span>
              <span className="text-[10px] text-zinc-500 block">Suporte e Sistema</span>
            </div>
          </button>
        </div>

        {/* CONTEÚDO DOS MÓDULOS UNIFICADOS */}

        {/* MÓDULO 1: VENDAS & PIX */}
        {activeModule === 'sales' && (
          <div className="space-y-6 animate-in fade-in-70 slide-in-from-bottom-2 duration-300 ease-out fill-mode-both">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 shadow-xs">
              <HelpCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="text-xs leading-relaxed">
                <strong>Guia Didático:</strong> Acompanhe o faturamento total em tempo real e consulte a lista completa de transações realizadas por PIX com opção de reenvio de e-mail.
              </p>
            </div>

            <Tabs defaultValue="pix_list" className="w-full">
              <TabsList className="bg-white border border-zinc-200 p-1.5 rounded-2xl mb-4 flex-wrap shadow-xs">
                <TabsTrigger value="pix_list" className="gap-2 text-xs font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-white border border-transparent">
                  <FileText className="h-3.5 w-3.5" /> Lista de Vendas PIX
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="gap-2 text-xs font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-white border border-transparent">
                  <BarChart3 className="h-3.5 w-3.5" /> Dashboard de Faturamento
                </TabsTrigger>
                <TabsTrigger value="metaads" className="gap-2 text-xs font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-white border border-transparent">
                  <Target className="h-3.5 w-3.5" /> ROI Meta Ads
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pix_list">
                <AdminSales embedded={true} />
              </TabsContent>
              <TabsContent value="dashboard">
                <AdminDashboard />
              </TabsContent>
              <TabsContent value="metaads">
                <MetaAdsDashboard />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* MÓDULO 2: CATÁLOGO DE SÉRIES & ANIMES (GRID PROPORCIONAL) */}
        {activeModule === 'catalog' && (
          <div className="space-y-6 animate-in fade-in-70 slide-in-from-bottom-2 duration-300 ease-out fill-mode-both">
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 flex items-center gap-3 shadow-xs">
              <HelpCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <p className="text-xs leading-relaxed">
                <strong>Guia Didático:</strong> Gerencie o catálogo de séries e animes em uma grade proporcional perfeitamente ajustada para Celulares e Computadores.
              </p>
            </div>

            <Tabs defaultValue="series_catalog" className="w-full">
              <TabsList className="bg-white border border-zinc-200 p-1.5 rounded-2xl mb-4 flex-wrap shadow-xs">
                <TabsTrigger value="series_catalog" className="gap-2 text-xs font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white border border-transparent">
                  <Film className="h-3.5 w-3.5" /> Catálogo Séries ({seriesCount})
                </TabsTrigger>
                <TabsTrigger value="featured" className="gap-2 text-xs font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white border border-transparent">
                  <Star className="h-3.5 w-3.5 text-amber-300" /> Destaques ({featuredCount})
                </TabsTrigger>
                <TabsTrigger value="animes" className="gap-2 text-xs font-bold data-[state=active]:bg-teal-600 data-[state=active]:text-white border border-transparent">
                  <Sparkles className="h-3.5 w-3.5 text-teal-200" /> Animes
                </TabsTrigger>
                <TabsTrigger value="categories" className="gap-2 text-xs font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white border border-transparent">
                  <Tags className="h-3.5 w-3.5" /> Categorias
                </TabsTrigger>
              </TabsList>

              <TabsContent value="series_catalog">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Pesquisar série por título ou gênero..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs"
                  />
                </div>

                {seriesLoading ? (
                  <AdminCatalogSkeleton count={6} />
                ) : series && series.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {series
                      .filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.genre.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((s) => (
                        <Card key={s.id} className="overflow-hidden border border-zinc-200/90 bg-white hover:border-zinc-300 transition-all hover:shadow-md flex flex-col justify-between">
                          <CardContent className="p-4 flex flex-col h-full justify-between gap-4">
                            <div className="flex gap-4 items-start">
                              <img
                                src={s.image_url}
                                alt={s.title}
                                className="w-16 h-24 object-cover rounded-xl border border-zinc-200 shadow-xs flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-zinc-700 bg-zinc-100 border-zinc-200">
                                    {s.audio_type || 'Dublado'}
                                  </Badge>
                                  {s.featured && (
                                    <Badge className="text-[9px] bg-amber-500 text-white font-bold border-none">
                                      Destaque
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="font-black text-sm text-zinc-950 line-clamp-1">{s.title}</h3>
                                <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{s.genre || 'Sem categoria'}</p>
                                <p className="text-xs font-extrabold text-emerald-600 mt-1">{formatCurrencyBRL(s.price)}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-zinc-100 mt-auto">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleConvert(s.id, s.title)}
                                className="h-8 px-2 text-[11px] border-teal-200 text-teal-700 hover:bg-teal-50 font-bold gap-1"
                              >
                                <Wand2 className="h-3 w-3" /> Anime
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(s)} className="h-8 px-2.5 text-xs border-zinc-200 gap-1 hover:bg-zinc-100 text-zinc-700">
                                <Edit className="h-3 w-3" /> Editar
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(s.id)} className="h-8 px-2 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-zinc-200 rounded-2xl bg-white shadow-xs">
                    <p className="text-zinc-500 mb-4 text-sm">Nenhuma série cadastrada no catálogo.</p>
                    <Button onClick={() => setIsDialogOpen(true)} className="gap-2 bg-zinc-950 text-white hover:bg-[#E31C25] font-bold">
                      <Plus className="h-4 w-4" /> Cadastrar Primeira Série
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="featured" className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      placeholder="Pesquisar série para destacar por título ou gênero..."
                      value={featuredSearchQuery}
                      onChange={(e) => setFeaturedSearchQuery(e.target.value)}
                      className="pl-9 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-200 font-bold px-2.5 py-1">
                      <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                      {featuredCount} em destaque
                    </Badge>
                  </div>
                </div>

                {seriesLoading ? (
                  <AdminCatalogSkeleton count={6} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {series && series
                      .filter((s) =>
                        s.title.toLowerCase().includes(featuredSearchQuery.toLowerCase()) ||
                        (s.genre || '').toLowerCase().includes(featuredSearchQuery.toLowerCase())
                      )
                      .map((s) => (
                    <Card key={s.id} className={`transition-all border ${s.featured ? 'bg-amber-50/70 border-amber-300 shadow-xs' : 'bg-white border-zinc-200 hover:border-zinc-300'}`}>
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={s.image_url} alt={s.title} className="w-12 h-16 object-cover rounded-lg border border-zinc-200 flex-shrink-0" />
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-zinc-950 truncate">{s.title}</h4>
                            <p className="text-[11px] text-zinc-500 truncate">{s.genre || 'Geral'}</p>
                            <p className="text-xs text-emerald-600 font-semibold">{formatCurrencyBRL(s.price)}</p>
                          </div>
                        </div>
                        <Button
                          variant={s.featured ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateSeries.mutate({ id: s.id, featured: !s.featured })}
                          className={s.featured ? 'bg-amber-500 text-white hover:bg-amber-600 font-bold text-xs shadow-xs' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-xs'}
                        >
                          <Star className={`h-3.5 w-3.5 mr-1 ${s.featured ? 'fill-white' : ''}`} />
                          {s.featured ? 'Destaque' : 'Ativar'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                )}
              </TabsContent>

              <TabsContent value="animes">
                <AdminAnimeManager />
              </TabsContent>

              <TabsContent value="categories">
                <AdminCategoryManager />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* MÓDULO 3: CUPONS DE DESCONTO */}
        {activeModule === 'coupons' && (
          <div className="space-y-6 animate-in fade-in-70 slide-in-from-bottom-2 duration-300 ease-out fill-mode-both">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 shadow-xs">
              <HelpCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-xs leading-relaxed">
                <strong>Guia Didático:</strong> Crie cupons promocionais com porcentagem de desconto ou valor fixo em reais para impulsionar suas campanhas de vendas.
              </p>
            </div>

            <AdminCoupons embedded={true} />
          </div>
        )}

        {/* MÓDULO 4: POP-UP, MARKETING & E-MAILS */}
        {activeModule === 'marketing' && (
          <div className="space-y-6 animate-in fade-in-70 slide-in-from-bottom-2 duration-300 ease-out fill-mode-both">
            <div className="p-4 rounded-2xl bg-pink-50 border border-pink-200 text-pink-900 flex items-center gap-3 shadow-xs">
              <HelpCircle className="h-5 w-5 text-pink-600 flex-shrink-0" />
              <p className="text-xs leading-relaxed">
                <strong>Guia Didático:</strong> Configure o pop-up dinâmico de avisos da loja, envie e-mails para seus clientes inscritos na Newsletter e configure o Pixel do Meta Ads.
              </p>
            </div>

            <Tabs defaultValue="popup_marketing" className="w-full">
              <TabsList className="bg-white border border-zinc-200 p-1.5 rounded-2xl mb-4 flex-wrap shadow-xs">
                <TabsTrigger value="popup_marketing" className="gap-2 text-xs font-bold data-[state=active]:bg-pink-600 data-[state=active]:text-white border border-transparent">
                  <Sparkles className="h-3.5 w-3.5" /> Pop-up do Site & Pixel Meta
                </TabsTrigger>
                {!isRayane && (
                  <TabsTrigger value="newsletter" className="gap-2 text-xs font-bold data-[state=active]:bg-pink-600 data-[state=active]:text-white border border-transparent">
                    <Mail className="h-3.5 w-3.5" /> Disparo de Newsletter
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="popup_marketing">
                <AdminMarketingSettings />
              </TabsContent>

              {!isRayane && (
                <TabsContent value="newsletter">
                  <AdminNewsletterPanel />
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}

        {/* MÓDULO 5: CONFIGURAÇÕES & SISTEMA */}
        {activeModule === 'settings' && (
          <div className="space-y-6 animate-in fade-in-70 slide-in-from-bottom-2 duration-300 ease-out fill-mode-both">
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center gap-3 shadow-xs">
              <HelpCircle className="h-5 w-5 text-indigo-600 flex-shrink-0" />
              <p className="text-xs leading-relaxed">
                <strong>Guia Didático:</strong> Atualize os canais de suporte (WhatsApp / Instagram), altere sua senha de acesso e controle os temas festivos.
              </p>
            </div>

            <Tabs defaultValue="contacts" className="w-full">
              <TabsList className="bg-white border border-zinc-200 p-1.5 rounded-2xl mb-4 flex-wrap shadow-xs">
                <TabsTrigger value="whatsapp_messages" className="gap-2 text-xs font-bold data-[state=active]:bg-emerald-600 data-[state=active]:text-white border border-transparent">
                  <MessageCircle className="h-3.5 w-3.5" /> Mensagens WhatsApp (Gateway)
                </TabsTrigger>
                <TabsTrigger value="contacts" className="gap-2 text-xs font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white border border-transparent">
                  <Settings2 className="h-3.5 w-3.5" /> Canais de Suporte
                </TabsTrigger>
                <TabsTrigger value="password" className="gap-2 text-xs font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white border border-transparent">
                  <KeyRound className="h-3.5 w-3.5" /> Alterar Senha
                </TabsTrigger>
                {!isRayane && (
                  <TabsTrigger value="maintenance" className="gap-2 text-xs font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white border border-transparent">
                    <Wrench className="h-3.5 w-3.5" /> Modo Manutenção
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="whatsapp_messages">
                <AdminWhatsAppMessageSettings />
              </TabsContent>

              <TabsContent value="contacts">
                <AdminContactSettings />
              </TabsContent>

              <TabsContent value="password">
                <AdminPasswordChange />
              </TabsContent>

              {!isRayane && (
                <TabsContent value="maintenance">
                  <AdminMaintenanceSettings />
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}

      </main>
    </div>
  );
}
