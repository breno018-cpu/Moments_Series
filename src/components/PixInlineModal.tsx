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
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-[400px] max-h-[92vh] overflow-y-auto overflow-x-hidden p-6 bg-[#0c0d14] border border-white/10 text-white rounded-3xl shadow-2xl backdrop-blur-2xl select-none">
        {/* Cabeçalho Limpo Estilo Nubank / Apple Pay */}
        <div className="text-center space-y-1 pt-1 pb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Pagamento via PIX
          </div>

          <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            R$ {Number(amount || 0).toFixed(2).replace(".", ",")}
          </div>

          <DialogTitle className="text-sm font-medium text-slate-300 truncate max-w-[280px] mx-auto">
            {itemTitle || "Moments Séries"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Efetue o pagamento PIX para liberação imediata.
          </DialogDescription>
        </div>

        {/* QR Code Limpo em Fundo Branco Arredondado */}
        <div className="flex flex-col items-center justify-center py-2">
          {pixQrCodeBase64 ? (
            <div className="relative p-3.5 bg-white rounded-2xl shadow-xl shadow-black/50">
              <img
                src={`data:image/png;base64,${pixQrCodeBase64}`}
                alt="QR Code PIX"
                className="w-48 h-48 max-w-full object-contain rounded-lg"
              />

              {isCompleted && (
                <div className="absolute inset-0 bg-emerald-950/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white animate-in zoom-in-95 z-20">
                  <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-bounce" />
                  <span className="text-base font-bold mt-2 text-white">PIX Confirmado!</span>
                  <span className="text-xs text-emerald-300">Liberando acesso...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-48 h-48 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
              <QrCode className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
              <span className="text-xs text-slate-300">Carregando código...</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Código válido por</span>
            <span className="font-semibold text-white font-mono">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Ações Padronizadas e Limpas */}
        <div className="space-y-3 pt-2">
          {pixQrCode && (
            <Button
              type="button"
              onClick={handleCopy}
              className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-[0.99] ${
                copied
                  ? "bg-emerald-600 text-white shadow-emerald-950/80 hover:bg-emerald-500"
                  : "bg-emerald-400 hover:bg-emerald-300 text-black shadow-emerald-950/40"
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
          )}

          <Button
            type="button"
            onClick={handleManualCheck}
            disabled={isChecking || isCompleted}
            variant="ghost"
            className="w-full h-10 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Verificando com o banco...</span>
              </>
            ) : (
              <span>Já realizei o pagamento</span>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span>Acesso liberado automaticamente após confirmação</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
