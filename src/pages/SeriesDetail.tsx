import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Tv, 
  Calendar, 
  Volume2, 
  Play, 
  ShieldCheck, 
  Sparkles, 
  Film, 
  CheckCircle2, 
  Clock, 
  Layers 
} from "lucide-react";
import { useSeriesById } from "@/hooks/useSeries";
import { useAnimeById } from "@/hooks/useAnimes";
import { useSeriesView } from "@/hooks/useSeriesView";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { StarRating } from "@/components/StarRating";
import { useSeriesRatings, useRateSeries, useHasPurchasedSeries } from "@/hooks/useSeriesRatings";
import { optimizedImage } from "@/lib/image";
import placeholderImage from "@/assets/series-1.jpg";

export default function SeriesDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const seriesQuery = useSeriesById(id || '');
  const animeQuery = useAnimeById(id || '');

  const series = seriesQuery.data || animeQuery.data;
  const isLoading = seriesQuery.isLoading && animeQuery.isLoading;

  const addItem = useCart((s) => s.addItem);
  const baseRating = typeof series?.rating === 'number' && series.rating > 0 ? series.rating : 4.9;
  const { data: ratingStats } = useSeriesRatings(id, baseRating);
  const rateMutation = useRateSeries(id || '');
  const { data: hasPurchased } = useHasPurchasedSeries(id);
  useSeriesView(id);

  const handleAddToCart = () => {
    if (!series) return;
    addItem(series);
    toast.success("Adicionado ao carrinho!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-white">
        <Navbar />
        <div className="app-container py-40 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
            <Film className="h-8 w-8 text-purple-400" />
          </div>
          <div className="text-base font-bold text-white mb-2">Carregando Detalhes da Série...</div>
          <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
            <div className="w-full h-full bg-purple-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="app-container py-40 text-center">
          <h1 className="text-3xl font-black mb-3 text-white">Produção não encontrada</h1>
          <p className="text-sm text-muted-foreground mb-6">O título que você está buscando pode ter sido movido ou indisponibilizado.</p>
          <Button onClick={() => navigate('/')} className="rounded-full">Voltar para o catálogo</Button>
        </div>
      </div>
    );
  }

  const seasonsCount = (series as any).seasons || 1;
  const episodesCount = (series as any).episodes || 12;

  return (
    <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/20">
      <Navbar />

      {/* Espaçamento amplo e dinâmico de topo para nunca colidir com a Navbar em mobile ou desktop */}
      <main className="relative pt-24 sm:pt-28 md:pt-32 lg:pt-36 pb-20">
        {/* Background poster com desfoque cinematográfico suave */}
        <div className="absolute inset-0 overflow-hidden h-[65vh] pointer-events-none select-none" style={{ zIndex: 0 }}>
          <img 
            src={series.image_url ? optimizedImage(series.image_url, { width: 1200, quality: 50 }) : placeholderImage} 
            alt="" 
            className="w-full h-full object-cover blur-3xl opacity-20 scale-105"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/80 to-background" />
        </div>

        {/* Conteúdo Principal Estruturado */}
        <div className="relative" style={{ zIndex: 2 }}>
          <div className="app-container">
            {/* Botão Voltar ao Catálogo */}
            <div className="mb-6">
              <button 
                type="button"
                onClick={() => navigate('/')} 
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/10 hover:border-white/20 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Voltar ao Catálogo</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[340px_1fr] gap-8 md:gap-12 items-start">
              {/* Coluna da Imagem (Pôster Vertical Cinematográfico) */}
              <div className="w-full max-w-[320px] mx-auto md:mx-0">
                <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.7)] border border-white/[0.08] bg-card/25 backdrop-blur-2xl ring-1 ring-white/10 animate-in fade-in duration-500">
                  <img 
                    src={series.image_url ? optimizedImage(series.image_url, { width: 680, quality: 80 }) : placeholderImage} 
                    alt={series.title} 
                    fetchPriority="high"
                    decoding="async"
                    className="w-full h-full object-cover transition-all duration-700 hover:scale-[1.03]"
                  />
                </div>

                {/* Card de Informações Técnicas Resumidas abaixo do pôster */}
                <div className="mt-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs space-y-2">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Acesso</span>
                    <span className="font-semibold text-white">Vitalício</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-purple-400" /> Qualidade</span>
                    <span className="font-semibold text-white">4K Ultra HD</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5 text-amber-400" /> Áudio</span>
                    <span className="font-semibold text-white capitalize">{series.audio_type || 'Dublado'}</span>
                  </div>
                </div>
              </div>

              {/* Coluna de Informações e Menu de Abas */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge className="bg-primary/20 text-primary border-primary/30 font-semibold px-2.5 py-0.5">
                    {series.genre || 'Produção'}
                  </Badge>
                  {series.featured && (
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 font-semibold px-2.5 py-0.5">
                      Destaque Moments
                    </Badge>
                  )}
                  {hasPurchased && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-semibold px-2.5 py-0.5">
                      ✓ Você Possui Este Título
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight bg-gradient-to-br from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  {series.title}
                </h1>
                
                {/* Metadados rápidos */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 text-xs sm:text-sm">
                  <StarRating
                    rating={ratingStats?.average ?? baseRating}
                    readonly
                    size="sm"
                    showValue
                    count={ratingStats?.count}
                  />
                  {series.year > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{series.year}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Tv className="w-4 h-4" />
                    <span>{seasonsCount} {seasonsCount === 1 ? 'Temporada' : 'Temporadas'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Film className="w-4 h-4" />
                    <span>{episodesCount} Episódios</span>
                  </div>
                </div>

                {/* Botões de Ação Imediata */}
                <div className="flex flex-wrap items-center gap-3 mb-8 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <Button 
                    size="lg" 
                    onClick={() => navigate(`/checkout/${series.id}`)} 
                    className="flex-1 sm:flex-initial shadow-button hover:shadow-glow glow-btn-premium bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-400 text-slate-950 font-black border border-yellow-300/30 px-8"
                  >
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Comprar Agora R$ {(Number(series.price) || 0).toFixed(2)}
                  </Button>
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    onClick={handleAddToCart} 
                    className="gap-2 font-semibold"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Adicionar ao Carrinho
                  </Button>
                </div>

                {/* Menu de Abas Contextual */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide h-11 p-1 bg-white/[0.04] border border-white/10 rounded-xl mb-6">
                    <TabsTrigger value="overview" className="gap-2 text-xs font-semibold px-4 py-2">
                      <Film className="w-3.5 h-3.5" />
                      Visão Geral
                    </TabsTrigger>
                    <TabsTrigger value="episodes" className="gap-2 text-xs font-semibold px-4 py-2">
                      <Layers className="w-3.5 h-3.5" />
                      Episódios & Acesso
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="gap-2 text-xs font-semibold px-4 py-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Avaliações ({ratingStats?.count || 28})
                    </TabsTrigger>
                  </TabsList>

                  {/* Aba 1: Visão Geral */}
                  <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
                    <div className="p-5 rounded-2xl bg-card/40 border border-white/[0.06] backdrop-blur-xl">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Sinopse</h3>
                      <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                        {series.long_description || series.description || "Acompanhe todos os capítulos em ordem cronológica com imagem em alta resolução e áudio cristalino. Uma história envolvente feita para os fãs mais exigentes de streaming de qualidade."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <span className="text-[11px] text-muted-foreground block mb-1">Liberação</span>
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Imediata via PIX
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <span className="text-[11px] text-muted-foreground block mb-1">Duração Total</span>
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-purple-400" /> Temporada Completa
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <span className="text-[11px] text-muted-foreground block mb-1">Dispositivos</span>
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Tv className="w-3.5 h-3.5 text-amber-400" /> Celular, PC e Smart TV
                        </span>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Aba 2: Episódios & Acesso */}
                  <TabsContent value="episodes" className="space-y-4 focus-visible:outline-none">
                    <div className="p-5 rounded-2xl bg-card/40 border border-white/[0.06] backdrop-blur-xl">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-white">Conteúdo do Pacote Vitalício</h3>
                          <p className="text-xs text-muted-foreground">Todos os episódios completos sem cortes e sem assinaturas recorrentes.</p>
                        </div>
                        <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
                          {episodesCount} Episódios Disponíveis
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {Array.from({ length: Math.min(episodesCount, 6) }).map((_, i) => (
                          <div 
                            key={i} 
                            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-slate-300">
                                {i + 1}
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-white block">Episódio {i + 1}</span>
                                <span className="text-[10px] text-muted-foreground">Áudio Original / Dublado · 1080p HD</span>
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-400">
                              {hasPurchased ? "Assistir" : "Liberado na Compra"}
                            </span>
                          </div>
                        ))}
                        {episodesCount > 6 && (
                          <div className="text-center py-2 text-xs text-muted-foreground">
                            + {episodesCount - 6} episódios adicionais inclusos no acesso vitalício
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Aba 3: Avaliações */}
                  <TabsContent value="reviews" className="space-y-4 focus-visible:outline-none">
                    <div className="p-5 rounded-2xl bg-card/40 border border-white/[0.06] backdrop-blur-xl">
                      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                        <div>
                          <div className="text-xs font-semibold mb-1 flex items-center gap-2 text-white">
                            <span>Avaliação dos Espectadores</span>
                            {ratingStats?.userRating ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full shadow-sm">
                                ⭐ Sua Nota: {ratingStats.userRating}/5
                              </span>
                            ) : null}
                            {hasPurchased && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                Comprador Verificado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {ratingStats?.userRating
                              ? `Sua avaliação foi registrada! Você pode tocar em outra estrela se desejar alterar.`
                              : `Toque nas estrelas abaixo para deixar sua avaliação para este título.`}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <StarRating
                            rating={ratingStats?.userRating ?? 0}
                            onRatingChange={(r) => rateMutation.mutate(r)}
                            size="lg"
                            interactive
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-black text-amber-400">{ratingStats?.average.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground ml-1.5">de 5.0</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-white block">{ratingStats?.count} avaliações</span>
                          <span className="text-[10px] text-muted-foreground">Base ponderada da comunidade</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
