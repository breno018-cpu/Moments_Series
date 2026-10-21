import { useEffect, useState } from 'react';
import { useSiteSettings, useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MessageCircle,
  Save,
  RotateCcw,
  Sparkles,
  Send,
  CheckCircle2,
  HelpCircle,
  Smartphone,
  Eye,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { wa } from '@/lib/whatsapp.client';
import { toast } from 'sonner';

export const DEFAULT_SALES_TEMPLATE = `Oba, *{nome}*! 🚀

Seu pagamento referente ao pedido *#{pedido}* foi *CONFIRMADO* com sucesso!

💰 Valor: *R$ {valor}*
🍿 Conteúdo: *{itens}*

🔗 *Seu link de acesso exclusivo à série está liberado:*
{link}

Aproveite e assista direto no seu celular ou navegador! Qualquer dúvida estamos à disposição.`;

export const DEFAULT_PIX_TEMPLATE = `Olá *{nome}*! 👋

Recebemos seu pedido *#{pedido}* no Moments Séries no valor de *R$ {valor}*.

Itens: *{itens}*

Para liberar seu acesso na hora, efetue o pagamento com o código PIX Copia e Cola abaixo:

\`\`\`
{pix_copia_cola}
\`\`\`

Assim que confirmado, seu link será liberado automaticamente aqui no WhatsApp!`;

export const AdminWhatsAppMessageSettings = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const update = useUpdateSiteSetting();

  const [salesTemplate, setSalesTemplate] = useState(DEFAULT_SALES_TEMPLATE);
  const [pixTemplate, setPixTemplate] = useState(DEFAULT_PIX_TEMPLATE);
  const [autoDispatchEnabled, setAutoDispatchEnabled] = useState(false);
  const [testPhone, setTestPhone] = useState('37999323791');
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    if (settings) {
      if (settings.whatsapp_sales_template) {
        setSalesTemplate(settings.whatsapp_sales_template);
      }
      if (settings.whatsapp_pix_template) {
        setPixTemplate(settings.whatsapp_pix_template);
      }
      setAutoDispatchEnabled(settings.whatsapp_auto_dispatch_enabled === 'true');
    }
  }, [settings]);

  const handleToggleAutoDispatch = (checked: boolean) => {
    setAutoDispatchEnabled(checked);
    update.mutate({
      key: 'whatsapp_auto_dispatch_enabled',
      value: checked ? 'true' : 'false',
    });
    if (checked) {
      toast.success('Envio automático via WhatsApp ativado!');
    } else {
      toast.info('Envio automático pausado. Nenhuma mensagem será disparada sem ação manual.');
    }
  };

  const handleSaveSales = () => {
    update.mutate({
      key: 'whatsapp_sales_template',
      value: salesTemplate,
    });
  };

  const handleSavePix = () => {
    update.mutate({
      key: 'whatsapp_pix_template',
      value: pixTemplate,
    });
  };

  const handleResetSales = () => {
    setSalesTemplate(DEFAULT_SALES_TEMPLATE);
    update.mutate({
      key: 'whatsapp_sales_template',
      value: DEFAULT_SALES_TEMPLATE,
    });
    toast.info('Template de confirmação restaurado para o padrão.');
  };

  const handleResetPix = () => {
    setPixTemplate(DEFAULT_PIX_TEMPLATE);
    update.mutate({
      key: 'whatsapp_pix_template',
      value: DEFAULT_PIX_TEMPLATE,
    });
    toast.info('Template de PIX restaurado para o padrão.');
  };

  // Renderiza a prévia substituindo as variáveis de exemplo
  const renderPreview = (template: string) => {
    return template
      .replace(/{nome}/g, 'Lauren')
      .replace(/{pedido}/g, '42918')
      .replace(/{valor}/g, '19,90')
      .replace(/{itens}/g, 'Amor Proibido (Temporada Completa)')
      .replace(/{link}/g, 'https://moments.app.br/acesso/player?token=demo')
      .replace(/{pix_copia_cola}/g, '00020126580014br.gov.bcb.pix0136123e4567...');
  };

  const handleSendTestMessage = async () => {
    const cleanPhone = testPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('Digite um número de telefone válido com DDD');
      return;
    }

    setIsSendingTest(true);
    try {
      const demoMessage = renderPreview(salesTemplate);
      const res = await wa.notify({
        event: 'PAYMENT_APPROVED',
        customerName: 'Lauren',
        customerPhone: cleanPhone,
        orderId: 'DEMO-PREVIEW',
        totalAmount: 19.90,
        items: ['Amor Proibido (Temporada Completa): https://moments.app.br/acesso/player?token=demo'],
        trackingUrl: 'https://moments.app.br/acesso/player?token=demo',
        customMessage: demoMessage,
        labels: ['Teste Manual', 'Preview Template'],
      });

      if (res.success) {
        toast.success(`Mensagem de teste enviada com sucesso para o WhatsApp!`);
      } else {
        toast.error(`Falha no envio: ${res.error || 'Verifique o Gateway'}`);
      }
    } catch (err: any) {
      toast.error(`Erro ao disparar teste: ${err.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Informativo */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 text-zinc-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-zinc-950 flex items-center gap-2">
              Mensagens Automáticas do WhatsApp Gateway (PixelLoom / WA-AKG)
            </h3>
            <p className="text-xs text-zinc-600 mt-0.5">
              Personalize o texto exato que seu cliente receberá no WhatsApp assim que o pagamento PIX for confirmado.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/80 p-2 px-3 rounded-xl border border-zinc-200">
          <div className="text-right">
            <div className="text-xs font-black text-zinc-900">Disparo Automático</div>
            <div className="text-[10px] text-zinc-500 font-medium">
              {autoDispatchEnabled ? "Ativo para novos pagamentos" : "Pausado (Modo Seguro)"}
            </div>
          </div>
          <Switch
            checked={autoDispatchEnabled}
            onCheckedChange={handleToggleAutoDispatch}
          />
        </div>
      </div>

      {/* Grid Principal: Editor de Mensagem e Prévia ao Vivo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna 1: Editores de Template (7 colunas) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Mensagem de Venda Confirmada com Link */}
          <Card className="bg-white border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-zinc-950 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    Mensagem de Compra Confirmada (Com Link da Série)
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500 mt-0.5">
                    Enviada no milissegundo em que o PIX é compensado.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetSales}
                  className="text-xs text-zinc-500 hover:text-zinc-900 gap-1 h-8"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Padrão
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Tags / Variáveis Dinâmicas Disponíveis */}
              <div>
                <Label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 mb-2 block">
                  Tags que você pode usar no texto (clique para copiar/inserir):
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { tag: '{nome}', desc: 'Nome do comprador' },
                    { tag: '{pedido}', desc: 'Número do pedido' },
                    { tag: '{valor}', desc: 'Valor total pago' },
                    { tag: '{itens}', desc: 'Nome da(s) série(s)' },
                    { tag: '{link}', desc: 'Link direto de acesso à série' },
                  ].map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => setSalesTemplate((prev) => `${prev} ${item.tag}`)}
                      className="px-2 py-1 rounded-md bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-zinc-200 text-zinc-700 text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1"
                      title={item.desc}
                    >
                      <span>{item.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea do Template */}
              <div>
                <Label className="text-xs font-bold text-zinc-800 mb-1.5 block">
                  Texto da Mensagem no WhatsApp:
                </Label>
                <Textarea
                  value={salesTemplate}
                  onChange={(e) => setSalesTemplate(e.target.value)}
                  rows={8}
                  className="font-sans text-xs sm:text-sm bg-white border-zinc-200 text-zinc-950 focus-visible:ring-emerald-500 leading-relaxed custom-scrollbar resize-y"
                  placeholder="Digite a mensagem que o cliente receberá..."
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  💡 Você pode usar formatação do WhatsApp: <strong>*negrito*</strong>, <em>_itálico_</em> e <code>```código```</code>.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveSales}
                  disabled={update.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 rounded-xl shadow-xs"
                >
                  <Save className="h-4 w-4" />
                  Salvar Mensagem de Compra
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Mensagem de PIX Gerado com Copia e Cola */}
          <Card className="bg-white border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-zinc-950 flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-teal-600" />
                    Mensagem de PIX Gerado (Copia e Cola)
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500 mt-0.5">
                    Enviada quando o cliente gera a chave PIX no checkout antes de pagar.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetPix}
                  className="text-xs text-zinc-500 hover:text-zinc-900 gap-1 h-8"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Padrão
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div>
                <Label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 mb-2 block">
                  Tags disponíveis:
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { tag: '{nome}', desc: 'Nome' },
                    { tag: '{pedido}', desc: 'Pedido' },
                    { tag: '{valor}', desc: 'Valor' },
                    { tag: '{itens}', desc: 'Série' },
                    { tag: '{pix_copia_cola}', desc: 'Código PIX' },
                  ].map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => setPixTemplate((prev) => `${prev} ${item.tag}`)}
                      className="px-2 py-1 rounded-md bg-zinc-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-zinc-200 text-zinc-700 text-xs font-mono font-bold transition-colors cursor-pointer"
                      title={item.desc}
                    >
                      <span>{item.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Textarea
                  value={pixTemplate}
                  onChange={(e) => setPixTemplate(e.target.value)}
                  rows={6}
                  className="font-sans text-xs sm:text-sm bg-white border-zinc-200 text-zinc-950 focus-visible:ring-teal-500 leading-relaxed custom-scrollbar resize-y"
                  placeholder="Digite a mensagem com o PIX Copia e Cola..."
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSavePix}
                  disabled={update.isPending}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs gap-1.5 rounded-xl shadow-xs"
                >
                  <Save className="h-4 w-4" />
                  Salvar Mensagem do PIX
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2: Prévia Visual ao Vivo no Estilo Balão do WhatsApp (5 colunas) */}
        <div className="lg:col-span-5 space-y-6 sticky top-6">
          <Card className="bg-[#efeae2] border-zinc-300/80 shadow-md rounded-3xl overflow-hidden relative">
            {/* Header imitando o WhatsApp */}
            <div className="bg-[#075e54] text-white p-3.5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs uppercase">
                  M
                </div>
                <div>
                  <h4 className="font-bold text-xs tracking-tight">Moments Séries VIP</h4>
                  <p className="text-[10px] text-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    online
                  </p>
                </div>
              </div>

              <Badge className="bg-[#128c7e] text-white border-0 text-[10px] font-bold">
                Prévia ao Vivo
              </Badge>
            </div>

            {/* Fundo de conversa do WhatsApp com balão de mensagem */}
            <div className="p-4 sm:p-5 min-h-[360px] flex flex-col justify-end bg-[#efeae2] relative">
              {/* Balão verde de mensagem enviada */}
              <div className="self-end max-w-[92%] bg-[#d9fdd3] text-zinc-900 rounded-2xl rounded-tr-xs p-3.5 shadow-sm text-xs leading-relaxed space-y-2 relative border border-[#c1e8b9]">
                <p className="whitespace-pre-wrap font-sans text-xs text-zinc-900 selection:bg-emerald-200">
                  {renderPreview(salesTemplate)}
                </p>
                <div className="flex items-center justify-end gap-1 text-[9px] text-zinc-500 pt-1">
                  <span>13:45</span>
                  <span className="text-[#53bdeb] font-bold">✓✓</span>
                </div>
              </div>
            </div>

            {/* Teste Imediato de Disparo */}
            <div className="p-4 bg-white border-t border-zinc-200 space-y-3">
              <Label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 text-emerald-600" />
                Enviar Mensagem de Teste Real:
              </Label>
              <div className="flex gap-2">
                <Input
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="(37) 9 9932-3791"
                  className="text-xs bg-white border-zinc-200 h-9"
                />
                <Button
                  onClick={handleSendTestMessage}
                  disabled={isSendingTest}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 rounded-xl gap-1 shadow-xs"
                >
                  {isSendingTest ? 'Enviando...' : 'Testar Agora'}
                </Button>
              </div>
              <p className="text-[10px] text-zinc-500">
                Dispara esta mensagem exata para o número acima usando a sessão ativa no WhatsApp Gateway.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminWhatsAppMessageSettings;
