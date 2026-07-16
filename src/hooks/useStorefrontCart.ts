import { useCallback, useEffect, useState } from "react";

export interface CartLine {
  product_id: string;
  storefront_product_id: string;
  product_name: string;
  product_sku?: string | null;
  unit_price: number;
  quantity: number;
  image_url?: string | null;
}

const STORAGE_PREFIX = "use_storefront_cart:";

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

function emit(slug: string) {
  listeners.get(slug)?.forEach((l) => l());
}

function readCart(slug: string): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + slug);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function writeCart(slug: string, lines: CartLine[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(lines));
  emit(slug);
}

export function useStorefrontCart(slug: string | undefined) {
  const key = slug ?? "";
  const [lines, setLines] = useState<CartLine[]>(() => readCart(key));

  useEffect(() => {
    if (!key) return;
    const set = listeners.get(key) ?? new Set<Listener>();
    const cb = () => setLines(readCart(key));
    set.add(cb);
    listeners.set(key, set);
    setLines(readCart(key));
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_PREFIX + key) cb();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      set.delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  }, [key]);

  const addItem = useCallback(
    (line: Omit<CartLine, "quantity"> & { quantity?: number }) => {
      const qty = line.quantity ?? 1;
      const current = readCart(key);
      const idx = current.findIndex(
        (l) => l.storefront_product_id === line.storefront_product_id,
      );
      if (idx >= 0) {
        current[idx] = { ...current[idx], quantity: current[idx].quantity + qty };
      } else {
        current.push({ ...line, quantity: qty });
      }
      writeCart(key, current);
    },
    [key],
  );

  const updateQty = useCallback(
    (storefront_product_id: string, quantity: number) => {
      const current = readCart(key);
      const next = quantity <= 0
        ? current.filter((l) => l.storefront_product_id !== storefront_product_id)
        : current.map((l) =>
            l.storefront_product_id === storefront_product_id
              ? { ...l, quantity }
              : l,
          );
      writeCart(key, next);
    },
    [key],
  );

  const removeItem = useCallback(
    (storefront_product_id: string) => updateQty(storefront_product_id, 0),
    [updateQty],
  );

  const clear = useCallback(() => writeCart(key, []), [key]);

  const totalItems = lines.reduce((s, l) => s + l.quantity, 0);
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);

  return { lines, addItem, updateQty, removeItem, clear, totalItems, subtotal };
}
