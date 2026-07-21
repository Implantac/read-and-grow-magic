/**
 * Offline queue for PDV emissions.
 * Uses localStorage for simplicity/reliability. Volume per terminal is small (dozens/day).
 * Records are drained by `flushQueue` when connectivity returns.
 */

const KEY = 'pdv:offline-queue:v1';

export interface QueuedNFCe {
  id: string;
  queuedAt: string;
  payload: {
    items: {
      productCode: string;
      productName: string;
      productId?: string;
      quantity: number;
      unitPrice: number;
      unit?: string;
    }[];
    paymentMethod: 'cash' | 'pix';
    amountPaid: number;
    discount?: number;
    customerName?: string;
    customerDocument?: string;
    terminalId?: string;
    operatorName?: string;
  };
  attempts: number;
  lastError?: string;
}

function read(): QueuedNFCe[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QueuedNFCe[]) : [];
  } catch {
    return [];
  }
}

function write(list: QueuedNFCe[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('pdv-queue-changed'));
}

export function enqueue(payload: QueuedNFCe['payload']): QueuedNFCe {
  const list = read();
  const item: QueuedNFCe = {
    id: `off-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    queuedAt: new Date().toISOString(),
    payload,
    attempts: 0,
  };
  list.push(item);
  write(list);
  return item;
}

export function listQueue(): QueuedNFCe[] {
  return read();
}

export function queueSize(): number {
  return read().length;
}

export function removeFromQueue(id: string) {
  write(read().filter((i) => i.id !== id));
}

export function markFailure(id: string, message: string) {
  const list = read();
  const it = list.find((i) => i.id === id);
  if (!it) return;
  it.attempts += 1;
  it.lastError = message;
  write(list);
}

export function clearQueue() {
  write([]);
}
