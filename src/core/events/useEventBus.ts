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
  subscribers: Record<string, SubscriptionCallback[]>;
  publish: (event: EventType, payload: any) => Promise<void>;
  subscribe: (event: EventType, callback: SubscriptionCallback) => () => void;
}

export const useEventBus = create<EventBusState>((set, get) => ({
  subscribers: {},

  publish: async (event, payload) => {
    console.log(`[EventBus] Publishing ${event}`, payload);
    const eventSubscribers = get().subscribers[event] || [];
    
    // Executa callbacks em paralelo
    await Promise.all(eventSubscribers.map(cb => {
      try {
        return Promise.resolve(cb(payload));
      } catch (err) {
        console.error(`[EventBus] Error in subscriber for ${event}:`, err);
        return Promise.resolve();
      }
    }));
  },

  subscribe: (event, callback) => {
    set((state) => ({
      subscribers: {
        ...state.subscribers,
        [event]: [...(state.subscribers[event] || []), callback]
      }
    }));

    return () => {
      set((state) => ({
        subscribers: {
          ...state.subscribers,
          [event]: state.subscribers[event].filter(cb => cb !== callback)
        }
      }));
    };
  }
}));
