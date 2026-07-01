import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/shared/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/base/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/base/table";
import { useToast } from "@/ui/base/use-toast";
import { Users, Activity, Timer, Trophy } from "lucide-react";

interface TaskLog {
  id: string;
  task_type: string;
  action: string;
  operator: string | null;
  operator_id: string | null;
  duration_seconds: number | null;
  quantity: number | null;
  created_at: string;
}

interface OperatorStats {
  operator: string;
  tasks: number;
  totalQty: number;
  totalSeconds: number;
  avgSeconds: number;
  tasksPerHour: number;
  byType: Record<string, number>;
}

const RANGES: Record<string, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
};

export default function LaborManagement() {
  const { toast } = useToast();
  const [range, setRange] = useState<string>("7d");
  const [taskType, setTaskType] = useState<string>("all");
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(
      Date.now() - RANGES[range] * 24 * 60 * 60 * 1000,
    ).toISOString();
    let q = supabase
      .from("wms_task_logs")
      .select("id, task_type, action, operator, operator_id, duration_seconds, quantity, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (taskType !== "all") q = q.eq("task_type", taskType);
    const { data, error } = await q;
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    setLogs((data || []) as TaskLog[]);
    setLoading(false);
  }, [range, taskType, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo<OperatorStats[]>(() => {
    const map = new Map<string, OperatorStats>();
    logs.forEach((l) => {
      const op = l.operator || "—";
      if (!map.has(op)) {
        map.set(op, {
          operator: op,
          tasks: 0,
          totalQty: 0,
          totalSeconds: 0,
          avgSeconds: 0,
          tasksPerHour: 0,
          byType: {},
        });
      }
      const s = map.get(op)!;
      s.tasks += 1;
      s.totalQty += Number(l.quantity || 0);
      s.totalSeconds += Number(l.duration_seconds || 0);
      s.byType[l.task_type] = (s.byType[l.task_type] || 0) + 1;
    });
    map.forEach((s) => {
      s.avgSeconds = s.tasks ? Math.round(s.totalSeconds / s.tasks) : 0;
      s.tasksPerHour = s.totalSeconds
        ? Math.round((s.tasks / s.totalSeconds) * 3600 * 10) / 10
        : 0;
    });
    return Array.from(map.values()).sort((a, b) => b.tasks - a.tasks);
  }, [logs]);

  const totals = useMemo(() => {
    const tasks = logs.length;
    const totalSec = logs.reduce((a, l) => a + Number(l.duration_seconds || 0), 0);
    const operators = new Set(logs.map((l) => l.operator || "—")).size;
    return {
      tasks,
      operators,
      avgMin: tasks ? Math.round((totalSec / tasks / 60) * 10) / 10 : 0,
      tasksPerHour: totalSec ? Math.round((tasks / totalSec) * 3600 * 10) / 10 : 0,
    };
  }, [logs]);

  const taskTypes = useMemo(
    () => Array.from(new Set(logs.map((l) => l.task_type))).sort(),
    [logs],
  );

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" /> Gestão de Mão de Obra (WMS)
          </h1>
          <p className="text-sm text-muted-foreground">
            Produtividade por operador com base em <code>wms_task_logs</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={taskType} onValueChange={setTaskType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de tarefa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {taskTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" /> Tarefas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totals.tasks}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Operadores
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totals.operators}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Timer className="h-4 w-4" /> Tempo médio
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totals.avgMin} min</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Tarefas/hora
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-primary">
            {totals.tasksPerHour}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ranking de operadores</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : stats.length === 0 ? (
            <EmptyState
              title="Nenhuma atividade no período"
              description="Assim que operadores registrarem tarefas de picking, packing ou putaway, o ranking será exibido aqui."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead className="text-right">Tarefas</TableHead>
                  <TableHead className="text-right">Qtd total</TableHead>
                  <TableHead className="text-right">Tempo médio</TableHead>
                  <TableHead className="text-right">Tarefas/h</TableHead>
                  <TableHead>Mix por tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((s, i) => (
                  <TableRow key={s.operator}>
                    <TableCell className="font-bold">{i + 1}</TableCell>
                    <TableCell className="font-medium">{s.operator}</TableCell>
                    <TableCell className="text-right">{s.tasks}</TableCell>
                    <TableCell className="text-right">{s.totalQty}</TableCell>
                    <TableCell className="text-right">
                      {Math.round((s.avgSeconds / 60) * 10) / 10} min
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {s.tasksPerHour}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(s.byType).map(([t, n]) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">
                            {t}: {n}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
