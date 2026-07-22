import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/ui/base/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Switch } from '@/ui/base/switch';
import { toSafeNumber } from '@/lib/numericValidation';
import { EVENT_TYPE_OPTIONS, WMS_ACTION_OPTIONS, emptyRule, type RuleFormData } from './useRFIDWMSRules';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: RuleFormData) => Promise<boolean>;
  initial?: RuleFormData;
}

export function RuleDialog({ open, onClose, onSave, initial }: Props) {
  const [form, setForm] = useState<RuleFormData>(initial ?? emptyRule);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(initial ?? emptyRule); }, [initial, open]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    const ok = await onSave(form);
    setSaving(false);
    if (ok) onClose();
  };

  const set = (k: keyof RuleFormData, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar Regra' : 'Nova Regra de Integração'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Auto-receber na doca" />
          </div>
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Opcional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tipo de Evento RFID *</Label>
              <Select value={form.triggerEventType} onValueChange={v => set('triggerEventType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Ação WMS *</Label>
              <Select value={form.wmsAction} onValueChange={v => set('wmsAction', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WMS_ACTION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Zona RFID (opcional)</Label>
              <Input value={form.triggerZone} onChange={e => set('triggerZone', e.target.value)} placeholder="Recebimento, Picking..." />
            </div>
            <div className="grid gap-2">
              <Label>Código do Leitor (opcional)</Label>
              <Input value={form.triggerReaderCode} onChange={e => set('triggerReaderCode', e.target.value)} placeholder="READER-001" />
            </div>
          </div>
          {form.wmsAction === 'transfer' && (
            <div className="grid gap-2">
              <Label>Local de Destino (Transferência)</Label>
              <Input value={form.wmsTargetLocation} onChange={e => set('wmsTargetLocation', e.target.value)} placeholder="Ex: A-01-02" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Prioridade</Label>
              <Input type="number" min={1} max={100} value={form.priority}
                onChange={e => set('priority', toSafeNumber(e.target.value, 0, { integer: true }) || 1)} />
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <Label>Auto-concluir operação WMS</Label>
              <div className="flex items-center gap-2 pt-1">
                <Switch checked={form.autoComplete} onCheckedChange={v => set('autoComplete', v)} />
                <span className="text-sm text-muted-foreground">{form.autoComplete ? 'Sim' : 'Não'}</span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
