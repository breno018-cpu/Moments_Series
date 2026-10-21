import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function SupportNoticeModal() {
  const { data: settings } = useSiteSettings();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (settings?.popup_active === "true") {
      const shown = sessionStorage.getItem("moments_notice_shown");
      if (!shown) {
        setIsOpen(true);
      }
    }
  }, [settings?.popup_active]);

  const handleClose = () => {
    sessionStorage.setItem("moments_notice_shown", "true");
    setIsOpen(false);
  };

  if (!settings || settings.popup_active !== "true") return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-[#0c0d14] border-white/10 text-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{settings.popup_title || "Aviso Importante"}</DialogTitle>
          <DialogDescription className="text-slate-300 text-sm mt-2">
            {settings.popup_message || "Bem-vindo ao Moments Séries! Aproveite nosso catálogo exclusivo com acesso vitalício."}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Button onClick={handleClose} className="w-full font-bold bg-gradient-to-r from-purple-600 to-indigo-600">
            {settings.popup_button_text || "Entendido"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
