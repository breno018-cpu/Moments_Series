import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppLogEntry {
  orderId: string;
  customerName: string;
  customerPhone: string;
  status: "sent" | "error";
  sentAt: string;
  messageId?: string;
  errorMessage?: string;
  items?: string;
}

const STORAGE_KEY = "moments_whatsapp_sales_logs";

/**
 * Salva um log de envio de WhatsApp tanto no localStorage quanto sincronizado no site_settings do Supabase
 */
export async function logWhatsAppDispatch(entry: WhatsAppLogEntry) {
  try {
    // 1. Salvar localmente para exibição instantânea
    const current = getLocalWhatsAppLogs();
    const updated = [entry, ...current.filter((l) => l.orderId !== entry.orderId)].slice(0, 500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // 2. Persistir no Supabase em site_settings sob a chave 'wa_sales_dispatches'
    const payloadStr = JSON.stringify(updated.slice(0, 100)); // guarda até 100 mais recentes na nuvem
    await supabase.from("site_settings").upsert(
      {
        key: "wa_sales_dispatches",
        value: payloadStr,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
  } catch (err) {
    console.error("[WhatsApp Logging Error]:", err);
  }
}

/**
 * Lê os logs locais salvos no navegador
 */
export function getLocalWhatsAppLogs(): WhatsAppLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Carrega logs do Supabase e sincroniza o cache local
 */
export async function fetchRemoteWhatsAppLogs(): Promise<WhatsAppLogEntry[]> {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "wa_sales_dispatches")
      .maybeSingle();

    if (data?.value) {
      const parsed: WhatsAppLogEntry[] = JSON.parse(data.value);
      // Mescla com locais preservando o mais recente
      const local = getLocalWhatsAppLogs();
      const map = new Map<string, WhatsAppLogEntry>();
      [...local, ...parsed].forEach((item) => {
        if (!map.has(item.orderId)) {
          map.set(item.orderId, item);
        }
      });
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn("[WhatsApp Fetch Logs Warn]:", err);
  }
  return getLocalWhatsAppLogs();
}
