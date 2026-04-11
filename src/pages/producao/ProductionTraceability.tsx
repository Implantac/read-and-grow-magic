import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProductionLogs } from '@/hooks/useProductionLogs';
import { Search, History, User, Package } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const eventTypeConfig: Record<string, { label: string; color: string }> = {
  start: { label: 'Início', color: 'bg-info/15 text-info' },
  pause: { label: 'Pausa', color: 'bg-warning/15 text-warning' },
  resume: { label: 'Retomada', color: 'bg-success/15 text-success' },
  complete: { label: 'Finalização', color: 'bg-success/15 text-success' },
  quality_check: { label: 'Qualidade', color: 'bg-primary/15 text-primary' },
  defect: { label: 'Defeito', color: 'bg-destructive/15 text-destructive' },
  info: { label: 'Info', color: 'bg-muted text-muted-foreground' },
  material: { label: 'Material', color: 'bg-warning/15 text-warning' },
};

export default function ProductionTraceabilityPage() {
  const { logs, loading } = useProductionLogs();
  const [search, setSearch] = useState('');

  const filtered = logs.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (l.operator || '').toLowerCase().includes(s) || (l.description || '').toLowerCase().includes(s) || l.event_type.toLowerCase().includes(s);
  });

  return (
    <PageContainer loading={loading}>
      <PageHeader title="Rastreabilidade" description="Histórico completo de eventos de produção" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Eventos Registrados" value={logs.length} icon={<History className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Operadores" value={new Set(logs.map(l => l.operator).filter(Boolean)).size} icon={<User className="h-5 w-5" />} accentColor="info" index={1} />
        <KPICard title="Peças Registradas" value={logs.reduce((s, l) => s + (l.quantity || 0), 0)} icon={<Package className="h-5 w-5" />} accentColor="success" index={2} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle>Eventos</CardTitle>
            <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Data/Hora</TableHead><TableHead>Tipo</TableHead><TableHead>Operador</TableHead>
              <TableHead>Quantidade</TableHead><TableHead>Descrição</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum evento registrado</TableCell></TableRow>
              ) : filtered.slice(0, 100).map(l => {
                const cfg = eventTypeConfig[l.event_type] || { label: l.event_type, color: 'bg-muted text-muted-foreground' };
                return (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs font-mono">{format(parseISO(l.created_at), 'dd/MM HH:mm')}</TableCell>
                    <TableCell><Badge className={cfg.color}>{cfg.label}</Badge></TableCell>
                    <TableCell>{l.operator || '-'}</TableCell>
                    <TableCell>{l.quantity || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{l.description || '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
