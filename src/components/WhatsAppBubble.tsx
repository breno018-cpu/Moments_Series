import { MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function WhatsAppBubble() {
  const { data: settings } = useSiteSettings();
  const rawNumber = settings?.whatsapp_number || "5511999999999";
  const cleanNumber = rawNumber.replace(/\D/g, "");

  // Ocultar completamente em rotas administrativas e na tela de login
  if (typeof window !== "undefined") {
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.startsWith("/admin") || pathname === "/auth") {
      return null;
    }
  }

  return (
    <a
      href={`https://wa.me/${cleanNumber}?text=Olá!%20Vim%20pelo%20site%20e%20gostaria%20de%20tirar%20dúvidas.`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500 text-white shadow-xl hover:scale-110 active:scale-95 transition-transform duration-300"
      aria-label="Atendimento via WhatsApp"
    >
      <MessageCircle className="h-6 w-6 fill-current" />
    </a>
  );
}
