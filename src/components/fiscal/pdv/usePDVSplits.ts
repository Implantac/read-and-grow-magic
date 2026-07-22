import { useMemo, useState } from 'react';
import { formatBRL } from '@/lib/formatters';
import { toastError } from '@/lib/toastHelpers';
import type { DbClient } from '@/hooks/commercial/useClients';
import type { SplitPayment } from './types';

interface Args {
  total: number;
  customer: DbClient | null;
  onRequestCustomer: () => void;
  onOpenPix: (payload: { splitId: string; amount: number }) => void;
}

export function usePDVSplits({ total, customer, onRequestCustomer, onOpenPix }: Args) {
  const [splits, setSplits] = useState<SplitPayment[]>([]);
  const [splitDrafts, setSplitDrafts] = useState<Record<string, string>>({});
  const [installments, setInstallments] = useState(1);

  const paidTotal = splits.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, total - paidTotal);
  const change = Math.max(0, paidTotal - total);

  const availableCredit = useMemo(() => {
    if (!customer) return 0;
    return Math.max(0, (customer.credit_limit || 0) - (customer.current_balance || 0));
  }, [customer]);

  const addSplit = (method: SplitPayment['method']) => {
    const amount = Math.round(remaining * 100) / 100;
    if (amount <= 0) { toastError('Total já foi pago.'); return; }

    if (method === 'credit') {
      if (!customer) { toastError('Selecione um cliente antes de vender no fiado.'); onRequestCustomer(); return; }
      const jaFiado = splits.filter((s) => s.method === 'credit').reduce((s, p) => s + p.amount, 0);
      if (jaFiado + amount > availableCredit + 0.001) {
        toastError(`Crédito insuficiente. Disponível: ${formatBRL(availableCredit - jaFiado)}`);
        return;
      }
    }

    const inst = method === 'credit_card' ? installments : undefined;
    const id = crypto.randomUUID();
    setSplits((prev) => [...prev, { id, method, amount, installments: inst }]);
    if (method === 'pix') onOpenPix({ splitId: id, amount });
  };

  const handleSplitAmountChange = (id: string, text: string) => {
    const cleaned = text.replace(',', '.').replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
    setSplitDrafts((prev) => ({ ...prev, [id]: normalized }));
    if (normalized === '' || normalized === '.') {
      setSplits((prev) => prev.map((p) => (p.id === id ? { ...p, amount: 0 } : p)));
      return;
    }
    const n = Number(normalized);
    if (Number.isFinite(n) && n >= 0) {
      setSplits((prev) => prev.map((p) => (p.id === id ? { ...p, amount: Math.round(n * 100) / 100 } : p)));
    }
  };

  const commitSplitAmount = (id: string) => {
    setSplitDrafts((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const removeSplit = (id: string) => {
    setSplits((prev) => prev.filter((p) => p.id !== id));
    setSplitDrafts((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const resetSplits = () => {
    setSplits([]);
    setSplitDrafts({});
    setInstallments(1);
  };

  return {
    splits, setSplits,
    splitDrafts, installments, setInstallments,
    paidTotal, remaining, change, availableCredit,
    addSplit, handleSplitAmountChange, commitSplitAmount, removeSplit,
    resetSplits,
  };
}
