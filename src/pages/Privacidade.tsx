import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield } from "lucide-react";

const Privacidade = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12">
        <article className="app-container max-w-3xl">
          <header className="mb-10 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/15 mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-3 text-primary">
              Política de Privacidade
            </h1>
            <p className="text-sm text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </header>

          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">1. Dados que Coletamos</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Nome, e-mail e telefone informados no checkout</li>
                <li>Dados de pagamento processados pelo Mercado Pago (não armazenamos dados de cartão)</li>
                <li>Informações de navegação: páginas visitadas, dispositivo, navegador, origem (UTMs)</li>
                <li>Cookies de marketing (Meta Pixel) para mensuração de campanhas</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">2. Como Utilizamos os Dados</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Processar pedidos e enviar acesso ao conteúdo</li>
                <li>Comunicação de suporte e pós-venda</li>
                <li>Análise estatística para melhorar a plataforma</li>
                <li>Mensuração de campanhas publicitárias (Meta Ads, com dados criptografados via SHA-256)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">3. Compartilhamento</h2>
              <p className="text-muted-foreground">
                Compartilhamos dados estritamente com provedores necessários para a
                operação: Mercado Pago (pagamento), Resend (envio de e-mails) e Meta
                (eventos de conversão criptografados). Nenhum dado é vendido a terceiros.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">4. Segurança</h2>
              <p className="text-muted-foreground">
                Utilizamos conexões HTTPS, banco de dados com Row Level Security (RLS),
                criptografia de dados sensíveis e infraestrutura monitorada. Tokens de
                acesso ao seu pedido são gerados de forma única e segura.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">5. Seus Direitos (LGPD)</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Solicitar acesso aos seus dados</li>
                <li>Corrigir informações incorretas</li>
                <li>Solicitar exclusão (exceto registros fiscais obrigatórios)</li>
                <li>Revogar consentimento de marketing</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Para exercer seus direitos, entre em contato pelo WhatsApp do rodapé.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">6. Cookies</h2>
              <p className="text-muted-foreground">
                Utilizamos cookies essenciais para o funcionamento do carrinho e cookies
                de marketing (Meta Pixel) para mensuração de anúncios. Você pode
                desativar cookies nas configurações do seu navegador.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">7. Retenção</h2>
              <p className="text-muted-foreground">
                Mantemos dados de pedidos pelo prazo legal (5 anos). Dados de marketing
                são anonimizados após 12 meses sem nova interação.
              </p>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default Privacidade;
