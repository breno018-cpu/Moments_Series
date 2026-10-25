import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle, Copy, Clock, Zap, ArrowLeft, QrCode, CheckCircle2, Lock, Smartphone, ShieldCheck } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";

interface OrderData {
  id: string;
  payment_status: string;
  pix_qr_code: string | null;
  pix_qr_code_base64: string | null;
  total_amount: number;
  series_id: string;
  customer_name: string;
  created_at: string;
  mp_payment_id: string | null;
}

interface SeriesData {
  title: string;
  image: string;
}

interface OrderWithSeries {
  order: OrderData;
  series: SeriesData;
  quantity: number;
}

export default function PixPayment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderToken = searchParams.get('token');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [allOrders, setAllOrders] = useState<OrderWithSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPixCode = () => {
    if (order?.pix_qr_code) {
      navigator.clipboard.writeText(order.pix_qr_code);
      setCopied(true);
      triggerHaptic('success');
      toast.success('Código PIX copiado com sucesso! Cole no seu banco.');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const checkPaymentStatus = async () => {
    if (!orderId || !orderToken || isCheckingPayment) return;

    setIsCheckingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { orderId, orderToken }
      });

      if (error) throw error;

      if (data.status === 'completed') {
        toast.success('Pagamento confirmado! Redirecionando...');
        navigate(`/purchase-success?order_id=${orderId}&token=${orderToken}`);
      } else if (data.status === 'failed') {
        toast.error('Pagamento recusado. Tente novamente.');
      } else {
        toast.info('Aguardando confirmação do pagamento...');
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      toast.error('Erro ao verificar status. Tente novamente.');
    } finally {
      setIsCheckingPayment(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !orderToken) {
        toast.error('Link de pagamento inválido');
        setIsLoading(false);
        return;
      }

      try {
        // Buscar todos os pedidos usando o token seguro
        const { data: allOrderData, error: orderError } = await supabase
          .rpc('get_order_by_token', { token: orderToken });

        if (orderError) throw orderError;
        if (!allOrderData || allOrderData.length === 0) throw new Error('Pedido não encontrado');

        const primaryOrder = allOrderData[0] as OrderData;
        setOrder(primaryOrder);

        const samePayment = allOrderData as OrderData[];

        // Buscar TODAS as séries em UMA query usando .in() (antes era 1 query por item)
        const uniqueSeriesIds = Array.from(new Set(samePayment.map((o) => o.series_id)));
        const { data: seriesList } = await supabase
          .from('series')
          .select('id, title, image')
          .in('id', uniqueSeriesIds);

        const { data: animeList } = await supabase
          .from('animes')
          .select('id, title, image')
          .in('id', uniqueSeriesIds);

        const seriesById = new Map<string, SeriesData>();
        (seriesList || []).forEach((s: any) => {
          seriesById.set(s.id, { title: s.title, image: s.image });
        });
        (animeList || []).forEach((a: any) => {
          seriesById.set(a.id, { title: a.title, image: a.image });
        });

        const seriesMap = new Map<string, { order: OrderData; series: SeriesData; quantity: number }>();
        let total = 0;

        for (const ord of samePayment) {
          const series = seriesById.get(ord.series_id);
          if (!series) continue;
          const existing = seriesMap.get(ord.series_id);
          if (existing) {
            existing.quantity += 1;
          } else {
            seriesMap.set(ord.series_id, { order: ord, series, quantity: 1 });
          }
          total += Number(ord.total_amount);
        }

        setAllOrders(Array.from(seriesMap.values()));
        setTotalAmount(total);
      } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        toast.error('Erro ao carregar dados do pagamento');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();

    // Polling: 12s (antes 3s) — economia ~75% das chamadas ao backend.
    // Para após 20 min (100 tentativas) para não rodar eternamente em abas esquecidas.
    let attempts = 0;
    const MAX_ATTEMPTS = 100;
    const interval = setInterval(async () => {
      if (!orderId || !orderToken) return;
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        clearInterval(interval);
        return;
      }

      // Pausa polling quando a aba está em background
      if (document.hidden) return;

      const { data } = await supabase
        .rpc('get_order_by_token', { token: orderToken });

      const firstOrder = data?.[0];
      if (firstOrder?.payment_status === 'completed') {
        clearInterval(interval);
        toast.success('Pagamento confirmado!');
        navigate(`/purchase-success?order_id=${orderId}&token=${orderToken}`);
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [orderId, orderToken, navigate]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
            <QrCode className="h-8 w-8 text-emerald-400" />
          </div>
          <p className="text-base font-bold text-white mb-2">Carregando Dados do Pagamento PIX...</p>
          <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mt-3">
            <div className="w-full h-full bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!order || allOrders.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-4xl font-bold mb-4">Pedido não encontrado</h1>
          <Button onClick={() => navigate('/')}>Voltar para o catálogo</Button>
        </div>
      </div>
    );
  }

  if (order.payment_status === 'completed') {
    navigate(`/purchase-success?order_id=${orderId}&token=${orderToken}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="app-container py-16 sm:py-24 max-w-full overflow-x-hidden">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full mb-3 shadow-sm shadow-emerald-950/60">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] sm:text-xs font-black text-emerald-400 uppercase tracking-wider">Aguardando Pagamento PIX</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black mb-1.5 text-white tracking-tight">Finalize seu Pagamento</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              Escaneie o QR Code no app do seu banco ou copie a chave PIX. A liberação do seu acesso é 100% automática e instantânea.
            </p>
          </div>

          <Card className="p-4 sm:p-8 mb-5 sm:mb-6 bg-[#090a12]/95 border border-white/[0.09] backdrop-blur-3xl shadow-2xl rounded-2xl sm:rounded-[28px] relative overflow-hidden ring-1 ring-purple-500/20 max-w-full animate-in fade-in-80 slide-in-from-bottom-2 duration-500 fill-mode-both">
            {/* Glow Superior */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-gradient-to-r from-emerald-500/20 via-teal-500/25 to-purple-600/20 blur-3xl pointer-events-none overflow-hidden" />

            <div className="mb-5 sm:mb-6 relative z-10">
              <div className="text-center mb-4 pb-4 border-b border-white/[0.08]">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-400 font-bold block">Valor Total a Pagar</span>
                <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 mt-1 tracking-tight">
                  R$ {totalAmount.toFixed(2).replace('.', ',')}
                </h2>
              </div>
              
              <div className="space-y-2.5 mb-3">
                {allOrders.map((item) => (
                  <div key={item.order.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-xl min-w-0">
                    <img
                      src={item.series.image}
                      alt={item.series.title}
                      className="w-11 h-14 object-cover rounded-lg shadow-md ring-1 ring-white/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-white truncate">{item.series.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        R$ {Number(item.order.total_amount).toFixed(2).replace('.', ',')}
                        {item.quantity > 1 && ` × ${item.quantity}`}
                      </p>
                    </div>
                    <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 shrink-0">
                      Liberado na Hora
                    </span>
                  </div>
                ))}
              </div>

              {allOrders.length > 1 && (
                <p className="text-[11px] text-center text-slate-400 font-medium">
                  Total de {allOrders.reduce((sum, item) => sum + item.quantity, 0)} títulos no pedido
                </p>
              )}
            </div>

            {order.pix_qr_code_base64 && (
              <div className="flex flex-col items-center justify-center mb-5 relative z-10">
                <div className="relative group p-3 bg-white rounded-2xl shadow-[0_15px_45px_rgba(16,185,129,0.18)] ring-2 sm:ring-4 ring-emerald-500/25 transition-transform hover:scale-[1.01]">
                  {/* Viewfinder corners */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-md pointer-events-none" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-md pointer-events-none" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-md pointer-events-none" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-md pointer-events-none" />

                  <img
                    src={`data:image/png;base64,${order.pix_qr_code_base64}`}
                    alt="QR Code PIX"
                    className="w-44 h-44 sm:w-56 sm:h-56 max-w-full object-contain rounded-lg"
                  />
                </div>
                <span className="text-[11px] sm:text-xs text-slate-300 mt-2.5 font-medium flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  Aponte a câmera do aplicativo do seu banco
                </span>
              </div>
            )}

            {order.pix_qr_code && (
              <div className="space-y-2 min-w-0 w-full relative z-10">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 px-0.5">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    Código PIX Copia e Cola:
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">Toque para copiar</span>
                </div>

                <div 
                  onClick={copyPixCode}
                  className="w-full min-w-0 bg-black/40 hover:bg-black/60 border border-white/10 hover:border-emerald-500/40 p-2.5 rounded-xl cursor-pointer transition-all shadow-inner"
                >
                  <p className="font-mono text-[11px] text-slate-300 truncate select-all">
                    {order.pix_qr_code}
                  </p>
                </div>

                {/* Botão Padronizado Mobile (h-12, rounded-xl) */}
                <Button
                  type="button"
                  onClick={copyPixCode}
                  className={`w-full h-12 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    copied
                      ? "bg-emerald-600 text-white shadow-emerald-950/80 hover:bg-emerald-500"
                      : "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-black shadow-emerald-950/50 active:scale-[0.99]"
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Código PIX Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-black" />
                      <span>Copiar Código PIX (Copia e Cola)</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>

          {/* Botão Secundário Padronizado (h-12, rounded-xl) */}
          <div className="mb-5 sm:mb-6 animate-in fade-in-80 slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both">
            <Button 
              onClick={checkPaymentStatus}
              disabled={isCheckingPayment}
              variant="outline"
              className="w-full h-12 rounded-xl text-xs sm:text-sm font-semibold border border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.05] text-slate-200 cursor-pointer transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {isCheckingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 text-emerald-300 animate-spin" />
                  <span>Consultando compensação no banco...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-slate-400" />
                  <span>Já Fiz o Pagamento no Meu Banco</span>
                </>
              )}
            </Button>
          </div>

          <Card className="p-4 sm:p-7 bg-gradient-to-br from-purple-950/30 via-[#0b0c15] to-indigo-950/20 border border-purple-500/30 rounded-2xl sm:rounded-3xl shadow-xl animate-in fade-in-80 slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both max-w-full">
            <h3 className="font-black text-xs sm:text-base mb-3 flex items-center gap-2 text-white">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              Passo a Passo Rápido
            </h3>
            <ol className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">1</span>
                <span>Abra o aplicativo do seu banco ou carteira digital no celular</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">2</span>
                <span>Selecione <strong>"Pagar com PIX"</strong> (QR Code ou Copia e Cola)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">3</span>
                <span>Cole o código copiado acima ou aponte a câmera para o QR Code</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">4</span>
                <span>Confirme o valor e finalize. <strong>Seu acesso será liberado automaticamente!</strong></span>
              </li>
            </ol>
          </Card>

          <div className="mt-5 text-center space-y-2.5">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              <span>Esta tela é atualizada automaticamente assim que o banco confirma a transferência.</span>
            </p>
            <Button variant="ghost" onClick={() => navigate('/')} className="h-9 px-3 rounded-xl text-xs text-slate-400 hover:text-white gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar ao Catálogo de Séries</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Label({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={className} {...props}>{children}</label>;
}
