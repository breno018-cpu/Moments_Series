import { useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, type CheckoutFormData } from "@/lib/validators";
import { Loader2, CreditCard, ShoppingCart, Tag, X, Zap, Check, User, Mail, Phone, Lock, Sparkles, ArrowLeft, ShieldCheck } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useValidateCoupon } from "@/hooks/useCoupons";
import { trackPixel } from "@/hooks/useMetaPixel";
import { formatPhone } from "@/lib/validators";
import { captureUtms, captureLandingAndReferrer } from "@/lib/marketing";
import { checkClientRateLimit } from "@/lib/security";
import { PixInlineModal } from "@/components/PixInlineModal";
import { wa } from "@/lib/whatsapp.client";

export default function CartCheckout() {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
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

  const subtotal = getTotalPrice();
  const discount = appliedCoupon?.discount || 0;
  const total = subtotal - discount;

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

    validateCoupon.mutate(
      { 
        code: couponCode, 
        totalAmount: subtotal,
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('phone', formatted);
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }

    if (!checkClientRateLimit('cart_checkout', 3, 10000)) {
      toast.error('Muitas tentativas simultâneas. Por favor, aguarde alguns instantes.');
      return;
    }

    setIsProcessing(true);
    try {
      // Criar um único pagamento para todo o carrinho
      const cartItems = items.map(item => {
        const itemPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : Number(item.price) || 0;
        const itemQty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
        return {
          id: item.id,
          seriesId: item.id,
          title: item.title,
          quantity: itemQty,
          price: itemPrice,
        };
      });

      trackPixel('InitiateCheckout', {
        content_ids: items.map((i) => i.id),
        contents: items.map((i) => ({
          id: i.id,
          quantity: typeof i.quantity === 'number' && i.quantity > 0 ? i.quantity : 1,
          item_price: typeof i.price === 'number' && !isNaN(i.price) ? i.price : Number(i.price) || 0,
        })),
        value: total,
        currency: 'BRL',
        num_items: items.reduce((acc, i) => acc + (typeof i.quantity === 'number' && i.quantity > 0 ? i.quantity : 1), 0),
      });

      const utms = captureUtms();
      const landing = captureLandingAndReferrer();
      const firstSeriesId = items[0]?.id;

      const { data: result, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          seriesId: firstSeriesId,
          items: cartItems,
          totalAmount: total,
          customerName: data.name,
          customerEmail: data.email,
          customerPhone: data.phone.replace(/\D/g, ''),
          couponCode: appliedCoupon?.code,
          marketing: { ...utms, ...landing },
        },
      });

      if (error) {
        throw error;
      }

      if (!result?.orderId) {
        throw new Error('Nenhum pedido foi criado');
      }

      localStorage.setItem('checkout_customer_data', JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone,
      }));
      clearCart();

      // Ativa o Checkout Transparente na mesma tela
      setInlinePix({
        open: true,
        orderId: result.orderId,
        orderToken: result.orderToken,
        pixQrCode: result.pixQrCode || '',
        pixQrCodeBase64: result.pixQrCodeBase64 || '',
      });

      // Disparo do código PIX Copia e Cola para o WhatsApp do comprador
      wa.notify({
        event: "PIX_GENERATED",
        customerName: data.name,
        customerPhone: data.phone,
        orderId: result.orderId,
        totalAmount: total,
        items: items.map((i) => i.title),
        pixCode: result.pixQrCode || "",
        pixExpiresInMinutes: 30,
        labels: ["PIX Gerado", "Moments Carrinho"]
      }).catch((err) => console.warn("[WhatsApp Cart PIX Warn]:", err));

      toast.success('PIX gerado instantaneamente! Conclua o pagamento para liberação.');
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h1 className="text-4xl font-bold mb-4">Carrinho Vazio</h1>
          <p className="text-muted-foreground mb-8">Adicione séries ao seu carrinho para continuar</p>
          <Button onClick={() => navigate('/')}>Ver Catálogo</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="app-container py-20 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)} 
              className="gap-2 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-xl text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Continuar comprando
            </Button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-bold">
              <Lock className="w-3 h-3" />
              <span>Checkout 100% Blindado</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Finalizar Compra do Carrinho</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Preencha seus dados para receber o acesso imediato de todos os títulos adquiridos.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Formulário de Pagamento */}
            <Card className="p-6 sm:p-7 bg-[#090a12]/95 border border-white/[0.09] backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] rounded-[28px] relative overflow-hidden ring-1 ring-purple-500/20">
              {/* Glow sutil */}
              <div className="absolute top-0 right-0 w-64 h-36 bg-emerald-500/10 blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/25 to-teal-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Checkout Express</h2>
                    <p className="text-xs text-slate-300">Pagamento seguro via PIX</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Blindado
                </span>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-xs font-bold text-slate-200">Nome Completo *</Label>
                  <div className="relative mt-1.5">
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
                  <div className="relative mt-1.5">
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
                    <p className="text-[11px] text-slate-400 mt-1">O link de liberação será enviado para este endereço.</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-xs font-bold text-slate-200">WhatsApp para Notificações *</Label>
                  <div className="relative mt-1.5">
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
                    <p className="text-[11px] text-slate-400 mt-1">Receba a chave PIX e confirmação direta no WhatsApp.</p>
                  )}
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="coupon" className="text-xs font-bold text-slate-200">Cupom Promocional</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        id="coupon"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Ex: DESCONTO10"
                        disabled={isProcessing || !!appliedCoupon}
                        className="h-11 bg-white/[0.04] border-white/10 rounded-xl uppercase font-semibold text-white placeholder:text-muted-foreground"
                      />
                      {appliedCoupon ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRemoveCoupon}
                          disabled={isProcessing}
                          className="h-11 px-4 rounded-xl border-rose-500/40 text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={isProcessing || validateCoupon.isPending}
                          className="h-11 px-4 rounded-xl border-white/10 hover:border-purple-500/40 hover:bg-white/[0.06] text-white font-bold text-xs cursor-pointer"
                        >
                          <Tag className="h-4 w-4 mr-1 text-purple-400" />
                          Aplicar
                        </Button>
                      )}
                    </div>
                    {appliedCoupon && (
                      <p className="text-xs text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                        ✓ Cupom "{appliedCoupon.code}" aplicado (- R$ {discount.toFixed(2)})
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-13 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm sm:text-base rounded-2xl shadow-[0_12px_35px_rgba(16,185,129,0.35)] cursor-pointer transition-all active:scale-[0.99] border border-emerald-400/40"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 text-black animate-spin" />
                        Gerando seu PIX Seguro...
                      </>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Zap className="w-5 h-5 fill-black text-black" />
                        <span>Gerar PIX — R$ {total.toFixed(2).replace('.', ',')}</span>
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
                    <span>Transação blindada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    <span>Suporte via WhatsApp</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Resumo do Carrinho */}
            <div className="space-y-5">
              <Card className="p-6 sm:p-7 bg-[#090a12]/95 border border-white/[0.09] backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] rounded-[28px] relative overflow-hidden">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/[0.08]">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Resumo do Pedido</h2>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                    {items.length} {items.length === 1 ? 'título' : 'títulos'}
                  </span>
                </div>

                <div className="space-y-3.5 mb-5 max-h-80 overflow-y-auto pr-1">
                  {items.map((item) => {
                    if (!item || !item.id) return null;
                    const p = typeof item.price === 'number' && !isNaN(item.price) ? item.price : Number(item.price) || 0;
                    const q = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
                    return (
                      <div key={item.id} className="flex gap-3.5 pb-3.5 border-b border-white/[0.06] last:border-0 items-center">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-14 h-20 object-cover rounded-xl shadow-md ring-1 ring-white/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-white line-clamp-1">{item.title}</h3>
                          <p className="text-xs text-slate-400">{item.genre || 'Produção Exclusiva'}</p>
                          <div className="flex justify-between items-center mt-1.5">
                            <span className="text-xs text-slate-400">
                              {q}x R$ {p.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="font-black text-sm text-emerald-400">
                              R$ {(p * q).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-white/[0.08] pt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal:</span>
                    <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Desconto ({appliedCoupon.code}):</span>
                      <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-2xl font-black text-white border-t border-white/[0.08] pt-3">
                    <span>Total a Pagar:</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                      R$ {total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Card de Garantia & Confiança */}
              <Card className="p-6 bg-gradient-to-br from-purple-950/30 via-[#090a12] to-emerald-950/20 border border-purple-500/25 rounded-[28px] shadow-xl">
                <h3 className="font-black text-sm sm:text-base text-white mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Acesso Imediato & Vitalício
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Todos os títulos do seu pedido serão sincronizados e liberados instantaneamente após o pagamento. Você receberá o acesso no seu e-mail e na tela seguinte.
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
        itemTitle="Itens do Carrinho"
        onSuccess={(oId, oToken) => {
          navigate(`/purchase-success?order_id=${oId}&token=${oToken}`);
        }}
      />
    </div>
  );
}
