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
      <main className="app-container py-16 sm:py-24 max-w-full overflow-x-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)} 
              className="h-9 px-3 gap-1.5 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-xl text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Continuar comprando
            </Button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 text-xs font-medium">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Checkout Seguro</span>
            </div>
          </div>

          {/* Resumo Rápido para Mobile */}
          <div className="md:hidden mb-5 p-3.5 bg-[#12131d] border border-white/10 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              {items[0]?.image_url && (
                <img
                  src={items[0].image_url}
                  alt={items[0].title}
                  className="w-12 h-16 object-cover rounded-xl shadow-md shrink-0 ring-1 ring-white/10"
                />
              )}
              <div className="min-w-0">
                <h2 className="font-bold text-sm text-white truncate">
                  {items.length === 1 ? items[0].title : `${items.length} séries no carrinho`}
                </h2>
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3" /> Acesso Imediato
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total</span>
              <span className="text-xl font-extrabold text-emerald-400">
                R$ {total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Formulário de Pagamento (7 colunas no desktop) */}
            <div className="md:col-span-7 bg-[#12131d] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Dados para Acesso</h2>
                <p className="text-xs text-slate-400 mt-1">Informe onde você receberá seus acessos e comprovante.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-xs font-semibold text-slate-200">Nome Completo</Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Seu nome completo"
                      disabled={isProcessing}
                      className="pl-10 h-11 bg-white/[0.03] border-white/10 rounded-xl focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 text-white placeholder:text-slate-500"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-rose-400 mt-1 font-medium">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-200">E-mail para Acesso</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="seu@email.com"
                      disabled={isProcessing}
                      className="pl-10 h-11 bg-white/[0.03] border-white/10 rounded-xl focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 text-white placeholder:text-slate-500"
                    />
                  </div>
                  {errors.email ? (
                    <p className="text-xs text-rose-400 mt-1 font-medium">{errors.email.message}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">O link de liberação será enviado para este endereço.</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-xs font-semibold text-slate-200">WhatsApp</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <Input
                      id="phone"
                      value={phoneValue || ''}
                      onChange={handlePhoneChange}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      disabled={isProcessing}
                      className="pl-10 h-11 bg-white/[0.03] border-white/10 rounded-xl focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 text-white placeholder:text-slate-500"
                    />
                  </div>
                  {errors.phone ? (
                    <p className="text-xs text-rose-400 mt-1 font-medium">{errors.phone.message}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">Receba a chave PIX e confirmação direta no WhatsApp.</p>
                  )}
                </div>

                {/* Cupom */}
                <div className="pt-1">
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Cupom de desconto"
                      disabled={isProcessing || !!appliedCoupon}
                      className="h-11 flex-1 min-w-0 bg-white/[0.03] border-white/10 rounded-xl uppercase font-semibold text-xs sm:text-sm text-white placeholder:text-slate-500"
                    />
                    {appliedCoupon ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemoveCoupon}
                        disabled={isProcessing}
                        className="h-11 w-11 p-0 shrink-0 rounded-xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10 cursor-pointer flex items-center justify-center"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={isProcessing || validateCoupon.isPending}
                        className="h-11 px-4 shrink-0 rounded-xl border-white/10 hover:bg-white/[0.06] text-white font-semibold text-xs cursor-pointer flex items-center justify-center"
                      >
                        <Tag className="h-3.5 w-3.5 mr-1 text-slate-400" />
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

                {/* Botão Primário Padronizado */}
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-12 bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-sm sm:text-base rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      <span>Gerando PIX...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-black text-black" />
                      <span>Pagar R$ {total.toFixed(2).replace('.', ',')} com PIX</span>
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-slate-500 text-center">
                  Ao confirmar, você concorda com nossos{" "}
                  <Link to="/termos" target="_blank" className="text-slate-400 underline hover:text-white">
                    Termos
                  </Link>{" "}
                  e{" "}
                  <Link to="/privacidade" target="_blank" className="text-slate-400 underline hover:text-white">
                    Privacidade
                  </Link>.
                </p>
              </form>

              {/* Indicadores de Segurança Limpos */}
              <div className="pt-2 border-t border-white/[0.06] grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col items-center gap-1">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">100% Criptografado</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Liberação Imediata</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Acesso Vitalício</span>
                </div>
              </div>
            </div>

            {/* Resumo do Pedido (5 colunas no desktop) */}
            <div className="md:col-span-5 space-y-4">
              <div className="bg-[#12131d] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="font-bold text-sm sm:text-base text-white">Resumo do Pedido</h3>
                  <span className="text-xs text-slate-400">
                    {items.length} {items.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                  {items.map((item) => {
                    if (!item || !item.id) return null;
                    const p = typeof item.price === 'number' && !isNaN(item.price) ? item.price : Number(item.price) || 0;
                    const q = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
                    return (
                      <div key={item.id} className="flex gap-3 pb-3 border-b border-white/[0.05] last:border-0 items-center">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-12 h-16 object-cover rounded-xl shadow-md ring-1 ring-white/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-white truncate">{item.title}</h4>
                          <p className="text-[11px] text-slate-400">{item.genre || 'Produção Exclusiva'}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[11px] text-slate-400">
                              {q}x R$ {p.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="font-bold text-xs text-emerald-400">
                              R$ {(p * q).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-white/10 pt-3 space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Desconto ({appliedCoupon.code})</span>
                      <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base sm:text-lg font-extrabold text-white border-t border-white/10 pt-3">
                    <span>Total</span>
                    <span className="text-emerald-400">R$ {total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>
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
