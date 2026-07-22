import { useState } from 'react';
import { formatBRL } from '@/lib/formatters';
import { toastError } from '@/lib/toastHelpers';
import { openReceipt } from '../pdvReceipt';
import { logAudit } from './usePDVCashSession';
import type { DbClient } from '@/hooks/commercial/useClients';

type CartLine = {
  productCode: string;
  productName: string;
  productId?: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
};

type Split = { id: string; method: string; amount: number; installments?: number };

type Session = {
  terminalId?: string;
  operatorName?: string;
};

interface UsePDVFinalizeArgs {
  cart: CartLine[];
  splits: Split[];
  total: number;
  totalItems: number;
  subtotal: number;
  discountValue: number;
  paidTotal: number;
  change: number;
  loyaltyPoints: number;
  customer: DbClient | null;
  customerName: string;
  customerDocument: string;
  session: Session | null;
  setSession: (updater: (prev: any) => any) => void;
  setShowOpenSession: (v: boolean) => void;
  setShowCustomerPicker: (v: boolean) => void;
  setShowPayment: (v: boolean) => void;
  clearAll: () => void;
  onClose: () => void;
  onEmit: (data: any) => Promise<any>;
  updateClient: { mutateAsync: (v: any) => Promise<any> };
}

export function usePDVFinalize(args: UsePDVFinalizeArgs) {
  const {
    cart, splits, total, totalItems, subtotal, discountValue, paidTotal, change,
    loyaltyPoints, customer, customerName, customerDocument, session, setSession,
    setShowOpenSession, setShowCustomerPicker, setShowPayment,
    clearAll, onClose, onEmit, updateClient,
  } = args;

  const [saving, setSaving] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);

  const handleFinalize = async (skipConfirm = false) => {
    if (cart.length === 0) return;
    if (!session) { toastError('Abra o caixa antes de finalizar uma venda.'); setShowOpenSession(true); return; }
    if (splits.length === 0) { toastError('Adicione ao menos uma forma de pagamento.'); return; }
    if (paidTotal + 0.001 < total) { toastError('Valor pago insuficiente.'); return; }

    const fiadoInSplits = splits.filter((s) => s.method === 'credit').reduce((s, p) => s + p.amount, 0);
    if (fiadoInSplits > 0 && !customer) {
      toastError('Identifique o cliente antes de finalizar venda no fiado.');
      setShowCustomerPicker(true);
      return;
    }

    const HIGH_VALUE = 1000;
    const HIGH_ITEMS = 20;
    if (!skipConfirm && (total >= HIGH_VALUE || totalItems >= HIGH_ITEMS)) {
      setShowFinalizeConfirm(true);
      return;
    }

    setSaving(true);
    const primary = splits.length === 1 ? splits[0].method : 'multiple';
    const receiptSnapshot = {
      items: cart.map((i) => ({
        productCode: i.productCode,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        unit: i.unit,
      })),
      subtotal,
      discount: discountValue,
      total,
      paid: paidTotal,
      change,
      splits: splits.map((s) => ({ method: s.method, amount: s.amount, installments: s.installments })),
      customerName: customerName || undefined,
      customerDocument: customerDocument || undefined,
      loyaltyPoints,
      terminalId: session.terminalId,
      operatorName: session.operatorName,
    };
    try {
      const emitResult = await onEmit({
        items: cart,
        paymentMethod: primary,
        amountPaid: paidTotal,
        discount: discountValue || undefined,
        customerName: customerName || undefined,
        customerDocument: customerDocument || undefined,
        terminalId: session.terminalId,
        operatorName: session.operatorName,
      });
      const cashPortion = splits.filter((s) => s.method === 'cash').reduce((s, p) => s + Math.min(p.amount, total), 0);
      setSession((prev: any) => prev ? {
        ...prev,
        movements: [...prev.movements, { type: 'sale', amount: cashPortion, at: new Date().toISOString(), note: `Venda ${formatBRL(total)}` }],
      } : prev);
      const fiadoAmount = splits.filter((s) => s.method === 'credit').reduce((s, p) => s + p.amount, 0);
      if (fiadoAmount > 0 && customer) {
        try {
          await updateClient.mutateAsync({
            id: customer.id,
            current_balance: Math.round(((customer.current_balance || 0) + fiadoAmount) * 100) / 100,
          });
        } catch { toastError('Falha ao debitar fiado do cliente.'); }
      }
      logAudit('sale.finalized', { total, methods: splits.map((s) => s.method), customer: customer?.id, fiado: fiadoAmount });

      const emitData = (emitResult ?? {}) as { number?: string; accessKey?: string; protocol?: string };
      const printed = openReceipt({
        ...receiptSnapshot,
        issuedAt: new Date(),
        saleNumber: emitData.number,
        accessKey: emitData.accessKey,
        authorizationProtocol: emitData.protocol,
      });
      if (!printed) {
        toastError('Popup bloqueado: libere a janela para imprimir o comprovante.');
      }

      clearAll();
      setShowPayment(false);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return { saving, showFinalizeConfirm, setShowFinalizeConfirm, handleFinalize };
}
