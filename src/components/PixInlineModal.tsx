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
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 bg-[#07080e]/98 border border-white/[0.09] text-white rounded-2xl sm:rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] backdrop-blur-3xl ring-1 ring-emerald-500/20 select-none">
        {/* Glow Superior Aurora Dinâmico */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-gradient-to-r from-emerald-500/20 via-teal-500/25 to-purple-600/20 blur-3xl pointer-events-none overflow-hidden" />

        {/* Cabeçalho Premium */}
        <div className="p-4 sm:p-5 pb-3 border-b border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-2 shadow-sm shadow-emerald-950/60">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Ambiente PIX Seguro & Oficial</span>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            Pague e Acesse na Hora
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-300 mt-0.5 max-w-xs mx-auto leading-relaxed">
            Liberação 100% automática instantaneamente após a confirmação.
          </DialogDescription>
        </div>

        <div className="p-4 sm:p-5 pt-3 space-y-3.5 relative z-10 max-w-full overflow-hidden">
          {/* Card Resumo do Pedido Estilo Glass Cinema */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/[0.08] flex items-center justify-between gap-3 shadow-inner min-w-0">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {itemImage && (
                <div className="relative shrink-0">
                  <img
                    src={itemImage}
                    alt={itemTitle || "Série"}
                    className="w-11 h-14 object-cover rounded-lg ring-1 ring-white/15 shadow-md"
                  />
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border border-[#07080e] flex items-center justify-center">
                    <Sparkles className="w-2 h-2 text-black" />
                  </div>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-black text-purple-400 tracking-wider flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-purple-400" /> Acesso Vitalício
                </span>
                <p className="text-xs sm:text-sm font-black text-white truncate max-w-[160px] sm:max-w-[200px] mt-0.5">
                  {itemTitle || "Moments Séries / Animes"}
                </p>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Liberação Automática
                </span>
              </div>
            </div>

            <div className="text-right shrink-0 pl-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Total a Pagar</span>
              <span className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 tracking-tight">
                R$ {Number(amount || 0).toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          {/* Área do QR Code com Viewfinder Futurista e Temporizador */}
          <div className="flex flex-col items-center justify-center py-0.5">
            {pixQrCodeBase64 ? (
              <div className="relative group p-3 bg-white rounded-2xl shadow-[0_15px_45px_rgba(16,185,129,0.18)] ring-2 sm:ring-4 ring-emerald-500/25 transition-all">
                {/* Viewfinder Corners */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-md pointer-events-none" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-md pointer-events-none" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-md pointer-events-none" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-md pointer-events-none" />

                <img
                  src={`data:image/png;base64,${pixQrCodeBase64}`}
                  alt="QR Code PIX Dinâmico"
                  className="w-40 h-40 sm:w-48 sm:h-48 max-w-full object-contain rounded-lg"
                />

                {isCompleted && (
                  <div className="absolute inset-0 bg-emerald-950/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-white animate-in zoom-in-95 z-20">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
                    <span className="text-base font-black mt-2 text-white">PIX Confirmado!</span>
                    <span className="text-xs text-emerald-300 mt-0.5">Liberando acesso...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-40 h-40 rounded-xl bg-white/[0.03] border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-400 p-3 text-center">
                <QrCode className="w-8 h-8 mb-2 opacity-50 text-purple-400" />
                <span className="text-xs font-semibold text-slate-300">Use a chave Copia e Cola abaixo</span>
              </div>
            )}

            {/* Temporizador */}
            <div className="flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] sm:text-[11px] font-medium text-slate-300">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>QR Code válido por:</span>
              <span className="text-emerald-400 font-mono font-black">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Chave PIX Copia e Cola Padronizada */}
          {pixQrCode && (
            <div className="space-y-2 min-w-0 w-full">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-0.5">
                <span className="flex items-center gap-1 text-slate-200">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  Código Copia e Cola:
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">Toque para copiar</span>
              </div>

              {/* Caixa de Código com overflow contido */}
              <div 
                onClick={handleCopy}
                className="w-full min-w-0 bg-black/40 hover:bg-black/60 border border-white/10 hover:border-emerald-500/40 p-2.5 rounded-xl cursor-pointer transition-all shadow-inner"
              >
                <p className="font-mono text-[11px] text-slate-300 truncate select-all">
                  {pixQrCode}
                </p>
              </div>

              {/* Botão Principal Padronizado (h-12, rounded-xl) */}
              <Button
                type="button"
                onClick={handleCopy}
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

          {/* Botão Secundário Padronizado (h-12, rounded-xl) */}
          <div className="space-y-2.5 pt-0.5">
            <Button
              type="button"
              onClick={handleManualCheck}
              disabled={isChecking || isCompleted}
              variant="outline"
              className="w-full h-12 rounded-xl border border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.05] text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span>Consultando compensação no banco...</span>
                </>
              ) : isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Acesso Liberado com Sucesso!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  <span>Já Fiz o Pagamento no Meu Banco</span>
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              <span>A tela atualiza automaticamente assim que o banco aprova o PIX</span>
            </div>

            {/* Badges de Confiança */}
            <div className="flex items-center justify-center gap-3 pt-1 text-[10px] text-slate-400 border-t border-white/[0.06]">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" /> SSL 256-bit
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" /> Liberação Automática
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Acesso Vitalício
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
