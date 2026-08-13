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
    
    // Execute callbacks asynchronously to avoid blocking the caller
    // and to prevent recursive update loops (Error #185)
    setTimeout(() => {
      // Create a snapshot of callbacks to prevent mutation issues during execution
      const callbacksSnapshot = Array.from(eventSubscribers);
      callbacksSnapshot.forEach(cb => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[EventBus] Error in subscriber for ${event}:`, err);
        }
      });
    }, 0);
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

