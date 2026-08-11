import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader,
} from '@/ui/base/alert-dialog';
import { OperationalFeedback } from '@/components/shared/OperationalFeedback';

interface DeleteOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber?: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteOrderDialog({
  open, onOpenChange, orderNumber, isPending, onCancel, onConfirm,
}: DeleteOrderDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <OperationalFeedback
            type="error"
            title="Confirmar Exclusão"
            message={`Tem certeza que deseja excluir o pedido ${orderNumber}? Esta ação removerá o registro permanentemente do sistema após o período de restauração.`}
          />
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Confirmar Exclusão
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
