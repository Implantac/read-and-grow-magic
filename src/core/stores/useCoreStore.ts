import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  module: string;
  details: any;
}

interface CoreState {
  auditLog: AuditEvent[];
  addAuditEntry: (entry: Omit<AuditEvent, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
}

export const useCoreStore = create<CoreState>()(
  persist(
    (set) => ({
      auditLog: [],
      addAuditEntry: (entry) => set((state) => ({
        auditLog: [
          {
            ...entry,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          },
          ...state.auditLog.slice(0, 99), // Keep last 100 entries
        ],
      })),
      clearLogs: () => set({ auditLog: [] }),
    }),
    {
      name: 'erp-core-storage',
    }
  )
);
