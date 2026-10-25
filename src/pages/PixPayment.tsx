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
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] border border-white/10 rounded-full mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-300">Pagamento via PIX</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Finalize pelo seu banco</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Escaneie o QR Code ou copie o código PIX. O acesso é liberado instantaneamente.
            </p>
          </div>

          <div className="bg-[#12131d] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
            {/* Valor */}
            <div className="text-center pb-4 border-b border-white/10">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Valor Total</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1 tracking-tight">
                R$ {totalAmount.toFixed(2).replace('.', ',')}
              </div>
            </div>

            {/* Itens do Pedido */}
            <div className="space-y-2">
              {allOrders.map((item) => (
                <div key={item.order.id} className="flex items-center gap-3 p-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl min-w-0">
                  <img
                    src={item.series.image}
                    alt={item.series.title}
                    className="w-10 h-14 object-cover rounded-lg shadow-sm ring-1 ring-white/10 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs sm:text-sm text-white truncate">{item.series.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      R$ {Number(item.order.total_amount).toFixed(2).replace('.', ',')}
                      {item.quantity > 1 && ` × ${item.quantity}`}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium shrink-0">
                    Acesso Imediato
                  </span>
                </div>
              ))}
            </div>

            {/* QR Code */}
            {order.pix_qr_code_base64 && (
              <div className="flex flex-col items-center justify-center py-2">
                <div className="p-3.5 bg-white rounded-2xl shadow-xl shadow-black/50">
                  <img
                    src={`data:image/png;base64,${order.pix_qr_code_base64}`}
                    alt="QR Code PIX"
                    className="w-44 h-44 sm:w-52 sm:h-52 max-w-full object-contain rounded-lg"
                  />
                </div>
                <span className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  Aponte a câmera do aplicativo do seu banco
                </span>
              </div>
            )}

            {/* Código PIX Copia e Cola */}
            {order.pix_qr_code && (
              <div className="space-y-2 pt-1">
                <div 
                  onClick={copyPixCode}
                  className="w-full min-w-0 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 p-2.5 rounded-xl cursor-pointer transition-all"
                >
                  <p className="font-mono text-[11px] text-slate-400 truncate select-all">
                    {order.pix_qr_code}
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={copyPixCode}
                  className={`w-full h-12 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                    copied
                      ? "bg-emerald-600 text-white shadow-emerald-950/80 hover:bg-emerald-500"
                      : "bg-emerald-400 hover:bg-emerald-300 text-black shadow-emerald-500/10"
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Código PIX Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-black" />
                      <span>Copiar Código PIX</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Botão Secundário para verificação manual */}
            <Button 
              onClick={checkPaymentStatus}
              disabled={isCheckingPayment}
              variant="ghost"
              className="w-full h-10 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] cursor-pointer flex items-center justify-center gap-2"
            >
              {isCheckingPayment ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 text-emerald-400 animate-spin" />
                  <span>Verificando com o banco...</span>
                </>
              ) : (
                <span>Já realizei o pagamento</span>
              )}
            </Button>
          </div>

          {/* Passo a Passo Simples */}
          <div className="mt-5 p-4 sm:p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-3">
            <h3 className="font-bold text-xs sm:text-sm text-white">Como pagar:</h3>
            <ol className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-300">1.</span>
                <span>Abra o app do seu banco no celular e escolha a opção <strong>PIX</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-300">2.</span>
                <span>Selecione <strong>Pix Copia e Cola</strong> ou aponte para o <strong>QR Code</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-300">3.</span>
                <span>Confirme o valor e finalize. <strong>O acesso é liberado instantaneamente.</strong></span>
              </li>
            </ol>
          </div>

          <div className="mt-5 text-center">
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
