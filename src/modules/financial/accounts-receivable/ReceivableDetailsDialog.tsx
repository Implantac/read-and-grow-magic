import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { AuditTrailPanel } from '@/shared/components/AuditTrailPanel';
import { formatBRL } from '@/lib/formatters';

type Account = {
  id: string; description: string; client_name: string; category: string;
  invoice_number?: string | null; due_date: string;
  installment_number?: number | null; total_installments?: number | null;
  amount: number | string; original_amount?: number | string | null;
  open_amount?: number | string | null; paid_amount?: number | string | null;
  interest?: number | string | null; penalty?: number | string | null;
  discount_amount?: number | string | null; notes?: string | null;
};

type Props = { open: boolean; onOpenChange: (v: boolean) => void; account: Account | null };

export function ReceivableDetailsDialog({ open, onOpenChange, account }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Detalhes do Título</DialogTitle></DialogHeader>
        {account && (
          <div className="space-y-3 py-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><p className="text-muted-foreground">Descrição</p><p className="font-medium">{account.description}</p></div>
              <div><p className="text-muted-foreground">Cliente</p><p className="font-medium">{account.client_name}</p></div>
              <div><p className="text-muted-foreground">Categoria</p><p>{account.category}</p></div>
              <div><p className="text-muted-foreground">Nota Fiscal</p><p>{account.invoice_number || '-'}</p></div>
              <div><p className="text-muted-foreground">Vencimento</p><p>{format(new Date(account.due_date), 'dd/MM/yyyy', { locale: ptBR })}</p></div>
              <div><p className="text-muted-foreground">Parcela</p><p>{account.total_installments && account.total_installments > 1 ? `${account.installment_number}/${account.total_installments}` : 'Única'}</p></div>
              <div><p className="text-muted-foreground">Valor Original</p><p className="font-medium">{formatBRL(Number(account.original_amount ?? account.amount))}</p></div>
              <div><p className="text-muted-foreground">Em Aberto</p><p className="font-medium text-primary">{formatBRL(Number(account.open_amount ?? account.amount))}</p></div>
              <div><p className="text-muted-foreground">Pago</p><p className="text-success">{formatBRL(Number(account.paid_amount ?? 0))}</p></div>
              <div><p className="text-muted-foreground">Juros</p><p>{formatBRL(Number(account.interest ?? 0))}</p></div>
              <div><p className="text-muted-foreground">Multa</p><p>{formatBRL(Number(account.penalty ?? 0))}</p></div>
              <div><p className="text-muted-foreground">Desconto</p><p>{formatBRL(Number(account.discount_amount ?? 0))}</p></div>
            </div>
            {account.notes && <div><p className="text-muted-foreground">Observações</p><p>{account.notes}</p></div>}
            <AuditTrailPanel entityName="accounts_receivable" entityId={account.id} height={260} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
