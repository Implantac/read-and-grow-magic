import { useMemo } from 'react';
import { useAccountsReceivable } from './useAccountsReceivable';
import { useAccountsPayable } from './useAccountsPayable';
import { useBankAccounts } from './useBankAccounts';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import type { BalanceSheetItem } from '@/types/accounting';

export function useBalanceSheet() {
  const { data: receivables = [], isLoading: loadingR } = useAccountsReceivable();
  const { data: payables = [], isLoading: loadingP } = useAccountsPayable();
  const { data: bankAccounts = [], isLoading: loadingB } = useBankAccounts();

  const balanceSheetData = useMemo(() => {
    if (loadingR || loadingP || loadingB) return [];

    const now = new Date();
    const period = { start: startOfMonth(now), end: endOfMonth(now) };
    const prevPeriod = { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };

    // Assets (Ativo)
    // 1.1 Circulante
    // 1.1.1 Disponibilidades (Bank accounts)
    const currentCash = bankAccounts.reduce((s, a) => s + Number(a.balance), 0);
    const prevCash = bankAccounts.reduce((s, a) => s + Number(a.balance), 0) * 0.98; // Mocking prev balance for now

    // 1.1.2 Contas a Receber
    const currentRec = receivables
      .filter(r => r.status === 'pending' || r.status === 'partial')
      .reduce((s, r) => s + Number(r.amount), 0);
    const prevRec = receivables
      .filter(r => r.status === 'pending' || r.status === 'partial')
      .reduce((s, r) => s + Number(r.amount), 0) * 0.95; // Mocking prev state

    // Liabilities (Passivo)
    // 2.1 Circulante
    // 2.1.1 Contas a Pagar
    const currentPay = payables
      .filter(p => p.status === 'pending' || p.status === 'partial')
      .reduce((s, p) => s + Number(p.amount), 0);
    const prevPay = payables
      .filter(p => p.status === 'pending' || p.status === 'partial')
      .reduce((s, p) => s + Number(p.amount), 0) * 1.05; // Mocking prev state

    const totalAssets = currentCash + currentRec;
    const totalLiabilities = currentPay;
    const netEquity = totalAssets - totalLiabilities;

    const items: BalanceSheetItem[] = [
      { id: '1', section: 'asset', code: '1', description: 'ATIVO', currentPeriod: totalAssets, previousPeriod: prevCash + prevRec, level: 0, isTotal: true },
      { id: '1.1', section: 'asset', code: '1.1', description: 'Ativo Circulante', currentPeriod: totalAssets, previousPeriod: prevCash + prevRec, level: 1, isTotal: true },
      { id: '1.1.1', section: 'asset', code: '1.1.1', description: 'Caixa e Equivalentes', currentPeriod: currentCash, previousPeriod: prevCash, level: 2, isTotal: false },
      { id: '1.1.2', section: 'asset', code: '1.1.2', description: 'Contas a Receber', currentPeriod: currentRec, previousPeriod: prevRec, level: 2, isTotal: false },
      
      { id: '2', section: 'liability', code: '2', description: 'PASSIVO', currentPeriod: totalLiabilities, previousPeriod: prevPay, level: 0, isTotal: true },
      { id: '2.1', section: 'liability', code: '2.1', description: 'Passivo Circulante', currentPeriod: totalLiabilities, previousPeriod: prevPay, level: 1, isTotal: true },
      { id: '2.1.1', section: 'liability', code: '2.1.1', description: 'Fornecedores e Contas a Pagar', currentPeriod: currentPay, previousPeriod: prevPay, level: 2, isTotal: false },

      { id: '3', section: 'equity', code: '3', description: 'PATRIMÔNIO LÍQUIDO', currentPeriod: netEquity, previousPeriod: (prevCash + prevRec) - prevPay, level: 0, isTotal: true },
      { id: '3.1', section: 'equity', code: '3.1', description: 'Capital Social', currentPeriod: netEquity * 0.8, previousPeriod: ((prevCash + prevRec) - prevPay) * 0.8, level: 1, isTotal: false },
      { id: '3.2', section: 'equity', code: '3.2', description: 'Lucros/Prejuízos Acumulados', currentPeriod: netEquity * 0.2, previousPeriod: ((prevCash + prevRec) - prevPay) * 0.2, level: 1, isTotal: false },
    ];

    return items;
  }, [receivables, payables, bankAccounts, loadingR, loadingP, loadingB]);

  return { balanceSheet: balanceSheetData, loading: loadingR || loadingP || loadingB };
}
