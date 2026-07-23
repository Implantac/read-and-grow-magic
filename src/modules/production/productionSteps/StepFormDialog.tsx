import { Button } from '@/ui/base/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Switch } from '@/ui/base/switch';
import { Textarea } from '@/ui/base/textarea';
import { toSafeNumber } from '@/lib/numericValidation';

export interface StepFormState {
  name: string;
  code: string;
  description: string;
  sequence: number;
  estimated_time_minutes: number;
  sector: string;
  is_active: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: boolean;
  form: StepFormState;
  setForm: (updater: (prev: StepFormState) => StepFormState) => void;
  onSave: () => void;
}

export function StepFormDialog({ open, onOpenChange, editing, form, setForm, onSave }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? 'Editar Etapa' : 'Nova Etapa'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Corte" /></div>
            <div><Label>Código</Label><Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="Ex: corte" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Setor</Label><Input value={form.sector} onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))} placeholder="Ex: Corte" /></div>
            <div><Label>Tempo Estimado (min)</Label><Input type="number" value={form.estimated_time_minutes} onChange={(e) => setForm((f) => ({ ...f, estimated_time_minutes: toSafeNumber(e.target.value) }))} /></div>
          </div>
          <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
            <Label>Etapa ativa</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave}>{editing ? 'Salvar' : 'Criar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
