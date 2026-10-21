import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { HelpCircle, MessageCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const faqs = [
  {
    q: "Como recebo o acesso após o pagamento?",
    a: "Assim que o PIX é confirmado (geralmente em segundos), o link de acesso é exibido na tela de sucesso e enviado para o seu e-mail cadastrado. Procure por mensagens que comecem com 'momen' na sua caixa de entrada.",
  },
  {
    q: "Não recebi o e-mail. O que faço?",
    a: "Confira a aba de SPAM/Promoções e busque por 'Moments' ou 'momen'. Se ainda não encontrar, entre em contato pelo WhatsApp informando o seu e-mail e o nome do conteúdo comprado — fazemos o reenvio em minutos.",
  },
  {
    q: "Quanto tempo tenho de acesso ao conteúdo?",
    a: "O acesso é vitalício enquanto a plataforma de hospedagem do conteúdo estiver ativa. Você pode assistir quando e quantas vezes quiser.",
  },
  {
    q: "Posso assistir pelo celular?",
    a: "Sim! Funciona em qualquer dispositivo com navegador. Ao abrir o link no celular, escolha 'ABRIR NO NAVEGADOR' e ignore o botão 'abrir no aplicativo' — não é necessário baixar nada.",
  },
  {
    q: "O pagamento é seguro?",
    a: "Sim. Utilizamos o Mercado Pago como processador de pagamentos, com criptografia de ponta a ponta. Não armazenamos dados de cartão e o PIX é processado direto no seu banco.",
  },
  {
    q: "Posso comprar vários títulos de uma vez?",
    a: "Sim! Adicione todos os títulos desejados ao carrinho e finalize com um único PIX. Todos os acessos são liberados de uma vez no mesmo e-mail.",
  },
  {
    q: "Como funcionam os cupons de desconto?",
    a: "Cupons promocionais podem ser aplicados na tela de checkout. Cada cupom pode ser usado apenas uma vez por e-mail e possui validade definida pela administração.",
  },
  {
    q: "O conteúdo é dublado ou legendado?",
    a: "Indicamos sempre na ficha de cada título se está disponível em PT-BR dublado, legendado, ou ambos. Use os filtros do catálogo para encontrar exatamente o que prefere.",
  },
  {
    q: "Como entro em contato com o suporte?",
    a: "Pelo WhatsApp ou Telegram disponibilizados no rodapé do site. Atendemos em horário comercial e respondemos com prioridade compradores ativos.",
  },
];

const FAQ = () => {
  const { data: settings } = useSiteSettings();
  const whatsapp = (settings?.whatsapp_number || "5581991768142").replace(/\D/g, "");

  const handleSupport = () => {
    const message = encodeURIComponent(
      "Olá! Tenho uma dúvida que não encontrei no FAQ.",
    );
    window.open(`https://wa.me/${whatsapp}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12">
        <div className="app-container max-w-3xl">
          <header className="mb-10 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/15 mb-4">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-3 text-primary">
              Perguntas Frequentes
            </h1>
            <p className="text-muted-foreground">
              Tudo o que você precisa saber sobre a Moments série
            </p>
          </header>

          <Accordion type="single" collapsible className="bg-card/50 border border-border rounded-xl px-4">
            {faqs.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border">
                <AccordionTrigger className="text-left font-semibold hover:text-primary">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-10 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Não encontrou sua dúvida?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Fale com a gente no WhatsApp — nossa equipe responde rapidamente.
            </p>
            <Button onClick={handleSupport} size="lg" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Falar com Suporte
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
