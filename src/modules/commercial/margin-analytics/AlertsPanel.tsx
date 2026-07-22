import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { AlertTriangle, Bell, Check } from 'lucide-react';

export function AlertsPanel({
  alerts, filteredAlerts, severityFilter, setSeverityFilter, resolveAlert, resolveBulk,
}: any) {
  return (
    <Card className="mb-4 border-destructive/40 bg-destructive/5">
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-destructive" />
          Alertas de Margem Crítica
          <Badge variant="destructive" className="ml-1">{filteredAlerts.length}</Badge>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas severidades</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            disabled={resolveBulk.isPending || filteredAlerts.length === 0}
            onClick={() => resolveBulk.mutate(filteredAlerts.map((a: any) => a.id))}
          >
            <Check className="h-4 w-4 mr-1" /> Resolver todos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-64 overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="text-xs text-muted-foreground py-2">Nenhum alerta para o filtro selecionado.</div>
        ) : (
          filteredAlerts.map((a: any) => (
            <div key={a.id} className="flex items-start gap-3 text-sm border-b border-border/40 last:border-0 pb-2 last:pb-0">
              <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${a.severity === 'critical' ? 'text-destructive' : 'text-yellow-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{a.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{a.description}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => resolveAlert.mutate(a.id)} disabled={resolveAlert.isPending}>
                <Check className="h-4 w-4 mr-1" /> Resolver
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
