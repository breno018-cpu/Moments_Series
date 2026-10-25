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
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="app-container py-16 sm:py-24 max-w-full overflow-x-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)} 
              className="h-9 px-3 gap-1.5 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-xl text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao catálogo
            </Button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-bold">
              <Lock className="w-3 h-3" />
              <span>Ambiente 100% Blindado</span>
            </div>
          </div>

          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Finalize Seu Pedido</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Preencha seus dados para receber o link exclusivo e assistir imediatamente.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-start">
            {/* Formulário de Pagamento */}
            <Card className="p-4 sm:p-7 bg-[#090a12]/95 border border-white/[0.09] backdrop-blur-3xl shadow-2xl rounded-2xl sm:rounded-[28px] relative overflow-hidden ring-1 ring-purple-500/20 max-w-full">
              {/* Glow sutil */}
              <div className="absolute top-0 right-0 w-64 h-36 bg-emerald-500/10 blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500/25 to-teal-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">Checkout Express</h2>
                    <p className="text-[11px] sm:text-xs text-slate-300">Liberação automática via PIX</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] sm:text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Instantâneo
                </span>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 sm:space-y-4">
                <div>
                  <Label htmlFor="name" className="text-xs font-bold text-slate-200">Nome Completo *</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Digite seu nome completo"
                      disabled={isProcessing}
                      className="pl-10 h-11 bg-white/[0.04] border-white/10 rounded-xl focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 text-white placeholder:text-muted-foreground transition-all"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs font-bold text-slate-200">E-mail para Receber o Acesso *</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="seu@email.com"
                      disabled={isProcessing}
                      className="pl-10 h-11 bg-white/[0.04] border-white/10 rounded-xl focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 text-white placeholder:text-muted-foreground transition-all"
                    />
                  </div>
                  {errors.email ? (
                    <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.email.message}</p>
                  ) : (
                    <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">O link de acesso à série será enviado para este e-mail.</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-xs font-bold text-slate-200">WhatsApp para Notificações *</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="phone"
                      value={phoneValue || ''}
                      onChange={handlePhoneChange}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      disabled={isProcessing}
                      className="pl-10 h-11 bg-white/[0.04] border-white/10 rounded-xl focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 text-white placeholder:text-muted-foreground transition-all"
                    />
                  </div>
                  {errors.phone ? (
                    <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.phone.message}</p>
                  ) : (
                    <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">Receba a chave PIX e aviso de liberação direto no WhatsApp.</p>
                  )}
                </div>

                <div className="space-y-3.5 pt-1">
                  <div>
                    <Label htmlFor="coupon" className="text-xs font-bold text-slate-200">Cupom de Desconto</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="coupon"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Ex: PROMO10"
                        disabled={isProcessing || !!appliedCoupon}
                        className="h-11 flex-1 min-w-0 bg-white/[0.04] border-white/10 rounded-xl uppercase font-semibold text-white placeholder:text-muted-foreground"
                      />
                      {appliedCoupon ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRemoveCoupon}
                          disabled={isProcessing}
                          className="h-11 w-11 p-0 shrink-0 rounded-xl border-rose-500/40 text-rose-400 hover:bg-rose-500/10 cursor-pointer flex items-center justify-center"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={isProcessing || validateCoupon.isPending}
                          className="h-11 px-3.5 shrink-0 rounded-xl border-white/10 hover:border-purple-500/40 hover:bg-white/[0.06] text-white font-bold text-xs cursor-pointer flex items-center justify-center"
                        >
                          <Tag className="h-3.5 w-3.5 mr-1 text-purple-400" />
                          Aplicar
                        </Button>
                      )}
                    </div>
                    {appliedCoupon && (
                      <p className="text-xs text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                        ✓ Cupom "{appliedCoupon.code}" aplicado com sucesso (- R$ {discount.toFixed(2)})
                      </p>
                    )}
                  </div>

                  {/* Botão Padronizado Mobile (h-12, rounded-xl) */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm sm:text-base rounded-xl shadow-lg shadow-emerald-950/40 cursor-pointer transition-all active:scale-[0.99] border border-emerald-400/40 flex items-center justify-center gap-2"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 text-black animate-spin" />
                        <span>Gerando seu PIX Seguro...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-black text-black" />
                        <span>Gerar PIX — R$ {total.toFixed(2).replace('.', ',')}</span>
                      </>
                    )}
                  </Button>

                  <p className="text-[11px] text-muted-foreground text-center mt-2">
                    Ao confirmar o pedido, você concorda com nossos{" "}
                    <Link to="/termos" target="_blank" className="text-primary hover:underline">
                      Termos de Uso
                    </Link>{" "}
                    e{" "}
                    <Link to="/privacidade" target="_blank" className="text-primary hover:underline">
                      Privacidade
                    </Link>.
                  </p>
                </div>
              </form>

              <div className="mt-5 p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[11px] sm:text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    <span>Liberação imediata</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    <span>Pagamento blindado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    <span>Acesso vitalício</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Resumo do Pedido */}
            <div className="space-y-4 sm:space-y-5">
              <Card className="p-4 sm:p-7 bg-[#090a12]/95 border border-white/[0.09] backdrop-blur-3xl shadow-2xl rounded-2xl sm:rounded-[28px] relative overflow-hidden max-w-full">
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                  <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">Resumo do Pedido</h2>
                  <span className="text-[10px] sm:text-[11px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                    Acesso Exclusivo
                  </span>
                </div>

                <div className="flex gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-white/[0.08] min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={imgSrc || series.image_url}
                      alt={series.title}
                      onError={() => setImgSrc(placeholderImage)}
                      className="w-18 h-26 sm:w-24 sm:h-32 object-cover rounded-xl shadow-xl ring-1 ring-white/10"
                    />
                    <div className="absolute top-1 left-1 px-1 py-0.2 rounded bg-black/70 backdrop-blur-md text-[8px] sm:text-[9px] font-black text-emerald-400 border border-emerald-500/30">
                      4K UHD
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm sm:text-lg text-white mb-0.5 truncate">{series.title}</h3>
                    <p className="text-[11px] sm:text-xs text-slate-400 mb-2 truncate">{series.genre || 'Produção Exclusiva'}</p>
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Temporada Completa
                      </span>
                      <p className="text-[10px] sm:text-[11px] text-slate-400">Assista em qualquer celular, tablet ou PC.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal:</span>
                    <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Desconto Aplicado:</span>
                      <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-xl sm:text-2xl text-white pt-2.5 border-t border-white/[0.08]">
                    <span>Total a Pagar:</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                      R$ {total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Card de Garantia & Confiança */}
              <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-950/30 via-[#090a12] to-emerald-950/20 border border-purple-500/25 rounded-2xl sm:rounded-[28px] shadow-xl max-w-full">
                <h3 className="font-black text-xs sm:text-base text-white mb-1.5 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Garantia Moments Séries
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                  Sem mensalidades ou assinaturas recorrentes. O acesso adquirido é vitalício, com suporte humanizado e atualizações contínuas de episódios.
                </p>
              </Card>
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
