import React, { useState, useMemo } from "react";
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
} from "recharts";
import { TrendingUp, BarChart3, Calendar, Sparkles } from "lucide-react";
import type { DbOrder } from "@/lib/api";
import { AnimatedCountUp } from "./AnimatedCountUp";

interface AnimatedSalesChartProps {
  orders: DbOrder[];
}

export const AnimatedSalesChart: React.FC<AnimatedSalesChartProps> = ({ orders }) => {
  const [chartType, setChartType] = useState<"revenue" | "volume">("revenue");
  const [daysRange, setDaysRange] = useState<7 | 14 | 30>(7);

  // Group orders by day according to selected daysRange
  const chartData = useMemo(() => {
    const map = new Map<string, { date: string; displayDate: string; revenue: number; paidCount: number; pendingCount: number; totalCount: number }>();
    const now = new Date();

    // Initialize all days in range so empty days still show on graph
    for (let i = daysRange - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoKey = d.toISOString().slice(0, 10);
      const displayDate = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      map.set(isoKey, {
        date: isoKey,
        displayDate,
        revenue: 0,
        paidCount: 0,
        pendingCount: 0,
        totalCount: 0,
      });
    }

    orders.forEach((o) => {
      const dayKey = o.created_at.slice(0, 10);
      const entry = map.get(dayKey);
      if (entry) {
        entry.totalCount += 1;
        if (o.status === "pago") {
          entry.revenue += Number(o.total || 0);
          entry.paidCount += 1;
        } else if (o.status === "pendente") {
          entry.pendingCount += 1;
        }
      }
    });

    return Array.from(map.values());
  }, [orders, daysRange]);

  const summary = useMemo(() => {
    const totalRevenue = chartData.reduce((acc, d) => acc + d.revenue, 0);
    const totalPaid = chartData.reduce((acc, d) => acc + d.paidCount, 0);
    const maxDay = chartData.reduce((prev, curr) => (curr.revenue > prev.revenue ? curr : prev), chartData[0] || { revenue: 0, displayDate: "-" });
    const dailyAverage = totalRevenue / Math.max(1, chartData.length);

    return {
      totalRevenue,
      totalPaid,
      maxDayRevenue: maxDay.revenue,
      maxDayDate: maxDay.displayDate,
      dailyAverage,
    };
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[150px]">
          <p className="font-bold text-slate-300 pb-1 border-b border-slate-800 flex items-center justify-between">
            <span>Data: {data.displayDate}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Faturamento:</span>
            <span className="font-mono font-bold text-emerald-400">
              R$ {Number(data.revenue).toFixed(2).replace(".", ",")}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Pedidos Pagos:</span>
            <span className="font-mono font-semibold text-white">{data.paidCount}</span>
          </div>
          {data.pendingCount > 0 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Pendentes:</span>
              <span className="font-mono font-semibold text-amber-400">{data.pendingCount}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
      {/* Header with Title and Control Toggles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={14} className="text-rose-600" />
              Evolução e Tendência de Vendas
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <Sparkles size={10} />
              Dinâmico
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Acompanhe a curva de receita e o volume diário com animação em tempo real
          </p>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap justify-between sm:justify-end">
          {/* Chart Type (Revenue / Volume) */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl text-xs">
            <button
              onClick={() => setChartType("revenue")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                chartType === "revenue"
                  ? "bg-white text-rose-600 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingUp size={12} />
              <span>Receita</span>
            </button>
            <button
              onClick={() => setChartType("volume")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                chartType === "volume"
                  ? "bg-white text-rose-600 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 size={12} />
              <span>Volume</span>
            </button>
          </div>

          {/* Days Range (7d, 14d, 30d) */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl text-xs">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setDaysRange(days as 7 | 14 | 30)}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  daysRange === days
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200 font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[250px] sm:h-[280px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "revenue" ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E31C25" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7B3FE4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748B", fontSize: 11 }}
                dy={6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748B", fontSize: 11 }}
                tickFormatter={(val) => `R$${val}`}
                dx={-6}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#E31C25"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#revenueGradient)"
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748B", fontSize: 11 }}
                dy={6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748B", fontSize: 11 }}
                allowDecimals={false}
                dx={-6}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="paidCount"
                fill="#7B3FE4"
                radius={[6, 6, 0, 0]}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Micro-Cards with Animated Count-Ups */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] font-semibold text-slate-500 uppercase block">
            Total Período
          </span>
          <AnimatedCountUp
            end={summary.totalRevenue}
            decimals={2}
            prefix="R$ "
            delay={100}
            className="text-sm sm:text-base font-bold font-mono text-slate-900"
          />
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] font-semibold text-slate-500 uppercase block">
            Média Diária
          </span>
          <AnimatedCountUp
            end={summary.dailyAverage}
            decimals={2}
            prefix="R$ "
            delay={200}
            className="text-sm sm:text-base font-bold font-mono text-emerald-600"
          />
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] font-semibold text-slate-500 uppercase block">
            Pico Diário ({summary.maxDayDate})
          </span>
          <AnimatedCountUp
            end={summary.maxDayRevenue}
            decimals={2}
            prefix="R$ "
            delay={300}
            className="text-sm sm:text-base font-bold font-mono text-purple-700"
          />
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] font-semibold text-slate-500 uppercase block">
            Pedidos no Período
          </span>
          <AnimatedCountUp
            end={summary.totalPaid}
            decimals={0}
            suffix=" pagos"
            delay={400}
            className="text-sm sm:text-base font-bold font-mono text-slate-900"
          />
        </div>
      </div>
    </div>
  );
};

export default AnimatedSalesChart;
