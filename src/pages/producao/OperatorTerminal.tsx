import { useState, useMemo, useEffect } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { Play, Pause, CheckCircle, Timer, Package, AlertTriangle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInMinutes, format } from 'date-fns';

export default function OperatorTerminalPage() {
  const { entries, loading, create, update } = useTimeEntries();
  const { orders } = useProductionOrders();
  const [operatorName, setOperatorName] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [producedQty, setProducedQty] = useState(0);
  const [rejectedQty, setRejectedQty] = useState(0);
  const [now, setNow] = useState(new Date());

  // Tick every second for live timer
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const activeOrders = orders.filter(o => ['planned', 'in_progress'].includes(o.status));
  const myActiveEntry = entries.find(e => e.operator === operatorName && e.status === 'started');
  const myPausedEntry = entries.find(e => e.operator === operatorName && e.status === 'paused');
  const currentEntry = myActiveEntry || myPausedEntry;

  const currentOrder = currentEntry
    ? orders.find(o => o.id === currentEntry.production_order_id)
    : selectedOrderId ? orders.find(o => o.id === selectedOrderId) : null;

  const elapsedMin = currentEntry && currentEntry.status === 'started'
    ? differenceInMinutes(now, new Date(currentEntry.start_time)) - (currentEntry.paused_time || 0)
    : 0;

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
    await create({
      production_order_id: selectedOrderId,
      order_number: order.order_number,
      operation_id: null,
      operation_name: order.work_center || 'Produção',
      operator: operatorName,
      start_time: new Date().toISOString(),
      end_time: null,
      paused_time: 0,
      produced_quantity: 0,
      rejected_quantity: 0,
      status: 'started',
      notes: null,
      work_center: order.work_center,
    });
  };

  const handlePause = async () => {
    if (!myActiveEntry) return;
    await update(myActiveEntry.id, { status: 'paused' });
  };

  const handleResume = async () => {
    if (!myPausedEntry) return;
    const pausedAt = new Date(myPausedEntry.start_time); // approximation
    await update(myPausedEntry.id, { status: 'started' });
  };

  const handleFinish = async () => {
    if (!currentEntry) return;
    await update(currentEntry.id, {
      status: 'completed',
      end_time: new Date().toISOString(),
      produced_quantity: producedQty,
      rejected_quantity: rejectedQty,
    });
    setProducedQty(0);
    setRejectedQty(0);
  };

  const formatTime = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Today's completed entries for this operator
  const todayEntries = entries.filter(e =>
    e.operator === operatorName &&
    e.status === 'completed' &&
    new Date(e.start_time).toDateString() === new Date().toDateString()
  );
  const todayProduced = todayEntries.reduce((s, e) => s + e.produced_quantity, 0);
  const todayRejected = todayEntries.reduce((s, e) => s + e.rejected_quantity, 0);

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Operator identification */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" /> Identificação do Operador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Seu nome..."
              value={operatorName}
              onChange={e => setOperatorName(e.target.value)}
              className="text-lg h-12"
            />
          </CardContent>
        </Card>

        {!currentEntry ? (
          /* Select order to start */
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" /> Selecionar Ordem de Produção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Escolha uma OP..." />
                </SelectTrigger>
                <SelectContent>
                  {activeOrders.map(o => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.order_number} — {o.product_name} ({o.produced_quantity}/{o.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {currentOrder && (
                <div className="p-4 rounded-lg bg-muted space-y-2">
                  <p className="font-semibold text-lg">{currentOrder.product_name}</p>
                  <p className="text-sm text-muted-foreground">OP: {currentOrder.order_number}</p>
                  <p className="text-sm">Meta: <strong>{currentOrder.quantity} {currentOrder.unit}</strong></p>
                  <p className="text-sm">Produzido: <strong>{currentOrder.produced_quantity}</strong></p>
                  <p className="text-sm">Setor: {currentOrder.work_center || currentOrder.sector || '-'}</p>
                </div>
              )}

              <Button
                size="lg"
                className="w-full h-16 text-xl"
                disabled={!operatorName || !selectedOrderId}
                onClick={handleStart}
              >
                <Play className="h-6 w-6 mr-2" /> INICIAR PRODUÇÃO
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Active production panel */
          <Card className={cn(
            'border-2',
            currentEntry.status === 'started' ? 'border-green-500' : 'border-yellow-500'
          )}>
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
              {/* Order info */}
              <div className="p-4 rounded-lg bg-muted space-y-1">
                <p className="text-sm text-muted-foreground">OP: {currentEntry.order_number}</p>
                <p className="font-semibold text-lg">{currentOrder?.product_name || currentEntry.operation_name}</p>
                <p className="text-sm">Etapa: {currentEntry.operation_name}</p>
              </div>

              {/* Timer */}
              <div className="text-center py-4">
                <p className="text-5xl font-mono font-bold tabular-nums">
                  {formatTime(elapsedMin)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Tempo de produção</p>
              </div>

              {/* Progress */}
              {currentOrder && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso da OP</span>
                    <span>{pct.toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.min(pct, 100)} className="h-3" />
                  <p className="text-sm text-center text-muted-foreground">
                    {currentOrder.produced_quantity}/{currentOrder.quantity} {currentOrder.unit}
                  </p>
                </div>
              )}

              {/* Production input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Peças Boas</label>
                  <Input
                    type="number"
                    min={0}
                    value={producedQty}
                    onChange={e => setProducedQty(Number(e.target.value))}
                    className="h-12 text-lg text-center"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Refugo</label>
                  <Input
                    type="number"
                    min={0}
                    value={rejectedQty}
                    onChange={e => setRejectedQty(Number(e.target.value))}
                    className="h-12 text-lg text-center"
                  />
                </div>
              </div>

              {/* Productivity */}
              <div className="p-3 rounded-lg bg-primary/10 text-center">
                <p className="text-sm text-muted-foreground">Produtividade atual</p>
                <p className="text-2xl font-bold">{productivity} peças/h</p>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                {currentEntry.status === 'started' ? (
                  <Button size="lg" variant="secondary" className="h-14 text-lg" onClick={handlePause}>
                    <Pause className="h-5 w-5 mr-2" /> PAUSAR
                  </Button>
                ) : (
                  <Button size="lg" variant="default" className="h-14 text-lg" onClick={handleResume}>
                    <Play className="h-5 w-5 mr-2" /> RETOMAR
                  </Button>
                )}
                <Button size="lg" className="h-14 text-lg bg-green-600 hover:bg-green-700" onClick={handleFinish}>
                  <CheckCircle className="h-5 w-5 mr-2" /> FINALIZAR
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">📊 Meu Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{todayEntries.length}</p>
                <p className="text-xs text-muted-foreground">Atividades</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{todayProduced}</p>
                <p className="text-xs text-muted-foreground">Peças Boas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{todayRejected}</p>
                <p className="text-xs text-muted-foreground">Refugo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
