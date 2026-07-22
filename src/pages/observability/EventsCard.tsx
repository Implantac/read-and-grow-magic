import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import { AlertCircle, AlertTriangle, Info, Loader2, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { SystemEvent } from "./types";
import { sevColor } from "./hooks";

const sevIcon = (s: string) => {
  if (s === "critical") return <ShieldAlert className="h-3.5 w-3.5" />;
  if (s === "error") return <AlertCircle className="h-3.5 w-3.5" />;
  if (s === "warning") return <AlertTriangle className="h-3.5 w-3.5" />;
  return <Info className="h-3.5 w-3.5" />;
};

export function EventsCard({
  events, loading, sevFilter, onSevFilter,
}: { events: SystemEvent[]; loading: boolean; sevFilter: string; onSevFilter: (v: string) => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Eventos recentes</CardTitle>
        <Select value={sevFilter} onValueChange={onSevFilter}>
          <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas severidades</SelectItem>
            <SelectItem value="critical">Crítico</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
            <SelectItem value="warning">Aviso</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="debug">Debug</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Sem eventos no período.</p>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className="border rounded-md p-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={sevColor[e.severity] as any} className="gap-1">
                    {sevIcon(e.severity)} {e.severity}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{e.source}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(e.occurred_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <div className="mt-1">{e.message}</div>
                {Object.keys(e.context ?? {}).length > 0 && (
                  <pre className="mt-1 text-[10px] text-muted-foreground bg-muted/40 p-1 rounded overflow-x-auto">
{JSON.stringify(e.context, null, 0)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
