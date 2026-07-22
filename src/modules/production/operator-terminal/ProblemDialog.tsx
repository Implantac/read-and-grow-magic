import { AlertOctagon } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Textarea } from '@/ui/base/textarea';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  hasActiveEntry: boolean;
  submitting: boolean;
  onSubmit: () => void;
};

export function ProblemDialog({
  open, onOpenChange, category, onCategoryChange,
  description, onDescriptionChange, hasActiveEntry, submitting, onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-destructive" /> Reportar Problema
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Categoria</label>
            <Select value={category} onValueChange={onCategoryChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="machine_stop">🔧 Parada de Máquina</SelectItem>
                <SelectItem value="quality_issue">🔍 Problema de Qualidade</SelectItem>
                <SelectItem value="material_shortage">📦 Falta de Material</SelectItem>
                <SelectItem value="safety">⚠️ Segurança</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Descrição do problema</label>
            <Textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Descreva o que aconteceu..."
              className="min-h-[100px]"
            />
          </div>
          {hasActiveEntry && (
            <p className="text-sm text-muted-foreground">
              ⚠️ A produção será pausada automaticamente ao reportar.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar Problema'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
