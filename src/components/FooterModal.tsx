import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface FooterModalProps {
  type: "termos" | "privacidade" | "faq";
  onClose: () => void;
}

const FAQ_ITEMS = [
  {
    q: "Como funciona a compra?",
    a: "Você escolhe a série ou pack desejado, adiciona ao carrinho e finaliza o pagamento via Pix ou Mercado Pago. Após a confirmação, o acesso é liberado automaticamente.",
  },
  {
    q: "Como recebo meu conteúdo?",
    a: "Após a confirmação do pagamento, você receberá um link de acesso por e-mail com instruções para assistir ao conteúdo adquirido.",
  },
  {
    q: "Posso assistir em qualquer dispositivo?",
    a: "Sim! O conteúdo pode ser acessado em smartphones, tablets, computadores e smart TVs com navegador compatível.",
  },
  {
    q: "Qual o prazo de acesso?",
    a: "O acesso ao conteúdo é vitalício. Uma vez adquirido, você pode assistir quantas vezes quiser, sem prazo de expiração.",
  },
  {
    q: "Como funciona o cupom de desconto?",
    a: "Na tela de checkout, insira o código do cupom no campo indicado. O desconto será aplicado automaticamente ao valor total do pedido.",
  },
];

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/8 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-3"
      >
        <span className="text-sm font-body font-medium text-foreground/80">{q}</span>
        <ChevronDown
          size={16}
          className={`text-muted-foreground/50 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="text-xs font-body text-muted-foreground/60 pb-4 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CONTENT: Record<string, { title: string; body: React.ReactNode }> = {
  termos: {
    title: "Termos de Uso",
    body: (
      <div className="space-y-4 text-xs font-body text-muted-foreground/60 leading-relaxed">
        <p><strong className="text-foreground/70">1. Aceitação dos Termos</strong><br />
          Ao acessar e utilizar a plataforma Hangar Box, você concorda integralmente com estes Termos de Uso. Caso não concorde, recomendamos que não utilize nossos serviços.</p>
        <p><strong className="text-foreground/70">2. Serviços Oferecidos</strong><br />
          A Hangar Box é uma plataforma de venda de conteúdos digitais, incluindo séries, doramas, novelas, livros e outros materiais audiovisuais. Os conteúdos são disponibilizados mediante pagamento.</p>
        <p><strong className="text-foreground/70">3. Conta do Usuário</strong><br />
          Para realizar compras, não é necessário criar conta. Os dados de e-mail e nome fornecidos no checkout são utilizados exclusivamente para entrega do conteúdo e comunicação sobre o pedido.</p>
        <p><strong className="text-foreground/70">4. Pagamento</strong><br />
          Os pagamentos são processados via Pix e Mercado Pago. A liberação do conteúdo ocorre após a confirmação do pagamento pela instituição financeira.</p>
        <p><strong className="text-foreground/70">5. Propriedade Intelectual</strong><br />
          Todo o conteúdo disponibilizado é protegido por direitos autorais. É proibida a reprodução, distribuição ou compartilhamento dos materiais adquiridos.</p>
      </div>
    ),
  },
  privacidade: {
    title: "Política de Privacidade",
    body: (
      <div className="space-y-4 text-xs font-body text-muted-foreground/60 leading-relaxed">
        <p><strong className="text-foreground/70">1. Dados Coletados</strong><br />
          Coletamos apenas os dados necessários para processar suas compras: nome, e-mail e informações de pagamento. Não armazenamos dados de cartão de crédito.</p>
        <p><strong className="text-foreground/70">2. Uso dos Dados</strong><br />
          Seus dados são utilizados exclusivamente para: processar pedidos, enviar links de acesso ao conteúdo adquirido e comunicação sobre status de compras.</p>
        <p><strong className="text-foreground/70">3. Compartilhamento</strong><br />
          Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros, exceto quando necessário para processamento de pagamento (Mercado Pago).</p>
        <p><strong className="text-foreground/70">4. Segurança</strong><br />
          Utilizamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração ou destruição.</p>
        <p><strong className="text-foreground/70">5. Cookies</strong><br />
          Utilizamos cookies essenciais para funcionamento do site e verificação de idade. Não utilizamos cookies de rastreamento de terceiros.</p>
        <p><strong className="text-foreground/70">6. Seus Direitos (LGPD)</strong><br />
          Conforme a Lei Geral de Proteção de Dados, você tem direito a: acessar, corrigir, excluir seus dados e revogar consentimento a qualquer momento via WhatsApp.</p>
      </div>
    ),
  },
  faq: {
    title: "Perguntas Frequentes",
    body: (
      <div>
        {FAQ_ITEMS.map((item, i) => (
          <FaqItem key={i} q={item.q} a={item.a} />
        ))}
      </div>
    ),
  },
};

const FooterModal = ({ type, onClose }: FooterModalProps) => {
  const isMobile = useIsMobile();
  const { title, body } = CONTENT[type];

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={isMobile ? { y: "100%" } : { scale: 0.95, opacity: 0 }}
        animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
        exit={isMobile ? { y: "100%" } : { scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 w-full md:max-w-lg max-h-[85vh] bg-card border border-border/10 rounded-t-2xl md:rounded-2xl shadow-elevated overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-border/8">
          <h2 className="text-base md:text-lg font-display text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-muted-foreground/50 hover:text-foreground/70 transition-colors rounded-full hover:bg-secondary/40">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-5 scrollbar-hide">
          {body}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FooterModal;