import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Checkbox } from "@/ui/base/checkbox";
import { 
  ClipboardList, 
  Clock, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  PlayCircle
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Progress } from "@/ui/base/progress";

interface Task {
  id: string;
  title: string;
  module: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  timeEstimate: string;
}

export const DailyTaskBoard = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Conferir Recebimento NF #882', module: 'WMS', priority: 'high', status: 'in_progress', timeEstimate: '15 min' },
    { id: '2', title: 'Liberar Pedidos Bloqueados (Crédito)', module: 'Comercial', priority: 'high', status: 'pending', timeEstimate: '10 min' },
    { id: '3', title: 'Ajuste de Estoque - Curva A', module: 'Estoque', priority: 'medium', status: 'pending', timeEstimate: '30 min' },
    { id: '4', title: 'Auditoria de Ledger - Fechamento Ontem', module: 'Governança', priority: 'medium', status: 'completed', timeEstimate: '20 min' },
    { id: '5', title: 'Sincronizar Terminais PDV', module: 'Rede', priority: 'low', status: 'pending', timeEstimate: '5 min' },
  ]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t
    ));
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progress = (completedCount / tasks.length) * 100;

  return (
    <Card className="border-primary/20 bg-background shadow-lg overflow-hidden h-full">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold">Tarefas do Dia</CardTitle>
          </div>
          <Badge variant="outline" className="bg-background text-xs">
            {completedCount}/{tasks.length} Concluídas
          </Badge>
        </div>
        <Progress value={progress} className="h-1.5" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className={cn(
                "p-4 flex items-start gap-3 transition-colors hover:bg-muted/50",
                task.status === 'completed' && "opacity-60"
              )}
            >
              <Checkbox 
                checked={task.status === 'completed'} 
                onCheckedChange={() => toggleTask(task.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={cn(
                    "text-sm font-bold truncate",
                    task.status === 'completed' && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </span>
                  <Badge className={cn(
                    "text-[9px] uppercase font-black px-1.5 h-4",
                    task.priority === 'high' ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : 
                    task.priority === 'medium' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                    "bg-blue-500/10 text-blue-600 border-blue-500/20"
                  )}>
                    {task.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-bold text-primary/70 uppercase">
                    <ArrowRight className="h-3 w-3" /> {task.module}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {task.timeEstimate}
                  </span>
                  {task.status === 'in_progress' && (
                    <span className="flex items-center gap-1 text-primary animate-pulse font-bold">
                      <PlayCircle className="h-3 w-3" /> Em execução
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-muted/20">
          <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1 w-full justify-center">
             Ver Cronograma Completo <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
