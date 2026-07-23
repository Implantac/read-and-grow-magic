import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TimeEntryRow } from '@/hooks/system/useTimeEntries';
import { getElapsedTime } from './constants';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entry: TimeEntryRow | null;
}

export function TimeEntryDetailsDialog({ open, onOpenChange, entry }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Detalhes do Apontamento</DialogTitle></DialogHeader>
        {entry && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Ordem de Produção</p><p className="font-medium">{entry.order_number}</p></div>
              <div><p className="text-sm text-muted-foreground">Operação</p><p className="font-medium">{entry.operation_name}</p></div>
              <div><p className="text-sm text-muted-foreground">Operador</p><p className="font-medium">{entry.operator}</p></div>
              <div><p className="text-sm text-muted-foreground">Centro de Trabalho</p><p className="font-medium">{entry.work_center || '-'}</p></div>
              <div><p className="text-sm text-muted-foreground">Início</p><p className="font-medium">{format(new Date(entry.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p></div>
              <div><p className="text-sm text-muted-foreground">Término</p><p className="font-medium">{entry.end_time ? format(new Date(entry.end_time), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}</p></div>
              <div><p className="text-sm text-muted-foreground">Tempo Total</p><p className="font-medium">{getElapsedTime(entry)}</p></div>
              <div><p className="text-sm text-muted-foreground">Tempo Pausado</p><p className="font-medium">{entry.paused_time || 0} min</p></div>
              <div><p className="text-sm text-muted-foreground">Quantidade Produzida</p><p className="font-medium text-green-600 dark:text-green-400">{entry.produced_quantity} UN</p></div>
              <div><p className="text-sm text-muted-foreground">Quantidade Rejeitada</p><p className="font-medium text-destructive">{entry.rejected_quantity} UN</p></div>
            </div>
            {entry.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Observações</p>
                <p className="p-3 bg-muted rounded-lg">{entry.notes}</p>
              </div>
            )}
          </div>
        )}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
