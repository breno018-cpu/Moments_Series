import { useEffect, useState } from 'react';
import { useSiteSettings, useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Save, Loader2, Activity, ExternalLink, AlertCircle, CheckCircle2,
  ShieldCheck, Zap, KeyRound, FlaskConical, Sparkles, MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminMarketingSettings = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const { data: adminStatus } = useAdmin();
  const update = useUpdateSiteSetting();

  const isBreno = (adminStatus?.email || '').toLowerCase().includes('breno');

  const [pixelId, setPixelId] = useState('');
  const [capiToken, setCapiToken] = useState('');
  const [testCode, setTestCode] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [copaEnabled, setCopaEnabled] = useState('true');
  const [halloweenEnabled, setHalloweenEnabled] = useState('false');
  const [christmasEnabled, setChristmasEnabled] = useState('false');
  const [newyearEnabled, setNewyearEnabled] = useState('false');
  const [updatingTheme, setUpdatingTheme] = useState(false);

  // Pop-up Anúncio / Comunicado Dinâmico
  const [popupActive, setPopupActive] = useState('false');
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupButtonText, setPopupButtonText] = useState('');
  const [popupButtonLink, setPopupButtonLink] = useState('');
  const [savingPopup, setSavingPopup] = useState(false);

  useEffect(() => {
    if (settings) {
      setPixelId(settings.meta_pixel_id || '');
      setCapiToken(settings.meta_capi_token || '');
      setTestCode(settings.meta_test_event_code || '');
      setCopaEnabled(settings.copa_theme_active ?? 'false');
      setHalloweenEnabled(settings.halloween_theme_active ?? 'false');
      setChristmasEnabled(settings.christmas_theme_active ?? 'false');
      setNewyearEnabled(settings.newyear_theme_active ?? 'false');

      setPopupActive(settings.popup_active ?? 'false');
      setPopupTitle(settings.popup_title || '');
      setPopupMessage(settings.popup_message || '');
      setPopupButtonText(settings.popup_button_text || '');
      setPopupButtonLink(settings.popup_button_link || '');
    }
  }, [settings]);

  const handleToggleTheme = async (themeKey: 'copa_theme_active' | 'halloween_theme_active' | 'christmas_theme_active' | 'newyear_theme_active', currentValue: string) => {
    setUpdatingTheme(true);
    const newValue = currentValue === 'true' ? 'false' : 'true';
    try {
      if (newValue === 'true') {
        const updates = [];
        if (themeKey !== 'copa_theme_active') updates.push(update.mutateAsync({ key: 'copa_theme_active', value: 'false' }));
        if (themeKey !== 'halloween_theme_active') updates.push(update.mutateAsync({ key: 'halloween_theme_active', value: 'false' }));
        if (themeKey !== 'christmas_theme_active') updates.push(update.mutateAsync({ key: 'christmas_theme_active', value: 'false' }));
        if (themeKey !== 'newyear_theme_active') updates.push(update.mutateAsync({ key: 'newyear_theme_active', value: 'false' }));
        await Promise.all(updates);

        setCopaEnabled(themeKey === 'copa_theme_active' ? 'true' : 'false');
        setHalloweenEnabled(themeKey === 'halloween_theme_active' ? 'true' : 'false');
        setChristmasEnabled(themeKey === 'christmas_theme_active' ? 'true' : 'false');
        setNewyearEnabled(themeKey === 'newyear_theme_active' ? 'true' : 'false');
      }

      await update.mutateAsync({ key: themeKey, value: newValue });
      
      if (themeKey === 'copa_theme_active') setCopaEnabled(newValue);
      if (themeKey === 'halloween_theme_active') setHalloweenEnabled(newValue);
      if (themeKey === 'christmas_theme_active') setChristmasEnabled(newValue);
      if (themeKey === 'newyear_theme_active') setNewyearEnabled(newValue);
    } catch (err) {
      // Erro tratado pela mutation
    } finally {
      setUpdatingTheme(false);
    }
  };

  const isPixelValid = /^\d{15,16}$/.test(pixelId.trim());
  const isCapiConfigured = !!settings?.meta_capi_token;
  const isPixelConfigured = !!settings?.meta_pixel_id;

  const handleSaveAll = async () => {
    if (pixelId && !isPixelValid) {
      toast.error('Pixel ID deve ter 15 ou 16 dígitos');
      return;
    }
    await Promise.all([
      update.mutateAsync({ key: 'meta_pixel_id', value: pixelId.trim() }),
      update.mutateAsync({ key: 'meta_capi_token', value: capiToken.trim() }),
      update.mutateAsync({ key: 'meta_test_event_code', value: testCode.trim() }),
    ]);
    toast.success('Configurações salvas');
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('meta-test-connection');
      if (error) throw error;
      if (data.ok) {
        setTestResult({ ok: true, msg: `Conectado ao Pixel "${data.pixel_name}" (${data.pixel_id})` });
      } else {
        setTestResult({ ok: false, msg: data.error || 'Falha na conexão' });
      }
    } catch (e: any) {
      setTestResult({ ok: false, msg: e.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSavePopup = async () => {
    setSavingPopup(true);
    try {
      await Promise.all([
        update.mutateAsync({ key: 'popup_active', value: popupActive }),
        update.mutateAsync({ key: 'popup_title', value: popupTitle.trim() }),
        update.mutateAsync({ key: 'popup_message', value: popupMessage.trim() }),
        update.mutateAsync({ key: 'popup_button_text', value: popupButtonText.trim() }),
        update.mutateAsync({ key: 'popup_button_link', value: popupButtonLink.trim() }),
      ]);
      toast.success('Configurações do Pop-up salvas com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar pop-up.');
    } finally {
      setSavingPopup(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-500">
        <div className="w-6 h-6 rounded-lg bg-zinc-200 border border-zinc-300 flex items-center justify-center">
          <Activity className="h-3.5 w-3.5 text-zinc-600" />
        </div>
        <p className="text-xs font-semibold">Carregando configurações de marketing...</p>
      </div>
    );
  }

  return (
    <div className="admin-theme space-y-6 text-zinc-950">
      <div className="flex items-center gap-3">
        <div className="h-10 w-1 bg-zinc-950 rounded-full" />
        <div>
          <h2 className="text-xl font-bold text-zinc-950">Meta Ads — Pixel + CAPI</h2>
          <p className="text-sm text-zinc-500">
            Conecte o Pixel e a Conversions API para enviar eventos reais ao Meta Ads.
          </p>
        </div>
      </div>

      {/* Pixel ID */}
      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-background/70">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Pixel ID
                {isPixelConfigured && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" /> Ativo
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Identificador do Pixel da Meta — usado no navegador e na CAPI.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Label htmlFor="pid">ID numérico (15-16 dígitos)</Label>
          <Input
            id="pid"
            placeholder="Ex: 4325575347661165"
            value={pixelId}
            onChange={(e) => setPixelId(e.target.value.replace(/\D/g, ''))}
            maxLength={16}
            className="bg-background/80 font-mono mt-1"
          />
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Encontre no{' '}
            <a
              href="https://business.facebook.com/events_manager"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1 hover:underline"
            >
              Gerenciador de Eventos <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </CardContent>
      </Card>

      {/* CAPI Token */}
      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-accent/10 via-background to-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-background/70">
              <KeyRound className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Access Token (Conversions API)
                {isCapiConfigured && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" /> Conectado
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Token permanente gerado no Gerenciador de Eventos &gt; Configurações &gt; Conversions API.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="capi">Access Token</Label>
            <Input
              id="capi"
              type="password"
              placeholder="EAAxxxxx..."
              value={capiToken}
              onChange={(e) => setCapiToken(e.target.value)}
              className="bg-background/80 font-mono mt-1"
            />
          </div>
          <div>
            <Label htmlFor="tec" className="flex items-center gap-2">
              <FlaskConical className="h-3.5 w-3.5" /> Test Event Code (opcional)
            </Label>
            <Input
              id="tec"
              placeholder="TEST12345"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              className="bg-background/80 font-mono mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use durante validação para ver eventos em "Eventos de Teste" na Meta. Remova depois.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleSaveAll} disabled={update.isPending} className="flex-1 bg-zinc-950 hover:bg-[#E31C25] text-white font-bold transition-colors">
          {update.isPending ? 'Salvando...' : <><Save className="h-4 w-4 mr-2" /> Salvar tudo</>}
        </Button>
        <Button onClick={handleTest} variant="outline" disabled={testing || !isPixelConfigured || !isCapiConfigured} className="border-zinc-300 text-zinc-800 hover:bg-zinc-100 font-bold">
          {testing ? 'Testando...' : <><Zap className="h-4 w-4 mr-2" /> Testar conexão</>}
        </Button>
      </div>

      {testResult && (
        <Card className={testResult.ok ? 'border-green-500/40 bg-green-500/5' : 'border-destructive/40 bg-destructive/5'}>
          <CardContent className="py-3 flex items-center gap-2 text-sm">
            {testResult.ok ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            {testResult.msg}
          </CardContent>
        </Card>
      )}

      {/* Gerenciador do Pop-up Anúncio / Comunicado no Site */}
      <Card className="overflow-hidden border border-zinc-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-zinc-950 font-bold">
                  Pop-up de Anúncio / Comunicado no Site
                  <Badge variant="outline" className={popupActive === 'true' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}>
                    {popupActive === 'true' ? 'Ativo no Site' : 'Desativado'}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  Configure um aviso, anúncio ou promoção para aparecer aos visitantes ao entrar na loja.
                </CardDescription>
              </div>
            </div>

            <button
              onClick={() => setPopupActive(popupActive === 'true' ? 'false' : 'true')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 flex-shrink-0 ${
                popupActive === 'true' ? 'bg-emerald-600' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform duration-300 ${
                  popupActive === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="popup_title" className="text-xs font-bold text-zinc-700">Título do Pop-up</Label>
              <Input
                id="popup_title"
                placeholder="Ex: Aviso Importante! / Promoção do Mês"
                value={popupTitle}
                onChange={(e) => setPopupTitle(e.target.value)}
                className="mt-1 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs"
              />
            </div>
            <div>
              <Label htmlFor="popup_button_text" className="text-xs font-bold text-zinc-700">Texto do Botão de Ação</Label>
              <Input
                id="popup_button_text"
                placeholder="Ex: Falar no WhatsApp / Ver Oferta / Entendi"
                value={popupButtonText}
                onChange={(e) => setPopupButtonText(e.target.value)}
                className="mt-1 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="popup_message" className="text-xs font-bold text-zinc-700">Mensagem / Texto do Pop-up</Label>
            <Textarea
              id="popup_message"
              placeholder="Escreva a mensagem ou comunicado que aparecerá no pop-up..."
              rows={3}
              value={popupMessage}
              onChange={(e) => setPopupMessage(e.target.value)}
              className="mt-1 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs"
            />
          </div>

          <div>
            <Label htmlFor="popup_button_link" className="text-xs font-bold text-zinc-700">Link de Destino do Botão (Opcional)</Label>
            <Input
              id="popup_button_link"
              placeholder="Ex: https://wa.me/5581991768142 (Deixe vazio para usar WhatsApp ou apenas fechar)"
              value={popupButtonLink}
              onChange={(e) => setPopupButtonLink(e.target.value)}
              className="mt-1 bg-white border-zinc-200 text-zinc-950 font-mono text-xs shadow-xs"
            />
          </div>

          <Button
            onClick={handleSavePopup}
            disabled={savingPopup}
            className="bg-zinc-950 hover:bg-[#E31C25] text-white font-bold text-xs gap-2 shadow-xs transition-colors"
          >
            <Save className="h-4 w-4" />
            {savingPopup ? 'Salvando...' : 'Salvar Configurações do Pop-up'}
          </Button>
        </CardContent>
      </Card>

      {/* Campanhas Visuais & Datas Especiais */}
      <Card className="overflow-hidden border border-zinc-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-xl select-none border border-amber-200">
              🗓️
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2 text-zinc-950 font-bold">
                Campanhas Visuais & Datas Especiais
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Ative decorações visuais comemorativas e altere o esquema de cores globalmente. Apenas uma campanha pode estar ativa por vez.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {/* Copa */}
          <div className="flex items-center justify-between p-4 bg-zinc-50/70 rounded-xl border border-zinc-200 gap-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                🏆 Clima de Copa do Mundo 2026
                {copaEnabled === 'true' && <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">Ativo</Badge>}
              </Label>
              <p className="text-xs text-zinc-500">Tema Verde & Amarelo, confetes brilhantes e fita superior de apoio à Seleção.</p>
            </div>
            <button
              onClick={() => handleToggleTheme('copa_theme_active', copaEnabled)}
              disabled={updatingTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 flex-shrink-0 ${
                copaEnabled === 'true' ? 'bg-emerald-600' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform duration-300 ${
                  copaEnabled === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Halloween */}
          <div className="flex items-center justify-between p-4 bg-zinc-50/70 rounded-xl border border-zinc-200 gap-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                🎃 Portal das Sombras (Halloween)
                {halloweenEnabled === 'true' && <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-[10px] font-bold">Ativo</Badge>}
              </Label>
              <p className="text-xs text-zinc-500">Tema Roxo & Laranja, partículas flutuantes de abóboras/morcegos e banner místico.</p>
            </div>
            <button
              onClick={() => handleToggleTheme('halloween_theme_active', halloweenEnabled)}
              disabled={updatingTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 flex-shrink-0 ${
                halloweenEnabled === 'true' ? 'bg-purple-600' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform duration-300 ${
                  halloweenEnabled === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Natal */}
          <div className="flex items-center justify-between p-4 bg-zinc-50/70 rounded-xl border border-zinc-200 gap-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                🎄 Natal Mágico
                {christmasEnabled === 'true' && <Badge className="bg-red-100 text-red-800 border-red-300 text-[10px] font-bold">Ativo</Badge>}
              </Label>
              <p className="text-xs text-zinc-500">Tema Vermelho & Verde, flocos de neve caindo, estrelas de Natal e banner festivo.</p>
            </div>
            <button
              onClick={() => handleToggleTheme('christmas_theme_active', christmasEnabled)}
              disabled={updatingTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 flex-shrink-0 ${
                christmasEnabled === 'true' ? 'bg-red-600' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform duration-300 ${
                  christmasEnabled === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Ano Novo */}
          <div className="flex items-center justify-between p-4 bg-zinc-50/70 rounded-xl border border-zinc-200 gap-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                ✨ Celebração de Ano Novo
                {newyearEnabled === 'true' && <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold">Ativo</Badge>}
              </Label>
              <p className="text-xs text-zinc-500">Tema Dourado & Branco, fogos de artifício e taças flutuantes de comemoração.</p>
            </div>
            <button
              onClick={() => handleToggleTheme('newyear_theme_active', newyearEnabled)}
              disabled={updatingTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 flex-shrink-0 ${
                newyearEnabled === 'true' ? 'bg-amber-500' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform duration-300 ${
                  newyearEnabled === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Eventos rastreados */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Eventos enviados (Pixel + CAPI deduplicado)
          </CardTitle>
          <CardDescription className="text-xs">
            Cada evento dispara no navegador e no servidor com o mesmo event_id — Meta deduplica automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 text-sm">
          {[
            { event: 'PageView', desc: 'Toda navegação' },
            { event: 'ViewContent', desc: 'Abre uma série/anime' },
            { event: 'AddToCart', desc: 'Adiciona ao carrinho' },
            { event: 'InitiateCheckout', desc: 'Inicia checkout' },
            { event: 'Purchase', desc: 'Compra confirmada' },
            { event: 'Lead', desc: 'Cadastro no formulário' },
          ].map((e) => (
            <div key={e.event} className="flex items-center justify-between gap-2 p-2.5 rounded bg-muted/40">
              <div className="flex flex-col">
                <span className="font-mono text-xs text-primary">{e.event}</span>
                <span className="text-xs text-muted-foreground">{e.desc}</span>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
