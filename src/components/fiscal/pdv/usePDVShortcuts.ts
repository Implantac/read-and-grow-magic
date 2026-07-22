import { useEffect } from 'react';
import type { SplitPayment } from './types';

interface Args {
  open: boolean;
  screenLocked: boolean;
  showPayment: boolean;
  cartLength: number;
  hasSearch: boolean;
  onClearSearch: () => void;
  onClearAll: () => void;
  onGoToPayment: () => void;
  onFinalize: () => void;
  onSuspend: () => void;
  onOpenParked: () => void;
  onLock: () => void;
  onAddSplit: (method: SplitPayment['method']) => void;
}

export function usePDVShortcuts({
  open, screenLocked, showPayment, cartLength, hasSearch,
  onClearSearch, onClearAll, onGoToPayment, onFinalize,
  onSuspend, onOpenParked, onLock, onAddSplit,
}: Args) {
  useEffect(() => {
    if (!open || screenLocked) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && ['INPUT', 'TEXTAREA'].includes(target.tagName);
      if (e.key === 'Escape' && !typing && !showPayment && hasSearch) { e.preventDefault(); onClearSearch(); return; }
      if (e.key === 'F9' && !typing) { e.preventDefault(); onClearAll(); }
      if (e.key === 'F10' && !typing) {
        e.preventDefault();
        if (!showPayment && cartLength > 0) onGoToPayment();
        else if (showPayment) onFinalize();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); onLock(); }
      if (e.key === 'F7' && !typing && cartLength > 0) { e.preventDefault(); onSuspend(); }
      if (e.key === 'F8' && !typing) { e.preventDefault(); onOpenParked(); }
      if (!showPayment || typing) return;
      if (e.key === 'F1') { e.preventDefault(); onAddSplit('cash'); }
      if (e.key === 'F2') { e.preventDefault(); onAddSplit('credit_card'); }
      if (e.key === 'F3') { e.preventDefault(); onAddSplit('debit_card'); }
      if (e.key === 'F4') { e.preventDefault(); onAddSplit('pix'); }
      if (e.key === 'F5') { e.preventDefault(); onAddSplit('voucher'); }
      if (e.key === 'F6') { e.preventDefault(); onAddSplit('credit'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, screenLocked, showPayment, cartLength, hasSearch, onClearSearch, onClearAll, onGoToPayment, onFinalize, onSuspend, onOpenParked, onLock, onAddSplit]);
}
