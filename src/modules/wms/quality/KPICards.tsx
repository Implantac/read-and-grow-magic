import { Card, CardContent } from "@/ui/base/card";
import type { KPI } from "./types";

function KpiCard({ label, value, cls }: { label: string; value: number; cls?: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold ${cls ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

export function KPICards({ kpi }: { kpi: KPI }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <KpiCard label="Total de lotes" value={kpi.total} />
      <KpiCard label="Pendentes" value={kpi.pending} cls="text-blue-500" />
      <KpiCard label="Aprovados" value={kpi.approved} cls="text-emerald-500" />
      <KpiCard label="Quarentena" value={kpi.quarantine} cls="text-amber-500" />
      <KpiCard label="Rejeitados" value={kpi.rejected} cls="text-red-500" />
    </div>
  );
}
