import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { useAdminSales, SaleRecord } from '@/hooks/useAdminSales';
import { AdminHeader } from '@/components/AdminHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Download, Search, Loader2, TrendingUp, DollarSign, ShoppingCart, BarChart3, MailCheck, MailX, Clock, Send, MessageCircle, CheckCircle, XCircle, Phone, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchRemoteWhatsAppLogs, WhatsAppLogEntry } from '@/lib/whatsappLogs';
import { wa } from '@/lib/whatsapp.client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { formatCurrencyBRL, formatNumberBRL } from '@/lib/utils';
import { AnimatedCounter } from '@/components/AnimatedCounter';

type SortField = 'created_at' | 'total_amount' | 'customer_name' | 'series_title';
type SortDirection = 'asc' | 'desc';

export interface AdminSalesProps {
  embedded?: boolean;
}

export default function AdminSales({ embedded = false }: AdminSalesProps = {}) {
  const navigate = useNavigate();
  const { data: adminStatus, isLoading: adminLoading } = useAdmin();
  const { data: salesData, isLoading: salesLoading, refetch } = useAdminSales(!!adminStatus?.isAdmin || embedded);

  const sales = useMemo(() => salesData || [], [salesData]);
  const [search, setSearch] = useState('');

  // Filtro de Mês / Período (Padrão: Mês Atual conforme solicitado)
  const [periodFilter, setPeriodFilter] = useState<string>('current_month');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [seriesFilter, setSeriesFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendingWaId, setResendingWaId] = useState<string | null>(null);
  const [waLogs, setWaLogs] = useState<WhatsAppLogEntry[]>([]);

  // Carrega e sincroniza histórico de envios do WhatsApp
  useEffect(() => {
    fetchRemoteWhatsAppLogs().then((logs) => setWaLogs(logs));
  }, []);

  // Mapeamento dos meses disponíveis nas vendas
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      set.add(key);
    });

    const currentKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    set.add(currentKey);

    return Array.from(set).sort().reverse();
  }, [sales]);

  const handleResendEmail = async (orderId: string) => {
    setResendingId(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('resend-access-email', {
        body: { orderId },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success('Email reenviado com sucesso!');
        refetch();
      } else {
        toast.error(data?.error || 'Falha ao reenviar email');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao reenviar email');
    } finally {
      setResendingId(null);
    }
  };

  const handleResendWhatsApp = async (sale: SaleRecord) => {
    const rawPhone = sale.customer_phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('Telefone do cliente não cadastrado ou inválido');
      return;
    }

    setResendingWaId(sale.id);
    try {
      // Busca link de acesso para o envio direto
      const { data: linkRow } = await supabase
        .from('series_access_links')
        .select('access_link')
        .eq('series_id', sale.series_id)
        .maybeSingle();

      const accessLink = linkRow?.access_link || `${window.location.origin}/acesso`;

      // Buscar template salvo se existir no site_settings
      let templateRaw = `Oba, *{nome}*! 🚀\n\nSeu pagamento referente ao pedido *#{pedido}* foi *CONFIRMADO* com sucesso!\n\n💰 Valor: *R$ {valor}*\n🍿 Conteúdo: *{itens}*\n\n🔗 *Seu link de acesso exclusivo à série está liberado:*\n{link}\n\nAproveite e assista direto no seu celular ou navegador! Qualquer dúvida estamos à disposição.`;
      try {
        const { data: stRow } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'whatsapp_sales_template')
          .maybeSingle();
        if (stRow?.value) templateRaw = stRow.value;
      } catch (e) {
        console.warn('Falha ao carregar template no reenvio', e);
      }

      const valFormatted = Number(sale.total_amount || 0).toFixed(2).replace('.', ',');
      const formattedCustomMsg = templateRaw
        .replace(/{nome}/g, sale.customer_name || 'Cliente')
        .replace(/{pedido}/g, String(sale.id))
        .replace(/{valor}/g, valFormatted)
        .replace(/{itens}/g, sale.series_title || 'Série Adquirida')
        .replace(/{link}/g, accessLink);

      const res = await wa.notify({
        event: 'PAYMENT_APPROVED',
        customerName: sale.customer_name || 'Cliente',
        customerPhone: cleanPhone,
        orderId: sale.id,
        totalAmount: sale.total_amount,
        items: [`${sale.series_title}: ${accessLink}`],
        trackingUrl: accessLink,
        customMessage: formattedCustomMsg,
        labels: ['Já Comprou', 'Reenvio Manual']
      });

      if (res.success) {
        toast.success(`Mensagem enviada com sucesso para ${cleanPhone}!`);
        // Atualiza logs
        const newEntry: WhatsAppLogEntry = {
          orderId: sale.id,
          customerName: sale.customer_name,
          customerPhone: cleanPhone,
          status: 'sent',
          sentAt: new Date().toISOString(),
          messageId: res.data?.messageKeyId,
          items: sale.series_title
        };
        setWaLogs(prev => [newEntry, ...prev.filter(l => l.orderId !== sale.id)]);
      } else {
        toast.error(`Falha no envio: ${res.error || 'Verifique o Gateway'}`);
        const newEntry: WhatsAppLogEntry = {
          orderId: sale.id,
          customerName: sale.customer_name,
          customerPhone: cleanPhone,
          status: 'error',
          sentAt: new Date().toISOString(),
          errorMessage: res.error,
          items: sale.series_title
        };
        setWaLogs(prev => [newEntry, ...prev.filter(l => l.orderId !== sale.id)]);
      }
    } catch (err: any) {
      toast.error(`Erro ao reenviar WhatsApp: ${err.message}`);
    } finally {
      setResendingWaId(null);
    }
  };

  useEffect(() => {
    if (adminLoading) return;
    if (!adminStatus?.isAdmin && !embedded) {
      navigate('/auth');
    }
  }, [navigate, adminStatus, adminLoading, embedded]);

  // Unique series for filter dropdown
  const uniqueSeries = useMemo(() => {
    const map = new Map<string, string>();
    sales.forEach(s => map.set(s.series_id, s.series_title));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [sales]);

  // Vendas do período ativo (Mês atual, Mês anterior, Histórico ou Mês Selecionado)
  const periodScopedSales = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (periodFilter === 'all') {
      return sales;
    }

    if (periodFilter === 'current_month') {
      return sales.filter((s) => {
        const d = new Date(s.created_at);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });
    }

    if (periodFilter === 'last_month') {
      const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
      return sales.filter((s) => {
        const d = new Date(s.created_at);
        return (
          d.getFullYear() === lastMonthDate.getFullYear() &&
          d.getMonth() === lastMonthDate.getMonth()
        );
      });
    }

    return sales.filter((s) => {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === periodFilter;
    });
  }, [sales, periodFilter]);

  const filteredSales = useMemo(() => {
    const result = periodScopedSales.filter(s => {
      const q = search.toLowerCase();
      const matchesSearch = !q || 
        s.customer_name.toLowerCase().includes(q) ||
        s.customer_email.toLowerCase().includes(q) ||
        s.series_title.toLowerCase().includes(q) ||
        s.customer_cpf.includes(q);

      const matchesStatus = statusFilter === 'all' || s.payment_status === statusFilter;
      const matchesSeries = seriesFilter === 'all' || s.series_id === seriesFilter;

      const saleDate = new Date(s.created_at);
      const matchesDateFrom = !dateFrom || saleDate >= new Date(dateFrom.setHours(0, 0, 0, 0));
      const matchesDateTo = !dateTo || saleDate <= new Date(new Date(dateTo).setHours(23, 59, 59, 999));

      const matchesMinAmount = !minAmount || s.total_amount >= parseFloat(minAmount);
      const matchesMaxAmount = !maxAmount || s.total_amount <= parseFloat(maxAmount);

      return matchesSearch && matchesStatus && matchesSeries && matchesDateFrom && matchesDateTo && matchesMinAmount && matchesMaxAmount;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'total_amount':
          comparison = a.total_amount - b.total_amount;
          break;
        case 'customer_name':
          comparison = a.customer_name.localeCompare(b.customer_name);
          break;
        case 'series_title':
          comparison = a.series_title.localeCompare(b.series_title);
          break;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [periodScopedSales, search, statusFilter, seriesFilter, dateFrom, dateTo, minAmount, maxAmount, sortField, sortDirection]);

  // Métricas do período selecionado (Mês atual por padrão)
  const stats = useMemo(() => {
    const total = periodScopedSales.length;
    const completed = periodScopedSales.filter(s => s.payment_status === 'completed').length;
    const pending = periodScopedSales.filter(s => s.payment_status === 'pending').length;
    const failed = periodScopedSales.filter(s => s.payment_status === 'failed' || s.payment_status === 'cancelled').length;
    const revenueCompleted = periodScopedSales.filter(s => s.payment_status === 'completed').reduce((acc, s) => acc + s.total_amount, 0);
    const revenueTotal = periodScopedSales.reduce((acc, s) => acc + s.total_amount, 0);
    const ticketAverage = completed > 0 ? revenueCompleted / completed : 0;
    const conversionRate = total > 0 ? (completed / total) * 100 : 0;

    return { total, completed, pending, failed, revenueCompleted, revenueTotal, ticketAverage, conversionRate };
  }, [periodScopedSales]);

  // Mapa rápido de status do WhatsApp indexado por orderId
  const waStatusMap = useMemo(() => {
    const map = new Map<string, WhatsAppLogEntry>();
    waLogs.forEach((l) => {
      map.set(l.orderId, l);
    });
    return map;
  }, [waLogs]);

  // Métricas exclusivas do WhatsApp Gateway
  const waStats = useMemo(() => {
    const completedOrders = periodScopedSales.filter(s => s.payment_status === 'completed');
    let sentCount = 0;
    let errorCount = 0;
    let pendingCount = 0;

    completedOrders.forEach(ord => {
      const log = waStatusMap.get(ord.id);
      if (log?.status === 'sent') {
        sentCount++;
      } else if (log?.status === 'error') {
        errorCount++;
      } else {
        // Pedido pago sem log registrado (ainda pendente ou fallback)
        pendingCount++;
      }
    });

    return {
      totalEligible: completedOrders.length,
      sentCount,
      errorCount,
      pendingCount,
      successRate: completedOrders.length > 0 ? (sentCount / completedOrders.length) * 100 : 0
    };
  }, [periodScopedSales, waStatusMap]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'desc' ? '↓' : '↑';
  };

  const exportCSV = () => {
    const headers = ['Data', 'Hora', 'Série', 'Cliente', 'Email', 'Telefone', 'CPF', 'Valor', 'Status', 'Email Enviado', 'Método', 'ID Pagamento MP'];
    const rows = filteredSales.map(s => {
      const date = new Date(s.created_at);
      return [
        date.toLocaleDateString('pt-BR'),
        date.toLocaleTimeString('pt-BR'),
        s.series_title,
        s.customer_name,
        s.customer_email,
        s.customer_phone || '',
        s.customer_cpf,
        s.total_amount.toFixed(2),
        s.payment_status,
        s.email_status === 'sent' ? 'Sim' : s.email_status === 'failed' ? 'Falhou' : 'Pendente',
        s.payment_method,
        s.mp_payment_id || '',
      ].map(v => `"${v}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold shadow-2xs">Pago</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold shadow-2xs">Pendente</Badge>;
      case 'failed':
      case 'cancelled':
        return <Badge className="bg-rose-100 text-rose-800 border border-rose-300 font-extrabold shadow-2xs">Falhou</Badge>;
      default:
        return <Badge variant="outline" className="border-zinc-300 text-zinc-700 font-semibold">{status}</Badge>;
    }
  };

  const emailBadge = (emailStatus: string, paymentStatus: string) => {
    if (paymentStatus !== 'completed') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
          <Clock className="h-3 w-3" /> N/A
        </span>
      );
    }
    switch (emailStatus) {
      case 'delivered':
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold" title="Email enviado">
            <MailCheck className="h-3.5 w-3.5 text-emerald-600" /> Enviado
          </span>
        );
      case 'bounced':
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-bold" title="Erro no envio">
            <MailX className="h-3.5 w-3.5 text-rose-600" /> Falhou
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-bold" title="Pendente">
            <Clock className="h-3.5 w-3.5 text-amber-600" /> Pendente
          </span>
        );
    }
  };

  const whatsappBadge = (sale: SaleRecord) => {
    if (sale.payment_status !== 'completed') {
      return (
        <span className="text-[11px] text-zinc-400 font-mono italic" title="Aguardando confirmação do pagamento">
          —
        </span>
      );
    }

    const log = waStatusMap.get(sale.id);

    if (log?.status === 'sent') {
      return (
        <span
          className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md font-bold shadow-2xs"
          title={`Enviado para ${log.customerPhone} em ${format(new Date(log.sentAt), 'dd/MM/yy HH:mm')}`}
        >
          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Enviado
        </span>
      );
    }

    if (log?.status === 'error') {
      return (
        <span
          className="inline-flex items-center gap-1 text-[11px] text-rose-800 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-md font-bold shadow-2xs"
          title={log.errorMessage || 'Falha no Gateway de WhatsApp'}
        >
          <XCircle className="h-3.5 w-3.5 text-rose-600" /> Falhou
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md font-bold shadow-2xs"
        title="Aguardando disparo ou cliente sem WhatsApp ativo"
      >
        <Clock className="h-3.5 w-3.5 text-amber-600" /> Pendente
      </span>
    );
  };


  if (adminLoading || (!adminStatus?.isAdmin && !embedded)) return null;

  const salesContent = (
    <div className="admin-theme space-y-6 text-zinc-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-950 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Relatório Geral de Vendas PIX
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">Consulte o status das compras, comprovantes e reenvio automático de e-mails.</p>
        </div>
        <Button onClick={exportCSV} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Barra de Período dos Relatórios */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-600" />
          <span className="text-xs font-bold text-zinc-900">Período Selecionado:</span>
          <span className="text-[11px] text-zinc-500">
            {periodFilter === 'current_month' && 'Consolidado do Mês Atual (Padrão)'}
            {periodFilter === 'last_month' && 'Histórico do Mês Anterior'}
            {periodFilter === 'all' && 'Todo o Histórico'}
            {periodFilter.includes('-') && `Mês específico: ${periodFilter}`}
          </span>
        </div>

        <div className="w-full sm:w-64">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="h-9 bg-white border-zinc-200 text-xs font-semibold text-zinc-900 shadow-xs">
              <SelectValue placeholder="Selecione o Mês" />
            </SelectTrigger>
            <SelectContent className="bg-white border-zinc-200 text-xs shadow-md">
              <SelectItem value="current_month">📅 Mês Atual (Padrão)</SelectItem>
              <SelectItem value="last_month">⏪ Mês Anterior</SelectItem>
              <SelectItem value="all">🌐 Todo o Histórico</SelectItem>
              {availableMonths.map((m) => {
                const [y, mon] = m.split('-');
                const d = new Date(Number(y), Number(mon) - 1, 1);
                const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                return (
                  <SelectItem key={m} value={m}>
                    {label.replace(/^\w/, (c) => c.toUpperCase())}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards com pontuação rigorosa pt-BR e animação progressiva */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="p-4 bg-white border-zinc-200 shadow-xs">
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
            <ShoppingCart className="h-3.5 w-3.5 text-zinc-700" />
            Total de Pedidos
          </div>
          <p className="text-2xl font-black text-zinc-950">
            <AnimatedCounter value={stats.total} duration={1100} />
          </p>
        </Card>
        <Card className="p-4 bg-emerald-50/50 border-emerald-200 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-700 text-xs mb-1 font-semibold">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            Pagos / Aprovados
          </div>
          <p className="text-2xl font-black text-emerald-700">
            <AnimatedCounter value={stats.completed} duration={1100} />
          </p>
        </Card>
        <Card className="p-4 bg-amber-50/50 border-amber-200 shadow-xs">
          <div className="flex items-center gap-2 text-amber-700 text-xs mb-1 font-semibold">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            Aguardando PIX
          </div>
          <p className="text-2xl font-black text-amber-700">
            <AnimatedCounter value={stats.pending} duration={1100} />
          </p>
        </Card>
        <Card className="p-4 bg-emerald-50/50 border-emerald-200 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-700 text-xs mb-1 font-semibold">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            Faturamento Pago
          </div>
          <p className="text-xl font-black text-emerald-700">
            <AnimatedCounter value={stats.revenueCompleted} isCurrency={true} duration={1300} />
          </p>
        </Card>
        <Card className="p-4 bg-purple-50/50 border-purple-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-purple-700 text-xs mb-1 font-semibold">
            <BarChart3 className="h-3.5 w-3.5 text-purple-600" />
            Ticket Médio
          </div>
          <p className="text-xl font-black text-purple-700">
            <AnimatedCounter value={stats.ticketAverage} isCurrency={true} duration={1300} />
          </p>
        </Card>
      </div>

      {/* PAINEL DE MÉTRICAS EXCLUSIVAS DO WHATSAPP GATEWAY */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-zinc-950 to-teal-950 border border-emerald-500/30 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                Métricas de Disparo WhatsApp Gateway
              </h3>
              <p className="text-xs text-slate-300">
                Acompanhamento em tempo real de mensagens entregues, falhas e taxa de sucesso por cliente.
              </p>
            </div>
          </div>

          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
            Taxa de Entrega: {waStats.successRate.toFixed(1)}%
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-bold block mb-1">Elegíveis (Vendas Pagas)</span>
            <span className="text-xl font-black text-white">
              <AnimatedCounter value={waStats.totalEligible} duration={1000} />
            </span>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3">
            <span className="text-[11px] text-emerald-300 font-bold flex items-center gap-1 mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Enviadas com Sucesso
            </span>
            <span className="text-xl font-black text-emerald-400">
              <AnimatedCounter value={waStats.sentCount} duration={1000} />
            </span>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-3">
            <span className="text-[11px] text-rose-300 font-bold flex items-center gap-1 mb-1">
              <XCircle className="h-3.5 w-3.5 text-rose-400" /> Falhas / Erros de Envio
            </span>
            <span className="text-xl font-black text-rose-400">
              <AnimatedCounter value={waStats.errorCount} duration={1000} />
            </span>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3">
            <span className="text-[11px] text-amber-300 font-bold flex items-center gap-1 mb-1">
              <Clock className="h-3.5 w-3.5 text-amber-400" /> Aguardando / Reenvio
            </span>
            <span className="text-xl font-black text-amber-400">
              <AnimatedCounter value={waStats.pendingCount} duration={1000} />
            </span>
          </div>
        </div>
      </div>


      {/* Filters Bar */}
      <Card className="p-4 bg-white border-zinc-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Buscar por cliente, e-mail, CPF ou título..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-zinc-200 text-zinc-950 text-xs shadow-md">
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="completed">Pagos (Aprovados)</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="failed">Falhados/Cancelados</SelectItem>
            </SelectContent>
          </Select>

          <Select value={seriesFilter} onValueChange={setSeriesFilter}>
            <SelectTrigger className="bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs">
              <SelectValue placeholder="Série/Anime" />
            </SelectTrigger>
            <SelectContent className="bg-white border-zinc-200 text-zinc-950 text-xs max-h-60 overflow-y-auto shadow-md">
              <SelectItem value="all">Todas as Séries & Animes</SelectItem>
              {uniqueSeries.map(([id, title]) => (
                <SelectItem key={id} value={id}>{title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Input
              placeholder="Min R$"
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs"
            />
            <Input
              placeholder="Max R$"
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border border-zinc-200 bg-white shadow-xs">
        {salesLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{ animationDelay: `${i * 70}ms` }}
                className="animate-skeleton-card flex items-center justify-between p-3.5 rounded-xl border border-zinc-100 bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 h-4 rounded shimmer-placeholder" />
                  <div className="w-28 h-4 rounded shimmer-placeholder" />
                  <div className="w-36 h-4 rounded shimmer-placeholder" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-4 rounded shimmer-placeholder" />
                  <div className="w-14 h-5 rounded-md shimmer-placeholder" />
                  <div className="w-16 h-7 rounded-lg shimmer-placeholder" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-sm">
            Nenhuma venda encontrada com os filtros selecionados.
          </div>
        ) : (
          <>
            {/* Visualização Mobile: Cards Otimizados para Celular (md:hidden) */}
            <div className="md:hidden divide-y divide-zinc-100">
              {filteredSales.map((s) => (
                <div key={s.id} className="p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-zinc-950 truncate">{s.series_title}</h4>
                      <p className="text-[11px] font-mono text-zinc-500">
                        {format(new Date(s.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-black text-emerald-600 block">
                        {formatCurrencyBRL(s.total_amount)}
                      </span>
                      {statusBadge(s.payment_status)}
                    </div>
                  </div>

                  <div className="bg-zinc-50 rounded-xl p-2.5 text-xs space-y-1 border border-zinc-100">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 text-[11px]">Cliente:</span>
                      <span className="font-semibold text-zinc-900 truncate max-w-[190px]">{s.customer_name}</span>
                    </div>
                    {s.customer_email && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 text-[11px]">E-mail:</span>
                        <span className="font-mono text-zinc-600 text-[10px] truncate max-w-[190px]">{s.customer_email}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 text-[11px]">WhatsApp:</span>
                      {s.customer_phone ? (
                        <span className="font-mono text-zinc-800 text-[11px] font-bold flex items-center gap-1">
                          <Phone className="h-3 w-3 text-emerald-600" />
                          {s.customer_phone}
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic text-[10px]">Não informado</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {whatsappBadge(s)}
                      {emailBadge(s.email_status, s.payment_status)}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {s.payment_status === 'completed' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={resendingWaId === s.id}
                            onClick={() => handleResendWhatsApp(s)}
                            className="h-8 px-2.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold gap-1 shadow-2xs"
                            title="Disparar mensagem no WhatsApp com link da série"
                          >
                            <MessageCircle className="h-3 w-3" />
                            Zap
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={resendingId === s.id}
                            onClick={() => handleResendEmail(s.id)}
                            className="h-8 px-2 text-xs border-zinc-200 text-zinc-700 hover:bg-zinc-100 font-medium gap-1 shadow-2xs"
                            title="Reenviar e-mail de acesso"
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Visualização Desktop: Tabela Completa (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50 border-b border-zinc-200">
                  <TableRow className="hover:bg-transparent border-zinc-200">
                    <TableHead className="text-zinc-700 font-bold text-xs cursor-pointer" onClick={() => toggleSort('created_at')}>
                      Data {sortIcon('created_at')}
                    </TableHead>
                    <TableHead className="text-zinc-700 font-bold text-xs cursor-pointer" onClick={() => toggleSort('series_title')}>
                      Título {sortIcon('series_title')}
                    </TableHead>
                    <TableHead className="text-zinc-700 font-bold text-xs cursor-pointer" onClick={() => toggleSort('customer_name')}>
                      Cliente {sortIcon('customer_name')}
                    </TableHead>
                    <TableHead className="text-zinc-700 font-bold text-xs">WhatsApp / Tel</TableHead>
                    <TableHead className="text-zinc-700 font-bold text-xs cursor-pointer" onClick={() => toggleSort('total_amount')}>
                      Valor {sortIcon('total_amount')}
                    </TableHead>
                    <TableHead className="text-zinc-700 font-bold text-xs">Status PIX</TableHead>
                    <TableHead className="text-zinc-700 font-bold text-xs">Disparo WhatsApp</TableHead>
                    <TableHead className="text-zinc-700 font-bold text-xs">Acesso E-mail</TableHead>
                    <TableHead className="text-right text-zinc-700 font-bold text-xs">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((s) => (
                    <TableRow key={s.id} className="border-b border-zinc-100 hover:bg-zinc-50/70 transition-colors">
                      <TableCell className="text-xs font-mono text-zinc-600">
                        {format(new Date(s.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-zinc-950 max-w-[180px] truncate">
                        {s.series_title}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-800">
                        <div className="font-semibold">{s.customer_name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{s.customer_email}</div>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-700 font-mono">
                        {s.customer_phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-emerald-600" />
                            {s.customer_phone}
                          </span>
                        ) : (
                          <span className="text-zinc-400 italic">Não informado</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-black text-emerald-600">
                        {formatCurrencyBRL(s.total_amount)}
                      </TableCell>
                      <TableCell>
                        {statusBadge(s.payment_status)}
                      </TableCell>
                      <TableCell>
                        {whatsappBadge(s)}
                      </TableCell>
                      <TableCell>
                        {emailBadge(s.email_status, s.payment_status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {s.payment_status === 'completed' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={resendingWaId === s.id}
                                onClick={() => handleResendWhatsApp(s)}
                                className="h-7 px-2 text-[10px] border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold gap-1 shadow-2xs"
                                title="Disparar mensagem no WhatsApp com link da série"
                              >
                                <MessageCircle className="h-2.5 w-2.5" />
                                {resendingWaId === s.id ? 'Enviando...' : 'Enviar Zap'}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                disabled={resendingId === s.id}
                                onClick={() => handleResendEmail(s.id)}
                                className="h-7 px-2 text-[10px] border-zinc-200 text-zinc-700 hover:bg-zinc-100 font-medium gap-1 shadow-2xs"
                                title="Reenviar e-mail de acesso"
                              >
                                <Send className="h-2.5 w-2.5" />
                                {resendingId === s.id ? 'Enviando...' : 'E-mail'}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>
    </div>
  );

  if (embedded) {
    return salesContent;
  }

  return (
    <div className="admin-theme min-h-screen relative bg-[#fbfbfd] text-zinc-950 overflow-x-hidden animate-in fade-in duration-300">
      <AdminHeader />
      <main className="app-container py-6 sm:py-8 mt-2 relative z-10 max-w-7xl">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="gap-2 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
          </Button>
        </div>
        {salesContent}
      </main>
    </div>
  );
}
