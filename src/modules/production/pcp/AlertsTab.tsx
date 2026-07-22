import { Card, CardContent } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { AlertTriangle, ShieldCheck, Play } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import PCPIntelligencePanel from '@/components/production/PCPIntelligencePanel';

interface Props {
  pcpIntel: any;
  delayedOPs: any[];
  today: Date;
  onStatusChange: (op: any, newStatus: string) => void;
}

export function AlertsTab({ pcpIntel, delayedOPs, today, onStatusChange }: Props) {
  return (
    <div className="space-y-4">
      <PCPIntelligencePanel suggestions={pcpIntel.suggestions} summary={pcpIntel.summary} />

      {delayedOPs.length === 0 && pcpIntel.suggestions.length === 0 && (
        <Card><CardContent className="py-12 text-center"><ShieldCheck className="h-12 w-12 mx-auto text-success mb-4" /><p className="text-lg font-medium">Nenhum alerta ativo</p><p className="text-sm text-muted-foreground">Todas as OPs estão dentro do prazo</p></CardContent></Card>
      )}
      {delayedOPs.map(o => (
        <Card key={o.id} className="border-l-4 border-l-destructive">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div><p className="font-medium">{o.order_number} — {o.product_name}</p><p className="text-sm text-muted-foreground">{differenceInDays(today, parseISO(o.due_date!))} dias de atraso</p></div>
            </div>
            <Button size="sm" variant="outline" onClick={() => onStatusChange(o, 'in_progress')}><Play className="h-3 w-3 mr-1" /> Priorizar</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
