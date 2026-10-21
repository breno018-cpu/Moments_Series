import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Film,
  ShoppingCart,
  Users,
  Calendar,
  TrendingUp,
  CreditCard,
  Percent,
  Award,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useSeries } from "@/hooks/useSeries";
import { useAnimes } from "@/hooks/useAnimes";
import { useAdminSales } from "@/hooks/useAdminSales";
import { formatCurrencyBRL, formatNumberBRL } from "@/lib/utils";
import { AnimatedCounter } from "@/components/AnimatedCounter";

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1"];

export function AdminDashboard() {
  const { data: series = [] } = useSeries();
  const { data: animes = [] } = useAnimes();
  const { data: salesData = [] } = useAdminSales();

  // Filtro de Período (Padrão: Mês Atual)
  const [periodFilter, setPeriodFilter] = useState<string>("current_month");

  // Períodos disponíveis baseados nas vendas existentes
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    salesData.forEach((s) => {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      set.add(key);
    });

    const currentKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    set.add(currentKey);

    return Array.from(set).sort().reverse();
  }, [salesData]);

  // Vendas filtradas pelo período selecionado
  const filteredSales = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (periodFilter === "all") {
      return salesData;
    }

    if (periodFilter === "current_month") {
      return salesData.filter((s) => {
        const d = new Date(s.created_at);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });
    }

    if (periodFilter === "last_month") {
      const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
      return salesData.filter((s) => {
        const d = new Date(s.created_at);
        return (
          d.getFullYear() === lastMonthDate.getFullYear() &&
          d.getMonth() === lastMonthDate.getMonth()
        );
      });
    }

    // Filtro por mês específico (formato YYYY-MM)
    return salesData.filter((s) => {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return key === periodFilter;
    });
  }, [salesData, periodFilter]);

  // Métricas Consolidadas do Período
  const metrics = useMemo(() => {
    const completed = filteredSales.filter((s) => s.payment_status === "completed");
    const pending = filteredSales.filter((s) => s.payment_status === "pending");
    const failed = filteredSales.filter(
      (s) => s.payment_status === "failed" || s.payment_status === "cancelled"
    );

    const totalRevenue = completed.reduce((acc, s) => acc + s.total_amount, 0);
    const uniqueCustomers = new Set(filteredSales.map((s) => s.customer_email)).size;
    const totalOrders = filteredSales.length;
    const conversionRate = totalOrders > 0 ? (completed.length / totalOrders) * 100 : 0;
    const ticketAverage = completed.length > 0 ? totalRevenue / completed.length : 0;

    return {
      revenue: totalRevenue,
      completedCount: completed.length,
      pendingCount: pending.length,
      failedCount: failed.length,
      ordersCount: totalOrders,
      customersCount: uniqueCustomers,
      conversionRate,
      ticketAverage,
    };
  }, [filteredSales]);

  // Gráfico de Faturamento Diário ao longo do Período
  const dailyRevenueData = useMemo(() => {
    const dayMap = new Map<string, { date: string; revenue: number; orders: number }>();

    // Ordenar vendas cronologicamente
    const sorted = [...filteredSales].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    sorted.forEach((s) => {
      const d = new Date(s.created_at);
      const dayKey = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const current = dayMap.get(dayKey) || { date: dayKey, revenue: 0, orders: 0 };

      if (s.payment_status === "completed") {
        current.revenue += s.total_amount;
        current.orders += 1;
      }
      dayMap.set(dayKey, current);
    });

    return Array.from(dayMap.values());
  }, [filteredSales]);

  // Ranking dos Títulos Mais Vendidos no Período
  const topSellingTitles = useMemo(() => {
    const titleMap = new Map<string, { title: string; count: number; total: number }>();

    filteredSales
      .filter((s) => s.payment_status === "completed")
      .forEach((s) => {
        const item = titleMap.get(s.series_title) || {
          title: s.series_title,
          count: 0,
          total: 0,
        };
        item.count += 1;
        item.total += s.total_amount;
        titleMap.set(s.series_title, item);
      });

    return Array.from(titleMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredSales]);

  // Distribuição de Status de Pagamento
  const statusDistribution = useMemo(() => {
    return [
      { name: "Aprovados", value: metrics.completedCount, color: "#10b981" },
      { name: "Pendentes", value: metrics.pendingCount, color: "#f59e0b" },
      { name: "Cancelados", value: metrics.failedCount, color: "#ef4444" },
    ].filter((item) => item.value > 0);
  }, [metrics]);

  const monthLabel = (key: string) => {
    const [year, month] = key.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Barra de Seleção de Período Executiva */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-zinc-950">Inteligência Financeira & Faturamento</h3>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            {periodFilter === "current_month" && "Exibindo dados consolidados do mês atual (Padrão)"}
            {periodFilter === "last_month" && "Exibindo comparativo do mês anterior"}
            {periodFilter === "all" && "Exibindo todo o histórico acumulado"}
            {periodFilter.includes("-") && `Exibindo consolidação de ${monthLabel(periodFilter)}`}
          </p>
        </div>

        <div className="w-full sm:w-64">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="h-10 bg-white border-zinc-200 text-xs font-bold text-zinc-900 shadow-xs">
              <SelectValue placeholder="Selecione o Período" />
            </SelectTrigger>
            <SelectContent className="bg-white border-zinc-200 text-xs shadow-md">
              <SelectItem value="current_month">📅 Mês Atual (Padrão)</SelectItem>
              <SelectItem value="last_month">⏪ Mês Anterior</SelectItem>
              <SelectItem value="all">🌐 Todo o Histórico</SelectItem>
              {availableMonths.map((m) => (
                <SelectItem key={m} value={m}>
                  {monthLabel(m).replace(/^\w/, (c) => c.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid de 4 Cards Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento Pago */}
        <Card className="bg-white border-zinc-200 shadow-xs hover:border-zinc-300 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-zinc-500">Faturamento Pago</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-zinc-950">
              <AnimatedCounter value={metrics.revenue} isCurrency={true} duration={1300} />
            </div>
            <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                <AnimatedCounter value={metrics.completedCount} duration={1000} /> pedidos aprovados
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Ticket Médio */}
        <Card className="bg-white border-zinc-200 shadow-xs hover:border-zinc-300 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-zinc-500">Ticket Médio</CardTitle>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-zinc-950">
              <AnimatedCounter value={metrics.ticketAverage} isCurrency={true} duration={1300} />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1.5">
              Média por cliente comprador
            </p>
          </CardContent>
        </Card>

        {/* Taxa de Conversão */}
        <Card className="bg-white border-zinc-200 shadow-xs hover:border-zinc-300 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-zinc-500">Taxa de Conversão</CardTitle>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Percent className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-zinc-950">
              <AnimatedCounter value={metrics.conversionRate} decimals={1} suffix="%" duration={1200} />
            </div>
            <p className="text-[10px] text-blue-600 font-bold mt-1.5 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>
                <AnimatedCounter value={metrics.ordersCount} duration={1000} /> pedidos gerados no total
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Clientes Ativos Únicos */}
        <Card className="bg-white border-zinc-200 shadow-xs hover:border-zinc-300 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-zinc-500">Compradores Únicos</CardTitle>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-zinc-950">
              <AnimatedCounter value={metrics.customersCount} duration={1200} />
            </div>
            <p className="text-[10px] text-amber-600 font-semibold mt-1.5">
              Usuários pagantes no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção Gráfica: Curva de Faturamento + Distribuição PIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Curva de Faturamento Diário */}
        <Card className="lg:col-span-2 bg-white border-zinc-200 shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Evolução Diária do Faturamento
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Faturamento líquido por dia no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dailyRevenueData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-zinc-400 text-xs">
                <Calendar className="w-8 h-8 mb-2 opacity-50" />
                <span>Nenhuma venda registrada nos dias deste período</span>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" fontSize={11} stroke="#94a3b8" />
                    <YAxis
                      fontSize={11}
                      stroke="#94a3b8"
                      tickFormatter={(val) => `R$ ${val}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-zinc-950 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                              <p className="font-bold text-zinc-300">{data.date}</p>
                              <p className="text-emerald-400 font-black">
                                {formatCurrencyBRL(data.revenue)}
                              </p>
                              <p className="text-[10px] text-zinc-400">
                                {formatNumberBRL(data.orders)} compras pagas
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#revenueGrad)"
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição dos Status PIX */}
        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-600" />
              Eficiência dos Pedidos PIX
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Status de conversão dos pedidos gerados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusDistribution.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-zinc-400 text-xs">
                <span>Nenhum pedido gerado no período</span>
              </div>
            ) : (
              <div className="h-64 w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      isAnimationActive={true}
                      animationDuration={1300}
                      animationEasing="ease-out"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${formatNumberBRL(val)} pedidos`, "Total"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-xs">
                  {statusDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-zinc-600 font-medium">{item.name}:</span>
                      <strong className="text-zinc-950">{formatNumberBRL(item.value)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Séries Mais Vendidas no Período */}
      <Card className="bg-white border-zinc-200 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Top 5 Títulos Mais Vendidos no Período
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-0.5">
              Séries e animes com maior receita convertida
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase font-bold border-zinc-200 text-zinc-600 bg-zinc-50">
            {formatNumberBRL(topSellingTitles.length)} Títulos Ranqueados
          </Badge>
        </CardHeader>
        <CardContent>
          {topSellingTitles.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 text-xs">
              Nenhuma venda aprovada registrada no período selecionado.
            </div>
          ) : (
            <div className="space-y-3">
              {topSellingTitles.map((item, idx) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 bg-zinc-50/60 hover:bg-zinc-100/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-zinc-950 text-white text-[11px] font-black flex items-center justify-center flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-zinc-950 truncate">{item.title}</h4>
                      <p className="text-[10px] text-zinc-500">
                        {formatNumberBRL(item.count)} compras aprovadas
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-black text-emerald-600 block">
                      {formatCurrencyBRL(item.total)}
                    </span>
                    <span className="text-[9px] text-zinc-400 uppercase font-semibold">
                      Receita Gerada
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
