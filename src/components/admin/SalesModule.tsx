import React, { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  Search,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Check,
  X,
  PackageCheck,
  User,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { DbOrder } from "@/lib/api";
import AnimatedCountUp from "./AnimatedCountUp";
import AnimatedSalesChart from "./AnimatedSalesChart";

interface SalesModuleProps {
  orders: DbOrder[];
  onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>;
  isLoading?: boolean;
}

const formatBRL = (value: number) => {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDateBR = (isoString: string) => {
  try {
    const d = new Date(isoString);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

export const SalesModule: React.FC<SalesModuleProps> = ({
  orders,
  onUpdateStatus,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<DbOrder | null>(null);

  // Month options from orders
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      const d = new Date(o.created_at);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });
    return Array.from(set).sort().reverse();
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const searchLower = search.toLowerCase();
      const matchSearch =
        o.id.toLowerCase().includes(searchLower) ||
        o.user_email.toLowerCase().includes(searchLower) ||
        (o.user_name || "").toLowerCase().includes(searchLower);

      const matchStatus = statusFilter === "all" || o.status === statusFilter;

      let matchMonth = true;
      if (selectedMonth !== "all") {
        const [y, m] = selectedMonth.split("-").map(Number);
        const d = new Date(o.created_at);
        matchMonth = d.getFullYear() === y && d.getMonth() + 1 === m;
      }

      return matchSearch && matchStatus && matchMonth;
    });
  }, [orders, search, statusFilter, selectedMonth]);

  // Calculated Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayStr = now.toISOString().slice(0, 10);

    const paidOrders = orders.filter((o) => o.status === "pago");
    const totalGross = paidOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);

    const sentEmailsCount = orders.filter((o) => o.email_status === "enviado" || !!o.email_sent_at).length;
    const totalEmailCost = Math.round(sentEmailsCount * 0.15 * 100) / 100;
    const netRevenue = Math.max(0, totalGross - totalEmailCost);

    const monthPaidOrders = paidOrders.filter((o) => {
      const d = new Date(o.created_at);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
    const totalMonth = monthPaidOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);

    const todayPaidOrders = paidOrders.filter((o) => o.created_at.startsWith(todayStr));
    const totalToday = todayPaidOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);

    const averageTicket = paidOrders.length > 0 ? totalGross / paidOrders.length : 0;

    return {
      totalGross,
      totalEmailCost,
      netRevenue,
      sentEmailsCount,
      totalMonth,
      totalToday,
      todayCount: todayPaidOrders.length,
      averageTicket,
      totalOrdersCount: orders.length,
      paidCount: paidOrders.length,
      pendingCount: orders.filter((o) => o.status === "pendente").length,
      canceledCount: orders.filter((o) => o.status === "cancelado").length,
    };
  }, [orders]);

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error("Nenhuma transação disponível para exportar.");
      return;
    }

    const headers = ["ID", "Cliente", "Email", "Total (R$)", "Status", "Metodo", "Data", "Itens"];
    const rows = filteredOrders.map((o) => [
      o.id,
      `"${o.user_name || "Cliente"}"`,
      `"${o.user_email}"`,
      Number(o.total).toFixed(2),
      o.status,
      o.payment_method || "pix",
      `"${formatDateBR(o.created_at)}"`,
      `"${JSON.stringify(o.items).replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `transacoes_hangarbox_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Relatório de vendas exportado com sucesso!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} />
            Pago
          </span>
        );
      case "pendente":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} />
            Pendente
          </span>
        );
      case "cancelado":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={12} />
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics Row in Crisp White Cards with Sequential Count-Up Animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Faturamento Total
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            <AnimatedCountUp end={metrics.totalGross} decimals={2} prefix="R$ " delay={0} />
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px] font-medium text-slate-500">
            <span>{metrics.paidCount} confirmados</span>
            <span
              className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200"
              title="Líquido real descontando R$ 0,15 por e-mail transacional enviado"
            >
              <AnimatedCountUp end={metrics.netRevenue} decimals={2} prefix="Líq: R$ " delay={100} />
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Faturamento do Mês
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            <AnimatedCountUp end={metrics.totalMonth} decimals={2} prefix="R$ " delay={150} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Mês atual em vigência
          </p>
        </div>

        {/* Card 3 */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Vendas de Hoje
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Calendar size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            <AnimatedCountUp end={metrics.totalToday} decimals={2} prefix="R$ " delay={300} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {metrics.todayCount} pedidos hoje
          </p>
        </div>

        {/* Card 4 */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ticket Médio
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            <AnimatedCountUp end={metrics.averageTicket} decimals={2} prefix="R$ " delay={450} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Média por pedido aprovado
          </p>
        </div>

        {/* Card 5 */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total de Pedidos
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <PackageCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            <AnimatedCountUp end={metrics.totalOrdersCount} decimals={0} delay={600} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {metrics.pendingCount} pendentes • {metrics.canceledCount} cancelados
          </p>
        </div>
      </div>

      {/* Animated Sales & Revenue Trend Chart */}
      <AnimatedSalesChart orders={orders} />

      {/* Control Bar: Search & Filters in White */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, e-mail ou ID..."
              className="pl-9 h-10 bg-slate-50 border-slate-200 text-sm rounded-xl text-slate-900 placeholder:text-slate-400 focus-visible:ring-rose-500/30"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl">
            {[
              { id: "all", label: "Todos" },
              { id: "pago", label: "Pagos" },
              { id: "pendente", label: "Pendentes" },
              { id: "cancelado", label: "Cancelados" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === st.id
                    ? "bg-white text-rose-600 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium outline-none focus:border-rose-500"
          >
            <option value="all">Todos os Meses</option>
            {monthOptions.map((m) => {
              const [y, mo] = m.split("-");
              const monthNames = [
                "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
              ];
              return (
                <option key={m} value={m}>
                  {monthNames[parseInt(mo) - 1]} {y}
                </option>
              );
            })}
          </select>
        </div>

        {/* Export CSV button */}
        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="h-10 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs gap-1.5 rounded-xl shrink-0 shadow-xs font-semibold"
        >
          <Download size={14} />
          <span>Exportar CSV</span>
        </Button>
      </div>

      {/* Orders Table in White */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">ID Transação</th>
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Itens / Produtos</th>
                <th className="px-5 py-3.5">Valor (BRL)</th>
                <th className="px-5 py-3.5">Data & Hora</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                    Nenhuma transação encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const items = Array.isArray(order.items) ? order.items : [];
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* ID */}
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">
                        {order.id.slice(0, 8)}...
                      </td>

                      {/* Cliente */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-xs">
                            {order.user_name || "Cliente da Loja"}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {order.user_email}
                          </span>
                        </div>
                      </td>

                      {/* Itens */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {items.length === 0 ? (
                            <span className="text-slate-400 text-xs">Item avulso</span>
                          ) : (
                            items.slice(0, 2).map((it: any, idx: number) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-slate-100 text-slate-700 text-[10px] font-normal border border-slate-200"
                              >
                                {it.titulo || it.title || "Série"}
                              </Badge>
                            ))
                          )}
                          {items.length > 2 && (
                            <span className="text-[10px] text-slate-400">
                              +{items.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Valor */}
                      <td className="px-5 py-4 font-bold text-slate-900 text-sm">
                        R$ {formatBRL(Number(order.total))}
                      </td>

                      {/* Data */}
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDateBR(order.created_at)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Ações */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                            title="Ver Detalhes do Pedido"
                          >
                            <Eye size={15} />
                          </Button>

                          {order.status === "pendente" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  onUpdateStatus(order.id, "pago");
                                  toast.success(`Pedido ${order.id.slice(0, 8)} marcado como Pago!`);
                                }}
                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                                title="Aprovar Pagamento Manualmente"
                              >
                                <Check size={15} />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  onUpdateStatus(order.id, "cancelado");
                                  toast.info(`Pedido ${order.id.slice(0, 8)} cancelado.`);
                                }}
                                className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                                title="Cancelar Pedido"
                              >
                                <X size={15} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal in White */}
      {selectedOrder && (
        <Dialog
          open={!!selectedOrder}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
        >
          <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-lg rounded-2xl shadow-xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-rose-600" />
                  Detalhes do Pedido
                </DialogTitle>
                {getStatusBadge(selectedOrder.status)}
              </div>
              <DialogDescription className="text-slate-500 text-xs font-mono">
                ID: {selectedOrder.id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2 text-xs">
              {/* Buyer info */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs mb-1">
                  <User size={14} className="text-rose-600" />
                  Informações do Comprador
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nome:</span>
                  <span className="text-slate-900 font-semibold">{selectedOrder.user_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">E-mail:</span>
                  <span className="text-slate-900 font-medium">{selectedOrder.user_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Data da Compra:</span>
                  <span className="text-slate-700">{formatDateBR(selectedOrder.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Método de Pagamento:</span>
                  <span className="text-slate-800 uppercase font-mono">{selectedOrder.payment_method || "pix"}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/80">
                  <span className="text-slate-500">E-mail de Acesso:</span>
                  <span className={`font-semibold ${selectedOrder.email_status === "enviado" || selectedOrder.email_sent_at ? "text-purple-700" : "text-amber-600"}`}>
                    {selectedOrder.email_status === "enviado" || selectedOrder.email_sent_at ? "Disparado (- R$ 0,15)" : "Pendente"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Líquido do Pedido:</span>
                  <span className="text-emerald-700 font-bold">
                    R$ {formatBRL(Math.max(0, Number(selectedOrder.total || 0) - (selectedOrder.email_status === "enviado" || selectedOrder.email_sent_at ? 0.15 : 0)))}
                  </span>
                </div>
              </div>

              {/* Items info */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-slate-800 font-semibold text-xs mb-1">
                  <span className="flex items-center gap-2">
                    <PackageCheck size={14} className="text-emerald-600" />
                    Produtos Adquiridos
                  </span>
                  <span className="text-emerald-700 font-bold">
                    Total: R$ {formatBRL(Number(selectedOrder.total))}
                  </span>
                </div>

                <div className="space-y-2 divide-y divide-slate-200 max-h-48 overflow-y-auto pr-1">
                  {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map(
                    (it: any, index: number) => (
                      <div key={index} className="pt-2 first:pt-0 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900 text-xs">{it.titulo || it.title || "Série"}</p>
                          {it.link_acesso && (
                            <a
                              href={it.link_acesso}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 mt-0.5 font-medium"
                            >
                              <span>Acessar Drive/Conteúdo</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                        <span className="font-semibold text-slate-800">
                          R$ {formatBRL(Number(it.preco || 0))}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Quick status actions in modal */}
            {selectedOrder.status === "pendente" && (
              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <Button
                  onClick={async () => {
                    await onUpdateStatus(selectedOrder.id, "pago");
                    setSelectedOrder((prev) => (prev ? { ...prev, status: "pago" } : null));
                    toast.success("Pagamento aprovado!");
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl h-9 shadow-xs"
                >
                  <Check size={14} className="mr-1" />
                  Marcar como Pago
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await onUpdateStatus(selectedOrder.id, "cancelado");
                    setSelectedOrder((prev) => (prev ? { ...prev, status: "cancelado" } : null));
                    toast.info("Pedido cancelado.");
                  }}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs rounded-xl h-9"
                >
                  Cancelar Pedido
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SalesModule;
