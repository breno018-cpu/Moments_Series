import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ScrollText } from "lucide-react";

const Termos = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12">
        <article className="app-container max-w-3xl">
          <header className="mb-10 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/15 mb-4">
              <ScrollText className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-3 text-primary">
              Termos de Uso
            </h1>
            <p className="text-sm text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </header>

          <section className="prose prose-invert max-w-none space-y-6 text-foreground/90">
            <div>
              <h2 className="text-2xl font-semibold mb-2">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground">
                Ao acessar e utilizar a Moments série, você concorda integralmente com estes
                Termos de Uso. Caso não concorde com qualquer disposição, recomendamos que
                não utilize a plataforma.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">2. Sobre o Serviço</h2>
              <p className="text-muted-foreground">
                A Moments série é uma plataforma de indicação e curadoria de conteúdo
                audiovisual. Ao realizar uma compra, você recebe acesso a links de
                visualização do conteúdo selecionado, enviados por e-mail e disponibilizados
                na página de sucesso.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">3. Pagamentos</h2>
              <p className="text-muted-foreground">
                Os pagamentos são processados via PIX por meio de provedores certificados
                (Mercado Pago). A liberação do acesso ocorre automaticamente após a
                confirmação do pagamento.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">4. Reembolso</h2>
              <p className="text-muted-foreground">
                Por se tratar de produto digital com entrega imediata, não há reembolso
                após o envio do link de acesso. Em caso de erro técnico ou link inválido,
                entre em contato com nosso suporte para reenvio.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">5. Uso Permitido</h2>
              <p className="text-muted-foreground">
                O acesso fornecido é pessoal e intransferível. Não é permitido revender,
                redistribuir ou compartilhar publicamente os links recebidos.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">6. Cupons e Descontos</h2>
              <p className="text-muted-foreground">
                Cupons promocionais possuem regras específicas de validade e podem ser
                utilizados apenas uma vez por e-mail. Reservamo-nos o direito de cancelar
                cupons em caso de uso indevido.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">7. Alterações</h2>
              <p className="text-muted-foreground">
                Estes termos podem ser atualizados a qualquer momento. As alterações
                entram em vigor a partir da publicação nesta página.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">8. Contato</h2>
              <p className="text-muted-foreground">
                Para dúvidas sobre estes termos, entre em contato pelo WhatsApp ou
                Telegram disponibilizados no rodapé do site.
              </p>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default Termos;
