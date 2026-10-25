import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '@/components/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, ArrowLeft, Percent, DollarSign, Tag } from 'lucide-react';
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon } from '@/hooks/useCoupons';
import { useAdmin } from '@/hooks/useAdmin';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyBRL, formatNumberBRL } from '@/lib/utils';

export interface AdminCouponsProps {
  embedded?: boolean;
}

export default function AdminCoupons({ embedded = false }: AdminCouponsProps = {}) {
  const navigate = useNavigate();
  const { data: adminStatus, isLoading: adminLoading } = useAdmin();
  const { data: coupons, isLoading } = useCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_purchase: '',
    max_uses: '',
    valid_from: new Date().toISOString().slice(0, 16),
    valid_until: '',
    active: true,
  });

  useEffect(() => {
    if (adminLoading) return;
    if (!adminStatus?.isAdmin && !embedded) {
      navigate('/auth');
    }
  }, [adminStatus, adminLoading, navigate, embedded]);

  if (adminLoading || (!adminStatus?.isAdmin && !embedded)) {
    return null;
  }

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_purchase: '',
      max_uses: '',
      valid_from: new Date().toISOString().slice(0, 16),
      valid_until: '',
      active: true,
    });
    setEditingId(null);
  };

  const handleEdit = (coupon: any) => {
    setEditingId(coupon.id);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_purchase: coupon.min_purchase.toString(),
      max_uses: coupon.max_uses?.toString() || '',
      valid_from: new Date(coupon.valid_from).toISOString().slice(0, 16),
      valid_until: coupon.valid_until ? new Date(coupon.valid_until).toISOString().slice(0, 16) : '',
      active: coupon.active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const couponData = {
      code: formData.code.toUpperCase(),
      discount_type: formData.discount_type,
      discount_value: Number(formData.discount_value),
      min_purchase: Number(formData.min_purchase) || 0,
      max_uses: formData.max_uses ? Number(formData.max_uses) : null,
      valid_from: new Date(formData.valid_from).toISOString(),
      valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
      active: formData.active,
    };

    if (editingId) {
      await updateCoupon.mutateAsync({ id: editingId, ...couponData });
    } else {
      await createCoupon.mutateAsync(couponData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cupom?')) {
      await deleteCoupon.mutateAsync(id);
    }
  };

  const couponsContent = (
    <div className="admin-theme space-y-6 text-zinc-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-950 flex items-center gap-2">
            <Tag className="h-5 w-5 text-amber-600" />
            Gerenciador de Cupons Promocionais
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">Crie códigos de desconto com limite de uso e validade.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} size="sm" className="h-10 px-4 rounded-xl bg-zinc-950 hover:bg-[#E31C25] text-white font-bold text-xs shadow-xs gap-2">
              <Plus className="h-4 w-4 stroke-[3]" /> Adicionar Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-7 bg-white border-zinc-200 rounded-2xl shadow-2xl custom-scrollbar text-zinc-950">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-950">
                <Tag className="h-5 w-5 text-amber-400" />
                {editingId ? 'Editar Cupom' : 'Criar Novo Cupom'}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Preencha os dados do cupom de desconto.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4 w-full max-w-full overflow-x-hidden">
              <div>
                <Label htmlFor="code" className="text-xs font-bold text-zinc-700">Código do Cupom</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: DESCONTO10"
                  required
                  className="mt-1 bg-white border-zinc-200 text-zinc-950 font-mono text-xs uppercase shadow-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_type" className="text-xs font-bold text-zinc-700">Tipo de Desconto</Label>
                  <select
                    id="discount_type"
                    className="mt-1 flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 shadow-xs"
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="discount_value" className="text-xs font-bold text-zinc-700">
                    Valor do Desconto {formData.discount_type === 'percentage' ? '(%)' : '(R$)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    required
                    className="mt-1 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_purchase" className="text-xs font-bold text-zinc-700">Compra Mínima (R$)</Label>
                  <Input
                    id="min_purchase"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.min_purchase}
                    onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                    placeholder="0.00"
                    className="mt-1 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="max_uses" className="text-xs font-bold text-zinc-700">Limite de Usos (opcional)</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    min="1"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Ilimitado"
                    className="mt-1 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 border border-zinc-200 rounded-xl bg-zinc-50">
                <div>
                  <Label htmlFor="active" className="text-xs font-bold text-zinc-900 cursor-pointer">Cupom Ativo</Label>
                  <p className="text-[10px] text-zinc-500">Desative para pausar temporariamente este cupom.</p>
                </div>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-3 border-t border-zinc-200">
                <Button type="submit" className="flex-1 bg-zinc-950 hover:bg-[#E31C25] text-white font-bold shadow-xs">
                  {editingId ? 'Atualizar Cupom' : 'Criar Cupom'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="flex-1 sm:flex-initial border-zinc-200 text-zinc-700 hover:bg-zinc-100">Cancelar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-zinc-500">Carregando cupons...</div>
      ) : coupons && coupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => (
            <Card key={coupon.id} className="bg-white border-zinc-200 hover:border-zinc-300 transition-all hover:shadow-md">
              <CardContent className="p-4 flex flex-col justify-between h-full gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-xl font-black font-mono text-zinc-950 tracking-wider">{coupon.code}</h3>
                    {coupon.active ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">ATIVO</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] border-zinc-200 text-zinc-500">INATIVO</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-xs text-zinc-500">
                    <div className="flex items-center gap-1 text-zinc-950 font-extrabold">
                      {coupon.discount_type === 'percentage' ? (
                        <Percent className="h-3.5 w-3.5 text-amber-600" />
                      ) : (
                        <DollarSign className="h-3.5 w-3.5 text-amber-600" />
                      )}
                      <span>
                        {coupon.discount_type === 'percentage'
                          ? `${formatNumberBRL(coupon.discount_value)}% DE DESCONTO`
                          : `${formatCurrencyBRL(coupon.discount_value)} OFF`}
                      </span>
                    </div>
                    
                    {coupon.min_purchase > 0 && (
                      <p>Mínimo: {formatCurrencyBRL(coupon.min_purchase)}</p>
                    )}
                    
                    {coupon.max_uses && (
                      <p>Usos: {formatNumberBRL(coupon.current_uses)}/{formatNumberBRL(coupon.max_uses)}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(coupon)} className="h-8 px-3 text-xs border-zinc-200 gap-1 hover:bg-zinc-100 text-zinc-700">
                    <Edit className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(coupon.id)}
                    className="h-8 px-2.5 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-zinc-200 rounded-2xl bg-white shadow-xs">
          <Tag className="h-10 w-10 mx-auto mb-3 text-amber-600" />
          <h3 className="text-lg font-bold text-zinc-950 mb-1">Nenhum cupom cadastrado</h3>
          <p className="text-xs text-zinc-500 mb-4">
            Crie seu primeiro cupom de desconto para impulsionar suas vendas.
          </p>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2 bg-zinc-950 text-white hover:bg-[#E31C25] font-bold">
            <Plus className="h-4 w-4" /> Criar Primeiro Cupom
          </Button>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return couponsContent;
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
        {couponsContent}
      </main>
    </div>
  );
}
