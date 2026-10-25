import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Copy, ShieldCheck, Sparkles, QrCode, Clock, Lock, Smartphone, Zap } from "lucide-react";
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
      <DialogContent className="max-w-[460px] w-[95vw] max-h-[92vh] overflow-y-auto p-0 bg-[#07080e]/95 border border-white/[0.09] text-white rounded-[28px] shadow-[0_30px_90px_rgba(0,0,0,0.95)] backdrop-blur-3xl ring-1 ring-emerald-500/20 select-none">
        {/* Glow Superior Aurora Dinâmico */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-gradient-to-r from-emerald-500/20 via-teal-500/25 to-purple-600/20 blur-3xl pointer-events-none" />

        {/* Cabeçalho Premium */}
        <div className="p-6 pb-4 border-b border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-black uppercase tracking-wider mb-2.5 shadow-sm shadow-emerald-950/60">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Ambiente PIX Seguro & Oficial</span>
          </div>

          <DialogTitle className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            Pague e Acesse na Hora
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
            Liberação 100% automática instantaneamente após a confirmação.
          </DialogDescription>
        </div>

        <div className="p-5 sm:p-6 pt-4 space-y-4 relative z-10">
          {/* Card Resumo do Pedido Estilo Glass Cinema */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/[0.08] flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3 min-w-0">
              {itemImage && (
                <div className="relative shrink-0">
                  <img
                    src={itemImage}
                    alt={itemTitle || "Série"}
                    className="w-12 h-16 object-cover rounded-xl ring-1 ring-white/15 shadow-lg"
                  />
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border border-[#07080e] flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-black" />
                  </div>
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-black text-purple-400 tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 text-purple-400" /> Acesso Vitalício
                </span>
                <p className="text-xs sm:text-sm font-black text-white truncate max-w-[190px] mt-0.5">
                  {itemTitle || "Moments Séries / Animes"}
                </p>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Liberação Automática
                </span>
              </div>
            </div>

            <div className="text-right shrink-0 pl-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total a Pagar</span>
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 tracking-tight">
                R$ {Number(amount || 0).toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          {/* Área do QR Code com Viewfinder Futurista e Temporizador */}
          <div className="flex flex-col items-center justify-center py-1">
            {pixQrCodeBase64 ? (
              <div className="relative group p-3.5 bg-white rounded-3xl shadow-[0_15px_45px_rgba(16,185,129,0.18)] ring-4 ring-emerald-500/20 transition-all duration-300 hover:ring-emerald-400/40">
                {/* Viewfinder Corners (efeito câmera/fintech) */}
                <div className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg pointer-events-none" />
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg pointer-events-none" />
                <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg pointer-events-none" />
                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-2 border-r-2 border-emerald-400 rounded-br-lg pointer-events-none" />

                <img
                  src={`data:image/png;base64,${pixQrCodeBase64}`}
                  alt="QR Code PIX Dinâmico"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl"
                />

                {isCompleted && (
                  <div className="absolute inset-0 bg-emerald-950/95 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center text-white animate-in zoom-in-95 z-20">
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
                    <span className="text-lg font-black mt-2 text-white">PIX Confirmado!</span>
                    <span className="text-xs text-emerald-300 mt-0.5">Liberando seu acesso agora...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-48 h-48 rounded-2xl bg-white/[0.03] border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <QrCode className="w-10 h-10 mb-2 opacity-50 text-purple-400" />
                <span className="text-xs font-semibold text-slate-300">Use a chave Copia e Cola abaixo</span>
              </div>
            )}

            {/* Temporizador e instrução do QR */}
            <div className="flex items-center gap-2 mt-3 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-slate-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>QR Code válido por:</span>
              <span className="text-emerald-400 font-mono font-black">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Chave PIX Copia e Cola com Botão Vibrante */}
          {pixQrCode && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  PIX Copia e Cola
                </span>
                <span className="text-[11px] text-emerald-400 font-medium">Toque para copiar</span>
              </div>

              <div
                onClick={handleCopy}
                className="group relative flex items-center justify-between gap-2 p-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-emerald-500/40 rounded-2xl cursor-pointer transition-all shadow-inner"
              >
                <div className="flex-1 font-mono text-[11px] text-slate-300 truncate select-all pr-2">
                  {pixQrCode}
                </div>
                <div className="shrink-0 flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </div>
              </div>

              {/* Botão de Destaque Grande para Mobile */}
              <Button
                type="button"
                onClick={handleCopy}
                className={`w-full h-12 rounded-2xl font-black text-sm gap-2 shadow-lg transition-all cursor-pointer ${
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

          {/* Radar em Tempo Real & Verificação Manual */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center text-xs text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[11px] text-slate-300">
                Aguardando compensação... Esta tela sincroniza sozinha a cada 4s.
              </span>
            </div>

            <Button
              type="button"
              onClick={handleManualCheck}
              disabled={isChecking || isCompleted}
              variant="outline"
              className="w-full h-11 rounded-xl border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.05] text-slate-200 font-bold text-xs gap-2 transition-all cursor-pointer"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span>Verificando status no banco...</span>
                </>
              ) : isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Acesso Liberado!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  <span>Já Realizei a Transferência PIX</span>
                </>
              )}
            </Button>

            {/* Badges de Confiança */}
            <div className="flex items-center justify-center gap-4 pt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" /> SSL 256-bit
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" /> Liberação Instantânea
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Suporte VIP
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
