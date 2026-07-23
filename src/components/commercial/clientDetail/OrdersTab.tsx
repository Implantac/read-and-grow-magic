import { TabsContent } from '@/ui/base/tabs';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatBRL } from '@/lib/formatters';
import { getPaymentMethodLabel } from '@/config/commercial';

export function OrdersTab({ clientOrders }: { clientOrders: any[] }) {
  return (
    <TabsContent value="orders" className="mt-4">
      {clientOrders.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhum pedido encontrado</p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {clientOrders.map(order => (
            <div key={order.id} className="flex items-center justify-between border rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{order.number}</span>
                    <StatusBadge type="order" status={order.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(order.date), 'dd/MM/yyyy', { locale: ptBR })}
                    {order.items && ` • ${order.items.length} itens`}
                    {' • '}{getPaymentMethodLabel(order.payment_method as any)}
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold">{formatBRL(order.total)}</span>
            </div>
          ))}
        </div>
      )}
    </TabsContent>
  );
}
