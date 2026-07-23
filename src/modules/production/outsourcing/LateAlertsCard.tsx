import { Card, CardContent } from '@/ui/base/card';
import { AlertTriangle } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import type { OutsourcingOrderRow } from '@/hooks/production/useOutsourcingOrders';

export function LateAlertsCard({ lateOrders }: { lateOrders: OutsourcingOrderRow[] }) {
  if (lateOrders.length === 0) return null;
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">Fornecedores em Atraso</span>
        </div>
        <div className="space-y-1">
          {lateOrders.map(o => (
            <p key={o.id} className="text-xs text-destructive">
              🔴 {o.supplier_name} — OS {o.order_number} — {differenceInDays(new Date(), new Date(o.expected_return_date!))} dias de atraso
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
