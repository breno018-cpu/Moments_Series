import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import {
  Activity, CheckCircle2, AlertCircle, TrendingUp, Target, Zap, MousePointerClick,
} from 'lucide-react';
import { formatCurrencyBRL, formatNumberBRL } from '@/lib/utils';
import { AnimatedCounter } from '@/components/AnimatedCounter';

const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--chart-6))'];

const useMetaEvents = () =>
  useQuery({
    queryKey: ['meta_events_dashboard'],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from('meta_events')
        .select('event_name,status,value,utm_source,utm_campaign,match_quality_score,created_at,order_id')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(5000);
      if (error) throw error;
      return data || [];
    },
  });

const useOrdersForRoi = () =>
  useQuery({
    queryKey: ['orders_for_meta_roi'],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data } = await supabase
        .from('orders')
        .select('id,total_amount,payment_status,utm_source,utm_medium,utm_campaign,created_at')
        .gte('created_at', since.toISOString());
      return data || [];
    },
  });

export const MetaAdsDashboard = () => {
  const { data: events = [], isLoading } = useMetaEvents();
  const { data: orders = [] } = useOrdersForRoi();

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando métricas reais...</div>;
  }

  // === KPIs ===
  const total = events.length;
  const successCount = events.filter((e) => e.status === 'success').length;
  const errorCount = events.filter((e) => e.status === 'error').length;
  const successRate = total > 0 ? (successCount / total) * 100 : 0;
  const avgMatchQuality =
    total > 0 ? events.reduce((s, e) => s + (e.match_quality_score || 0), 0) / total : 0;
  const purchaseEvents = events.filter((e) => e.event_name === 'Purchase');
  const totalRevenue = purchaseEvents.reduce((s, e) => s + Number(e.value || 0), 0);

  // === Eventos por tipo ===
  const byType = Object.entries(
    events.reduce((acc: Record<string, number>, e) => {
      acc[e.event_name] = (acc[e.event_name] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, count]) => ({ name, count }));

  // === Funil por origem (utm_source) ===
  const sources = Array.from(new Set(events.map((e) => e.utm_source || 'direto')));
  const funnelBySource = sources.map((src) => {
    const list = events.filter((e) => (e.utm_source || 'direto') === src);
    return {
      source: src,
      view: list.filter((e) => e.event_name === 'ViewContent').length,
      cart: list.filter((e) => e.event_name === 'AddToCart').length,
      checkout: list.filter((e) => e.event_name === 'InitiateCheckout').length,
      purchase: list.filter((e) => e.event_name === 'Purchase').length,
    };
  }).slice(0, 6);

  // === ROI por campanha ===
  const paid = orders.filter((o) => ['approved', 'paid', 'completed'].includes(o.payment_status));
  const campaignMap = new Map<string, { revenue: number; orders: number; source: string }>();
  paid.forEach((o) => {
    const key = o.utm_campaign || 'sem_campanha';
    const cur = campaignMap.get(key) || { revenue: 0, orders: 0, source: o.utm_source || '—' };
    cur.revenue += Number(o.total_amount);
    cur.orders += 1;
    cur.source = o.utm_source || cur.source;
    campaignMap.set(key, cur);
  });
  const roi = Array.from(campaignMap.entries())
    .map(([campaign, v]) => ({ campaign, ...v, ticket: v.orders > 0 ? v.revenue / v.orders : 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // === Match quality buckets ===
  const matchBuckets = [
    { range: '0-25 (Ruim)', count: events.filter((e) => (e.match_quality_score || 0) < 25).length, color: 'hsl(0 70% 55%)' },
    { range: '25-50 (Médio)', count: events.filter((e) => (e.match_quality_score || 0) >= 25 && (e.match_quality_score || 0) < 50).length, color: 'hsl(40 90% 55%)' },
    { range: '50-75 (Bom)', count: events.filter((e) => (e.match_quality_score || 0) >= 50 && (e.match_quality_score || 0) < 75).length, color: 'hsl(150 60% 50%)' },
    { range: '75-100 (Ótimo)', count: events.filter((e) => (e.match_quality_score || 0) >= 75).length, color: 'hsl(270 70% 55%)' },
  ];

  // === Últimos erros ===
  const recentErrors = events.filter((e) => e.status === 'error').slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-1 bg-primary rounded-full" />
        <div>
          <h2 className="text-xl font-bold">Métricas Reais — Meta Ads</h2>
          <p className="text-sm text-muted-foreground">Últimos 30 dias · dados enviados via Pixel + CAPI</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          label="Eventos enviados"
          value={<AnimatedCounter value={total} duration={1100} />}
          icon={<Activity />}
        />
        <Kpi
          label="Taxa de sucesso"
          value={<AnimatedCounter value={successRate} decimals={1} suffix="%" duration={1200} />}
          icon={<CheckCircle2 className="text-green-500" />}
          sub={`${formatNumberBRL(successCount)} ok / ${formatNumberBRL(errorCount)} erros`}
        />
        <Kpi
          label="Match Quality"
          value={<AnimatedCounter value={avgMatchQuality} suffix="/100" duration={1100} />}
          icon={<Target className="text-primary" />}
          sub="média de qualidade dos dados"
        />
        <Kpi
          label="Receita atribuída"
          value={<AnimatedCounter value={totalRevenue} isCurrency={true} duration={1300} />}
          icon={<TrendingUp className="text-primary" />}
          sub={`${formatNumberBRL(purchaseEvents.length)} compras`}
        />
      </div>

      {/* Eventos por tipo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Eventos enviados por tipo
          </CardTitle>
          <CardDescription>Volume de cada evento disparado pelo Pixel + CAPI</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                }}
              />
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                isAnimationActive={true}
                animationDuration={1300}
                animationEasing="ease-out"
              >
                {byType.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Funil por origem */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-primary" /> Funil de conversão por origem (UTM)
          </CardTitle>
          <CardDescription>Visualização → Carrinho → Checkout → Compra</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelBySource}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="source" fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="view" fill={colors[0]} name="ViewContent" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1200} />
              <Bar dataKey="cart" fill={colors[1]} name="AddToCart" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1300} />
              <Bar dataKey="checkout" fill={colors[2]} name="InitiateCheckout" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1400} />
              <Bar dataKey="purchase" fill={colors[3]} name="Purchase" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1500} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ROI por campanha + Match Quality */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ROI por campanha</CardTitle>
            <CardDescription>Receita real e ticket médio por utm_campaign</CardDescription>
          </CardHeader>
          <CardContent>
            {roi.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Sem compras pagas com campanha nos últimos 30 dias
              </p>
            ) : (
              <div className="space-y-2">
                {roi.map((r) => (
                  <div key={r.campaign} className="flex items-center justify-between p-2.5 rounded bg-muted/40">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{r.campaign}</div>
                      <div className="text-xs text-muted-foreground truncate">via {r.source}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{formatCurrencyBRL(r.revenue)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatNumberBRL(r.orders)}x · ticket {formatCurrencyBRL(r.ticket)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Qualidade do match (CAPI)</CardTitle>
            <CardDescription>
              % com email/telefone/IP/UA. Quanto maior, melhor a otimização da Meta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={matchBuckets} dataKey="count" nameKey="range" cx="50%" cy="50%" outerRadius={80} label>
                  {matchBuckets.map((b, i) => (
                    <Cell key={i} fill={b.color} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Erros recentes */}
      {recentErrors.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" /> Últimos erros do Meta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentErrors.map((e: any) => (
              <div key={e.created_at} className="text-sm p-2 rounded bg-destructive/5 border border-destructive/20">
                <div className="flex justify-between">
                  <Badge variant="outline" className="text-xs">{e.event_name}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const Kpi = ({ label, value, icon, sub }: { label: string; value: React.ReactNode; icon: React.ReactNode; sub?: string }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="h-4 w-4 text-muted-foreground">{icon}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </CardContent>
  </Card>
);
