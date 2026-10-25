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
import { Loader2, CreditCard, ArrowLeft, Tag, X, ShieldCheck, Zap, Check } from "lucide-react";
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
      cpf: savedData.cpf || '',
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
          cpf: data.cpf
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
      <main className="app-container py-20 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 className="text-4xl font-bold mb-8">Complete Sua Compra</h1>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Formulário de Pagamento */}
            <Card className="p-6 sm:p-7 bg-[#0b0c15]/90 border border-white/10 backdrop-blur-2xl shadow-2xl rounded-3xl relative overflow-hidden ring-1 ring-purple-500/15">
              {/* Glow sutil */}
              <div className="absolute top-0 right-0 w-48 h-32 bg-purple-500/10 blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Checkout Express</h2>
                    <p className="text-xs text-slate-300">Liberação automática via PIX</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-black text-emerald-400 uppercase tracking-wider">
                  Blindado
                </span>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-xs font-bold text-slate-200">Nome Completo *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Digite seu nome completo"
                    disabled={isProcessing}
                    className="mt-1.5 h-11 bg-white/[0.04] border-white/10 rounded-xl focus:border-purple-500/50 text-white placeholder:text-muted-foreground"
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs font-bold text-slate-200">E-mail para Receber o Acesso *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="seu@email.com"
                    disabled={isProcessing}
                    className="mt-1.5 h-11 bg-white/[0.04] border-white/10 rounded-xl focus:border-purple-500/50 text-white placeholder:text-muted-foreground"
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-xs font-bold text-slate-200">Telefone (WhatsApp) *</Label>
                  <Input
                    id="phone"
                    value={phoneValue || ''}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    disabled={isProcessing}
                    className="mt-1.5 h-11 bg-white/[0.04] border-white/10 rounded-xl focus:border-purple-500/50 text-white placeholder:text-muted-foreground"
                  />
                  {errors.phone && (
                    <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="coupon" className="text-xs font-bold text-slate-200">Cupom de Desconto</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        id="coupon"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Ex: PROMO10"
                        disabled={isProcessing || !!appliedCoupon}
                        className="h-11 bg-white/[0.04] border-white/10 rounded-xl uppercase font-semibold text-white placeholder:text-muted-foreground"
                      />
                      {appliedCoupon ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRemoveCoupon}
                          disabled={isProcessing}
                          className="h-11 px-4 rounded-xl border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={isProcessing || validateCoupon.isPending}
                          className="h-11 px-4 rounded-xl border-white/10 hover:bg-white/10 text-white font-bold text-xs"
                        >
                          <Tag className="h-4 w-4 mr-1 text-purple-400" />
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

                  <Button
                    type="submit"
                    className="w-full h-12 shadow-button hover:shadow-glow glow-btn-premium bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-400 text-slate-950 font-black text-sm rounded-xl border border-yellow-300/40 cursor-pointer transition-all hover:scale-[1.01]"
                    size="lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Zap className="mr-2 h-4 w-4 text-slate-950 animate-pulse" />
                        Gerando seu PIX...
                      </>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
                        <span>Gerar PIX — R$ {total.toFixed(2)}</span>
                      </span>
                    )}
                  </Button>

                  <p className="text-[11px] text-muted-foreground text-center mt-2.5">
                    Ao confirmar o pedido, você concorda com nossos{" "}
                    <Link to="/termos" target="_blank" className="text-primary hover:underline">
                      Termos de Uso
                    </Link>{" "}
                    e{" "}
                    <Link to="/privacidade" target="_blank" className="text-primary hover:underline">
                      Política de Privacidade
                    </Link>.
                  </p>
                </div>
              </form>

              <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-2">
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
            <div className="space-y-5">
              <Card className="p-6 sm:p-7 bg-[#0b0c15]/90 border border-white/10 backdrop-blur-2xl shadow-2xl rounded-3xl">
                <h2 className="text-xl sm:text-2xl font-black mb-5 text-white tracking-tight">Resumo do Pedido</h2>

                <div className="flex gap-4 pb-5 border-b border-white/[0.08]">
                  <img
                    src={imgSrc || series.image_url}
                    alt={series.title}
                    onError={() => setImgSrc(placeholderImage)}
                    className="w-24 h-36 object-cover rounded-2xl shadow-lg ring-1 ring-white/10 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-base sm:text-lg text-white mb-1 truncate">{series.title}</h3>
                    <p className="text-xs text-slate-400 mb-3">{series.genre || 'Produção Exclusiva'}</p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Temporada Completa em 4K
                    </span>
                  </div>
                </div>

                <div className="pt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal:</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Desconto Aplicado:</span>
                      <span>- R$ {discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-2xl text-white pt-3 border-t border-white/[0.08]">
                    <span>Total a Pagar:</span>
                    <span className="text-emerald-400">R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </Card>

              {/* Card de Garantia & Confiança */}
              <Card className="p-6 bg-gradient-to-br from-purple-950/30 via-[#0b0c15] to-indigo-950/20 border border-purple-500/30 rounded-3xl shadow-xl">
                <h3 className="font-black text-sm sm:text-base text-white mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" /> Garantia Moments Séries
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sem mensalidades ou assinaturas recorrentes. O acesso adquirido é vitalício, acompanhado de suporte humanizado e atualizações contínuas de episódios.
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
