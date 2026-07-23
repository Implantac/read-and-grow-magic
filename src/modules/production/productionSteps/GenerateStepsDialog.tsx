import { Button } from '@/ui/base/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  activeOrders: any[];
  activeSteps: any[];
  generateOrderId: string;
  setGenerateOrderId: (id: string) => void;
  selectedStepIds: string[];
  setSelectedStepIds: (updater: (prev: string[]) => string[]) => void;
  onGenerate: () => void;
}

export function GenerateStepsDialog({
  open,
  onOpenChange,
  activeOrders,
  activeSteps,
  generateOrderId,
  setGenerateOrderId,
  selectedStepIds,
  setSelectedStepIds,
  onGenerate,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Gerar Etapas para Ordem de Produção</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Ordem de Produção</Label>
            <Select value={generateOrderId} onValueChange={setGenerateOrderId}>
              <SelectTrigger><SelectValue placeholder="Selecione a OP" /></SelectTrigger>
              <SelectContent>
                {activeOrders.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.order_number} — {o.product_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Etapas a incluir</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {activeSteps.map((s) => (
                <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStepIds.includes(s.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedStepIds((ids) => [...ids, s.id]);
                      else setSelectedStepIds((ids) => ids.filter((id) => id !== s.id));
                    }}
                    className="h-4 w-4"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.sector || 'Sem setor'} — {s.estimated_time_minutes}min</p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{selectedStepIds.length} etapas selecionadas</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onGenerate}>Gerar {selectedStepIds.length} Etapas</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
