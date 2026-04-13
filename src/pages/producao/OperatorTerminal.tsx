import { useState, useMemo, useEffect } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useProductionSteps } from '@/hooks/useProductionSteps';
import { supabase } from '@/integrations/supabase/client';
import { useProductionMachines } from '@/hooks/useProductionMachines';
import { Play, Pause, CheckCircle, Timer, Package, AlertTriangle, User, Layers, Clock, Plus, Minus, AlertOctagon, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInMinutes, differenceInSeconds, format } from 'date-fns';
import { toast } from 'sonner';

export default function OperatorTerminalPage() {
  const { entries, loading, create, update } = useTimeEntries();
  const { orders, update: updateOrder } = useProductionOrders();
  const { steps } = useProductionSteps();
  const [operatorName, setOperatorName] = useState(() => localStorage.getItem('operator_name') || '');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedStep, setSelectedStep] = useState('');
  const [producedQty, setProducedQty] = useState(0);
  const [rejectedQty, setRejectedQty] = useState(0);
  const [now, setNow] = useState(new Date());
  const [problemOpen, setProblemOpen] = useState(false);
  const [problemDesc, setProblemDesc] = useState('');
  const [problemCategory, setProblemCategory] = useState('machine_stop');
  const [reportingProblem, setReportingProblem] = useState(false);

  const handleReportProblem = async () => {
    if (!problemDesc.trim()) { toast.error('Descreva o problema'); return; }
    setReportingProblem(true);
    try {
      await (supabase as any).from('industrial_alerts').insert({
        alert_type: problemCategory,
        severity: problemCategory === 'machine_stop' ? 'critical' : 'high',
        title: `Problema reportado: ${problemCategory === 'machine_stop' ? 'Parada de Máquina' : problemCategory === 'quality_issue' ? 'Problema de Qualidade' : problemCategory === 'material_shortage' ? 'Falta de Material' : 'Segurança'}`,
        description: `Operador: ${operatorName}. ${currentEntry ? `OP: ${currentEntry.order_number}.` : ''} ${problemDesc}`,
        entity_type: 'operator_report',
        entity_name: operatorName,
        entity_id: currentEntry?.production_order_id || null,
        status: 'active',
      });
      if (currentEntry && currentEntry.status === 'started') {
        await update(currentEntry.id, { status: 'paused' });
      }
      toast.success('Problema reportado com sucesso. Supervisão notificada.');
      setProblemOpen(false);
      setProblemDesc('');
    } catch (e) {
      toast.error('Erro ao reportar problema');
    } finally {
      setReportingProblem(false);
    }
  };

  useEffect(() => {
    if (operatorName) localStorage.setItem('operator_name', operatorName);
  }, [operatorName]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const activeOrders = useMemo(() => {
    const pMap: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return orders
      .filter(o => ['planned', 'in_progress'].includes(o.status))
      .sort((a, b) => {
        const pDiff = (pMap[a.priority] ?? 9) - (pMap[b.priority] ?? 9);
        if (pDiff !== 0) return pDiff;
        if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        return 0;
      });
  }, [orders]);

  const myActiveEntry = entries.find(e => e.operator === operatorName && e.status === 'started');
  const myPausedEntry = entries.find(e => e.operator === operatorName && e.status === 'paused');
  const currentEntry = myActiveEntry || myPausedEntry;

  const currentOrder = currentEntry
    ? orders.find(o => o.id === currentEntry.production_order_id)
    : selectedOrderId ? orders.find(o => o.id === selectedOrderId) : null;

  const elapsedSec = currentEntry && currentEntry.status === 'started'
    ? differenceInSeconds(now, new Date(currentEntry.start_time)) - ((currentEntry.paused_time || 0) * 60)
    : 0;

  const elapsedMin = Math.floor(elapsedSec / 60);

  const productivity = currentEntry && elapsedMin > 0
    ? ((currentEntry.produced_quantity / (elapsedMin / 60))).toFixed(1)
    : '0';

  const pct = currentOrder && currentOrder.quantity > 0
    ? ((currentOrder.produced_quantity + (currentEntry?.produced_quantity || 0)) / currentOrder.quantity) * 100
    : 0;

  const handleStart = async () => {
    if (!operatorName || !selectedOrderId) return;
    const order = orders.find(o => o.id === selectedOrderId);
    if (!order) return;
    const stepName = steps.find(s => s.id === selectedStep)?.name || order.work_center || 'Produção';
    await create({
      production_order_id: selectedOrderId, order_number: order.order_number,
      operation_id: selectedStep || null, operation_name: stepName, operator: operatorName,
      start_time: new Date().toISOString(), end_time: null, paused_time: 0,
      produced_quantity: 0, rejected_quantity: 0, status: 'started', notes: null,
      work_center: order.work_center || order.sector,
    });
    if (order.status === 'planned') {
      await updateOrder(order.id, { status: 'in_progress', start_date: new Date().toISOString() });
    }
  };

  const handlePause = async () => {
    if (!myActiveEntry) return;
    await update(myActiveEntry.id, { status: 'paused' });
    toast.info('Produção pausada');
  };

  const handleResume = async () => {
    if (!myPausedEntry) return;
    await update(myPausedEntry.id, { status: 'started' });
    toast.success('Produção retomada');
  };

  const handleFinish = async () => {
    if (!currentEntry) return;
    if (producedQty <= 0) { toast.error('Informe a quantidade produzida'); return; }
    await update(currentEntry.id, {
      status: 'completed', end_time: new Date().toISOString(),
      produced_quantity: producedQty, rejected_quantity: rejectedQty,
    });
    if (currentEntry.production_order_id) {
      const order = orders.find(o => o.id === currentEntry.production_order_id);
      if (order) {
        const newProduced = order.produced_quantity + producedQty;
        const newRejected = order.rejected_quantity + rejectedQty;
        const updates: any = {
          produced_quantity: newProduced, rejected_quantity: newRejected,
          realized_time_minutes: order.realized_time_minutes + elapsedMin,
        };
        if (newProduced >= order.quantity) {
          updates.status = 'completed'; updates.completed_date = new Date().toISOString();
          toast.success('🎉 Ordem de Produção concluída!');
        }
        await updateOrder(order.id, updates);
      }
    }
    setProducedQty(0); setRejectedQty(0);
    toast.success('Apontamento finalizado');
  };

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const today = new Date().toDateString();
  const todayEntries = entries.filter(e => e.operator === operatorName && e.status === 'completed' && new Date(e.start_time).toDateString() === today);
  const todayProduced = todayEntries.reduce((s, e) => s + e.produced_quantity, 0);
  const todayRejected = todayEntries.reduce((s, e) => s + e.rejected_quantity, 0);
  const todayMinutes = todayEntries.reduce((s, e) => {
    if (e.end_time) return s + differenceInMinutes(new Date(e.end_time), new Date(e.start_time)) - (e.paused_time || 0);
    return s;
  }, 0);
  const todayPcsH = todayMinutes > 0 ? (todayProduced / (todayMinutes / 60)).toFixed(1) : '0';
  const qualityRate = (todayProduced + todayRejected) > 0 ? ((todayProduced / (todayProduced + todayRejected)) * 100).toFixed(0) : '100';

  return (
    <PageContainer loading={loading}>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Operator identification */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" /> Terminal do Operador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Seu nome..."
              value={operatorName}
              onChange={e => setOperatorName(e.target.value)}
              className="text-lg h-14 text-center font-semibold"
            />
          </CardContent>
        </Card>

        {!currentEntry ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" /> Iniciar Produção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ordem de Produção</label>
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger className="h-14 text-base">
                    <SelectValue placeholder="Escolha uma OP..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeOrders.map(o => {
                      const isLate = o.due_date && new Date(o.due_date) < new Date();
                      return (
                        <SelectItem key={o.id} value={o.id}>
                          <span className="flex items-center gap-2">
                            {o.priority === 'urgent' && '🔴'}{o.priority === 'high' && '🟠'}
                            {isLate && <AlertTriangle className="h-3 w-3 text-destructive" />}
                            {o.order_number} — {o.product_name} ({o.produced_quantity}/{o.quantity})
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {steps.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" /> Etapa
                  </label>
                  <Select value={selectedStep} onValueChange={setSelectedStep}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione a etapa (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {steps.filter(s => s.is_active).map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name} {s.sector ? `(${s.sector})` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {currentOrder && (
                <div className="p-4 rounded-xl bg-muted space-y-2">
                  <p className="font-semibold text-lg">{currentOrder.product_name}</p>
                  <p className="text-sm text-muted-foreground">OP: {currentOrder.order_number}</p>
                  {currentOrder.client_name && <p className="text-sm">Cliente: <strong>{currentOrder.client_name}</strong></p>}
                  <p className="text-sm">Meta: <strong>{currentOrder.quantity} {currentOrder.unit}</strong> | Produzido: <strong>{currentOrder.produced_quantity}</strong></p>
                  {currentOrder.color && <Badge variant="outline" className="text-xs mr-1">🎨 {currentOrder.color}</Badge>}
                  {currentOrder.size_grid && <Badge variant="outline" className="text-xs">📐 {currentOrder.size_grid}</Badge>}
                  {currentOrder.due_date && (
                    <p className={cn('text-sm', new Date(currentOrder.due_date) < new Date() ? 'text-destructive font-medium' : '')}>
                      Prazo: {format(new Date(currentOrder.due_date), 'dd/MM/yyyy')}
                    </p>
                  )}
                  <Progress value={currentOrder.quantity > 0 ? (currentOrder.produced_quantity / currentOrder.quantity) * 100 : 0} className="h-2.5" />
                </div>
              )}

              <Button
                size="lg"
                className="w-full h-20 text-2xl font-bold"
                disabled={!operatorName || !selectedOrderId}
                onClick={handleStart}
              >
                <Play className="h-8 w-8 mr-3" /> INICIAR
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className={cn('border-2', currentEntry.status === 'started' ? 'border-success' : 'border-warning')}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Timer className="h-5 w-5" /> Produção em Andamento
                </CardTitle>
                <Badge variant={currentEntry.status === 'started' ? 'default' : 'secondary'} className="text-sm">
                  {currentEntry.status === 'started' ? '▶ Produzindo' : '⏸ Pausado'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-muted space-y-1">
                <p className="text-sm text-muted-foreground">OP: {currentEntry.order_number}</p>
                <p className="font-semibold text-lg">{currentOrder?.product_name || currentEntry.operation_name}</p>
                <p className="text-sm flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {currentEntry.operation_name}</p>
                {currentOrder?.client_name && <p className="text-sm">Cliente: {currentOrder.client_name}</p>}
              </div>

              {/* Timer */}
              <div className="text-center py-6 rounded-xl bg-card border">
                <p className={cn(
                  'text-6xl font-mono font-extrabold tabular-nums tracking-wide',
                  currentEntry.status === 'started' ? 'text-success' : 'text-warning'
                )}>
                  {formatTime(currentEntry.status === 'started' ? elapsedSec : 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {currentEntry.status === 'started' ? 'Tempo de produção' : '⏸ Produção pausada'}
                </p>
              </div>

              {/* Progress */}
              {currentOrder && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso da OP</span>
                    <span className="font-bold">{pct.toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.min(pct, 100)} className="h-3" />
                  <p className="text-sm text-center text-muted-foreground">
                    {currentOrder.produced_quantity}/{currentOrder.quantity} {currentOrder.unit}
                  </p>
                </div>
              )}

              {/* Touch-friendly quantity input */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-center block">✅ Peças Boas</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline" size="icon"
                      className="h-14 w-14 shrink-0 text-lg"
                      onClick={() => setProducedQty(q => Math.max(0, q - 1))}
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <Input
                      type="number" min={0} value={producedQty}
                      onChange={e => setProducedQty(Number(e.target.value))}
                      className="h-14 text-2xl text-center font-bold"
                    />
                    <Button
                      variant="outline" size="icon"
                      className="h-14 w-14 shrink-0 text-lg"
                      onClick={() => setProducedQty(q => q + 1)}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-center block">❌ Refugo</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline" size="icon"
                      className="h-14 w-14 shrink-0 text-lg"
                      onClick={() => setRejectedQty(q => Math.max(0, q - 1))}
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <Input
                      type="number" min={0} value={rejectedQty}
                      onChange={e => setRejectedQty(Number(e.target.value))}
                      className="h-14 text-2xl text-center font-bold"
                    />
                    <Button
                      variant="outline" size="icon"
                      className="h-14 w-14 shrink-0 text-lg"
                      onClick={() => setRejectedQty(q => q + 1)}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Productivity */}
              <div className="p-3 rounded-xl bg-primary/10 text-center">
                <p className="text-sm text-muted-foreground">Produtividade atual</p>
                <p className="text-3xl font-extrabold">{productivity} <span className="text-base font-normal">peças/h</span></p>
              </div>

              {/* Action buttons — large for touch */}
              <div className="grid grid-cols-2 gap-3">
                {currentEntry.status === 'started' ? (
                  <Button size="lg" variant="secondary" className="h-20 text-xl font-bold" onClick={handlePause}>
                    <Pause className="h-7 w-7 mr-2" /> PAUSAR
                  </Button>
                ) : (
                  <Button size="lg" variant="default" className="h-20 text-xl font-bold" onClick={handleResume}>
                    <Play className="h-7 w-7 mr-2" /> RETOMAR
                  </Button>
                )}
                <Button size="lg" className="h-20 text-xl font-bold bg-success hover:bg-success/90 text-success-foreground" onClick={handleFinish}>
                  <CheckCircle className="h-7 w-7 mr-2" /> FINALIZAR
                </Button>
              </div>

              {/* Report Problem */}
              <Button
                size="lg"
                variant="destructive"
                className="w-full h-14 text-lg font-bold"
                onClick={() => setProblemOpen(true)}
              >
                <AlertOctagon className="h-6 w-6 mr-2" /> REPORTAR PROBLEMA
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Report Problem Dialog */}
        <Dialog open={problemOpen} onOpenChange={setProblemOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-destructive" /> Reportar Problema
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Categoria</label>
                <Select value={problemCategory} onValueChange={setProblemCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="machine_stop">🔧 Parada de Máquina</SelectItem>
                    <SelectItem value="quality_issue">🔍 Problema de Qualidade</SelectItem>
                    <SelectItem value="material_shortage">📦 Falta de Material</SelectItem>
                    <SelectItem value="safety">⚠️ Segurança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Descrição do problema</label>
                <Textarea
                  value={problemDesc}
                  onChange={e => setProblemDesc(e.target.value)}
                  placeholder="Descreva o que aconteceu..."
                  className="min-h-[100px]"
                />
              </div>
              {currentEntry && (
                <p className="text-sm text-muted-foreground">
                  ⚠️ A produção será pausada automaticamente ao reportar.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProblemOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleReportProblem} disabled={reportingProblem}>
                {reportingProblem ? 'Enviando...' : 'Enviar Problema'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Today's summary — enhanced */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5" /> Resumo do Turno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-3xl font-extrabold">{todayEntries.length}</p>
                <p className="text-xs text-muted-foreground">Atividades</p>
              </div>
              <div className="p-3 rounded-xl bg-success/10">
                <p className="text-3xl font-extrabold text-success">{todayProduced}</p>
                <p className="text-xs text-muted-foreground">Peças Boas</p>
              </div>
              <div className="p-3 rounded-xl bg-destructive/10">
                <p className="text-3xl font-extrabold text-destructive">{todayRejected}</p>
                <p className="text-xs text-muted-foreground">Refugo</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <p className="text-3xl font-extrabold">{todayPcsH}</p>
                <p className="text-xs text-muted-foreground">Peças/h</p>
              </div>
              <div className="p-3 rounded-xl bg-info/10">
                <p className="text-3xl font-extrabold">{qualityRate}%</p>
                <p className="text-xs text-muted-foreground">Qualidade</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
