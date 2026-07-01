import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Progress } from '@/ui/base/progress';
import { Layers, Play, CheckCircle, Clock, Search, Plus, ShoppingCart } from 'lucide-react';
import { usePickingWaves } from '@/hooks/wms/usePickingWaves';
import { EmptyState } from '@/shared/components/EmptyState';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  planned: { label: 'Planejada', variant: 'outline' },
  released: { label: 'Liberada', variant: 'secondary' },
  in_progress: { label: 'Em Andamento', variant: 'default' },
  completed: { label: 'Concluída', variant: 'default' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

const priorityLabels: Record<string, string> = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' };

export default function WavesPage() {
  const { waves, loading } = usePickingWaves();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = waves.filter(w => {
    const matchSearch = w.waveNumber.toLowerCase().includes(search.toLowerCase()) ||
      (w.carrier || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalOrders = waves.reduce((s, w) => s + w.ordersCount, 0);
  const inProgress = waves.filter(w => w.status === 'in_progress').length;
  const completed = waves.filter(w => w.status === 'completed').length;

  return (
    <PageContainer loading={loading}>
      <PageHeader
        title="Ondas de Separação"
        description="Wave picking — agrupe pedidos para separação eficiente"
        actions={<Button><Plus className="h-4 w-4 mr-2" /> Nova Onda</Button>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Total de Ondas" value={waves.length} icon={Layers} index={0} />
        <KPICard title="Em Andamento" value={inProgress} icon={Play} index={1} />
        <KPICard title="Concluídas" value={completed} icon={CheckCircle} index={2} color="success" />
        <KPICard title="Pedidos nas Ondas" value={totalOrders} icon={ShoppingCart} index={3} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar onda ou transportadora..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(wave => {
            const progress = wave.itemsCount > 0 ? Math.round((wave.pickedItems / wave.itemsCount) * 100) : 0;
            const cfg = statusConfig[wave.status] || statusConfig.planned;
            return (
              <Card key={wave.id} className="hover-lift">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-mono">{wave.waveNumber}</CardTitle>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                  {wave.name && <p className="text-sm text-muted-foreground">{wave.name}</p>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Pedidos:</span> <span className="font-semibold">{wave.ordersCount}</span></div>
                    <div><span className="text-muted-foreground">Itens:</span> <span className="font-semibold">{wave.itemsCount}</span></div>
                    {wave.carrier && <div className="col-span-2"><span className="text-muted-foreground">Transp:</span> {wave.carrier}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={wave.priority === 'urgent' ? 'destructive' : wave.priority === 'high' ? 'secondary' : 'outline'} className="text-xs">
                      {priorityLabels[wave.priority] || wave.priority}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{wave.pickedItems}/{wave.itemsCount} ({progress}%)</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="Nenhuma onda encontrada"
          description="Crie ondas de separação para otimizar o picking em lotes."
        />
      )}
    </PageContainer>
  );
}
