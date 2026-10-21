import { useEffect, useState } from 'react';
import { useSiteSettings, useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Instagram, MessageCircle, Send, Save, Loader2, Link as LinkIcon } from 'lucide-react';

import { formatPhone } from '@/lib/validators';

export const AdminContactSettings = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const update = useUpdateSiteSetting();

  const [whatsapp, setWhatsapp] = useState('');
  const [telegram, setTelegram] = useState('');
  const [instagram, setInstagram] = useState('');

  useEffect(() => {
    if (settings) {
      setWhatsapp(settings.whatsapp_number ? formatPhone(settings.whatsapp_number) : '');
      setTelegram(settings.telegram_username || '');
      setInstagram(settings.instagram_url || '');
    }
  }, [settings]);

  const cards = [
    {
      key: 'whatsapp_number' as const,
      title: 'WhatsApp',
      desc: 'DDD e número (ex: (81) 99999-9999)',
      icon: MessageCircle,
      value: whatsapp,
      setter: (val: string) => setWhatsapp(formatPhone(val)),
      placeholder: '(81) 99999-9999',
      maxLength: 15,
      accent: 'from-green-500/20 to-emerald-500/5',
      iconColor: 'text-green-500',
      onSave: (val: string) => {
        const clean = val.replace(/\D/g, '');
        // Adiciona 55 se não tiver código do país
        const withDDI = clean.length <= 11 ? `55${clean}` : clean;
        update.mutate({ key: 'whatsapp_number', value: withDDI });
      },
    },
    {
      key: 'telegram_username' as const,
      title: 'Telegram',
      desc: 'Apenas o username, sem @ (ex: meucanal)',
      icon: Send,
      value: telegram,
      setter: setTelegram,
      placeholder: 'meucanal',
      maxLength: 50,
      accent: 'from-sky-500/20 to-blue-500/5',
      iconColor: 'text-sky-400',
      onSave: (val: string) => update.mutate({ key: 'telegram_username', value: val.trim().replace(/^@/, '') }),
    },
    {
      key: 'instagram_url' as const,
      title: 'Instagram',
      desc: 'URL completa do perfil',
      icon: Instagram,
      value: instagram,
      setter: setInstagram,
      placeholder: 'https://instagram.com/seu_perfil',
      maxLength: 200,
      accent: 'from-pink-500/20 to-fuchsia-500/5',
      iconColor: 'text-pink-400',
      onSave: (val: string) => update.mutate({ key: 'instagram_url', value: val.trim() }),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-500">
        <div className="w-6 h-6 rounded-lg bg-zinc-200 border border-zinc-300 flex items-center justify-center">
          <MessageCircle className="h-3.5 w-3.5 text-zinc-600" />
        </div>
        <p className="text-xs font-semibold">Carregando canais de suporte...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-1 bg-primary rounded-full" />
        <div>
          <h2 className="text-xl font-bold">Contatos & Redes Sociais</h2>
          <p className="text-sm text-muted-foreground">
            Centralize aqui os links que aparecem no rodapé e nas páginas de suporte.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card
              key={c.key}
              className="relative overflow-hidden border-zinc-200 bg-white shadow-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-zinc-100 border border-zinc-200">
                    <Icon className={`h-4 w-4 ${c.iconColor}`} />
                  </div>
                  <CardTitle className="text-base text-zinc-950 font-bold">{c.title}</CardTitle>
                </div>
                <CardDescription className="text-xs text-zinc-500 font-medium">{c.desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor={c.key} className="sr-only">{c.title}</Label>
                  <Input
                    id={c.key}
                    placeholder={c.placeholder}
                    maxLength={c.maxLength}
                    value={c.value}
                    onChange={(e) => c.setter(e.target.value)}
                    className="bg-white border-zinc-300 text-zinc-950"
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full bg-zinc-950 hover:bg-[#E31C25] text-white transition-colors"
                  disabled={update.isPending}
                  onClick={() => c.onSave(c.value)}
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {update.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-zinc-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-zinc-950 flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-[#E31C25]" /> Pré-visualização dos links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <span className="text-zinc-600 font-medium">WhatsApp</span>
            <a
              href={whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, '')}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E31C25] hover:underline font-semibold truncate max-w-[60%]"
            >
              {whatsapp ? `wa.me/${whatsapp.replace(/\D/g, '')}` : '—'}
            </a>
          </div>
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <span className="text-zinc-600 font-medium">Telegram</span>
            <a
              href={telegram ? `https://t.me/${telegram.replace(/^@/, '')}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E31C25] hover:underline font-semibold truncate max-w-[60%]"
            >
              {telegram ? `t.me/${telegram.replace(/^@/, '')}` : '—'}
            </a>
          </div>
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <span className="text-zinc-600 font-medium">Instagram</span>
            <a
              href={instagram || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E31C25] hover:underline font-semibold truncate max-w-[60%]"
            >
              {instagram || '—'}
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
