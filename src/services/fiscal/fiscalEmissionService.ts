import { supabase } from '@/integrations/supabase/client';

export type FiscalDocumentType = 'nfe' | 'nfce' | 'nfse' | 'cte' | 'mdfe';

export type NfseDraftPayload = {
  provider_name: string;
  provider_document: string;
  customer_name: string;
  customer_document?: string;
  service_code: string;
  service_description: string;
  city_code: string;
  service_value: number;
  deductions?: number;
  iss_rate?: number;
};

export type FiscalEmissionJob = {
  id: string;
  document_type: FiscalDocumentType;
  document_id: string;
  status: 'queued' | 'processing' | 'authorized' | 'rejected' | 'cancelled';
  idempotency_key: string;
  attempt_count: number;
  provider: string | null;
  protocol: string | null;
  access_key: string | null;
  last_error: string | null;
};

export async function createNfseDraft(payload: NfseDraftPayload) {
  const { data, error } = await supabase.rpc('create_nfse_draft', {
    _payload: payload,
  });
  if (error) throw error;
  return data;
}

export async function enqueueFiscalEmission(
  documentType: FiscalDocumentType,
  documentId: string,
  payload: Record<string, unknown> = {},
) {
  const { data, error } = await supabase.rpc('enqueue_fiscal_emission', {
    _document_type: documentType,
    _document_id: documentId,
    _payload: payload,
  });
  if (error) throw error;
  return data as unknown as FiscalEmissionJob;
}
