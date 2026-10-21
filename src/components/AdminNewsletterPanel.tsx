import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Users, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export function AdminNewsletterPanel() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const { data: optInCount } = useQuery({
    queryKey: ['newsletter_optin_count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('crm_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('newsletter_opt_in', true);
      return count || 0;
    },
  });

  const { data: campaigns, refetch } = useQuery({
    queryKey: ['newsletter_campaigns'],
    queryFn: async () => {
      const { data } = await supabase
        .from('newsletter_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Preencha assunto e corpo do email');
      return;
    }
    if (!confirm(`Enviar para ${optInCount} contatos? Esta ação não pode ser desfeita.`)) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-newsletter', {
        body: { subject, bodyHtml: body },
      });
      if (error) throw error;
      toast.success(`Enviada! ${data.sent} sucesso, ${data.failed} falhas`);
      setSubject('');
      setBody('');
      refetch();
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold">Nova Campanha de Newsletter</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-3 w-3" /> {optInCount ?? 0} contatos opt-in
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Assunto</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: 🎬 Nova série disponível!"
            />
          </div>
          <div>
            <Label>Corpo (HTML permitido)</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="<p>Olá! Acabamos de lançar...</p>"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Header e footer com identidade visual são adicionados automaticamente.
            </p>
          </div>
          <Button onClick={handleSend} disabled={sending || !optInCount} className="gap-2">
            <Send className="h-4 w-4" />
            {sending ? 'Enviando...' : `Enviar para ${optInCount} contatos`}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-4">Histórico de Campanhas</h3>
        {!campaigns || campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma campanha enviada ainda.</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3 w-3" /> {c.sent_count}
                  </span>
                  {c.failed_count > 0 && (
                    <span className="flex items-center gap-1 text-destructive">
                      <XCircle className="h-3 w-3" /> {c.failed_count}
                    </span>
                  )}
                  <Badge variant={c.status === 'sent' ? 'default' : 'secondary'}>{c.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
