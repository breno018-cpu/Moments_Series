import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Wrench, Copy, RefreshCw, Save, Loader2, Power } from "lucide-react";
import { toast } from "sonner";

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/toggle-maintenance`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const AdminMaintenanceSettings = () => {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["maintenance_mode", "maintenance_message", "maintenance_toggle_token"]);
    const map: Record<string, string> = {};
    (data ?? []).forEach((r: any) => (map[r.key] = r.value));
    setEnabled(map["maintenance_mode"] === "on");
    setMessage(map["maintenance_message"] ?? "");
    setToken(map["maintenance_toggle_token"] ?? "");
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from("site_settings")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) throw error;
  };

  const handleToggle = async (next: boolean) => {
    setEnabled(next);
    try {
      await updateSetting("maintenance_mode", next ? "on" : "off");
      toast.success(next ? "Modo manutenção ATIVADO" : "Modo manutenção DESATIVADO");
    } catch (e: any) {
      toast.error(e.message);
      setEnabled(!next);
    }
  };

  const handleSaveMessage = async () => {
    setSaving(true);
    try {
      await updateSetting("maintenance_message", message);
      toast.success("Mensagem salva!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const regenerateToken = async () => {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    const newToken = Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
    try {
      await updateSetting("maintenance_toggle_token", newToken);
      setToken(newToken);
      toast.success("Novo token gerado!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const buildUrl = (state: string) => `${origin}/m/${token}/${state}`;
  const urlOn = buildUrl("on");
  const urlOff = buildUrl("off");
  const urlToggle = buildUrl("toggle");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-500">
        <span className="text-xs font-semibold">Carregando status de manutenção...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-1 bg-primary rounded-full" />
        <div>
          <h2 className="text-xl font-bold">Modo Manutenção</h2>
          <p className="text-sm text-muted-foreground">
            Ative para exibir uma tela de atualização aos visitantes. Admin/login continuam acessíveis.
          </p>
        </div>
      </div>

      <Card className={enabled ? "border-primary/60 shadow-lg shadow-primary/10" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Power className={`h-4 w-4 ${enabled ? "text-primary" : "text-muted-foreground"}`} />
            Status atual
          </CardTitle>
          <CardDescription>
            {enabled
              ? "🔴 O site está em manutenção. Visitantes veem a tela de atualização."
              : "🟢 O site está operando normalmente."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <Label htmlFor="maint-switch" className="text-base font-medium">
            {enabled ? "Manutenção ativa" : "Operação normal"}
          </Label>
          <Switch id="maint-switch" checked={enabled} onCheckedChange={handleToggle} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4 text-primary" /> Mensagem exibida
          </CardTitle>
          <CardDescription>Texto curto mostrado durante a manutenção.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Estamos passando por uma atualização..."
          />
          <Button onClick={handleSaveMessage} disabled={saving} className="gap-2 bg-zinc-950 hover:bg-[#E31C25] text-white font-bold transition-colors">
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar mensagem'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Links externos (gestor da empresa)</CardTitle>
          <CardDescription>
            Use estes links a partir do seu app gestor para ligar/desligar a manutenção sem entrar no painel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Token secreto</Label>
            <div className="flex gap-2">
              <Input value={token} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(token, "Token")}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={regenerateToken} title="Gerar novo token">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Gerar um novo token invalida imediatamente os links anteriores.
            </p>
          </div>

          {[
            { label: "🔴 Ativar manutenção", url: urlOn },
            { label: "🟢 Desativar manutenção", url: urlOff },
            { label: "🔄 Alternar (toggle)", url: urlToggle },
          ].map((item) => (
            <div key={item.url} className="space-y-1.5">
              <Label className="text-xs font-semibold">{item.label}</Label>
              <div className="flex gap-2">
                <Input value={item.url} readOnly className="font-mono text-[11px]" />
                <Button variant="outline" size="icon" onClick={() => copy(item.url, "Link")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="rounded-md bg-muted/50 border border-border p-3 text-xs space-y-1">
            <p className="font-semibold">Como usar:</p>
            <p className="text-muted-foreground">
              Basta abrir o link no navegador (ou fazer um GET via seu app). A resposta JSON confirma o estado:
              <code className="ml-1 px-1 bg-background rounded">{`{ ok: true, current: "on" }`}</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
