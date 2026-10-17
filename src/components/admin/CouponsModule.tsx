import React, { useState, useMemo } from "react";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Percent,
  Calendar,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  XCircle,
  Save,
  Copy,
  AlertTriangle,
  Zap,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { DbCoupon } from "@/lib/api";
import { PLATFORM_LIMITS, canCreateCoupon } from "@/lib/limits";
import { AnimatedCountUp } from "./AnimatedCountUp";

interface CouponsModuleProps {
  coupons: DbCoupon[];
  onSaveCoupon: (coupon: Partial<DbCoupon>) => Promise<void>;
  onDeleteCoupon: (id: string) => Promise<void>;
  onToggleCoupon: (coupon: DbCoupon) => Promise<void>;
}

const formatBRL = (value: number) => {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const CouponsModule: React.FC<CouponsModuleProps> = ({
  coupons,
  onSaveCoupon,
  onDeleteCoupon,
  onToggleCoupon,
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Partial<DbCoupon> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const active = coupons.filter((c) => c.is_active).length;
    const totalUses = coupons.reduce((sum, c) => sum + (c.used_count || 0), 0);
    const availableSlots = Math.max(0, PLATFORM_LIMITS.COUPONS_MAX - coupons.length);
    return { active, totalUses, availableSlots };
  }, [coupons]);

  const handleOpenNew = () => {
    const check = canCreateCoupon(coupons.length);
    if (!check.allowed) {
      toast.error(check.message);
      return;
    }

    setEditCoupon({
      code: "",
      discount_type: "percentage",
      discount_value: 10,
      min_order_value: 0,
      max_uses: null,
      is_active: true,
      starts_at: new Date().toISOString(),
      expires_at: null,
    });
    setIsOpenModal(true);
  };

  const handleOpenEdit = (c: DbCoupon) => {
    setEditCoupon({ ...c });
    setIsOpenModal(true);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Cupom "${code}" copiado para a área de transferência!`);
  };

  const handleSave = async () => {
    if (!editCoupon?.code?.trim()) {
      toast.error("O código do cupom é obrigatório.");
      return;
    }

    // Strictly enforce ceiling when creating a new coupon
    if (!editCoupon.id) {
      const check = canCreateCoupon(coupons.length);
      if (!check.allowed) {
        toast.error(check.message);
        return;
      }
    }

    // Validate discount values
    const discVal = Number(editCoupon.discount_value || 0);
    if (discVal <= 0) {
      toast.error("O valor de desconto deve ser maior do que zero.");
      return;
    }

    if (editCoupon.discount_type === "percentage" && discVal > 100) {
      toast.error("O desconto percentual não pode ultrapassar 100%.");
      return;
    }

    setIsSaving(true);
    try {
      await onSaveCoupon(editCoupon);
      toast.success(editCoupon.id ? "Cupom atualizado!" : "Cupom criado com sucesso!");
      setIsOpenModal(false);
      setEditCoupon(null);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar cupom.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quota Exhaustion Alert if reached */}
      {coupons.length >= PLATFORM_LIMITS.COUPONS_MAX && (
        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-medium shadow-xs">
          <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          <span>
            <strong>Capacidade Máxima Atingida ({PLATFORM_LIMITS.COUPONS_MAX}/{PLATFORM_LIMITS.COUPONS_MAX}):</strong> O limite de cupons promocionais do plano foi alcançado. Remova ou desative cupons antigos para criar novos códigos.
          </span>
        </div>
      )}

      {/* Top Bar in White */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Tag size={16} />
            </div>
            Gestão de Cupons Promocionais
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Crie campanhas de desconto com limite de uso e datas de expiração automáticas.
          </p>
        </div>

        <Button
          onClick={handleOpenNew}
          className="h-10 bg-gradient-to-r from-[#7B3FE4] via-[#6C2BD9] to-[#5B21B6] hover:brightness-110 text-white text-xs font-bold px-4 gap-2 rounded-xl shadow-xs transition-all"
        >
          <Plus size={16} />
          <span>Criar Novo Cupom</span>
          <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-medium ml-1">
            {coupons.length}/25
          </span>
        </Button>
      </div>

      {/* Coupons Quick Stats with sequential CountUp animation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total de Cupons
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Tag size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            <AnimatedCountUp end={coupons.length} delay={0} />
            <span className="text-xs font-normal text-slate-400 ml-1.5">/ {PLATFORM_LIMITS.COUPONS_MAX}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {stats.availableSlots} vagas restantes
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Cupons Ativos
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Zap size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            <AnimatedCountUp end={stats.active} delay={150} />
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            Prontos para aplicação
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total de Resgates
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Users size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-900 tracking-tight">
            <AnimatedCountUp end={stats.totalUses} delay={300} />
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">
            Usos acumulados
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Vagas de Cupom
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Percent size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 tracking-tight">
            <AnimatedCountUp end={stats.availableSlots} delay={450} />
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            Disponíveis para criar
          </div>
        </div>
      </div>

      {/* Coupons Table in White */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Código Promocional</th>
                <th className="px-5 py-3.5">Desconto Aplicado</th>
                <th className="px-5 py-3.5">Utilizações</th>
                <th className="px-5 py-3.5">Pedido Mínimo</th>
                <th className="px-5 py-3.5">Validade</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                    Nenhum cupom cadastrado. Clique no botão acima para criar o primeiro.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => {
                  const now = new Date();
                  const isExpired = c.expires_at && new Date(c.expires_at) < now;
                  const notStarted = c.starts_at && new Date(c.starts_at) > now;
                  const isMaxed = c.max_uses !== null && c.used_count >= c.max_uses;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Código */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-rose-600">
                            {c.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(c.code)}
                            className="text-slate-400 hover:text-slate-600 p-1"
                            title="Copiar Código"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </td>

                      {/* Desconto */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 font-bold text-slate-900 text-sm">
                          {c.discount_type === "percentage" ? (
                            <>
                              <span>{c.discount_value}</span>
                              <Percent size={13} className="text-rose-600" />
                            </>
                          ) : (
                            <>
                              <span className="text-slate-500 font-normal text-xs">R$</span>
                              <span>{formatBRL(Number(c.discount_value))}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Utilizações */}
                      <td className="px-5 py-4 text-xs text-slate-700">
                        <span className="font-semibold text-slate-900">{c.used_count}</span>
                        <span className="text-slate-500">
                          {c.max_uses !== null ? ` / ${c.max_uses}` : " (ilimitado)"}
                        </span>
                      </td>

                      {/* Pedido Mínimo */}
                      <td className="px-5 py-4 text-xs text-slate-600">
                        {Number(c.min_order_value) > 0
                          ? `R$ ${formatBRL(Number(c.min_order_value))}`
                          : "Sem mínimo"}
                      </td>

                      {/* Validade */}
                      <td className="px-5 py-4 text-xs text-slate-600">
                        {c.expires_at
                          ? new Date(c.expires_at).toLocaleDateString("pt-BR")
                          : "Indeterminada"}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle size={12} />
                            Expirado
                          </span>
                        ) : notStarted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <Clock size={12} />
                            Agendado
                          </span>
                        ) : isMaxed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={12} />
                            Esgotado
                          </span>
                        ) : c.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleCoupon(c)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                            title={c.is_active ? "Desativar Cupom" : "Ativar Cupom"}
                          >
                            {c.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(c)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                            title="Editar Cupom"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(c.id)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Excluir Cupom"
                          >
                            <Trash2 size={14} />
                          </Button>
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

      {/* Modal Dialog Form in White */}
      {isOpenModal && editCoupon && (
        <Dialog open={isOpenModal} onOpenChange={setIsOpenModal}>
          <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Tag size={20} className="text-rose-600" />
                {editCoupon.id ? "Editar Cupom" : "Novo Cupom Promocional"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 my-2 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Código do Cupom *
                </label>
                <Input
                  value={editCoupon.code || ""}
                  onChange={(e) =>
                    setEditCoupon({
                      ...editCoupon,
                      code: e.target.value.toUpperCase().replace(/\s/g, ""),
                    })
                  }
                  placeholder="EX: PROMO10 ou BEMVINDO"
                  className="bg-slate-50 border-slate-200 text-slate-900 font-mono tracking-wider text-sm rounded-xl h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Tipo de Desconto
                  </label>
                  <select
                    value={editCoupon.discount_type || "percentage"}
                    onChange={(e) =>
                      setEditCoupon({
                        ...editCoupon,
                        discount_type: e.target.value as "percentage" | "fixed",
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl h-10 px-3 text-xs outline-none focus:border-rose-500"
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {editCoupon.discount_type === "percentage"
                      ? "Valor do Desconto (%)"
                      : "Valor do Desconto (R$)"}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editCoupon.discount_value || 0}
                    onChange={(e) =>
                      setEditCoupon({
                        ...editCoupon,
                        discount_value: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-10 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Pedido Mínimo (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editCoupon.min_order_value || 0}
                    onChange={(e) =>
                      setEditCoupon({
                        ...editCoupon,
                        min_order_value: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-10 text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Limite Máximo de Usos
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={editCoupon.max_uses ?? ""}
                    onChange={(e) =>
                      setEditCoupon({
                        ...editCoupon,
                        max_uses: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="Deixe vazio para ilimitado"
                    className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Data de Início
                  </label>
                  <Input
                    type="datetime-local"
                    value={
                      editCoupon.starts_at
                        ? new Date(editCoupon.starts_at).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      setEditCoupon({
                        ...editCoupon,
                        starts_at: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      })
                    }
                    className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-10 text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Data de Expiração
                  </label>
                  <Input
                    type="datetime-local"
                    value={
                      editCoupon.expires_at
                        ? new Date(editCoupon.expires_at).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      setEditCoupon({
                        ...editCoupon,
                        expires_at: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      })
                    }
                    className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={editCoupon.is_active ?? true}
                  onCheckedChange={(checked) =>
                    setEditCoupon({ ...editCoupon, is_active: checked })
                  }
                />
                <span className="text-xs text-slate-700 font-semibold">
                  Cupom Ativo e pronto para uso
                </span>
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpenModal(false)}
                className="border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button
                disabled={isSaving}
                onClick={handleSave}
                className="bg-gradient-to-r from-[#7B3FE4] via-[#6C2BD9] to-[#5B21B6] hover:brightness-110 text-white font-bold text-xs rounded-xl gap-1.5 shadow-xs transition-all"
              >
                <Save size={15} />
                <span>{isSaving ? "Salvando..." : "Salvar Cupom"}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation in White */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-sm rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Excluir Cupom?
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-500 mt-1">
            Clientes não poderão mais aplicar este código no checkout.
          </p>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
              className="border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (deleteConfirmId) {
                  await onDeleteCoupon(deleteConfirmId);
                  setDeleteConfirmId(null);
                  toast.success("Cupom excluído com sucesso.");
                }
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-xs"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponsModule;
