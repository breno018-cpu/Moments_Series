import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail, Sparkles } from 'lucide-react';
import { captureUtms, captureLandingAndReferrer } from '@/lib/marketing';

export function LeadCaptureForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const utms = captureUtms();
    const { landing_page, referrer } = captureLandingAndReferrer();
    const { error } = await supabase.from('crm_lead_form').insert({
      email,
      name: name || null,
      message: 'Newsletter opt-in',
      utm_source: utms.utm_source,
      utm_medium: utms.utm_medium,
      utm_campaign: utms.utm_campaign,
      landing_page,
      referrer,
    });
    // marca opt-in no contato (caso já exista)
    await supabase
      .from('crm_contacts')
      .update({ newsletter_opt_in: true, newsletter_opt_in_at: new Date().toISOString() })
      .eq('email', email);
    setLoading(false);
    if (error) {
      toast.error('Erro ao cadastrar. Tente novamente.');
      return;
    }
    toast.success('🎉 Cadastrado! Em breve você receberá novidades.');
    setEmail('');
    setName('');
  };

  return (
    <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 via-[#0b0c15] to-indigo-950/20 p-6 sm:p-8 shadow-xl">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-purple-400" />
        <h3 className="font-extrabold text-lg sm:text-xl text-white">Receba Lançamentos Exclusivos e Descontos VIP</h3>
      </div>
      <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
        Cadastre-se gratuitamente para ser avisado sobre novos episódios, lançamentos de animes e cupons de desconto especiais antes de todo mundo.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Seu nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-xs sm:text-sm h-11 rounded-xl"
        />
        <Input
          type="email"
          required
          placeholder="Seu melhor e-mail (ex: joao@email.com)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-xs sm:text-sm h-11 rounded-xl"
        />
        <Button type="submit" disabled={loading} className="shrink-0 h-11 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md">
          <Mail className="mr-2 h-4 w-4" />
          {loading ? 'Cadastrando...' : 'Quero Descontos VIP'}
        </Button>
      </form>
    </div>
  );
}
