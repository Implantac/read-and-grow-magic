import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Input } from '@/ui/base/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/base/dialog';
import { useFollowUpTasks, useCreateFollowUp, useCompleteFollowUp } from '@/hooks/commercial/useFollowUpTasks';
import { Zap, AlertTriangle, Calendar, Clock, CheckCircle2, Sparkles } from 'lucide-react';

const today = new Date().toISOString().split('T')[0];

function FollowUpItem({ task, onComplete }: { task: any; onComplete: (p: { id: string; result: string }) => void }) {
  const channelIcons: Record<string, string> = { call: '📞', whatsapp: '💬', email: '📧', visit: '🏢', phone: '📞' };
  const priorityColors: Record<string, string> = { high: 'destructive', medium: 'default', low: 'secondary' };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-lg">{channelIcons[task.action_type] || channelIcons[task.channel] || '📋'}</span>
        <div>
          <div className="font-medium text-sm">{task.title}</div>
          <div className="text-xs text-muted-foreground">{task.client_name} • {task.scheduled_date}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={priorityColors[task.priority] as any}>{task.priority}</Badge>
        {task.suggested_message && <Badge variant="outline" className="text-xs"><Sparkles className="h-3 w-3 mr-1" />IA</Badge>}
        <Button size="sm" variant="ghost" onClick={() => onComplete({ id: task.id, result: 'Concluído' })}>
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function FollowUpTab() {
  const { data: tasks = [] } = useFollowUpTasks(undefined, 'pending');
  const { data: completedTasks = [] } = useFollowUpTasks(undefined, 'completed');
  const completeFollowUp = useCompleteFollowUp();
  const createFollowUp = useCreateFollowUp();
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ client_name: '', title: '', scheduled_date: today, action_type: 'call', priority: 'medium', channel: 'phone' });

  const todayTasks = tasks.filter(t => t.scheduled_date === today);
  const overdueTasks = tasks.filter(t => t.scheduled_date < today);
  const upcomingTasks = tasks.filter(t => t.scheduled_date > today);

  const handleCreate = () => {
    createFollowUp.mutate(newTask as any, {
      onSuccess: () => { setShowCreate(false); setNewTask({ client_name: '', title: '', scheduled_date: today, action_type: 'call', priority: 'medium', channel: 'phone' }); }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-destructive">{overdueTasks.length}</div>
          <div className="text-xs text-muted-foreground">Atrasados</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{todayTasks.length}</div>
          <div className="text-xs text-muted-foreground">Hoje</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-muted-foreground">{upcomingTasks.length}</div>
          <div className="text-xs text-muted-foreground">Próximos</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
          <div className="text-xs text-muted-foreground">Concluídos</div>
        </CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Zap className="h-4 w-4 mr-2" />Novo Follow-up</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Follow-up</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome do cliente" value={newTask.client_name} onChange={e => setNewTask(p => ({ ...p, client_name: e.target.value }))} />
              <Input placeholder="Título da ação" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} />
              <Input type="date" value={newTask.scheduled_date} onChange={e => setNewTask(p => ({ ...p, scheduled_date: e.target.value }))} />
              <Select value={newTask.action_type} onValueChange={v => setNewTask(p => ({ ...p, action_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">📞 Ligação</SelectItem>
                  <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                  <SelectItem value="email">📧 E-mail</SelectItem>
                  <SelectItem value="visit">🏢 Visita</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newTask.priority} onValueChange={v => setNewTask(p => ({ ...p, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 Alta</SelectItem>
                  <SelectItem value="medium">🟡 Média</SelectItem>
                  <SelectItem value="low">🟢 Baixa</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={handleCreate} disabled={!newTask.client_name || !newTask.title}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {overdueTasks.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Atrasados ({overdueTasks.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {overdueTasks.map(t => <FollowUpItem key={t.id} task={t} onComplete={completeFollowUp.mutate} />)}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" />Hoje ({todayTasks.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {todayTasks.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum follow-up para hoje</p> : todayTasks.map(t => <FollowUpItem key={t.id} task={t} onComplete={completeFollowUp.mutate} />)}
        </CardContent>
      </Card>

      {upcomingTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Próximos ({upcomingTasks.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcomingTasks.slice(0, 10).map(t => <FollowUpItem key={t.id} task={t} onComplete={completeFollowUp.mutate} />)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
