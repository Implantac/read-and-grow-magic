import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WMSReturn {
  id: string;
  returnNumber: string;
  returnType: string;
  referenceNumber: string | null;
  customerName: string | null;
  supplierName: string | null;
  reason: string | null;
  status: string;
  totalItems: number;
  inspectedItems: number;
  approvedItems: number;
  rejectedItems: number;
  destination: string | null;
  receivedBy: string | null;
  inspectedBy: string | null;
  createdAt: string;
}

export function useWMSReturns() {
  const [returns, setReturns] = useState<WMSReturn[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wms_returns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReturns((data || []).map(r => ({
        id: r.id,
        returnNumber: r.return_number,
        returnType: r.return_type,
        referenceNumber: r.reference_number,
        customerName: r.customer_name,
        supplierName: r.supplier_name,
        reason: r.reason,
        status: r.status,
        totalItems: r.total_items ?? 0,
        inspectedItems: r.inspected_items ?? 0,
        approvedItems: r.approved_items ?? 0,
        rejectedItems: r.rejected_items ?? 0,
        destination: r.destination,
        receivedBy: r.received_by,
        inspectedBy: r.inspected_by,
        createdAt: r.created_at,
      })));
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar devoluções');
    } finally {
      setLoading(false);
    }
  }, []);

  const createReturn = async (ret: Partial<WMSReturn>) => {
    try {
      const { error } = await supabase.from('wms_returns').insert({
        return_number: ret.returnNumber || `RET-${Date.now()}`,
        return_type: ret.returnType || 'customer',
        reference_number: ret.referenceNumber,
        customer_name: ret.customerName,
        supplier_name: ret.supplierName,
        reason: ret.reason,
        total_items: ret.totalItems || 0,
        destination: ret.destination || 'restock',
      });
      if (error) throw error;
      toast.success('Devolução registrada');
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao registrar');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const updates: { status: string; inspected_at?: string; completed_at?: string } = { status };
      if (status === 'inspected') updates.inspected_at = new Date().toISOString();
      if (status === 'completed') updates.completed_at = new Date().toISOString();
      const { error } = await supabase.from('wms_returns').update(updates).eq('id', id);
      if (error) throw error;
      toast.success('Status atualizado');
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar');
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  return { returns, loading, refetch: fetchData, createReturn, updateStatus };
}
