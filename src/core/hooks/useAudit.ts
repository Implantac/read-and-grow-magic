import { useCoreStore } from '../stores/useCoreStore';

export const useAudit = () => {
  const { addAuditEntry } = useCoreStore();

  const logAction = (action: string, module: string, details: any) => {
    addAuditEntry({
      userId: 'current-user-id', // Integrar com Auth real depois
      action,
      module,
      details,
    });
    console.log(`[AUDIT] ${module} - ${action}`, details);
  };

  return { logAction };
};
