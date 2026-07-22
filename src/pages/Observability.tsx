import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEnterpriseStore } from "@/core/stores/useEnterpriseStore";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Activity, Bell, RefreshCw } from "lucide-react";
import { useObservabilityData, useIncidentMutations, useAlertRuleMutations } from "./observability/hooks";
import { EventsCard } from "./observability/EventsCard";
import { IncidentsCard } from "./observability/IncidentsCard";
import { NewIncidentDialog } from "./observability/NewIncidentDialog";
import { AlertRulesCard } from "./observability/AlertRulesCard";

export default function Observability() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  const qc = useQueryClient();
  const [sevFilter, setSevFilter] = useState<string>("all");

  const { health, events, incidents, rules } = useObservabilityData(companyId, sevFilter);
  const { createIncident, updateStatus } = useIncidentMutations(companyId);
  const { createRule, toggleRule, deleteRule } = useAlertRuleMutations(companyId);

  const kpis = useMemo(() => {
    const ev = health.data?.events ?? { critical: 0, error: 0, warning: 0, info: 0, total: 0 };
    const inc = health.data?.incidents ?? { open: 0, mitigating: 0, resolved_24h: 0 };
    return [
      { label: "Críticos (24h)", value: ev.critical, accent: "text-red-500" },
      { label: "Erros (24h)", value: ev.error, accent: "text-orange-500" },
      { label: "Avisos (24h)", value: ev.warning, accent: "text-yellow-500" },
      { label: "Incidentes abertos", value: inc.open + inc.mitigating, accent: "text-primary" },
    ];
  }, [health.data]);

  return (
    <PageContainer>
      <PageHeader
        title="Observabilidade & SRE"
        description="Saúde da plataforma, eventos e incidentes deste tenant"
        icon={Activity}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/sre/configuracao"><Bell className="h-4 w-4 mr-1" /> Configurar SRE</a>
            </Button>
            <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["tenant_health"] })}>
              <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
            </Button>
            <NewIncidentDialog
              pending={createIncident.isPending}
              onCreate={(f) => createIncident.mutate(f)}
            />
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-4 mb-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className={`text-2xl font-semibold ${k.accent}`}>{health.isLoading ? "…" : k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <EventsCard events={events.data ?? []} loading={events.isLoading} sevFilter={sevFilter} onSevFilter={setSevFilter} />
        <IncidentsCard incidents={incidents.data ?? []} loading={incidents.isLoading} onUpdateStatus={(a) => updateStatus.mutate(a)} />
      </div>

      <AlertRulesCard
        rules={rules.data ?? []}
        loading={rules.isLoading}
        creating={createRule.isPending}
        onCreate={(r) => createRule.mutate(r)}
        onToggle={(a) => toggleRule.mutate(a)}
        onDelete={(id) => deleteRule.mutate(id)}
      />
    </PageContainer>
  );
}
