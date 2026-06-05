import { supabase } from '@/integrations/supabase/client';
import { NFe, NFCe } from '@/types/fiscal';


export class FiscalService {
  private readonly supabase = supabase;

  // NF-e
  async getNFes(): Promise<NFe[]> {
    const { data, error } = await this.supabase
      .from('nfes' as any)
      .select('*')
      .order('issue_date', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      number: row.number,
      series: row.series,
      status: row.status,
      issueDate: row.issue_date,
      clientName: row.client_name,
      clientDocument: row.client_document,
      total: Number(row.total_value),
      subtotal: Number(row.subtotal),
      discount: Number(row.discount),
      shipping: Number(row.shipping),
      icms: Number(row.icms_value),
      ipi: Number(row.ipi_value),
      pis: Number(row.pis_value),
      cofins: Number(row.cofins_value),
      accessKey: row.access_key,
      protocol: row.protocol,
      authorizationDate: row.authorization_date,
      cancellationDate: row.cancellation_date,
      cancellationReason: row.cancellation_reason,
    }));
  }

  async transmitNFe(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('nfes' as any)
      .update({ status: 'authorized', protocol: '123456789', authorization_date: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  async cancelNFe(id: string, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('nfes' as any)
      .update({ status: 'cancelled', cancellation_reason: reason, cancellation_date: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  // Tax Rules
  async getTaxRules(): Promise<TaxRule[]> {
    const { data, error } = await this.supabase
      .from('tax_rules' as any)
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }
}

export const fiscalService = new FiscalService();
