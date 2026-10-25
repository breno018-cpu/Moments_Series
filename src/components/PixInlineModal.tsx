import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Copy, ShieldCheck, Sparkles, QrCode } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import { wa } from "@/lib/whatsapp.client";
import { logWhatsAppDispatch } from "@/lib/whatsappLogs";

export interface PixInlineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderToken: string;
  pixQrCode: string;
  pixQrCodeBase64?: string;
  amount: number;
  itemTitle?: string;
  itemImage?: string;
  onSuccess: (orderId: string, orderToken: string) => void;
}

export function PixInlineModal({
  open,
  onOpenChange,
  orderId,
  orderToken,
  pixQrCode,
  pixQrCodeBase64,
  amount,
  itemTitle,
  itemImage,
  onSuccess,
}: PixInlineModalProps) {
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos em segundos
  const hasTriggeredSuccess = useRef(false);

  // Copiar código PIX
  const handleCopy = () => {
    if (!pixQrCode) return;
    try {
      navigator.clipboard.writeText(pixQrCode);
      setCopied(true);
      triggerHaptic("success");
      toast.success("Código PIX copiado com sucesso! Cole no aplicativo do seu banco.");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Não foi possível copiar automaticamente. Selecione o código manualmente.");
    }
  };

  // Contagem regressiva de validade (15 min)
  useEffect(() => {
    if (!open || isCompleted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [open, isCompleted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Verificação manual no banco
  const handleManualCheck = async () => {
    if (!orderId || !orderToken || isChecking || isCompleted) return;
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-payment-status", {
        body: { orderId, orderToken },
      });

      if (error) throw error;

      if (data?.status === "completed") {
        setIsCompleted(true);
        triggerHaptic("success");
        toast.success("Pagamento confirmado instantaneamente! Liberando acesso...");
        if (!hasTriggeredSuccess.current) {
          hasTriggeredSuccess.current = true;
          setTimeout(() => {
            if (typeof onSuccess === "function") {
              onSuccess(orderId, orderToken);
            }
          }, 1200);
        }
      } else {
        toast.info("Aguardando confirmação do banco... Pode levar alguns segundos após a transferência.");
      }
    } catch (err: any) {
      console.error("[PixInlineModal] Erro ao verificar status:", err);
      toast.error("Ainda não identificamos a compensação. Se já realizou o PIX, aguarde alguns instantes.");
    } finally {
      setIsChecking(false);
    }
  };

  // Polling automático e reativo em tempo real via get_order_by_token
  useEffect(() => {
    if (!open || !orderToken || isCompleted) return;

    let isMounted = true;
    let attempts = 0;
    const MAX_ATTEMPTS = 120; // 120 * 4s = até 8 minutos ativos

    const interval = setInterval(async () => {
      if (!isMounted || document.hidden || hasTriggeredSuccess.current) return;
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        clearInterval(interval);
        return;
      }

      try {
        const { data } = await supabase.rpc("get_order_by_token", { token: orderToken });
        const firstOrder = data?.[0];

        if (firstOrder?.payment_status === "completed") {
          clearInterval(interval);
          if (isMounted && !hasTriggeredSuccess.current) {
            hasTriggeredSuccess.current = true;
            setIsCompleted(true);
            triggerHaptic("success");

            // Disparo preventivo do WhatsApp - BLOQUEADO POR PADRÃO para não enviar sem permissão
            try {
              const { data: autoFlagRow } = await supabase
                .from("site_settings")
                .select("value")
                .eq("key", "whatsapp_auto_dispatch_enabled")
                .maybeSingle();

              const isAutoAllowed = autoFlagRow?.value === "true";

              if (isAutoAllowed) {
                const savedData = JSON.parse(localStorage.getItem("checkout_customer_data") || "{}");
                const phone = firstOrder.customer_phone || savedData.phone || "";
                const name = firstOrder.customer_name || savedData.name || "Cliente";
              if (phone) {
                // Buscar template salvo se existir no site_settings
                let templateRaw = `Oba, *{nome}*! 🚀\n\nSeu pagamento referente ao pedido *#{pedido}* foi *CONFIRMADO* com sucesso!\n\n💰 Valor: *R$ {valor}*\n🍿 Conteúdo: *{itens}*\n\n🔗 *Seu link de acesso exclusivo à série está liberado:*\n{link}\n\nAproveite e assista direto no seu celular ou navegador! Qualquer dúvida estamos à disposição.`;
                try {
                  const { data: stRow } = await supabase
                    .from("site_settings")
                    .select("value")
                    .eq("key", "whatsapp_sales_template")
                    .maybeSingle();
                  if (stRow?.value) templateRaw = stRow.value;
                } catch (e) {
                  console.warn("Falha ao carregar template no modal PIX", e);
                }

                const accessLink = window.location.origin + `/purchase-success?order_id=${firstOrder.id || orderId}&token=${orderToken}`;
                const valFormatted = Number(firstOrder.total_amount || amount || 0).toFixed(2).replace('.', ',');
                const formattedCustomMsg = templateRaw
                  .replace(/{nome}/g, name)
                  .replace(/{pedido}/g, String(firstOrder.id || orderId))
                  .replace(/{valor}/g, valFormatted)
                  .replace(/{itens}/g, itemTitle || "Série Adquirida")
                  .replace(/{link}/g, accessLink);

                wa.notify({
                  event: "PAYMENT_APPROVED",
                  customerName: name,
                  customerPhone: phone,
                  orderId: firstOrder.id || orderId,
                  totalAmount: Number(firstOrder.total_amount || 0),
                  items: [itemTitle || "Série Adquirida"],
                  trackingUrl: accessLink,
                  customMessage: formattedCustomMsg,
                  labels: ["Já Comprou", "Cliente Ativo", "Moments Séries"]
                }).then((res) => {
                  if (res.success) {
                    logWhatsAppDispatch({
                      orderId: String(firstOrder.id || orderId),
                      customerName: name,
                      customerPhone: phone,
                      status: "sent",
                      sentAt: new Date().toISOString(),
                      messageId: res.data?.messageKeyId || res.data?.id,
                      items: itemTitle || "Série Adquirida"
                    });
                  } else {
                    logWhatsAppDispatch({
                      orderId: String(firstOrder.id || orderId),
                      customerName: name,
                      customerPhone: phone,
                      status: "error",
                      sentAt: new Date().toISOString(),
                      errorMessage: res.error,
                      items: itemTitle || "Série Adquirida"
                    });
                  }
                }).catch((err) => {
                  logWhatsAppDispatch({
                    orderId: String(firstOrder.id || orderId),
                    customerName: name,
                    customerPhone: phone,
                    status: "error",
                    sentAt: new Date().toISOString(),
                    errorMessage: err?.message || "Exceção ao disparar",
                    items: itemTitle || "Série Adquirida"
                  });
                  console.warn("[WhatsApp Modal Notify Warn]:", err);
                });
                }
              }
            } catch {
              /* ignora */
            }

            toast.success("Pagamento confirmado via PIX! Liberando seu acesso imediato...");
            setTimeout(() => {
              if (typeof onSuccess === "function") {
                onSuccess(orderId, orderToken);
              }
            }, 1200);
          }
        }
      } catch {
        /* silencioso durante o polling */
      }
    }, 4000); // Polling a cada 4 segundos no modal aberto

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [open, orderToken, orderId, isCompleted, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] w-[95vw] p-0 bg-[#08090f]/98 border border-white/10 text-white rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden backdrop-blur-2xl ring-1 ring-purple-500/20">
        {/* Glow Superior Aurora */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-gradient-to-r from-emerald-500/20 via-purple-500/25 to-amber-500/20 blur-3xl pointer-events-none" />

        {/* Cabeçalho */}
        <div className="p-6 pb-4 border-b border-white/[0.07] bg-white/[0.015] relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider mb-2.5 shadow-sm shadow-emerald-950">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Checkout Transparente PIX</span>
          </div>

          <DialogTitle className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            Pague e Acesse na Hora
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
            Escaneie o QR Code ou copie o código PIX abaixo no aplicativo do seu banco.
          </DialogDescription>
        </div>

        <div className="p-6 pt-4 space-y-5 relative z-10">
          {/* Card Resumo do Pedido */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3 min-w-0">
              {itemImage && (
                <img
                  src={itemImage}
                  alt={itemTitle || "Série"}
                  className="w-11 h-14 object-cover rounded-xl ring-1 ring-white/10 shrink-0 shadow-md"
                />
              )}
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Item Selecionado
                </span>
                <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[190px]">
                  {itemTitle || "Moments Séries / Animes"}
                </p>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3" /> Liberação Automática
                </span>
              </div>
            </div>

            <div className="text-right shrink-0 pl-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Valor Total</span>
              <span className="text-xl font-black text-emerald-400 tracking-tight">
                R$ {Number(amount || 0).toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          {/* Área do QR Code com Borda Neon e Temporizador */}
          <div className="flex flex-col items-center justify-center">
            {pixQrCodeBase64 ? (
              <div className="relative group p-4 bg-white rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] ring-4 ring-emerald-500/25 transition-transform duration-300 hover:scale-[1.02]">
                <img
                  src={`data:image/png;base64,${pixQrCodeBase64}`}
                  alt="QR Code PIX Dinâmico"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                />
                {isCompleted && (
                  <div className="absolute inset-0 bg-emerald-950/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center text-white animate-in zoom-in-95">
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
                    <span className="text-base font-black mt-2 text-white">PIX Confirmado!</span>
                    <span className="text-xs text-emerald-300 mt-0.5">Liberando acesso...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-48 h-48 rounded-2xl bg-white/[0.03] border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <QrCode className="w-10 h-10 mb-2 opacity-50 text-purple-400" />
                <span className="text-xs font-semibold text-slate-300">Use a chave Copia e Cola abaixo</span>
              </div>
            )}

            {/* Temporizador Elegante */}
            <div className="flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-slate-300">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>QR Code válido por:</span>
              <span className="text-emerald-400 font-mono font-black">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Chave PIX Copia e Cola com Feedback Interativo */}
          {pixQrCode && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-0.5">
                <span>Chave PIX Copia e Cola:</span>
                <span className="text-[11px] text-purple-300 font-medium">Toque para copiar</span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  onClick={handleCopy}
                  className="flex-1 bg-white/[0.04] border border-white/10 hover:border-purple-500/40 p-2.5 rounded-xl text-xs font-mono text-slate-300 truncate cursor-pointer transition-colors select-all shadow-inner"
                  title="Clique para copiar o código"
                >
                  {pixQrCode}
                </div>

                <Button
                  type="button"
                  onClick={handleCopy}
                  className={`h-10 px-4 rounded-xl font-black text-xs gap-1.5 transition-all cursor-pointer ${
                    copied
                      ? "bg-emerald-600 text-white hover:bg-emerald-500"
                      : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-900/40"
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Botões de Ação e Status */}
          <div className="space-y-2.5 pt-1">
            <Button
              type="button"
              onClick={handleManualCheck}
              disabled={isChecking || isCompleted}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-950/50 gap-2 transition-all active:scale-[0.99] border border-emerald-400/30 cursor-pointer"
            >
              {isChecking ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200 animate-pulse" />
                  <span>Consultando compensação no banco...</span>
                </>
              ) : isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Acesso Liberado com Sucesso!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Já Realizei o Pagamento</span>
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Ambiente criptografado • Verificação automática a cada 4s</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
