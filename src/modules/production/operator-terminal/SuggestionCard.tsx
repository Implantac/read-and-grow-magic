import { differenceInMinutes, format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/ui/base/card';
import { Button } from '@/ui/base/button';

type Order = {
  id: string;
  order_number: string;
  product_name: string;
  priority: string;
  status: string;
  due_date?: string | null;
  produced_quantity: number;
  quantity: number;
};

export function SuggestionCard({
  activeOrders,
  onSelect,
}: {
  activeOrders: Order[];
  onSelect: (id: string) => void;
}) {
  const urgentOP = activeOrders.find(
    (o) => o.priority === 'urgent' || (o.due_date && new Date(o.due_date) < new Date())
  );
  const nearDeadline = activeOrders.find(
    (o) =>
      o.due_date &&
      differenceInMinutes(new Date(o.due_date), new Date()) < 24 * 60 &&
      !['completed', 'cancelled'].includes(o.status)
  );
  const target = urgentOP || nearDeadline || activeOrders[0];
  if (!target) return null;
  const isLate = target.due_date && new Date(target.due_date) < new Date();

  return (
    <Card className="border-l-4 border-l-primary bg-primary/5">
      <CardContent className="p-4">
        <p className="text-sm font-semibold flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-primary" /> 🧠 Sugestão Inteligente
        </p>
        <div className="space-y-1">
          <p className="text-sm">
            {isLate ? '🔴 ' : target.priority === 'urgent' ? '🔴 ' : '🟡 '}
            Priorize a <strong>{target.order_number}</strong> — {target.product_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {isLate
              ? 'Esta OP está atrasada!'
              : target.priority === 'urgent'
              ? 'Prioridade urgente definida pelo PCP'
              : 'Prazo mais próximo na fila'}
            {' | '}
            {target.produced_quantity}/{target.quantity} produzido
            {target.due_date && !isLate && ` | Prazo: ${format(new Date(target.due_date), 'dd/MM/yyyy')}`}
          </p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => onSelect(target.id)}>
            Selecionar esta OP
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
