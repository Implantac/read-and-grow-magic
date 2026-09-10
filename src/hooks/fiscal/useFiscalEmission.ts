import { useMutation, useQueryClient } from '@tanstack/react-query';
import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
import {
  createNfseDraft,
  enqueueFiscalEmission,
  type FiscalDocumentType,
  type NfseDraftPayload,
} from '@/services/fiscal/fiscalEmissionService';

export function useCreateNfseDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NfseDraftPayload) => createNfseDraft(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfse'] });
      toastSuccess('NFS-e salva', 'Rascunho criado e pronto para transmissão.');
    },
    onError: handleMutationError,
  });
}

export function useEnqueueFiscalEmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      documentType: FiscalDocumentType;
      documentId: string;
      payload?: Record<string, unknown>;
    }) => enqueueFiscalEmission(input.documentType, input.documentId, input.payload),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal_emission_jobs'] });
      queryClient.invalidateQueries({ queryKey: [input.documentType === 'nfse' ? 'nfse' : `${input.documentType}s`] });
      toastSuccess('Emissao enfileirada', 'O documento sera transmitido pelo provedor fiscal.');
    },
    onError: handleMutationError,
  });
}
