import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProductionLogs } from '@/hooks/useProductionLogs';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, History, User, Clock, Package } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const eventTypeConfig: Record<string, { label: string; color: string }> = {
  start: { label: 'Início', color: 'bg-blue-100 text-blue-800' },
  pause: { label: 'Pausa', color: 'bg-yellow-100 text-yellow-800' },
  resume: { label: 'Retomada', color: 'bg-green-100 text-green-800' },
  complete: { label: 'Finalização', color: 'bg-emerald-100 text-emerald-800' },
  quality_check: { label: 'Qualidade', color: 'bg-purple-100 text-purple-800' },
  defect: { label: 'Defeito', color: 'bg-red-100 text-red-800' },
  info: { label: 'Info', color: 'bg-gray-100 text-gray-800' },
  material: { label: 'Material', color: 'bg-orange-100 text-orange-800' },
};

export default function ProductionTraceabilityPage() {
  const { logs, loading } = useProductionLogs();
  const [search, setSearch] = useState('');

  const filtered = logs.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (l.operator || '').toLowerCase().includes(s) || (l.description || '').toLowerCase().includes(s) || l.event_type.toLowerCase().includes(s);
  });

  if (loading) return <PageContainer><Skeleton className="h-10 w-64" /></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title="Rastreabilidade" description="Histórico completo de eventos de produção" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3"><History className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{logs.length}</p><p className="text-xs text-muted-foreground">Eventos Registrados</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><User className="h-8 w-8 text-blue-500" /><div><p className="text-2xl font-bold">{new Set(logs.map(l => l.operator).filter(Boolean)).size}</p><p className="text-xs text-muted-foreground">Operadores</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Package className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{logs.reduce((s, l) => s + (l.quantity || 0), 0)}</p><p className="text-xs text-muted-foreground">Peças Registradas</p></div></CardContent></Card>
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
              <TableHead>Data/Hora</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Operador</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Descrição</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum evento registrado</TableCell></TableRow>
              ) : filtered.slice(0, 100).map(l => {
                const cfg = eventTypeConfig[l.event_type] || { label: l.event_type, color: 'bg-gray-100 text-gray-800' };
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
