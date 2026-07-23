import type { DbClient } from '@/hooks/commercial/useClients';
import { PDVPixDialog } from '../PDVPixDialog';
import { PDVCloseSessionDialog } from '../PDVCloseSessionDialog';
import { PDVParkedDialog } from '../PDVParkedDialog';
import { PDVCustomerPicker } from './PDVCustomerPicker';
import { PDVFinalizeConfirmDialog } from './PDVFinalizeConfirmDialog';
import { PDVOpenSessionDialog, PDVCashMovementDialog } from './PDVCashDialogs';

interface Props {
  // Open session
  showOpenSession: boolean;
  openingAmount: number;
  setOpeningAmount: (v: number) => void;
  setShowOpenSession: (v: boolean) => void;
  openSession: () => void;
  // Cash movement
  showCashMovement: 'suprimento' | 'sangria' | null;
  cashBalance: number;
  movementAmount: number;
  movementNote: string;
  setMovementAmount: (v: number) => void;
  setMovementNote: (v: string) => void;
  setShowCashMovement: (v: 'suprimento' | 'sangria' | null) => void;
  registerMovement: () => void;
  // Customer picker
  showCustomerPicker: boolean;
  customerQuery: string;
  filteredClients: DbClient[];
  setCustomerQuery: (v: string) => void;
  applyCustomer: (c: DbClient) => void;
  setShowCustomerPicker: (v: boolean) => void;
  // Pix
  showPixDialog: { splitId: string; amount: number } | null;
  setShowPixDialog: (v: { splitId: string; amount: number } | null) => void;
  removeSplit: (id: string) => void;
  // Close session
  showCloseSession: boolean;
  closeSessionSummary: any;
  setShowCloseSession: (v: boolean) => void;
  confirmCloseSession: () => void;
  // Parked
  showParked: boolean;
  parkedList: any[];
  setShowParked: (v: boolean) => void;
  resumeParked: (id: string) => void;
  discardParked: (id: string) => void;
  // Finalize confirm
  showFinalizeConfirm: boolean;
  setShowFinalizeConfirm: (v: boolean) => void;
  handleFinalize: (confirm?: boolean) => void;
  total: number;
  totalItems: number;
  splitsLength: number;
}

export function PDVDialogsStack(p: Props) {
  return (
    <>
      <PDVOpenSessionDialog
        open={p.showOpenSession}
        openingAmount={p.openingAmount}
        onChangeAmount={p.setOpeningAmount}
        onCancel={() => p.setShowOpenSession(false)}
        onConfirm={p.openSession}
      />

      <PDVCashMovementDialog
        type={p.showCashMovement}
        cashBalance={p.cashBalance}
        amount={p.movementAmount}
        note={p.movementNote}
        onChangeAmount={p.setMovementAmount}
        onChangeNote={p.setMovementNote}
        onCancel={() => p.setShowCashMovement(null)}
        onConfirm={p.registerMovement}
      />

      <PDVCustomerPicker
        open={p.showCustomerPicker}
        query={p.customerQuery}
        filteredClients={p.filteredClients}
        onQueryChange={p.setCustomerQuery}
        onSelect={p.applyCustomer}
        onClose={() => p.setShowCustomerPicker(false)}
      />

      <PDVPixDialog
        open={!!p.showPixDialog}
        amount={p.showPixDialog?.amount || 0}
        onConfirm={() => p.setShowPixDialog(null)}
        onCancel={() => {
          if (p.showPixDialog) p.removeSplit(p.showPixDialog.splitId);
          p.setShowPixDialog(null);
        }}
      />

      <PDVCloseSessionDialog
        open={p.showCloseSession}
        summary={p.closeSessionSummary}
        onCancel={() => p.setShowCloseSession(false)}
        onClose={p.confirmCloseSession}
      />

      <PDVParkedDialog
        open={p.showParked}
        parked={p.parkedList}
        onClose={() => p.setShowParked(false)}
        onResume={p.resumeParked}
        onDelete={p.discardParked}
      />

      <PDVFinalizeConfirmDialog
        open={p.showFinalizeConfirm}
        total={p.total}
        totalItems={p.totalItems}
        splitsCount={p.splitsLength}
        onCancel={() => p.setShowFinalizeConfirm(false)}
        onConfirm={() => { p.setShowFinalizeConfirm(false); p.handleFinalize(true); }}
      />
    </>
  );
}
