import { useMemo, useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Skeleton } from '@/ui/base/skeleton';
import { useAPSMulti, type APSAssignment } from '@/hooks/production/useAPSMulti';
import { AlertTriangle, CheckCircle2, Cpu, Layers, RefreshCw, Timer, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const CONFLICT_LABEL: Record<string, string> = {
  no_machine_available: 'Sem máquina',
  past_due: 'Fora do prazo',
  beyond_horizon: 'Fora do horizonte',
  no_operator_assigned: 'Sem operador',
};

export default function APSMulti() {
  const [horizon, setHorizon] = useState(14);
  const { data = [], isLoading, refetch, isFetching } = useAPSMulti(horizon);

  const kpis = useMemo(() => {
    const total = data.length;
    const late = data.filter((d) => d.is_late).length;
    const conflicts = data.filter((d) => (d.conflicts?.length ?? 0) > 0).length;
    const machines = new Set(data.map((d) => d.machine_id).filter(Boolean)).size;
    return { total, late, conflicts, machines };
  }, [data]);

  const byMachine = useMemo(() => {
    const map = new Map<string, APSAssignment[]>();
    for (const row of data) {
      const key = row.machine_name || '— sem máquina —';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return Array.from(map.entries());
  }, [data]);

  return (
    <PageContainer>
      <PageHeader
        title="APS Multi-Restrição"
        description="Sequenciamento considerando máquina, setor e operador"
      >
        <div className="flex items-end gap-2">
          <div className="w-32">
            <Label className="text-xs">Horizonte (dias)</Label>
            <Input
              type="number"
              min={1}
              max={90}
              value={horizon}
              onChange={(e) => setHorizon(Math.max(1, Number(e.target.value) || 14))}
            />
          </div>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Recalcular
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Ordens sequenciadas" value={kpis.total} icon={<Layers className="h-5 w-5" />} accentColor="info" />
        <KPICard title="Máquinas alocadas" value={kpis.machines} icon={<Cpu className="h-5 w-5" />} accentColor="accent" />
        <KPICard title="Fora do prazo" value={kpis.late} icon={<Timer className="h-5 w-5" />} accentColor="warning" />
        <KPICard title="Com conflitos" value={kpis.conflicts} icon={<AlertTriangle className="h-5 w-5" />} accentColor="destructive" />
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-primary" />
            Nenhuma ordem pendente para sequenciar.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-sm">Sequência sugerida</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Máquina / Setor</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Término</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((r) => (
                    <TableRow key={r.order_id} className={r.is_late ? 'bg-destructive/5' : undefined}>
                      <TableCell className="font-mono text-xs">{r.sequence_no}</TableCell>
                      <TableCell className="font-medium">{r.order_number}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.product_name}</TableCell>
                      <TableCell className="text-xs">
                        {r.machine_name ? (
                          <>
                            <div>{r.machine_name}</div>
                            {r.machine_sector && <div className="text-muted-foreground">{r.machine_sector}</div>}
                          </>
                        ) : <span className="text-destructive">—</span>}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.operator ? (
                          <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{r.operator}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {r.planned_start ? format(new Date(r.planned_start), 'dd/MM HH:mm') : '—'}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {r.planned_end ? format(new Date(r.planned_end), 'dd/MM HH:mm') : '—'}
                      </TableCell>
                      <TableCell className="text-xs">{r.duration_minutes} min</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {r.due_date ? format(new Date(r.due_date), 'dd/MM/yy') : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(r.conflicts?.length ?? 0) === 0 ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]">OK</Badge>
                          ) : (
                            r.conflicts.map((c) => (
                              <Badge key={c} variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
                                {CONFLICT_LABEL[c] ?? c}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {byMachine.map(([machine, rows]) => (
              <Card key={machine}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" /> {machine}
                    <Badge variant="outline" className="ml-auto text-[10px]">{rows.length} OP</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {rows.map((r) => (
                    <div key={r.order_id} className="flex items-center justify-between text-xs border-l-2 pl-2"
                      style={{ borderColor: r.is_late ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}>
                      <div className="truncate">
                        <span className="font-medium">{r.order_number}</span>
                        <span className="text-muted-foreground"> · {r.product_name}</span>
                      </div>
                      <div className="text-muted-foreground whitespace-nowrap ml-2">
                        {r.planned_start ? format(new Date(r.planned_start), 'dd/MM HH:mm') : '—'}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
