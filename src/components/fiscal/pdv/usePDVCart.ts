import { useCallback, useMemo, useState } from 'react';
import { toastError } from '@/lib/toastHelpers';
import type { DbProduct } from '@/hooks/inventory/useProducts';
import type { CartItem } from './types';

const MAX_QTY = 9999;
const MAX_PRICE = 1_000_000;

export function usePDVCart(products: DbProduct[]) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'value' | 'percent'>('value');
  const [flashId, setFlashId] = useState<string | null>(null);

  const flashLine = useCallback((id: string) => {
    setFlashId(id);
    window.setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 350);
  }, []);

  const addToCart = useCallback(
    (product: Pick<DbProduct, 'id' | 'code' | 'name' | 'sale_price' | 'unit'>) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          return prev.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          );
        }
        return [
          {
            productCode: product.code,
            productName: product.name,
            productId: product.id,
            quantity: 1,
            unitPrice: product.sale_price,
            unit: product.unit,
          },
          ...prev,
        ];
      });
      flashLine(product.id);
    },
    [flashLine],
  );

  const findByCode = useCallback(
    (raw: string): DbProduct | undefined => {
      const val = raw.trim();
      if (!val) return undefined;
      return products.find(
        (p) => p.barcode === val || p.code === val || p.code.toLowerCase() === val.toLowerCase(),
      );
    },
    [products],
  );

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId) return i;
          const next = i.quantity + delta;
          return { ...i, quantity: Math.min(MAX_QTY, Math.max(0, next)) };
        })
        .filter((i) => i.quantity > 0),
    );
    flashLine(productId);
  };

  const setQty = (productId: string, raw: number): boolean => {
    if (!Number.isFinite(raw)) { toastError('Quantidade inválida.'); return false; }
    if (raw < 0) { toastError('Quantidade não pode ser negativa.'); return false; }
    if (raw > MAX_QTY) { toastError(`Quantidade máxima por item é ${MAX_QTY}.`); return false; }
    const v = Math.floor(raw * 1000) / 1000;
    setCart((prev) =>
      v === 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, quantity: v } : i)),
    );
    flashLine(productId);
    return true;
  };

  const setUnitPrice = (productId: string, raw: number): boolean => {
    if (!Number.isFinite(raw)) { toastError('Preço inválido.'); return false; }
    if (raw < 0) { toastError('Preço unitário não pode ser negativo.'); return false; }
    if (raw > MAX_PRICE) { toastError('Preço unitário acima do limite permitido.'); return false; }
    const v = Math.round(raw * 100) / 100;
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, unitPrice: v } : i)));
    flashLine(productId);
    return true;
  };

  const removeFromCart = (productId: string) =>
    setCart((prev) => prev.filter((i) => i.productId !== productId));

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + i.quantity * i.unitPrice - (i.itemDiscount || 0), 0),
    [cart],
  );
  const discountValue = discountType === 'percent'
    ? Math.min(subtotal, (subtotal * discount) / 100)
    : Math.min(subtotal, discount);
  const total = Math.max(0, subtotal - discountValue);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  const resetCart = () => {
    setCart([]);
    setDiscount(0);
    setDiscountType('value');
  };

  return {
    cart, setCart,
    discount, setDiscount, discountType, setDiscountType,
    flashId, flashLine,
    addToCart, findByCode,
    updateQty, setQty, setUnitPrice, removeFromCart,
    subtotal, discountValue, total, totalItems,
    resetCart,
  };
}
