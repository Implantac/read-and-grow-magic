import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/base/alert-dialog';
import { formatBRL } from '@/lib/formatters';

interface Props {
  open: boolean;
  total: number;
  totalItems: number;
  splitsCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * PDVFinalizeConfirmDialog — confirmação acessível para finalizar vendas de
 * valor alto ou muitos itens, evitando F10 duplo acidental. Substitui window.confirm.
 */
export function PDVFinalizeConfirmDialog({ open, total, totalItems, splitsCount, onConfirm, onCancel }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar finalização?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold tabular-nums">{formatBRL(total)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Itens</span><span className="font-bold tabular-nums">{totalItems}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Formas de pagamento</span><span className="font-bold tabular-nums">{splitsCount}</span></div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} autoFocus>Finalizar venda</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
