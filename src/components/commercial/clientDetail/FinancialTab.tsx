import { TabsContent } from '@/ui/base/tabs';
import { Badge } from '@/ui/base/badge';
import { DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatBRL } from '@/lib/formatters';

interface Props {
  clientReceivables: any[];
  totalReceivable: number;
  overdueReceivable: number;
}

export function FinancialTab({ clientReceivables, totalReceivable, overdueReceivable }: Props) {
  return (
    <TabsContent value="financial" className="mt-4 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">A Receber</p>
          <p className="text-lg font-bold text-primary">{formatBRL(totalReceivable)}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Vencido</p>
          <p className={`text-lg font-bold ${overdueReceivable > 0 ? 'text-destructive' : ''}`}>{formatBRL(overdueReceivable)}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Total Títulos</p>
          <p className="text-lg font-bold">{clientReceivables.length}</p>
        </div>
      </div>
      {clientReceivables.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">Nenhum título encontrado</p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {clientReceivables.slice().sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).map((r: any) => {
            const isOverdue = r.status === 'pending' && new Date(r.due_date) < new Date();
            return (
              <div key={r.id} className={`flex items-center justify-between border rounded-lg px-4 py-2.5 ${isOverdue ? 'border-destructive/30 bg-destructive/5' : ''}`}>
                <div className="flex items-center gap-3">
                  <DollarSign className={`h-4 w-4 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-sm font-medium">{r.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Vence: {format(new Date(r.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      {r.invoice_number && ` • NF ${r.invoice_number}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatBRL(r.amount)}</p>
                  <Badge variant={r.status === 'paid' ? 'default' : isOverdue ? 'destructive' : 'secondary'} className="text-[10px]">
                    {r.status === 'paid' ? 'Pago' : isOverdue ? 'Vencido' : 'Pendente'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </TabsContent>
  );
}
