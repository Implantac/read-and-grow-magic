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
  publish: (event: EventType, payload: any) => Promise<void>;
  subscribe: (event: EventType, callback: SubscriptionCallback) => () => void;
}

// Global store to avoid unnecessary re-renders in hooks
export const useEventBus = create<EventBusState>((set, get) => ({
  subscribers: {},

  publish: async (event, payload) => {
    const allSubscribers = get().subscribers;
    const eventSubscribers = allSubscribers[event];
    
    if (!eventSubscribers || eventSubscribers.size === 0) return;

    // Use Set to ensure we don't call the same callback multiple times
    // and convert to array to iterate
    const callbacks = Array.from(eventSubscribers);
    
    // Execute callbacks in a non-blocking microtask to prevent recursive update loops (Error #185)
    queueMicrotask(() => {
      // Re-get subscribers in case it changed
      const currentSubscribers = get().subscribers[event];
      if (!currentSubscribers) return;

      const callbacksSnapshot = Array.from(currentSubscribers);
      callbacksSnapshot.forEach(cb => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[EventBus] Error in subscriber for ${event}:`, err);
        }
      });
    });
  },

  subscribe: (event, callback) => {
    // We use functional updates to ensure we have the latest state
    // and avoid recursion issues during subscribe/unsubscribe
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

