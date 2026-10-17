import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Users,
  Download,
  Save,
  Search,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchMetaPixelConfig,
  saveMetaPixelConfig,
  initMetaPixel,
} from "@/lib/metaPixel";
import type { DbOrder } from "@/lib/api";

interface MarketingModuleProps {
  orders: DbOrder[];
}

interface PixelSettings {
  gtmId: string;
  tiktokPixelId: string;
}

export const MarketingModule: React.FC<MarketingModuleProps> = ({ orders }) => {
  // Meta Pixel state
  const [pixelId, setPixelId] = useState("");
  const [domainVerification, setDomainVerification] = useState("");
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);

  // Other Pixels state (GTM, TikTok)
  const [pixels, setPixels] = useState<PixelSettings>({
    gtmId: "",
    tiktokPixelId: "",
  });
  const [savingOther, setSavingOther] = useState(false);

  // Leads search
  const [leadSearch, setLeadSearch] = useState("");

  // Load Meta Pixel & Other Pixels from Supabase
  useEffect(() => {
    fetchMetaPixelConfig().then((cfg) => {
      setPixelId(cfg.pixel_id || "");
      setDomainVerification(cfg.domain_verification || "");
      setLoadingMeta(false);
    });

    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "marketing_pixels")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && typeof data.value === "object") {
          setPixels(data.value as unknown as PixelSettings);
        }
      });
  }, []);

  const handleSaveMeta = async () => {
    const trimmed = pixelId.trim();
    if (trimmed && !/^\d{10,20}$/.test(trimmed)) {
      toast.error("O Pixel ID da Meta deve conter apenas números (10 a 20 dígitos).");
      return;
    }

    setSavingMeta(true);
    try {
      await saveMetaPixelConfig({
        pixel_id: trimmed,
        domain_verification: domainVerification.trim(),
      });
      if (trimmed) await initMetaPixel(trimmed);
      toast.success("Configurações do Meta Pixel salvas com sucesso!");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar Meta Pixel.");
    } finally {
      setSavingMeta(false);
    }
  };

  const handleSaveOtherPixels = async () => {
    setSavingOther(true);
    try {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "marketing_pixels")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("site_settings")
          .update({ value: pixels as any })
          .eq("key", "marketing_pixels");
      } else {
        await supabase
          .from("site_settings")
          .insert({ key: "marketing_pixels", value: pixels as any });
      }

      toast.success("Pixels de GTM e TikTok salvos!");
    } catch {
      toast.error("Erro ao salvar tags adicionais.");
    } finally {
      setSavingOther(false);
    }
  };

  // Derive unique leads from orders
  const leads = useMemo(() => {
    const map = new Map<string, { email: string; name: string; totalSpent: number; ordersCount: number; lastDate: string }>();

    orders.forEach((o) => {
      const email = (o.user_email || "").trim().toLowerCase();
      if (!email) return;

      const existing = map.get(email);
      const isPaid = o.status === "pago";
      const spent = isPaid ? Number(o.total || 0) : 0;

      if (!existing) {
        map.set(email, {
          email,
          name: o.user_name || "Cliente",
          totalSpent: spent,
          ordersCount: 1,
          lastDate: o.created_at,
        });
      } else {
        existing.totalSpent += spent;
        existing.ordersCount += 1;
        if (new Date(o.created_at) > new Date(existing.lastDate)) {
          existing.lastDate = o.created_at;
          if (o.user_name) existing.name = o.user_name;
        }
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
    );
  }, [orders]);

  const filteredLeads = useMemo(() => {
    const q = leadSearch.toLowerCase();
    return leads.filter(
      (l) => l.email.toLowerCase().includes(q) || l.name.toLowerCase().includes(q)
    );
  }, [leads, leadSearch]);

  const handleExportLeadsCSV = () => {
    if (filteredLeads.length === 0) {
      toast.error("Nenhum lead para exportar.");
      return;
    }

    const headers = ["Nome", "Email", "Total Gasto (R$)", "Quantidade de Pedidos", "Ultima Atividade"];
    const rows = filteredLeads.map((l) => [
      `"${l.name}"`,
      `"${l.email}"`,
      l.totalSpent.toFixed(2),
      l.ordersCount,
      `"${new Date(l.lastDate).toLocaleDateString("pt-BR")}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `leads_newsletter_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Base de leads exportada para CSV!");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Pixels and Trackers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meta Pixel Card */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Meta Pixel (Facebook & Instagram Ads)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Rastreamento oficial de conversões e tráfego pago
                </p>
              </div>
            </div>

            {pixelId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={11} />
                Ativo
              </span>
            )}
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-700 font-medium block mb-1">
                Pixel ID
              </label>
              <Input
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                placeholder="Ex: 1234567890123456"
                className="bg-slate-50 border-slate-200 text-slate-900 font-mono rounded-xl h-10 text-xs focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Localize seu identificador em:{" "}
                <a
                  href="https://business.facebook.com/events_manager"
                  target="_blank"
                  rel="noreferrer"
                  className="text-rose-600 hover:underline font-medium"
                >
                  business.facebook.com/events_manager
                </a>
              </span>
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">
                Verificação de Domínio (Meta Business Meta Tag)
              </label>
              <Input
                value={domainVerification}
                onChange={(e) => setDomainVerification(e.target.value)}
                placeholder="Ex: 8x92nd8238..."
                className="bg-slate-50 border-slate-200 text-slate-900 font-mono rounded-xl h-10 text-xs focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Insira apenas o código de conteúdo (sem a tag &lt;meta&gt;).
              </span>
            </div>

            {/* Event list */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
              <span className="font-semibold text-slate-800 text-[11px] block mb-1">
                🎯 Eventos rastreados automaticamente:
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                • <strong>PageView</strong> (visitas gerais) &nbsp;•&nbsp;
                <strong>ViewContent</strong> (detalhes da série) &nbsp;•&nbsp;
                <strong>AddToCart</strong> (adição ao carrinho) &nbsp;•&nbsp;
                <strong>InitiateCheckout</strong> (início do PIX) &nbsp;•&nbsp;
                <strong>Purchase</strong> (compra aprovada com valor em R$)
              </p>
            </div>

            <Button
              disabled={savingMeta || loadingMeta}
              onClick={handleSaveMeta}
              className="bg-gradient-to-r from-[#7B3FE4] via-[#6C2BD9] to-[#5B21B6] hover:brightness-110 text-white font-bold text-xs h-9 gap-1.5 rounded-xl shadow-xs transition-all"
            >
              <Save size={14} />
              <span>{savingMeta ? "Salvando..." : "Salvar Meta Pixel"}</span>
            </Button>
          </div>
        </div>

        {/* Other Marketing Pixels (GTM & TikTok) */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Google Tag Manager & TikTok Ads
              </h3>
              <p className="text-[11px] text-slate-500">
                Conecte outras plataformas de tráfego e mídia de performance
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-700 font-medium block mb-1">
                Google Tag Manager (GTM Container ID)
              </label>
              <Input
                value={pixels.gtmId || ""}
                onChange={(e) =>
                  setPixels({ ...pixels, gtmId: e.target.value.trim() })
                }
                placeholder="Ex: GTM-ABC1234"
                className="bg-slate-50 border-slate-200 text-slate-900 font-mono rounded-xl h-10 text-xs focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Dispara tags universais do Google Analytics 4 e Google Ads.
              </span>
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">
                TikTok Ads Pixel ID
              </label>
              <Input
                value={pixels.tiktokPixelId || ""}
                onChange={(e) =>
                  setPixels({ ...pixels, tiktokPixelId: e.target.value.trim() })
                }
                placeholder="Ex: C89D89S0KDSK..."
                className="bg-slate-50 border-slate-200 text-slate-900 font-mono rounded-xl h-10 text-xs focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Otimização para campanhas de vídeos no TikTok Ads.
              </span>
            </div>

            <Button
              disabled={savingOther}
              onClick={handleSaveOtherPixels}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs h-9 gap-1.5 shadow-sm"
            >
              <Save size={14} />
              <span>{savingOther ? "Salvando..." : "Salvar Tags Adicionais"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Leads & Newsletter Viewer */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-rose-600" />
              Base de Leads & Clientes ({leads.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Contatos registrados através dos checkouts e compras na loja.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                placeholder="Buscar por e-mail ou nome..."
                className="pl-8 h-9 bg-slate-50 border-slate-200 text-xs rounded-xl text-slate-800 placeholder:text-slate-400 focus:bg-white"
              />
            </div>

            <Button
              onClick={handleExportLeadsCSV}
              variant="outline"
              size="sm"
              className="h-9 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs gap-1.5 rounded-xl shrink-0 shadow-sm"
            >
              <Download size={13} />
              <span>Exportar CSV</span>
            </Button>
          </div>
        </div>

        {/* Leads Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Total Investido</th>
                <th className="px-4 py-3">Pedidos Realizados</th>
                <th className="px-4 py-3">Última Atividade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Nenhum lead encontrado.
                  </td>
                </tr>
              ) : (
                filteredLeads.slice(0, 50).map((lead, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {lead.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {lead.email}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      R$ {lead.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {lead.ordersCount} pedido(s)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(lead.lastDate).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketingModule;
