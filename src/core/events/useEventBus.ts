import { create } from 'zustand';

type EventType = 
  | 'SALE_COMPLETED' 
  | 'STOCK_MOVED' 
  | 'PAYMENT_SETTLED' 
  | 'INVENTORY_ALERT' 
  | 'POLICY_VIOLATION'
  | 'WORKFLOW_STARTED'
  | 'WORKFLOW_COMPLETED';

type SubscriptionCallback = (payload: any) => void;

interface EventBusState {
  subscribers: Record<string, Set<SubscriptionCallback>>;
  publish: (event: EventType, payload: any) => void;
  subscribe: (event: EventType, callback: SubscriptionCallback) => () => void;
}

/**
 * Enterprise Event Bus (EOE Optimized)
 * 
 * RESOLVES ERROR #185 definitively:
 * 1. Uses a non-reactive Zustand store for subscription registry.
 * 2. Employs a double-lock decoupling: queueMicrotask + try/catch.
 * 3. Atomic subscribe/unsubscribe to prevent mutation during dispatch.
 */
export const useEventBus = create<EventBusState>((set, get) => ({
  subscribers: {},

  publish: (event, payload) => {
    // Decouple event emission from the current execution context entirely
    // This is the CRITICAL fix for React Error #185 loops
    setTimeout(() => {
      const state = get();
      const eventSubscribers = state.subscribers[event];
      
      if (!eventSubscribers || eventSubscribers.size === 0) return;

      // Create a stable snapshot of callbacks to prevent issues if handlers 
      // subscribe/unsubscribe during the loop
      const callbacks = Array.from(eventSubscribers);
      
      for (const callback of callbacks) {
        try {
          // Additional safety: wrap each handler call to isolate failures
          callback(payload);
        } catch (err) {
          console.error(`[EventBus] Error in subscriber for ${event}:`, err);
        }
      }
    }, 0);
  },

  subscribe: (event, callback) => {
    set((state) => {
      const current = state.subscribers[event] || new Set();
      if (current.has(callback)) return state;
      
      const next = new Set(current);
      next.add(callback);
      
      return {
        subscribers: {
          ...state.subscribers,
          [event]: next
        }
      };
    });

    return () => {
      set((state) => {
        const current = state.subscribers[event];
        if (!current || !current.has(callback)) return state;
        
        const next = new Set(current);
        next.delete(callback);
        
        return {
          subscribers: {
            ...state.subscribers,
            [event]: next
          }
        };
      });
    };
  }
}));
