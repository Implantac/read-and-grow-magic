import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { Incident } from "./types";

export function IncidentsCard({
  incidents, loading, onUpdateStatus,
}: {
  incidents: Incident[];
  loading: boolean;
  onUpdateStatus: (args: { id: string; status: Incident["status"] }) => void;
}) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Incidentes</CardTitle></CardHeader>
      <CardContent className="max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : incidents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum incidente.</p>
        ) : (
          <div className="space-y-2">
            {incidents.map((i) => (
              <div key={i.id} className="border rounded-md p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{i.title}</div>
                  <div className="flex gap-1">
                    <Badge variant={i.severity === "critical" ? "destructive" : i.severity === "major" ? "secondary" : "outline"}>
                      {i.severity}
                    </Badge>
                    <Badge variant={i.status === "open" ? "destructive" : i.status === "mitigating" ? "secondary" : "outline"}>
                      {i.status}
                    </Badge>
                  </div>
                </div>
                {i.description && <div className="text-xs text-muted-foreground mt-1">{i.description}</div>}
                <div className="text-xs text-muted-foreground mt-1">
                  Aberto em {format(new Date(i.opened_at), "dd/MM/yyyy HH:mm")}
                  {i.resolved_at && <> · Resolvido em {format(new Date(i.resolved_at), "dd/MM/yyyy HH:mm")}</>}
                </div>
                {i.status !== "resolved" && (
                  <div className="flex gap-2 mt-2">
                    {i.status === "open" && (
                      <Button size="sm" variant="secondary" onClick={() => onUpdateStatus({ id: i.id, status: "mitigating" })}>
                        Iniciar mitigação
                      </Button>
                    )}
                    <Button size="sm" onClick={() => onUpdateStatus({ id: i.id, status: "resolved" })}>
                      Resolver
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
