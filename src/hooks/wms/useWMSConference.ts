import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ConferenceRecord {
  id: string;
  conferenceNumber: string;
  referenceType: string;
  referenceId?: string;
  referenceNumber?: string;
  conferenceType: string;
  status: string;
  operator?: string;
  startedAt?: string;
  completedAt?: string;
  totalItems: number;
  checkedItems: number;
  divergences: number;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface ConferenceItem {
  id: string;
  conferenceId: string;
  productCode: string;
  productName: string;
  expectedQty: number;
  checkedQty: number;
  divergence: number;
  barcode?: string;
  lotNumber?: string;
  status: string;
  checkedAt?: string;
  notes?: string;
}

export function useWMSConference() {
  const [records, setRecords] = useState<ConferenceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wms_conference_records')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) { console.error(error); toast.error('Erro ao carregar conferências'); }
    else setRecords((data || []).map((r: any) => ({
      id: r.id,
      conferenceNumber: r.conference_number,
      referenceType: r.reference_type,
      referenceId: r.reference_id,
      referenceNumber: r.reference_number,
      conferenceType: r.conference_type,
      status: r.status,
      operator: r.operator,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      totalItems: r.total_items,
      checkedItems: r.checked_items,
      divergences: r.divergences,
      approvedBy: r.approved_by,
      notes: r.notes,
      createdAt: r.created_at,
    })));
    setLoading(false);
  }, []);

  const fetchItems = async (conferenceId: string): Promise<ConferenceItem[]> => {
    const { data, error } = await supabase
      .from('wms_conference_items')
      .select('*')
      .eq('conference_id', conferenceId);
    
    if (error) { console.error(error); return []; }
    return (data || []).map((r: any) => ({
      id: r.id,
      conferenceId: r.conference_id,
      productCode: r.product_code,
      productName: r.product_name,
      expectedQty: Number(r.expected_qty),
      checkedQty: Number(r.checked_qty),
      divergence: Number(r.divergence),
      barcode: r.barcode,
      lotNumber: r.lot_number,
      status: r.status,
      checkedAt: r.checked_at,
      notes: r.notes,
    }));
  };

  const createConference = async (data: {
    reference_type: string;
    reference_number?: string;
    conference_type: string;
    operator?: string;
    items: { product_code: string; product_name: string; expected_qty: number; barcode?: string }[];
  }) => {
    const confNumber = 'CONF-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    
    const { data: rec, error } = await supabase.from('wms_conference_records').insert({
      conference_number: confNumber,
      reference_type: data.reference_type,
      reference_number: data.reference_number,
      conference_type: data.conference_type,
      operator: data.operator,
      total_items: data.items.length,
      status: 'pending',
    }).select().single();
    
    if (error || !rec) { toast.error('Erro ao criar conferência'); return false; }

    const items = data.items.map(item => ({
      conference_id: rec.id,
      product_code: item.product_code,
      product_name: item.product_name,
      expected_qty: item.expected_qty,
      barcode: item.barcode,
      status: 'pending',
    }));

    const { error: itemsError } = await supabase.from('wms_conference_items').insert(items);
    if (itemsError) { toast.error('Erro ao criar itens'); return false; }
    
    toast.success('Conferência criada!');
    await fetchRecords();
    return true;
  };

  const checkItem = async (itemId: string, checkedQty: number) => {
    // Compute divergence: read expected_qty first
    const { data: itemData } = await supabase
      .from('wms_conference_items')
      .select('expected_qty')
      .eq('id', itemId)
      .single();
    const expected = Number(itemData?.expected_qty || 0);
    const divergence = checkedQty - expected;

    const { error } = await supabase.from('wms_conference_items').update({
      checked_qty: checkedQty,
      divergence,
      status: 'checked',
      checked_at: new Date().toISOString(),
    }).eq('id', itemId);
    
    if (error) { toast.error('Erro ao conferir item'); return false; }
    return true;
  };

  /**
   * Scan a barcode against the conference items.
   * Strategy: increment checkedQty by 1 per scan; auto-check when reaches expected.
   * Matches by exact barcode OR by productCode if barcode is null.
   */
  const scanBarcode = async (conferenceId: string, barcode: string): Promise<{
    success: boolean;
    message: string;
    item?: ConferenceItem;
  }> => {
    const items = await fetchItems(conferenceId);
    const match = items.find(i =>
      (i.barcode && i.barcode === barcode) || i.productCode === barcode
    );

    if (!match) {
      return { success: false, message: `Código "${barcode}" não pertence a esta conferência` };
    }

    if (match.status === 'checked' && match.checkedQty >= match.expectedQty) {
      return { success: false, message: `${match.productName} já totalmente conferido (${match.checkedQty}/${match.expectedQty})` };
    }

    const newQty = (match.checkedQty || 0) + 1;
    const divergence = newQty - match.expectedQty;
    const newStatus = newQty >= match.expectedQty ? 'checked' : 'pending';

    const { error } = await supabase.from('wms_conference_items').update({
      checked_qty: newQty,
      divergence,
      status: newStatus,
      checked_at: newStatus === 'checked' ? new Date().toISOString() : null,
    }).eq('id', match.id);

    if (error) {
      return { success: false, message: 'Erro ao registrar leitura' };
    }

    return {
      success: true,
      message: `${match.productName} (${newQty}/${match.expectedQty})`,
      item: { ...match, checkedQty: newQty, status: newStatus, divergence },
    };
  };

  const startConference = async (id: string, operator: string) => {
    const { error } = await supabase.from('wms_conference_records').update({
      status: 'in_progress', operator, started_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) { toast.error('Erro ao iniciar'); return; }
    toast.success('Conferência iniciada!');
    await fetchRecords();
  };

  const completeConference = async (id: string) => {
    const items = await fetchItems(id);
    const divergences = items.filter(i => i.divergence !== 0).length;
    const checked = items.filter(i => i.status === 'checked').length;

    const { error } = await supabase.from('wms_conference_records').update({
      status: divergences > 0 ? 'divergence' : 'completed',
      completed_at: new Date().toISOString(),
      checked_items: checked,
      divergences,
    }).eq('id', id);
    if (error) { toast.error('Erro ao concluir'); return; }
    toast.success(divergences > 0 ? `Conferência com ${divergences} divergência(s)` : 'Conferência concluída sem divergências!');
    await fetchRecords();
  };

  /**
   * Finaliza uma conferência de RECEBIMENTO gerando movimentações no ledger imutável.
   * Requer que todos os itens conferidos (checked_qty > 0) tenham product_id vinculado.
   */
  const finalizeReceivingToLedger = async (id: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('finalize_receiving_conference', { _conference_id: id });
    if (error) {
      toast.error(error.message || 'Erro ao finalizar recebimento');
      return false;
    }
    const items = (data as any)?.items_ledgered ?? 0;
    toast.success(`Recebimento finalizado: ${items} item(ns) lançado(s) no ledger`);
    await fetchRecords();
    return true;
  };

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  return { records, loading, refetch: fetchRecords, fetchItems, createConference, checkItem, scanBarcode, startConference, completeConference, finalizeReceivingToLedger };
}
