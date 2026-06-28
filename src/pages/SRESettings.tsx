import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEnterpriseStore } from "@/core/stores/useEnterpriseStore";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Button } from "@/ui/base/button";
import { Switch } from "@/ui/base/switch";
import { Textarea } from "@/ui/base/textarea";
import { Loader2, Save, Mail, Clock } from "lucide-react";
import { toastSuccess, handleMutationError } from "@/lib/toastHelpers";

interface SRESettingsRow {
  id?: string;
  company_id: string;
  from_email: string | null;
  extra_recipients: string[];
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_timezone: string;
  silence_weekends: boolean;
}

function emptySettings(companyId: string): SRESettingsRow {
  return {
    company_id: companyId,
    from_email: "",
    extra_recipients: [],
    quiet_hours_start: "",
    quiet_hours_end: "",
    quiet_timezone: "America/Sao_Paulo",
    silence_weekends: false,
  };
}

function SRESettingsInner() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [s, setS] = useState<SRESettingsRow | null>(null);
  const [extrasText, setExtrasText] = useState("");

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("sre_settings")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();
      if (error) console.error(error);
      const row = (data as any) ?? emptySettings(companyId);
      setS(row);
      setExtrasText((row.extra_recipients ?? []).join("\n"));
      setLoading(false);
    })();
  }, [companyId]);

  async function handleSave() {
    if (!s || !companyId) return;
    setSaving(true);
    try {
      const extras = extrasText
        .split(/[\n,;]/)
        .map((x) => x.trim())
        .filter((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x));

      const payload = {
        company_id: companyId,
        from_email: s.from_email?.trim() || null,
        extra_recipients: extras,
        quiet_hours_start: s.quiet_hours_start || null,
        quiet_hours_end: s.quiet_hours_end || null,
        quiet_timezone: s.quiet_timezone || "America/Sao_Paulo",
        silence_weekends: s.silence_weekends,
      };

      const { error } = await supabase
        .from("sre_settings")
        .upsert(payload, { onConflict: "company_id" });
      if (error) throw error;
      toastSuccess("Configuração SRE salva");
      setS({ ...s, extra_recipients: extras });
    } catch (e) {
      handleMutationError(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !s) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Configuração SRE</h1>
        <p className="text-sm text-muted-foreground">
          Defina remetente, destinatários extras e janelas de silêncio para alertas de incidente crítico.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-primary" /> Remetente e destinatários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="from_email">E-mail de origem</Label>
            <Input
              id="from_email"
              placeholder='Ex: "SRE Acme" <alertas@acme.com>'
              value={s.from_email ?? ""}
              onChange={(e) => setS({ ...s, from_email: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Deve usar um domínio verificado no Resend. Vazio = remetente padrão da plataforma.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="extras">Destinatários extras (um e-mail por linha)</Label>
            <Textarea
              id="extras"
              rows={5}
              placeholder={"plantao@acme.com\nsre-oncall@acme.com"}
              value={extrasText}
              onChange={(e) => setExtrasText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Estes endereços recebem além dos admins do tenant. E-mails inválidos são descartados ao salvar.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" /> Janela de silêncio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qstart">Início</Label>
              <Input
                id="qstart"
                type="time"
                value={s.quiet_hours_start ?? ""}
                onChange={(e) => setS({ ...s, quiet_hours_start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qend">Fim</Label>
              <Input
                id="qend"
                type="time"
                value={s.quiet_hours_end ?? ""}
                onChange={(e) => setS({ ...s, quiet_hours_end: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tz">Fuso</Label>
              <Input
                id="tz"
                value={s.quiet_timezone}
                onChange={(e) => setS({ ...s, quiet_timezone: e.target.value })}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Durante a janela de silêncio o e-mail crítico é suprimido — a notificação in-app continua sendo gerada.
            A janela pode cruzar a meia-noite (ex.: 22:00 → 06:00).
          </p>

          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 p-3">
            <div>
              <p className="text-sm font-medium">Silenciar finais de semana</p>
              <p className="text-xs text-muted-foreground">
                Sábados e domingos não recebem e-mail crítico.
              </p>
            </div>
            <Switch
              checked={s.silence_weekends}
              onCheckedChange={(v) => setS({ ...s, silence_weekends: v })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar configuração
        </Button>
      </div>
    </div>
  );
}

export default function SRESettings() {
  return (
    <RoleGuard roles={["admin"]}>
      <SRESettingsInner />
    </RoleGuard>
  );
}
