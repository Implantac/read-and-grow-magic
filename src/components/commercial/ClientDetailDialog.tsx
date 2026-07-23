import { ClientNPSPanel } from '@/modules/relacionamento/nps/ClientNPSPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Badge } from '@/ui/base/badge';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Progress } from '@/ui/base/progress';
import { useClientTimeline } from '@/hooks/commercial/useClientTimeline';
import { useOrders } from '@/hooks/commercial/useOrders';
import { useAccountsReceivable } from '@/hooks/financial/useAccountsReceivable';
import { useSalesFunnel } from '@/hooks/commercial/useSalesFunnel';
import { type DbClient } from '@/hooks/commercial/useClients';
import { formatBRL } from '@/lib/formatters';
import { differenceInDays } from 'date-fns';
import { SCORE_CONFIG } from './clientDetail/constants';
import { InfoTab } from './clientDetail/InfoTab';
import { CommercialTab } from './clientDetail/CommercialTab';
import { OrdersTab } from './clientDetail/OrdersTab';
import { FinancialTab } from './clientDetail/FinancialTab';
import { TimelineTab } from './clientDetail/TimelineTab';

interface Props {
  client: DbClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientDetailDialog({ client, open, onOpenChange }: Props) {
  const { data: timeline = [], isLoading: tlLoading } = useClientTimeline(client?.id);
  const { data: allOrders = [] } = useOrders();
  const { data: allReceivables = [] } = useAccountsReceivable();
  const { data: allFunnel = [] } = useSalesFunnel();

  if (!client) return null;

  const clientOrders = allOrders
    .filter(o => (o as any).client_id === client.id)
    .sort((a, b) => new Date((b as any).date).getTime() - new Date((a as any).date).getTime());
  const clientReceivables = allReceivables.filter(r => (r as any).client_id === client.id) as any[];
  const clientFunnel = allFunnel.filter(f => (f as any).client_id === client.id && (f as any).status === 'open');

  const creditUsage = client.credit_limit > 0 ? (client.current_balance / client.credit_limit) * 100 : 0;
  const daysSinceLastPurchase = client.last_purchase_date ? differenceInDays(new Date(), new Date(client.last_purchase_date)) : null;
  const scoreConfig = SCORE_CONFIG[client.client_score as string] || SCORE_CONFIG['medium'];

  const totalReceivable = clientReceivables.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0);
  const overdueReceivable = clientReceivables
    .filter(r => r.status === 'overdue' || (r.status === 'pending' && new Date(r.due_date) < new Date()))
    .reduce((s, r) => s + r.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            <span className="text-lg">{client.name}</span>
            <StatusBadge type="client" status={client.status} />
            {client.abc_classification && (
              <Badge variant={client.abc_classification === 'A' ? 'default' : 'secondary'} className="text-xs font-bold">
                {client.abc_classification}
              </Badge>
            )}
            <Badge className={`text-[10px] gap-1 ${scoreConfig.color}`}>
              {scoreConfig.icon} {scoreConfig.label}
            </Badge>
          </DialogTitle>
          {client.trade_name && <p className="text-sm text-muted-foreground">{client.trade_name}</p>}
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Total Compras</p>
            <p className="text-sm font-bold text-primary">{formatBRL(client.total_purchases || 0)}</p>
          </div>
          <div className="rounded-lg border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Ticket Médio</p>
            <p className="text-sm font-bold">{formatBRL(client.avg_ticket || 0)}</p>
          </div>
          <div className="rounded-lg border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Pedidos</p>
            <p className="text-sm font-bold">{clientOrders.length}</p>
          </div>
          <div className="rounded-lg border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Última Compra</p>
            <p className={`text-sm font-bold ${daysSinceLastPurchase && daysSinceLastPurchase > 90 ? 'text-destructive' : ''}`}>
              {daysSinceLastPurchase !== null ? `${daysSinceLastPurchase}d` : '—'}
            </p>
          </div>
        </div>

        {client.credit_limit > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Crédito: {formatBRL(client.current_balance)} / {formatBRL(client.credit_limit)}</span>
              <span className={`font-medium ${creditUsage > 80 ? 'text-destructive' : ''}`}>{creditUsage.toFixed(0)}%</span>
            </div>
            <Progress value={Math.min(creditUsage, 100)} className="h-1.5" />
          </div>
        )}

        <Tabs defaultValue="info" className="mt-1">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="info" className="text-xs">Dados</TabsTrigger>
            <TabsTrigger value="commercial" className="text-xs">Comercial</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs">Pedidos ({clientOrders.length})</TabsTrigger>
            <TabsTrigger value="financial" className="text-xs">Financeiro</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs">Histórico ({timeline.length})</TabsTrigger>
            <TabsTrigger value="nps" className="text-xs">NPS</TabsTrigger>
          </TabsList>

          <InfoTab client={client} />
          <CommercialTab client={client} clientFunnel={clientFunnel} creditUsage={creditUsage} />
          <OrdersTab clientOrders={clientOrders} />
          <FinancialTab clientReceivables={clientReceivables} totalReceivable={totalReceivable} overdueReceivable={overdueReceivable} />
          <TimelineTab clientId={client.id} timeline={timeline} loading={tlLoading} />

          <TabsContent value="nps" className="mt-4">
            <ClientNPSPanel clientId={client.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
