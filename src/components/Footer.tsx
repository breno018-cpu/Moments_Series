import { Instagram, MessageCircle, Send, ShieldCheck, Zap, HeartHandshake, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { LegalDialog } from "@/components/LegalDialog";

const Footer = () => {
  const { data: settings } = useSiteSettings();
  const copaActive = settings?.copa_theme_active === 'true';
  const halloweenActive = settings?.halloween_theme_active === 'true';
  const christmasActive = settings?.christmas_theme_active === 'true';
  const newyearActive = settings?.newyear_theme_active === 'true';

  const whatsapp = (settings?.whatsapp_number || "5581991768142").replace(/\D/g, "");
  const telegram = (settings?.telegram_username || "rayanest5").replace(/^@/, "");
  const instagram =
    settings?.instagram_url ||
    "https://www.instagram.com/momentsseries2?igsh=MW9vZnNscmRlN3E0OA==";

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent("Olá! Gostaria de saber mais sobre a Moments série.");
    window.open(`https://wa.me/${whatsapp}?text=${message}`, "_blank");
  };

  return (
    <footer className="relative bg-card border-t border-border mt-20 pb-20 md:pb-0 overflow-hidden">
      {/* Glow decorativo */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[60rem] h-[40rem] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="app-container py-12 sm:py-16 relative">
        {/* Trust badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 pb-10 border-b border-border">
          {[
            { icon: ShieldCheck, title: "100% Seguro", desc: "Pagamento criptografado" },
            { icon: Zap, title: "Acesso Imediato", desc: "Liberação automática" },
            { icon: HeartHandshake, title: "Suporte Real", desc: "Atendimento humano" },
            { icon: Lock, title: "Dados Protegidos", desc: "LGPD compliant" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 group">
              <div className="h-11 w-11 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors flex-shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{title}</p>
                <p className="text-xs text-muted-foreground truncate">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mb-12">
          <LeadCaptureForm />
        </div>

        {/* 4 colunas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl font-black tracking-tight text-white">
                MOMENTS
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300 bg-purple-500/20 border border-purple-500/40 px-1.5 py-0.5 rounded shadow-sm">
                SÉRIES
              </span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed mb-4">
              Sua plataforma premium para assistir às melhores séries e animes com qualidade máxima e acesso instantâneo via PIX.
            </p>
            <div className="flex gap-2">
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-muted hover:bg-gradient-to-br hover:from-pink-500 hover:via-purple-500 hover:to-orange-400 hover:text-white flex items-center justify-center transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <button
                onClick={handleWhatsAppContact}
                className="h-10 w-10 rounded-full bg-muted hover:bg-green-500 hover:text-white flex items-center justify-center transition-all hover:scale-110"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <a
                href={`https://t.me/${telegram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-muted hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all hover:scale-110"
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-foreground/90">
              Navegar
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Início</Link></li>
              <li><Link to="/?genre=series" className="text-muted-foreground hover:text-primary transition-colors">Séries</Link></li>
              <li><Link to="/animes" className="text-muted-foreground hover:text-primary transition-colors">Animes</Link></li>
              <li><Link to="/favoritos" className="text-muted-foreground hover:text-primary transition-colors">Favoritos</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-foreground/90">
              Suporte
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  Dúvidas Frequentes & FAQ
                </Link>
              </li>
              <li>
                <button onClick={handleWhatsAppContact} className="text-muted-foreground hover:text-primary transition-colors">
                  WhatsApp
                </button>
              </li>
              <li>
                <a href={`https://t.me/${telegram}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  Telegram
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-foreground/90">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/termos" className="text-muted-foreground hover:text-primary transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/privacidade" className="text-muted-foreground hover:text-primary transition-colors">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Métodos de pagamento */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground text-center sm:text-left">
            <span>© {new Date().getFullYear()} Moments Séries. Todos os direitos reservados.</span>
            <Link
              to="/auth"
              className="text-muted-foreground/30 hover:text-muted-foreground/80 transition-colors inline-flex items-center p-1"
              title="Painel Administrativo"
            >
              <Lock className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Pagamentos:</span>
            <div className="flex items-center gap-2">
              <div className="h-7 px-2.5 rounded bg-muted border border-border flex items-center text-[10px] font-bold text-foreground/80">PIX</div>
              <div className="h-7 px-2.5 rounded bg-muted border border-border flex items-center text-[10px] font-bold text-foreground/80">VISA</div>
              <div className="h-7 px-2.5 rounded bg-muted border border-border flex items-center text-[10px] font-bold text-foreground/80">MASTER</div>
              <div className="h-7 px-2.5 rounded bg-muted border border-border flex items-center text-[10px] font-bold text-foreground/80">ELO</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-border/50 text-[10px] text-muted-foreground/60">
          <p className="tracking-wide">
            Sua plataforma premium de séries e entretenimento.
          </p>
          {copaActive && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold tracking-wider text-[9px] uppercase mt-2 sm:mt-0 select-none">
              <span>Copa 2026: Torcida Moments</span>
            </div>
          )}
          {halloweenActive && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-semibold tracking-wider text-[9px] uppercase mt-2 sm:mt-0 select-none">
              <span>🎃 Especial Halloween: Portal das Sombras</span>
            </div>
          )}
          {christmasActive && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-semibold tracking-wider text-[9px] uppercase mt-2 sm:mt-0 select-none">
              <span>🎄 Moments Natalino: Boas Festas</span>
            </div>
          )}
          {newyearActive && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold tracking-wider text-[9px] uppercase mt-2 sm:mt-0 select-none">
              <span>✨ Virada Moments: Feliz Ano Novo</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
