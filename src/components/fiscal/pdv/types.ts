import { Banknote, CreditCard, QrCode, Wallet, HandCoins, type LucideIcon } from 'lucide-react';

export interface CartItem {
  productCode: string;
  productName: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  itemDiscount?: number;
}

export type SplitMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'voucher' | 'credit';

export interface SplitPayment {
  id: string;
  method: SplitMethod;
  amount: number;
  installments?: number;
}

export interface PaymentMethodMeta {
  value: SplitMethod;
  label: string;
  hint: string;
  icon: LucideIcon;
  color: string;
}

export const paymentMethods: readonly PaymentMethodMeta[] = [
  { value: 'cash', label: 'Dinheiro', hint: 'F1', icon: Banknote, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' },
  { value: 'credit_card', label: 'Crédito', hint: 'F2', icon: CreditCard, color: 'text-blue-600 bg-blue-500/10 border-blue-500/30' },
  { value: 'debit_card', label: 'Débito', hint: 'F3', icon: CreditCard, color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/30' },
  { value: 'pix', label: 'PIX', hint: 'F4', icon: QrCode, color: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/30' },
  { value: 'voucher', label: 'Voucher', hint: 'F5', icon: Wallet, color: 'text-amber-600 bg-amber-500/10 border-amber-500/30' },
  { value: 'credit', label: 'Fiado', hint: 'F6', icon: HandCoins, color: 'text-rose-600 bg-rose-500/10 border-rose-500/30' },
] as const;

export const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');

export const maskDoc = (s: string) => {
  const d = onlyDigits(s);
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (_, a, b, c, e) =>
      [a, b, c, e].filter(Boolean).join('.').replace(/\.(\d{2})$/, '-$1'),
    );
  }
  return d.replace(/(\d{2})(\d{3})?(\d{3})?(\d{4})?(\d{2})?/, (_, a, b, c, d2, e) => {
    let out = a;
    if (b) out += '.' + b;
    if (c) out += '.' + c;
    if (d2) out += '/' + d2;
    if (e) out += '-' + e;
    return out;
  });
};
