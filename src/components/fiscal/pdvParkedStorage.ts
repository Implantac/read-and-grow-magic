const KEY = 'pdv:parked:v1';

export interface ParkedCartItem {
  productCode: string;
  productName: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  itemDiscount?: number;
}

export interface ParkedSale {
  id: string;
  parkedAt: string;
  label?: string;
  items: ParkedCartItem[];
  discount: number;
  discountType: 'value' | 'percent';
  customerId?: string | null;
  customerName?: string;
  customerDocument?: string;
  total: number;
}

export function loadParked(): ParkedSale[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function saveParked(list: ParkedSale[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30))); } catch { /* noop */ }
}

export function parkSale(sale: Omit<ParkedSale, 'id' | 'parkedAt'>): ParkedSale {
  const entry: ParkedSale = { ...sale, id: crypto.randomUUID(), parkedAt: new Date().toISOString() };
  saveParked([entry, ...loadParked()]);
  return entry;
}

export function removeParked(id: string): void {
  saveParked(loadParked().filter((p) => p.id !== id));
}
