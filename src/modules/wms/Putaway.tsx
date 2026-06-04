import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { ArrowDown, Search, MapPin, Clock, CheckCircle } from 'lucide-react';
import { usePutawayTasks } from '@/hooks/wms/usePutawayTasks';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'outline' },
  assigned: { label: 'Atribuída', variant: 'secondary' },
  in_progress: { label: 'Em Andamento', variant: 'default' },
  completed: { label: 'Concluída', variant: 'default' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

export default function PutawayPage() {
  const { tasks, loading, updateStatus } = usePutawayTasks();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = tasks.filter(t => {
    const matchSearch = t.productName.toLowerCase().includes(search.toLowerCase()) ||
      t.taskNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;

  return (
    <PageContainer loading={loading}>
      <PageHeader title="Put-Away" description="Endereçamento inteligente de produtos recebidos" />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Total de Tarefas" value={tasks.length} icon={ArrowDown} index={0} />
        <KPICard title="Pendentes" value={pending} icon={Clock} index={1} color={pending > 0 ? 'warning' : undefined} />
        <KPICard title="Em Andamento" value={inProgress} icon={MapPin} index={2} />
        <KPICard title="Concluídas" value={completed} icon={CheckCircle} index={3} color="success" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar tarefa ou produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(task => {
            const cfg = statusConfig[task.status] || statusConfig.pending;
            return (
              <Card key={task.id} className="hover-lift">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{task.taskNumber}</CardTitle>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{task.productName}</p>
                    <p className="text-muted-foreground font-mono text-xs">{task.productCode}</p>
                    <p><span className="text-muted-foreground">Qtd:</span> <span className="font-semibold">{task.quantity} {task.unit}</span></p>
                    {task.suggestedLocationCode && (
                      <div className="bg-primary/10 rounded-md p-2 mt-2">
                        <p className="text-xs text-muted-foreground">Endereço sugerido</p>
                        <p className="font-semibold text-primary font-mono">{task.suggestedLocationCode}</p>
                        {task.suggestionReason && <p className="text-xs text-muted-foreground italic mt-1">{task.suggestionReason}</p>}
                      </div>
                    )}
                    {task.assignedTo && <p className="text-xs"><span className="text-muted-foreground">Operador:</span> {task.assignedTo}</p>}
                  </div>
                  {task.status === 'pending' && (
                    <Button size="sm" className="w-full" onClick={() => updateStatus(task.id, 'in_progress')}>Iniciar Endereçamento</Button>
                  )}
                  {task.status === 'in_progress' && (
                    <Button size="sm" className="w-full" onClick={() => updateStatus(task.id, 'completed', task.suggestedLocationCode || '')}>Confirmar Endereçamento</Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ArrowDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma tarefa de put-away</h3>
            <p>As tarefas são geradas automaticamente ao receber produtos.</p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
