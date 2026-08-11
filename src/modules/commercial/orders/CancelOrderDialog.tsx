import { XCircle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader,
} from '@/ui/base/alert-dialog';
import { OperationalFeedback } from '@/components/shared/OperationalFeedback';

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber?: string;
  onConfirm: () => void;
}

export function CancelOrderDialog({ open, onOpenChange, orderNumber, onConfirm }: CancelOrderDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <OperationalFeedback
            type="warning"
            title="Cancelar Pedido"
            message={`Tem certeza que deseja cancelar o pedido ${orderNumber}? O cancelamento interrompe o fluxo logístico e financeiro associado.`}
          />
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Confirmar Cancelamento
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
