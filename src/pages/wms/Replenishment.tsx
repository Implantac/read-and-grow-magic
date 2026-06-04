import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Search, ArrowRight, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useReplenishmentTasks } from '@/hooks/wms/useReplenishmentTasks';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'outline' },
  assigned: { label: 'Atribuída', variant: 'secondary' },
  in_progress: { label: 'Em Andamento', variant: 'default' },
  completed: { label: 'Concluída', variant: 'default' },
};

export default function ReplenishmentPage() {
  const { tasks, loading, updateStatus } = useReplenishmentTasks();
  const [search, setSearch] = useState('');

  const filtered = tasks.filter(t =>
    t.productName.toLowerCase().includes(search.toLowerCase()) ||
    t.taskNumber.toLowerCase().includes(search.toLowerCase())
  );

  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const completedToday = tasks.filter(t => t.status === 'completed' && t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()).length;

  return (
    <PageContainer loading={loading}>
      <PageHeader title="Reabastecimento" description="Controle de reabastecimento pulmão → picking" />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Total" value={tasks.length} icon={RefreshCw} index={0} />
        <KPICard title="Pendentes" value={pending} icon={AlertTriangle} index={1} color={pending > 0 ? 'warning' : undefined} />
        <KPICard title="Em Andamento" value={inProgress} icon={Clock} index={2} />
        <KPICard title="Concluídas Hoje" value={completedToday} icon={CheckCircle} index={3} color="success" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar tarefa ou produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(task => {
            const cfg = statusConfig[task.status] || statusConfig.pending;
            const progress = task.requiredQty > 0 ? Math.round((task.movedQty / task.requiredQty) * 100) : 0;
            return (
              <Card key={task.id} className="hover-lift">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-mono">{task.taskNumber}</CardTitle>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm font-medium">{task.productName}</p>
                  <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-md p-2">
                    <span className="font-mono text-xs">{task.sourceLocationCode || '?'}</span>
                    <ArrowRight className="h-3 w-3 text-primary" />
                    <span className="text-primary font-medium font-mono text-xs">{task.targetLocationCode || '?'}</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Movido</span>
                      <span className="font-medium">{task.movedQty}/{task.requiredQty} {task.unit}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  {task.status === 'pending' && (
                    <Button size="sm" className="w-full" onClick={() => updateStatus(task.id, 'in_progress')}>Iniciar</Button>
                  )}
                  {task.status === 'in_progress' && (
                    <Button size="sm" className="w-full" onClick={() => updateStatus(task.id, 'completed', task.requiredQty)}>Concluir</Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum reabastecimento</h3>
            <p>Tarefas de reabastecimento serão geradas automaticamente.</p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
