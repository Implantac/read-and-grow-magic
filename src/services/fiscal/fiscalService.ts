import { supabase } from '@/integrations/supabase/client';
import { NFe, NFCe } from '@/types/fiscal';
import { LIST_LIMIT } from '@/lib/queryLimits';

export class FiscalService {
  private readonly supabase = supabase;

  // NF-e
  async getNFes(): Promise<NFe[]> {
    const { data, error } = await this.supabase
      .from('nfe')
      .select('*')
      .order('issue_date', { ascending: false })
      .limit(LIST_LIMIT);

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      number: row.number,
      series: row.series,
      status: row.status as NFe['status'],
      issueDate: row.issue_date,
      operationType: (row.operation_type || 'saida') as NFe['operationType'],
      clientId: row.client_id || '',
      clientName: row.client_name,
      clientDocument: row.client_document,
      total: Number(row.total || 0),
      subtotal: Number(row.subtotal || 0),
      discount: Number(row.discount || 0),
      shipping: Number(row.shipping || 0),
      icms: Number(row.icms || 0),
      ipi: Number(row.ipi || 0),
      pis: Number(row.pis || 0),
      cofins: Number(row.cofins || 0),
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
      .from('nfe')
      .update({ status: 'authorized', protocol: '123456789', authorization_date: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  async cancelNFe(id: string, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('nfe')
      .update({ status: 'cancelled', cancellation_reason: reason, cancellation_date: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  // Tax Rules
  async getTaxRules(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('tax_rules')
      .select('*')
      .order('name')
      .limit(200);

    if (error) throw error;
    return data || [];
  }
}

export const fiscalService = new FiscalService();
