import { format } from 'date-fns';
import { Play, Package, Layers, Cpu, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Progress } from '@/ui/base/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { cn } from '@/lib/utils';

type Order = {
  id: string;
  order_number: string;
  product_name: string;
  priority: string;
  status: string;
  due_date?: string | null;
  produced_quantity: number;
  quantity: number;
  unit?: string;
  client_name?: string | null;
  color?: string | null;
  size_grid?: string | null;
};
type Step = { id: string; name: string; sector?: string | null; is_active: boolean };
type Machine = { id: string; name: string; code: string; sector?: string | null; status: string };

type Props = {
  operatorName: string;
  selectedOrderId: string;
  onSelectOrder: (v: string) => void;
  selectedStep: string;
  onSelectStep: (v: string) => void;
  selectedMachineId: string;
  onSelectMachine: (v: string) => void;
  activeOrders: Order[];
  steps: Step[];
  activeMachines: Machine[];
  currentOrder: Order | null | undefined;
  onStart: () => void;
};

export function StartProductionCard({
  operatorName, selectedOrderId, onSelectOrder,
  selectedStep, onSelectStep, selectedMachineId, onSelectMachine,
  activeOrders, steps, activeMachines, currentOrder, onStart,
}: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" /> Iniciar Produção
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Ordem de Produção</label>
          <Select value={selectedOrderId} onValueChange={onSelectOrder}>
            <SelectTrigger className="h-14 text-base">
              <SelectValue placeholder="Escolha uma OP..." />
            </SelectTrigger>
            <SelectContent>
              {activeOrders.map((o) => {
                const isLate = o.due_date && new Date(o.due_date) < new Date();
                return (
                  <SelectItem key={o.id} value={o.id}>
                    <span className="flex items-center gap-2">
                      {o.priority === 'urgent' && '🔴'}
                      {o.priority === 'high' && '🟠'}
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
            <Select value={selectedStep} onValueChange={onSelectStep}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione a etapa (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {steps.filter((s) => s.is_active).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} {s.sector ? `(${s.sector})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {activeMachines.length > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5" /> Máquina
            </label>
            <Select value={selectedMachineId} onValueChange={onSelectMachine}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione a máquina (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {activeMachines.filter((m) => m.status === 'available').map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.code}) {m.sector ? `— ${m.sector}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {currentOrder && (
          <div className="p-4 rounded-xl bg-muted space-y-2">
            <p className="font-semibold text-lg">{currentOrder.product_name}</p>
            <p className="text-sm text-muted-foreground">OP: {currentOrder.order_number}</p>
            {currentOrder.client_name && (
              <p className="text-sm">
                Cliente: <strong>{currentOrder.client_name}</strong>
              </p>
            )}
            <p className="text-sm">
              Meta: <strong>{currentOrder.quantity} {currentOrder.unit}</strong> | Produzido:{' '}
              <strong>{currentOrder.produced_quantity}</strong>
            </p>
            {currentOrder.color && (
              <Badge variant="outline" className="text-xs mr-1">🎨 {currentOrder.color}</Badge>
            )}
            {currentOrder.size_grid && (
              <Badge variant="outline" className="text-xs">📐 {currentOrder.size_grid}</Badge>
            )}
            {currentOrder.due_date && (
              <p className={cn('text-sm', new Date(currentOrder.due_date) < new Date() ? 'text-destructive font-medium' : '')}>
                Prazo: {format(new Date(currentOrder.due_date), 'dd/MM/yyyy')}
              </p>
            )}
            <Progress
              value={currentOrder.quantity > 0 ? (currentOrder.produced_quantity / currentOrder.quantity) * 100 : 0}
              className="h-2.5"
            />
          </div>
        )}

        <Button
          size="lg"
          className="w-full h-20 text-2xl font-bold"
          disabled={!operatorName || !selectedOrderId}
          onClick={onStart}
        >
          <Play className="h-8 w-8 mr-3" /> INICIAR
        </Button>
      </CardContent>
    </Card>
  );
}
