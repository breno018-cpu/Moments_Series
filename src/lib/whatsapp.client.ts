import axios, { AxiosInstance } from "axios";

export type SalesEventType = 
  | "PIX_GENERATED"
  | "ORDER_CREATED"
  | "PAYMENT_APPROVED"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "ABANDONED_CART"
  | "FEEDBACK_REQUEST"
  | "CUSTOM";

export interface SalesNotificationPayload {
  event: SalesEventType;
  customerName: string;
  customerPhone: string;
  orderId?: string | number;
  totalAmount?: string | number;
  items?: string | string[];
  pixCode?: string;
  pixExpiresInMinutes?: number;
  trackingCode?: string;
  trackingUrl?: string;
  carrier?: string;
  recoveryUrl?: string;
  customMessage?: string;
  interactiveMode?: "LIST" | "BUTTONS" | "TEXT";
  webhookUrl?: string;
  labels?: string[]; // Cria etiquetas no CRM do WhatsApp (Ex: "Já Comprou", "Série Gold")
}

export class WhatsAppGateway {
  private api: AxiosInstance;
  private sessionId: string;

  constructor() {
    // Compatível com Vite (import.meta.env) e Node (process.env)
    const viteEnv = typeof import.meta !== "undefined" ? (import.meta as any).env : undefined;
    const procEnv = typeof process !== "undefined" ? process.env : undefined;

    const isBrowser = typeof window !== "undefined";
    const isLocalhost = isBrowser && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    // No navegador em ambiente de desenvolvimento local, usa o proxy do Vite para evitar bloqueio de CORS (Network Error)
    let baseURL =
      viteEnv?.VITE_WHATSAPP_GATEWAY_URL ||
      viteEnv?.WHATSAPP_GATEWAY_URL ||
      procEnv?.VITE_WHATSAPP_GATEWAY_URL ||
      procEnv?.WHATSAPP_GATEWAY_URL ||
      "http://localhost:3000";

    if (isBrowser && isLocalhost && (baseURL.includes("localhost:3000") || baseURL.includes("127.0.0.1:3000"))) {
      baseURL = "/api/whatsapp-gateway";
    }

    const apiKey =
      viteEnv?.VITE_WHATSAPP_API_KEY ||
      viteEnv?.WHATSAPP_API_KEY ||
      procEnv?.VITE_WHATSAPP_API_KEY ||
      procEnv?.WHATSAPP_API_KEY ||
      "pxl_master_08a16f5e64dabd5d12af10644f22ada83fe46206272d093d";

    this.sessionId =
      viteEnv?.VITE_WHATSAPP_SESSION_ID ||
      viteEnv?.WHATSAPP_SESSION_ID ||
      procEnv?.VITE_WHATSAPP_SESSION_ID ||
      procEnv?.WHATSAPP_SESSION_ID ||
      "OPE-01";

    this.api = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      }
    });
  }

  /**
   * 1. Notificações Transacionais e CRM com Auto-Tagging
   */
  async notify(data: SalesNotificationPayload) {
    try {
      // Normalização do telefone para formato internacional caso venha com máscara
      const cleanPhone = data.customerPhone ? data.customerPhone.replace(/\D/g, "") : "";
      
      const response = await this.api.post("/api/sales/notify", {
        sessionId: this.sessionId,
        ...data,
        customerPhone: cleanPhone || data.customerPhone
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      console.error(`[WhatsApp Error] Falha no evento ${data.event}:`, message);
      return { success: false, error: message };
    }
  }

  /**
   * 2. Disparos em Massa com Rotação Anti-Spam (Spintax) e Botões
   */
  async broadcast(params: {
    recipients: string[];
    messages: string[];
    delay?: number;
    dailyLimit?: number;
    buttons?: { id: string; text: string }[];
    labelsToAssign?: string[];
  }) {
    try {
      const response = await this.api.post(`/api/messages/${this.sessionId}/broadcast`, {
        recipients: params.recipients,
        messages: params.messages,
        delay: params.delay || 6000,
        dailyLimit: params.dailyLimit || 250,
        interactiveMode: params.buttons?.length ? "BUTTONS" : "NONE",
        buttons: params.buttons,
        labelsToAssign: params.labelsToAssign || ["Campanha Sistema"]
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      console.error("[WhatsApp Broadcast Error]:", message);
      return { success: false, error: message };
    }
  }
}

export const wa = new WhatsAppGateway();
