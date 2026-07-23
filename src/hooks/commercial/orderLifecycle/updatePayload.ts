import type { Database } from '@/integrations/supabase/types';

export function buildUpdatePayload(targetStatus: string): Database['public']['Tables']['orders']['Update'] {
  const p: Database['public']['Tables']['orders']['Update'] = {
    status: targetStatus,
    updated_at: new Date().toISOString(),
  };

  if (targetStatus === 'awaiting_separation' || targetStatus === 'in_separation') {
    p.separation_status = targetStatus;
  }
  if (targetStatus === 'awaiting_conference') p.conference_status = 'pending';
  if (targetStatus === 'conferenced') p.conference_status = 'completed';
  if (targetStatus === 'awaiting_billing') p.billing_status = 'awaiting';
  if (targetStatus === 'invoiced') p.billing_status = 'billed';
  if (targetStatus === 'shipped') p.shipment_status = 'dispatched';
  if (targetStatus === 'delivered') {
    p.shipment_status = 'delivered';
    p.fulfillment_status = 'fulfilled';
  }
  if (targetStatus === 'in_production' || targetStatus === 'awaiting_production') {
    p.production_status = targetStatus === 'in_production' ? 'in_progress' : 'pending';
  }
  return p;
}
