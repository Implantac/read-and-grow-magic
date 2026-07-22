import { useEffect, useMemo, useState } from 'react';
import { toastError, toastSuccess } from '@/lib/toastHelpers';
import { formatBRL } from '@/lib/formatters';
import type { CashCloseSummary } from '../PDVCloseSessionDialog';

export interface CashSession {
  operatorName: string;
  terminalId: string;
  openedAt: string;
  openingAmount: number;
  movements: { type: 'sale' | 'sangria' | 'suprimento'; amount: number; at: string; note?: string }[];
}

const SESSION_KEY = 'pdv:session:v1';
const AUDIT_KEY = 'pdv:audit:v1';

export const logAudit = (event: string, payload: Record<string, unknown> = {}) => {
  try {
    const arr = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    arr.unshift({ event, at: new Date().toISOString(), ...payload });
    localStorage.setItem(AUDIT_KEY, JSON.stringify(arr.slice(0, 500)));
  } catch { /* noop */ }
};

export function usePDVCashSession() {
  const [session, setSession] = useState<CashSession | null>(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  });
  const [showOpenSession, setShowOpenSession] = useState(false);
  const [showCashMovement, setShowCashMovement] = useState<null | 'sangria' | 'suprimento'>(null);
  const [openingAmount, setOpeningAmount] = useState(0);
  const [movementAmount, setMovementAmount] = useState(0);
  const [movementNote, setMovementNote] = useState('');
  const [showCloseSession, setShowCloseSession] = useState(false);

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  const cashBalance = useMemo(() => {
    if (!session) return 0;
    return session.movements.reduce((sum, m) => {
      if (m.type === 'sangria') return sum - m.amount;
      return sum + m.amount;
    }, session.openingAmount);
  }, [session]);

  const sessionElapsed = session
    ? Math.floor((Date.now() - new Date(session.openedAt).getTime()) / 60000)
    : 0;

  const openSession = () => {
    if (openingAmount < 0) { toastError('Valor de abertura inválido.'); return; }
    const s: CashSession = {
      operatorName: 'Operador Sistema',
      terminalId: 'PDV-01',
      openedAt: new Date().toISOString(),
      openingAmount: Math.round(openingAmount * 100) / 100,
      movements: [],
    };
    setSession(s);
    setShowOpenSession(false);
    setOpeningAmount(0);
    logAudit('session.open', { openingAmount: s.openingAmount });
    toastSuccess('Caixa aberto com sucesso.');
  };

  const closeSessionSummary: CashCloseSummary | null = useMemo(() => {
    if (!session) return null;
    const sales = session.movements.filter((m) => m.type === 'sale');
    const sangria = session.movements.filter((m) => m.type === 'sangria').reduce((s, m) => s + m.amount, 0);
    const suprimento = session.movements.filter((m) => m.type === 'suprimento').reduce((s, m) => s + m.amount, 0);
    const totalSales = sales.reduce((s, m) => s + m.amount, 0);
    return {
      operatorName: session.operatorName,
      terminalId: session.terminalId,
      openedAt: session.openedAt,
      openingAmount: session.openingAmount,
      totalSales,
      salesCount: sales.length,
      sangria,
      suprimento,
      expectedCash: cashBalance,
    };
  }, [session, cashBalance]);

  const confirmCloseSession = (result: { countedAmount: number; difference: number }) => {
    if (!session) return;
    logAudit('session.close', {
      closingBalance: cashBalance,
      counted: result.countedAmount,
      difference: result.difference,
      movements: session.movements.length,
    });
    setSession(null);
    setShowCloseSession(false);
    toastSuccess(
      Math.abs(result.difference) < 0.005
        ? 'Caixa fechado sem divergência.'
        : `Caixa fechado com ${result.difference > 0 ? 'sobra' : 'falta'} de ${formatBRL(Math.abs(result.difference))}.`,
    );
  };

  const registerMovement = () => {
    if (!showCashMovement || !session) return;
    if (movementAmount <= 0) { toastError('Valor deve ser maior que zero.'); return; }
    if (showCashMovement === 'sangria' && movementAmount > cashBalance) {
      toastError('Sangria maior que o saldo em caixa.'); return;
    }
    setSession({
      ...session,
      movements: [...session.movements, {
        type: showCashMovement,
        amount: Math.round(movementAmount * 100) / 100,
        at: new Date().toISOString(),
        note: movementNote.trim() || undefined,
      }],
    });
    logAudit(`cash.${showCashMovement}`, { amount: movementAmount, note: movementNote });
    toastSuccess(`${showCashMovement === 'sangria' ? 'Sangria' : 'Suprimento'} registrado.`);
    setShowCashMovement(null);
    setMovementAmount(0);
    setMovementNote('');
  };

  return {
    session, setSession,
    cashBalance, sessionElapsed,
    showOpenSession, setShowOpenSession,
    showCashMovement, setShowCashMovement,
    openingAmount, setOpeningAmount,
    movementAmount, setMovementAmount,
    movementNote, setMovementNote,
    showCloseSession, setShowCloseSession,
    openSession,
    closeSessionSummary,
    confirmCloseSession,
    registerMovement,
  };
}
