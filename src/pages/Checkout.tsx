import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSeriesById } from "@/hooks/useSeries";
import { useAnimeById } from "@/hooks/useAnimes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, formatPhone, type CheckoutFormData } from "@/lib/validators";
import { Loader2, CreditCard, ArrowLeft, Tag, X, ShieldCheck, Zap, Check, User, Mail, Phone, Lock, Sparkles } from "lucide-react";
import { trackPixel } from "@/hooks/useMetaPixel";
import { useValidateCoupon } from "@/hooks/useCoupons";
import { captureUtms, captureLandingAndReferrer } from "@/lib/marketing";
import { checkClientRateLimit } from "@/lib/security";
import placeholderImage from "@/assets/series-1.jpg";
import { PixInlineModal } from "@/components/PixInlineModal";
import { wa } from "@/lib/whatsapp.client";

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const seriesQuery = useSeriesById(id || '');
  const animeQuery = useAnimeById(id || '');
  
  const series = seriesQuery.data || animeQuery.data;
  const isLoading = seriesQuery.isLoading && animeQuery.isLoading;
  const [isProcessing, setIsProcessing] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const validateCoupon = useValidateCoupon();

  // Estado do Checkout Transparente PIX
  const [inlinePix, setInlinePix] = useState<{
    open: boolean;
    orderId: string;
    orderToken: string;
    pixQrCode: string;
    pixQrCodeBase64?: string;
  }>({
    open: false,
    orderId: '',
    orderToken: '',
    pixQrCode: '',
  });

  const savedDataStr = localStorage.getItem('checkout_customer_data');
  const savedData = savedDataStr ? JSON.parse(savedDataStr) : {};

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: savedData.name || '',
      email: savedData.email || '',
      phone: savedData.phone || '',
    }
  });

  const phoneValue = watch('phone');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('phone', formatted);
  };

  const subtotal = series ? series.price : 0;
  const discount = appliedCoupon?.discount || 0;
  const total = Math.max(0, subtotal - discount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Digite um código de cupom');
      return;
    }

    const form = watch();
    if (!form.email) {
      toast.error('Por favor, preencha seu email antes de aplicar o cupom');
      return;
    }

    if (!series) return;

    validateCoupon.mutate(
      { 
        code: couponCode, 
        totalAmount: series.price,
        customerEmail: form.email 
      },
      {
        onSuccess: (result) => {
          setAppliedCoupon({
            code: couponCode.toUpperCase(),
            discount: result.discount,
          });
          toast.success(`Cupom aplicado! Desconto de R$ ${result.discount.toFixed(2)}`);
        },
      }
    );
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Cupom removido');
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (!series) return;

    // Proteção cibernética contra spam de requisições / brute-force
    if (!checkClientRateLimit(`checkout_${series.id}`, 3, 10000)) {
      toast.error('Muitas tentativas simultâneas. Por favor, aguarde alguns instantes.');
      return;
    }

    setIsProcessing(true);
    try {
      trackPixel('InitiateCheckout', {
        content_ids: [series.id],
        content_name: series.title,
        value: series.price,
        currency: 'BRL',
        num_items: 1,
      });

      const utms = captureUtms();
      const landing = captureLandingAndReferrer();
      const { data: result, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          seriesId: series.id,
          customerName: data.name,
          customerEmail: data.email,
          customerPhone: data.phone.replace(/\D/g, ''),
          couponCode: appliedCoupon?.code,
          marketing: { ...utms, ...landing },
        },
      });

      if (error) throw error;

      if (result.success && result.orderId) {
        localStorage.setItem('checkout_customer_data', JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
        }));
        
        // Ativa o Checkout Transparente na mesma tela sem redirecionar
        setInlinePix({
          open: true,
          orderId: result.orderId,
          orderToken: result.orderToken,
          pixQrCode: result.pixQrCode || '',
          pixQrCodeBase64: result.pixQrCodeBase64 || '',
        });

        // Disparo assíncrono do código PIX Copia e Cola para o WhatsApp do cliente
        wa.notify({
          event: "PIX_GENERATED",
          customerName: data.name,
          customerPhone: data.phone,
          orderId: result.orderId,
          totalAmount: total,
          items: [series.title],
          pixCode: result.pixQrCode || "",
          pixExpiresInMinutes: 30,
          labels: ["PIX Gerado", "Moments Séries"]
        }).catch((err) => console.warn("[WhatsApp PIX Notify Warn]:", err));

        toast.success('PIX gerado instantaneamente! Conclua o pagamento para liberação.');
      } else {
        throw new Error(result.error || 'Erro ao criar pagamento');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-purple-400" />
          </div>
          <p className="text-base font-bold text-white mb-2">Preparando Checkout Seguro...</p>
          <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mt-3">
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
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-4xl font-bold mb-4">Série não encontrada</h1>
          <Button onClick={() => navigate('/')}>Voltar para o catálogo</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080d] text-white selection:bg-emerald-500/20">
      {/* Header Minimalista Exclusivo de Checkout (Estilo Stripe / Netflix) */}
      <header className="sticky top-0 z-40 w-full bg-[#07080d]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                navigate(-1);
              }}
              className="h-9 w-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06]"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              MOMENTS
            </span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-white/[0.03] border border-white/[0.08] px-3 py-1.5 rounded-full">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Ambiente Criptografado & Seguro</span>
            <span className="sm:hidden">Checkout Seguro</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12 overflow-x-hidden">
        {/* Banner de Resumo Mobile (Estilo Netflix) */}
        <div className="md:hidden mb-6 p-4 rounded-2xl bg-[#0f1018] border border-white/[0.08] flex items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src={imgSrc || series.image_url}
              alt={series.title}
              onError={() => setImgSrc(placeholderImage)}
              className="w-12 h-16 object-cover rounded-xl shadow-md shrink-0 ring-1 ring-white/10"
            />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block mb-0.5">
                Acesso Vitalício
              </span>
              <h2 className="font-bold text-sm text-white truncate">{series.title}</h2>
              <p className="text-[11px] text-slate-400 truncate">{series.genre || 'Produção Exclusiva'}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total</span>
            <span className="text-xl font-black text-white">
              R$ {total.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Formulário de Pagamento (7 colunas no desktop) */}
          <div className="md:col-span-7 bg-[#0f1018] border border-white/[0.08] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl">
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Finalizar Pedido</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Preencha seus dados para receber o acesso imediatamente.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-xs font-semibold text-slate-300 block mb-1.5">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Nome e sobrenome"
                    disabled={isProcessing}
                    className="pl-10 h-12 bg-white/[0.03] border-white/10 rounded-xl focus:border-emerald-500 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-500/30 text-white placeholder:text-slate-500 text-sm"
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-rose-400 mt-1 font-medium">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="text-xs font-semibold text-slate-300 block mb-1.5">E-mail para Acesso</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="seu@email.com"
                    disabled={isProcessing}
                    className="pl-10 h-12 bg-white/[0.03] border-white/10 rounded-xl focus:border-emerald-500 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-500/30 text-white placeholder:text-slate-500 text-sm"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-400 mt-1 font-medium">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="text-xs font-semibold text-slate-300 block mb-1.5">WhatsApp com DDD</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <Input
                    id="phone"
                    value={phoneValue || ''}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    disabled={isProcessing}
                    className="pl-10 h-12 bg-white/[0.03] border-white/10 rounded-xl focus:border-emerald-500 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-500/30 text-white placeholder:text-slate-500 text-sm"
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-rose-400 mt-1 font-medium">{errors.phone.message}</p>
                )}
              </div>

              {/* Cupom Promocional Clean */}
              <div className="pt-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <Input
                      id="coupon"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Cupom de desconto"
                      disabled={isProcessing || !!appliedCoupon}
                      className="pl-10 h-11 bg-white/[0.03] border-white/10 rounded-xl uppercase font-semibold text-xs text-white placeholder:text-slate-500"
                    />
                  </div>
                  {appliedCoupon ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveCoupon}
                      disabled={isProcessing}
                      className="h-11 px-3.5 shrink-0 rounded-xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10 cursor-pointer text-xs"
                    >
                      <X className="h-4 w-4 mr-1" /> Remover
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={isProcessing || validateCoupon.isPending}
                      className="h-11 px-4 shrink-0 rounded-xl border-white/10 hover:bg-white/[0.06] text-white font-semibold text-xs cursor-pointer"
                    >
                      Aplicar
                    </Button>
                  )}
                </div>
                {appliedCoupon && (
                  <p className="text-xs text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Cupom "{appliedCoupon.code}" aplicado (- R$ {discount.toFixed(2)})
                  </p>
                )}
              </div>

              {/* Botão de Compra Principal (Stripe / Netflix Premium) */}
              <Button
                type="submit"
                disabled={isProcessing}
                className="w-full h-13 sm:h-14 mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 text-slate-950 animate-spin" />
                    <span>Gerando Chave PIX...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-slate-950 text-slate-950" />
                    <span>Pagar R$ {total.toFixed(2).replace('.', ',')} com PIX</span>
                  </>
                )}
              </Button>

              <p className="text-[11px] text-slate-500 text-center pt-1">
                Ambiente seguro com liberação automática após confirmação do PIX.
              </p>
            </form>

            {/* Selos de Confiança Sóbrios */}
            <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center justify-around text-center text-slate-400 text-[11px]">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Criptografia 256-bit
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" /> Liberação na Hora
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Acesso Vitalício
              </span>
            </div>
          </div>

          {/* Resumo do Pedido Desktop (5 colunas no desktop, fixo) */}
          <div className="hidden md:block md:col-span-5 space-y-4 sticky top-24">
            <div className="bg-[#0f1018] border border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Resumo do Pedido
              </span>

              <div className="flex gap-4 pb-5 border-b border-white/[0.08]">
                <img
                  src={imgSrc || series.image_url}
                  alt={series.title}
                  onError={() => setImgSrc(placeholderImage)}
                  className="w-20 h-28 object-cover rounded-xl shadow-lg ring-1 ring-white/10 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-base text-white mb-1 truncate">{series.title}</h3>
                  <p className="text-xs text-slate-400 mb-2 truncate">{series.genre || 'Produção Exclusiva'}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" /> Temporada Completa em 4K
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Preço</span>
                  <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Desconto ({appliedCoupon?.code})</span>
                    <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline font-black text-2xl text-white pt-3 border-t border-white/[0.08]">
                  <span className="text-base font-bold text-slate-300">Total</span>
                  <span className="text-2xl text-emerald-400">
                    R$ {total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400 leading-relaxed flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Pagamento único sem mensalidades. Acesso direto liberado na sua tela e enviado ao seu e-mail e WhatsApp.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Checkout Transparente PIX */}
      <PixInlineModal
        open={inlinePix.open}
        onOpenChange={(isOpen) => setInlinePix((prev) => ({ ...prev, open: isOpen }))}
        orderId={inlinePix.orderId}
        orderToken={inlinePix.orderToken}
        pixQrCode={inlinePix.pixQrCode}
        pixQrCodeBase64={inlinePix.pixQrCodeBase64}
        amount={total}
        itemTitle={series.title}
        itemImage={imgSrc || series.image_url}
        onSuccess={(oId, oToken) => {
          navigate(`/purchase-success?order_id=${oId}&token=${oToken}`);
        }}
      />
    </div>
  );
}
