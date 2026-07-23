import { TabsContent } from '@/ui/base/tabs';
import { Target } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatBRL } from '@/lib/formatters';
import { ClientAIWidget } from '../ClientAIWidget';
import { type DbClient } from '@/hooks/commercial/useClients';

export function CommercialTab({ client, clientFunnel, creditUsage }: { client: DbClient; clientFunnel: any[]; creditUsage: number }) {
  return (
    <TabsContent value="commercial" className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 rounded-lg bg-muted/50">
          <span className="text-muted-foreground block text-xs">Limite de Crédito</span>
          <p className="text-lg font-semibold">{formatBRL(client.credit_limit)}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <span className="text-muted-foreground block text-xs">Saldo Atual</span>
          <p className={`text-lg font-semibold ${creditUsage > 80 ? 'text-destructive' : ''}`}>{formatBRL(client.current_balance)}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div><span className="text-muted-foreground block text-xs">Condição de Pagamento</span><p>{client.default_payment_condition || 'À vista'}</p></div>
        <div><span className="text-muted-foreground block text-xs">Tabela de Preço</span><p>{client.price_table || 'Padrão'}</p></div>
        <div><span className="text-muted-foreground block text-xs">Potencial Estimado</span><p>{formatBRL(client.estimated_potential || 0)}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-muted-foreground block text-xs">Região</span><p>{client.region || '—'}</p></div>
        <div><span className="text-muted-foreground block text-xs">Micro-Região</span><p>{client.micro_region || '—'}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-muted-foreground block text-xs">Frequência de Compra</span><p>{client.purchase_frequency || 0} pedidos/mês</p></div>
        <div><span className="text-muted-foreground block text-xs">Última Compra</span>
          <p>{client.last_purchase_date ? format(new Date(client.last_purchase_date), 'dd/MM/yyyy', { locale: ptBR }) : '—'}</p>
        </div>
      </div>

      {clientFunnel.length > 0 && (
        <div className="border-t pt-3">
          <h4 className="text-xs font-medium uppercase text-muted-foreground mb-2 flex items-center gap-1"><Target className="h-3 w-3" /> Oportunidades Abertas ({clientFunnel.length})</h4>
          <div className="space-y-2">
            {clientFunnel.map(f => (
              <div key={f.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
                <div>
                  <p className="font-medium">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.stage} • {f.probability}%</p>
                </div>
                <span className="font-semibold text-primary">{formatBRL(f.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ClientAIWidget clientId={client.id} />

      {client.commercial_notes && (
        <div className="text-sm border-t pt-3"><span className="text-muted-foreground block text-xs">Observações Comerciais</span><p>{client.commercial_notes}</p></div>
      )}
    </TabsContent>
  );
}
