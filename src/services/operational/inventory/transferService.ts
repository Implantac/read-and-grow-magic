import { supabase } from "@/integrations/supabase/client";
import { transferWorkflow, TransferStatus } from "./transferWorkflow";

/** Acima deste total de unidades a transferência exige aprovação de gestor. */
export const AUTO_APPROVAL_LIMIT_UNITS = 100;

export interface NewTransferItemInput {
  productId: string;
  quantity: number;
}

export interface NewTransferInput {
  companyId: string;
  originUnitId: string;
  destinationUnitId: string;
  priority?: string;
  reason?: string;
  items: NewTransferItemInput[];
  userId: string;
}

export interface TransferOrder {
  id: string;
  company_id: string;
  order_number: number;
  origin_unit_id: string;
  destination_unit_id: string;
  current_status: TransferStatus;
  status: string;
  notes: string | null;
  correlation_id: string | null;
  created_at: string;
  updated_at: string;
  shipped_at: string | null;
  received_at: string | null;
  origin?: { name: string } | null;
  destination?: { name: string } | null;
  items?: Array<{
    id: string;
    product_id: string;
    requested_qty: number;
    picked_qty: number | null;
    shipped_qty: number | null;
    received_qty: number | null;
    product?: { name: string; code: string } | null;
  }>;
}

const ORDER_SELECT = `
  *,
  origin:origin_unit_id(name),
  destination:destination_unit_id(name),
  items:stock_transfer_items(
    *,
    product:product_id(name, code)
  )
`;

export const transferService = {
  async listOrders(companyId: string): Promise<TransferOrder[]> {
    const { data, error } = await (supabase as any)
      .from('stock_transfer_orders')
      .select(ORDER_SELECT)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return (data || []) as TransferOrder[];
  },

  async listInbound(branchId: string): Promise<TransferOrder[]> {
    const { data, error } = await (supabase as any)
      .from('stock_transfer_orders')
      .select(ORDER_SELECT)
      .eq('destination_unit_id', branchId)
      .in('current_status', ['EXPEDIDA', 'EM TRÂNSITO'])
      .order('shipped_at', { ascending: true })
      .limit(200);
    if (error) throw error;
    return (data || []) as TransferOrder[];
  },

  /** Saldo disponível (físico − reservado) por produto na unidade de origem. */
  async getAvailableBalances(branchId: string) {
    const { data, error } = await (supabase as any)
      .from('stock_balances')
      .select('product_id, quantity, reserved_qty, products(name, code)')
      .eq('branch_id', branchId)
      .limit(1000);
    if (error) throw error;
    return (data || []).map((row: any) => ({
      productId: row.product_id,
      name: row.products?.name || 'Produto',
      code: row.products?.code || '',
      available: Number(row.quantity || 0) - Number(row.reserved_qty || 0),
    })).filter((row: any) => row.available > 0);
  },

  async createTransfer(input: NewTransferInput) {
    const { companyId, originUnitId, destinationUnitId, items, userId, reason, priority } = input;

    if (!originUnitId || !destinationUnitId) throw new Error('Informe origem e destino.');
    if (originUnitId === destinationUnitId) throw new Error('Origem e destino devem ser diferentes.');
    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) throw new Error('Adicione ao menos um produto com quantidade.');

    // Validação de saldo disponível na origem
    const balances = await this.getAvailableBalances(originUnitId);
    for (const item of validItems) {
      const balance = balances.find((b: any) => b.productId === item.productId);
      if (!balance || balance.available < item.quantity) {
        throw new Error(
          `Saldo insuficiente na origem para ${balance?.name || 'o produto selecionado'} (disponível: ${balance?.available || 0}).`
        );
      }
    }

    const correlationId = crypto.randomUUID();
    const totalUnits = validItems.reduce((sum, i) => sum + i.quantity, 0);

    const { data: order, error } = await (supabase as any)
      .from('stock_transfer_orders')
      .insert({
        company_id: companyId,
        origin_unit_id: originUnitId,
        destination_unit_id: destinationUnitId,
        current_status: 'SUGERIDA',
        correlation_id: correlationId,
        requested_by: userId,
        notes: [priority ? `Prioridade: ${priority}` : null, reason].filter(Boolean).join(' — ') || null,
      })
      .select()
      .single();
    if (error) throw error;

    const { error: itemsError } = await (supabase as any)
      .from('stock_transfer_items')
      .insert(validItems.map((i) => ({
        transfer_id: order.id,
        product_id: i.productId,
        requested_qty: i.quantity,
      })));

    if (itemsError) {
      await (supabase as any).from('stock_transfer_orders').delete().eq('id', order.id);
      throw itemsError;
    }

    const autoApproved = totalUnits <= AUTO_APPROVAL_LIMIT_UNITS;
    if (autoApproved) {
      await transferWorkflow.transition({
        transferId: order.id,
        toStatus: 'APROVADA',
        userId,
        correlationId,
        notes: 'Aprovação automática (dentro do limite).',
      });
    }

    return { order, autoApproved, totalUnits, correlationId };
  },
};
