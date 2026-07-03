import { supabase } from '@/integrations/supabase/client';
import { NFe, NFCe } from '@/types/fiscal';

export class FiscalService {
  private readonly supabase = supabase;

  // NF-e
  async getNFes(): Promise<NFe[]> {
    const { data, error } = await this.supabase
      .from('nfe' as any)
      .select('*')
      .order('issue_date', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      number: row.number,
      series: row.series,
      status: row.status,
      issueDate: row.issue_date,
      operationType: row.operation_type || 'saida',
      clientId: row.client_id || '',
      clientName: row.client_name,
      clientDocument: row.client_document,
      total: Number(row.total_value || row.total || 0),
      subtotal: Number(row.subtotal || 0),
      discount: Number(row.discount || 0),
      shipping: Number(row.shipping || 0),
      icms: Number(row.icms_value || row.icms || 0),
      ipi: Number(row.ipi_value || row.ipi || 0),
      pis: Number(row.pis_value || row.pis || 0),
      cofins: Number(row.cofins_value || row.cofins || 0),
      accessKey: row.access_key,
      protocol: row.protocol,
      authorizationDate: row.authorization_date,
      cancellationDate: row.cancellation_date,
      cancellationReason: row.cancellation_reason,
      items: [], 
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async transmitNFe(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('nfe' as any)
      .update({ status: 'authorized', protocol: '123456789', authorization_date: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  async cancelNFe(id: string, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('nfe' as any)
      .update({ status: 'cancelled', cancellation_reason: reason, cancellation_date: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  // Tax Rules
  async getTaxRules(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('tax_rules' as any)
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }
}

export const fiscalService = new FiscalService();
