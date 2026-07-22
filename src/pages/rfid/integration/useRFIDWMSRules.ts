import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PackagePlus, PackageSearch, ArrowRightLeft, Layers } from 'lucide-react';

export interface WMSRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  triggerZone?: string;
  triggerEventType: string;
  triggerReaderCode?: string;
  wmsAction: string;
  wmsTargetLocation?: string;
  autoComplete: boolean;
  priority: number;
  createdAt: string;
}

export const EVENT_TYPE_OPTIONS = [
  { value: 'read', label: 'Leitura' },
  { value: 'entry', label: 'Entrada' },
  { value: 'exit', label: 'Saída' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'inventory', label: 'Inventário' },
];

export const WMS_ACTION_OPTIONS = [
  { value: 'receive', label: 'Recebimento WMS', icon: PackagePlus },
  { value: 'pick', label: 'Picking WMS', icon: PackageSearch },
  { value: 'transfer', label: 'Transferência automática', icon: ArrowRightLeft },
  { value: 'inventory_count', label: 'Contagem de inventário', icon: Layers },
];

export const actionConfig: Record<string, { label: string; color: string }> = {
  receive: { label: 'Recebimento', color: 'text-blue-500' },
  pick: { label: 'Picking', color: 'text-amber-500' },
  transfer: { label: 'Transferência', color: 'text-purple-500' },
  inventory_count: { label: 'Inventário', color: 'text-green-500' },
};

export const emptyRule = {
  name: '',
  description: '',
  enabled: true,
  triggerZone: '',
  triggerEventType: 'entry',
  triggerReaderCode: '',
  wmsAction: 'receive',
  wmsTargetLocation: '',
  autoComplete: false,
  priority: 5,
};

export type RuleFormData = typeof emptyRule;

export function useRFIDWMSRules() {
  const [rules, setRules] = useState<WMSRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('rfid_wms_rules')
      .select('*')
      .order('priority', { ascending: false });

    if (error) { console.error(error); toast.error('Erro ao carregar regras'); }
    else setRules((data || []).map((r: any) => ({
      id: r.id, name: r.name, description: r.description, enabled: r.enabled,
      triggerZone: r.trigger_zone, triggerEventType: r.trigger_event_type,
      triggerReaderCode: r.trigger_reader_code, wmsAction: r.wms_action,
      wmsTargetLocation: r.wms_target_location, autoComplete: r.auto_complete,
      priority: r.priority, createdAt: r.created_at,
    })));
    setLoading(false);
  }, []);

  const create = async (rule: RuleFormData) => {
    const { error } = await (supabase as any).from('rfid_wms_rules').insert({
      name: rule.name, description: rule.description || null, enabled: rule.enabled,
      trigger_zone: rule.triggerZone || null, trigger_event_type: rule.triggerEventType,
      trigger_reader_code: rule.triggerReaderCode || null, wms_action: rule.wmsAction,
      wms_target_location: rule.wmsTargetLocation || null,
      auto_complete: rule.autoComplete, priority: rule.priority,
    });
    if (error) { toast.error('Erro ao criar regra'); return false; }
    toast.success('Regra criada!');
    await fetch();
    return true;
  };

  const update = async (id: string, updates: Partial<WMSRule>) => {
    const { error } = await (supabase as any).from('rfid_wms_rules').update({
      name: updates.name, description: updates.description,
      enabled: updates.enabled, trigger_zone: updates.triggerZone || null,
      trigger_event_type: updates.triggerEventType, trigger_reader_code: updates.triggerReaderCode || null,
      wms_action: updates.wmsAction, wms_target_location: updates.wmsTargetLocation || null,
      auto_complete: updates.autoComplete, priority: updates.priority,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar regra'); return false; }
    toast.success('Regra atualizada!');
    await fetch();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from('rfid_wms_rules').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir regra'); return false; }
    toast.success('Regra excluída!');
    await fetch();
    return true;
  };

  const toggleEnabled = async (id: string, enabled: boolean) => {
    const { error } = await (supabase as any).from('rfid_wms_rules').update({ enabled }).eq('id', id);
    if (error) { toast.error('Erro ao alterar status'); return; }
    await fetch();
  };

  useEffect(() => { fetch(); }, [fetch]);
  return { rules, loading, refetch: fetch, create, update, remove, toggleEnabled };
}
