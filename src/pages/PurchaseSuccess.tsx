import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Copy, Loader2, ExternalLink, Mail, Calendar, Sparkles, Play, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { trackPixel } from "@/hooks/useMetaPixel";
import { optimizedImage } from "@/lib/image";
import { wa } from "@/lib/whatsapp.client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { DEFAULT_SALES_TEMPLATE } from "@/components/AdminWhatsAppMessageSettings";
import { logWhatsAppDispatch } from "@/lib/whatsappLogs";

interface Purchase {
  id: string;
  series_id: string;
  access_link: string;
  access_token: string;
  purchased_at: string;
  series: {
    title: string;
    image: string;
    description: string;
  };
}

export default function PurchaseSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const orderToken = searchParams.get('token');
  const { data: settings } = useSiteSettings();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 10;
  const purchaseTracked = useRef(false);
  const waNotificationSent = useRef(false);
  const [waStatus, setWaStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const fetchPurchases = useCallback(async (): Promise<boolean> => {
    if (!orderId || !orderToken) {
      toast.error('Link de compra inválido');
      setLoading(false);
      return true; // stop retrying
    }

    try {
      // First, check how many orders exist for this token
      const { data: ordersData } = await supabase
        .rpc('get_order_by_token', { token: orderToken }) as { data: any[] | null; error: any };
      
      const expectedCount = ordersData ? new Set(ordersData.map((o: any) => o.series_id)).size : 0;

      const { data: purchasesData, error: purchasesError } = await supabase
        .rpc('get_purchases_by_order_token', { token: orderToken }) as {
          data: {
            id: string;
            user_id: string;
            order_id: string;
            series_id: string;
            access_link: string;
            access_token: string;
            purchased_at: string;
          }[] | null;
          error: any;
        };

      if (purchasesError) throw purchasesError;

      if (!purchasesData || purchasesData.length === 0) {
        return false; // not found yet, retry
      }

      // Check if all expected purchases are created
      const foundSeriesIds = new Set(purchasesData.map(p => p.series_id));
      if (expectedCount > 0 && foundSeriesIds.size < expectedCount) {
        console.log(`Aguardando todas as compras: ${foundSeriesIds.size}/${expectedCount}`);
        return false; // not all purchases created yet, retry
      }

      const seriesIds = [...new Set(purchasesData.map(p => p.series_id))];
      const { data: seriesData } = await supabase
        .from('series')
        .select('id, title, image, description')
        .in('id', seriesIds);

      const { data: animeData } = await supabase
        .from('animes')
        .select('id, title, image, description')
        .in('id', seriesIds);

      const allItemsData = [...(seriesData || []), ...(animeData || [])];

      const uniquePurchases = seriesIds.map(seriesId => {
        const purchase = purchasesData.find(p => p.series_id === seriesId);
        const itemInfo = allItemsData.find(s => s.id === seriesId);
        return {
          id: purchase!.id,
          series_id: purchase!.series_id,
          access_link: purchase!.access_link,
          access_token: purchase!.access_token || '',
          purchased_at: purchase!.purchased_at,
          series: itemInfo || {
            title: 'Conteúdo Adquirido',
            image: '',
            description: '',
          },
        };
      });

      setPurchases(uniquePurchases);
      setLoading(false);
      toast.success(`${uniquePurchases.length} série(s) adquirida(s) com sucesso!`);

      // Salvar IDs comprados no localStorage para controle de avaliação
      try {
        const localPurchases = JSON.parse(localStorage.getItem('moments-purchases') || '[]');
        let changed = false;
        uniquePurchases.forEach(p => {
          if (!localPurchases.includes(p.series_id)) {
            localPurchases.push(p.series_id);
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem('moments-purchases', JSON.stringify(localPurchases));
          window.dispatchEvent(new Event('purchases-changed'));
        }
      } catch (err) {
        console.error("Erro ao salvar compras locais", err);
      }

      // Fire Meta Pixel Purchase event (once)
      if (!purchaseTracked.current && ordersData && ordersData.length > 0) {
        purchaseTracked.current = true;
        const totalValue = ordersData.reduce(
          (sum: number, o: any) => sum + Number(o.total_amount || 0),
          0,
        );
        trackPixel('Purchase', {
          content_ids: uniquePurchases.map((p) => p.series_id),
          content_type: 'product',
          value: Number(totalValue.toFixed(2)),
          currency: 'BRL',
          num_items: uniquePurchases.length,
        });
      }

      // Disparo Automático via WhatsApp Gateway (PixelLoom / WA-AKG) com o link da série
      // BLOQUEADO POR PADRÃO: Só dispara se o administrador ativar expressamente nas configurações
      const isAutoDispatchAllowed = settings?.whatsapp_auto_dispatch_enabled === 'true';

      if (!waNotificationSent.current && ordersData && ordersData.length > 0) {
        waNotificationSent.current = true;

        if (!isAutoDispatchAllowed) {
          console.log("[WhatsApp Dispatch] Disparo automático desativado pelo administrador. Nenhuma mensagem enviada sem permissão.");
          setWaStatus("idle");
          return;
        }

        setWaStatus("sending");

        const primaryOrder = ordersData[0];
        // Recuperar telefone e nome do pedido ou do cache do checkout
        const savedData = (() => {
          try {
            const raw = localStorage.getItem("checkout_customer_data");
            return raw ? JSON.parse(raw) : {};
          } catch {
            return {};
          }
        })();

        const customerPhone =
          primaryOrder.customer_phone ||
          savedData.phone ||
          primaryOrder.phone ||
          "";

        const customerName =
          primaryOrder.customer_name ||
          savedData.name ||
          "Cliente";

        const totalValue = ordersData.reduce(
          (sum: number, o: any) => sum + Number(o.total_amount || 0),
          0
        );

        const cleanPhone = (customerPhone || "").replace(/\D/g, "");

        if (cleanPhone && cleanPhone.length >= 10) {
          // Montar lista de títulos e links diretos
          const itemsList = uniquePurchases.map(
            (p) => `${p.series.title}: ${p.access_link}`
          );

          // Link de acesso principal ou link da página de sucesso
          const mainAccessLink =
            uniquePurchases[0]?.access_link ||
            window.location.href;

          // Template configurado no painel administrativo ou padrão
          const templateRaw =
            settings?.whatsapp_sales_template || DEFAULT_SALES_TEMPLATE;

          const formattedMessage = templateRaw
            .replace(/{nome}/g, customerName)
            .replace(/{pedido}/g, String(orderId || primaryOrder.id || ''))
            .replace(/{valor}/g, totalValue.toFixed(2).replace('.', ','))
            .replace(/{itens}/g, uniquePurchases.map((p) => p.series.title).join(', '))
            .replace(/{link}/g, mainAccessLink);

          console.log("[WhatsApp Dispatch] Disparando notificação de venda para:", cleanPhone);

          wa.notify({
            event: "PAYMENT_APPROVED",
            customerName,
            customerPhone: cleanPhone,
            orderId: orderId || primaryOrder.id,
            totalAmount: Number(totalValue.toFixed(2)),
            items: itemsList,
            trackingUrl: mainAccessLink,
            customMessage: formattedMessage,
            labels: ["Já Comprou", "Cliente Ativo", "Moments Séries"]
          }).then((res) => {
            console.log("[WhatsApp Dispatch Result]:", res);
            if (res.success) {
              setWaStatus("sent");
              logWhatsAppDispatch({
                orderId: String(orderId || primaryOrder.id),
                customerName,
                customerPhone: cleanPhone,
                status: "sent",
                sentAt: new Date().toISOString(),
                messageId: res.data?.messageKeyId || res.data?.id,
                items: uniquePurchases.map((p) => p.series.title).join(", ")
              });
              toast.success("Link da série encaminhado para o seu WhatsApp!");
            } else {
              setWaStatus("error");
              logWhatsAppDispatch({
                orderId: String(orderId || primaryOrder.id),
                customerName,
                customerPhone: cleanPhone,
                status: "error",
                sentAt: new Date().toISOString(),
                errorMessage: res.error || "Falha na resposta do Gateway",
                items: uniquePurchases.map((p) => p.series.title).join(", ")
              });
              console.warn("[WhatsApp Notification Warning]:", res.error);
            }
          }).catch((err) => {
            setWaStatus("error");
            logWhatsAppDispatch({
              orderId: String(orderId || primaryOrder.id),
              customerName,
              customerPhone: cleanPhone,
              status: "error",
              sentAt: new Date().toISOString(),
              errorMessage: err?.message || "Exceção de rede / timeout",
              items: uniquePurchases.map((p) => p.series.title).join(", ")
            });
            console.error("[WhatsApp Notification Error]:", err);
          });
        } else {
          console.warn("[WhatsApp Dispatch Warning] Telefone não encontrado ou inválido:", customerPhone);
        }
      }

      return true; // found, stop retrying
    } catch (error) {
      console.error('Erro ao buscar compras:', error);
      return false; // error, retry
    }
  }, [orderId, orderToken]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const attemptFetch = async () => {
      const found = await fetchPurchases();
      if (found || cancelled) {
        if (!found) setLoading(false);
        return;
      }

      setRetryCount(prev => {
        const next = prev + 1;
        if (next >= MAX_RETRIES) {
          setLoading(false);
          toast.error('Não foi possível encontrar suas compras. O pagamento pode ainda estar sendo processado.');
          return next;
        }
        // Retry with increasing delay (2s, 2s, 3s, 3s, 4s...)
        const delay = Math.min(2000 + Math.floor(next / 2) * 1000, 5000);
        timeoutId = setTimeout(attemptFetch, delay);
        return next;
      });
    };

    attemptFetch();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [fetchPurchases]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <p className="text-base font-bold text-white mb-2">Processando Liberação do Acesso...</p>
          <p className="text-xs text-muted-foreground max-w-md">
            {retryCount > 0
              ? `Confirmando recebimento do PIX junto ao banco (tentativa ${retryCount}/${MAX_RETRIES})...`
              : 'Preparando seus links exclusivos de streaming...'}
          </p>
          <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mt-4">
            <div className="w-full h-full bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-4xl font-bold mb-4">Aguardando confirmação</h1>
          <p className="text-muted-foreground mb-8">
            Seu pagamento está sendo processado. Pode levar alguns instantes para a confirmação.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => {
              setLoading(true);
              setRetryCount(0);
            }}>
              Verificar novamente
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>Voltar ao catálogo</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="app-container py-20 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full mb-6 ring-4 ring-emerald-500/30 animate-in zoom-in duration-500">
              <CheckCircle className="h-10 w-10 text-emerald-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mb-2 text-white">Pagamento Confirmado com Sucesso!</h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Parabéns! {purchases.length > 1 ? `Seus ${purchases.length} títulos estão` : 'Seu conteúdo está'} liberado com acesso vitalício para você assistir agora.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3">
              <span className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-medium">
                <Mail className="w-3.5 h-3.5 text-purple-300" />
                Links enviados para o seu e-mail cadastrado
              </span>
              <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-medium">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                {waStatus === "sending"
                  ? "Encaminhando link para seu WhatsApp..."
                  : waStatus === "sent"
                  ? "Link da série enviado para o seu WhatsApp!"
                  : "Link da série encaminhado via WhatsApp"}
              </span>
            </div>
          </div>

          <div className="grid gap-6 mb-8">
            {purchases.map((purchase, index) => (
              <Card 
                key={purchase.id} 
                className="overflow-hidden hover:shadow-2xl transition-all duration-300 bg-[#0c0e17]/95 border-white/15 backdrop-blur-xl rounded-2xl animate-in fade-in slide-in-from-bottom" 
                style={{ animationDelay: `${index * 150}ms`, animationDuration: '600ms' }}
              >
                <div className="flex flex-col md:flex-row gap-6 p-6">
                  <div className="relative group shrink-0">
                    <img
                      src={purchase.series.image ? optimizedImage(purchase.series.image, { width: 360, quality: 75 }) : ''}
                      alt={purchase.series.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full md:w-44 h-64 object-cover rounded-xl shadow-lg ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Acesso Vitalício Liberado
                        </span>
                      </div>
                      <h2 className="text-2xl font-black mb-2 text-white">
                        {purchase.series.title}
                      </h2>
                      <p className="text-slate-300 text-xs sm:text-sm mb-4 line-clamp-2 leading-relaxed">
                        {purchase.series.description || "Acesso completo a todos os episódios em alta definição."}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                        <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Adquirido em {new Date(purchase.purchased_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Button
                        onClick={() => window.open(purchase.access_link, '_blank')}
                        className="gap-2 w-full md:w-auto h-12 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all duration-300 hover:scale-[1.02]"
                        size="lg"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Assistir Agora no Navegador
                      </Button>

                      {/* Guia de Reprodução */}
                      <div className="rounded-xl border border-purple-500/30 bg-purple-900/15 p-4 text-xs leading-relaxed text-slate-200 space-y-1.5">
                        <p className="font-bold text-purple-300 flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          Dica de Reprodução Instantânea:
                        </p>
                        <p>1. Clique no botão verde <strong>"Assistir Agora no Navegador"</strong> acima.</p>
                        <p>2. Ao carregar a página, se aparecer aviso de app, selecione <strong>"Continuar no Navegador"</strong>.</p>
                        <p>3. Dê o <strong>Play</strong> e aproveite todos os episódios!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Adendo: canais de entrega (WhatsApp + E-mail) */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <Card className="border-emerald-500/20 bg-emerald-950/15 p-6 rounded-2xl animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: '300ms' }}>
              <h3 className="font-bold text-sm sm:text-base mb-2 flex items-center gap-2 text-white">
                <MessageCircle className="w-4 h-4 text-emerald-400" /> Acesso Enviado no WhatsApp
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Encaminhamos uma mensagem automática com o link exclusivo direto para o seu WhatsApp cadastrado. Basta abrir a conversa e dar o play!
              </p>
            </Card>

            <Card className="border-purple-500/20 bg-purple-950/15 p-6 rounded-2xl animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: '350ms' }}>
              <h3 className="font-bold text-sm sm:text-base mb-2 flex items-center gap-2 text-white">
                <Mail className="w-4 h-4 text-purple-400" /> Acesso Permanente no E-mail
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Você também recebeu o link permanente no seu e-mail cadastrado. Guarde a mensagem para poder reassistir quando e onde quiser.
              </p>
            </Card>
          </div>

          <div className="flex justify-center animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: '400ms' }}>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              size="lg"
              className="gap-2 hover:scale-105 transition-transform duration-300"
            >
              Voltar ao Catálogo
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
