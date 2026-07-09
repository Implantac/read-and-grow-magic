import { useState } from 'react';
import { useNPSLogs } from './hooks';
import { Card, CardContent } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Skeleton } from '@/ui/base/skeleton';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { FileText, Search } from 'lucide-react';

const LEVEL_STYLE: Record<string, string> = {
  error: 'bg-red-500/20 text-red-500 border-red-500/30',
  warn: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  info: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  success: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
};

export default function Logs() {
  const [level, setLevel] = useState('all');
  const [event, setEvent] = useState('');
  const { data: logs = [], isLoading } = useNPSLogs({ level, event });
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5" /> Logs de atividade</h2>
        <p className="text-sm text-muted-foreground">Histórico de webhooks, alertas, automações e disparos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl">
        <div>
          <Label>Nível</Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
              <SelectItem value="warn">Alerta</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Buscar evento</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={event} onChange={(e) => setEvent(e.target.value)} placeholder="webhook, alert, invite..." className="pl-8" />
          </div>
        </div>
      </div>

      {isLoading ? <Skeleton className="h-64" /> : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {(logs as any[]).map((l) => (
                <div key={l.id} className="p-3 hover:bg-muted/20">
                  <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setExpanded(expanded === l.id ? null : l.id)}>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Badge className={LEVEL_STYLE[l.level] ?? 'bg-muted text-muted-foreground'}>{l.level}</Badge>
                      <span className="font-mono text-xs text-muted-foreground shrink-0">{l.event}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {typeof l.payload === 'object' && l.payload ? JSON.stringify(l.payload).slice(0, 120) : ''}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  {expanded === l.id && l.payload && (
                    <pre className="mt-2 p-2 bg-muted/40 rounded text-xs overflow-x-auto">{JSON.stringify(l.payload, null, 2)}</pre>
                  )}
                </div>
              ))}
              {(logs as any[]).length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Sem logs no filtro.</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
