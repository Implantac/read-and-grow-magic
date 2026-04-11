import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Search, ArrowRight, AlertTriangle } from 'lucide-react';
import { useReplenishmentTasks } from '@/hooks/useReplenishmentTasks';

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reabastecimento</h1>
        <p className="text-muted-foreground">Controle de reabastecimento pulmão → picking</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{tasks.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-500">{pending}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status === 'completed' && t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(task => {
            const cfg = statusConfig[task.status] || statusConfig.pending;
            const progress = task.requiredQty > 0 ? Math.round((task.movedQty / task.requiredQty) * 100) : 0;
            return (
              <Card key={task.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{task.taskNumber}</CardTitle>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm font-medium">{task.productName}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{task.sourceLocationCode || '?'}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-primary font-medium">{task.targetLocationCode || '?'}</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Movido</span>
                      <span>{task.movedQty}/{task.requiredQty} {task.unit}</span>
                    </div>
                    <Progress value={progress} />
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
    </div>
  );
}
