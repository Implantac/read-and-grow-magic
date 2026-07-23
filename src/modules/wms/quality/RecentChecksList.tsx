import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { EmptyState } from "@/shared/components/EmptyState";
import { ClipboardList, ShieldCheck } from "lucide-react";
import { decisionMeta, type Check, type Decision } from "./types";

export function RecentChecksList({ checks }: { checks: Check[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Últimas Inspeções</CardTitle>
      </CardHeader>
      <CardContent>
        {checks.length === 0 ? (
          <EmptyState
            compact
            icon={ClipboardList}
            title="Nenhuma inspeção registrada"
            description="Inspecione lotes recebidos para começar a acumular histórico de qualidade."
          />
        ) : (
          <ul className="space-y-2">
            {checks.map((c) => {
              const meta = decisionMeta[c.decision as Decision];
              const Icon = meta?.icon ?? ShieldCheck;
              return (
                <li key={c.id} className="flex items-center gap-3 text-sm p-2 rounded border bg-card">
                  <Icon className={`h-4 w-4 ${meta?.cls.split(" ")[1] ?? ""}`} aria-hidden="true" />
                  <Badge className={meta?.cls}>{meta?.label ?? c.decision}</Badge>
                  <span className="text-muted-foreground text-xs">
                    Amostra {c.sample_size ?? 0} · Defeitos {c.defects_found ?? 0}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleString("pt-BR")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
