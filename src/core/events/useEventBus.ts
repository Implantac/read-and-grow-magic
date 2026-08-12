import { create } from 'zustand';

export type EnterpriseEvent = 
  | 'SALE_COMPLETED'
  | 'SALE_CANCELLED'
  | 'PURCHASE_RECEIVED'
  | 'STOCK_MOVED'
  | 'STOCK_ADJUSTED'
  | 'TRANSFER_DISPATCHED'
  | 'TRANSFER_RECEIVED'
  | 'INVENTORY_COMPLETED'
  | 'INVOICE_ISSUED'
  | 'PAYMENT_SETTLED';

interface EventBusState {
  publish: (event: EnterpriseEvent, payload: any) => Promise<void>;
  subscribe: (event: EnterpriseEvent, callback: (payload: any) => void) => () => void;
}

export const useEventBus = create<EventBusState>((set, get) => {
  const subscribers = new Map<string, Set<(payload: any) => void>>();

  return {
    publish: async (event, payload) => {
      console.log(`[EventBus] Publishing: ${event}`, payload);
      const callbacks = subscribers.get(event);
      if (callbacks) {
        callbacks.forEach(callback => callback(payload));
      }
    },
    subscribe: (event, callback) => {
      if (!subscribers.has(event)) {
        subscribers.set(event, new Set());
      }
      subscribers.get(event)!.add(callback);
      return () => subscribers.get(event)?.delete(callback);
    }
  };
});
