import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { GitBranch, AlertTriangle } from 'lucide-react';
import type { ProductionRouteRow } from '@/hooks/production/useProductionRoutes';

interface ProductLite { id: string; code: string; name: string; }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: ProductionRouteRow | null;
  form: Partial<ProductionRouteRow>;
  setForm: (f: Partial<ProductionRouteRow>) => void;
  products: ProductLite[];
  onSave: () => void;
}

export function RouteFormDialog({ open, onOpenChange, editing, form, setForm, products, onSave }: Props) {
  const handleProductChange = (productId: string) => {
    const p = products.find(pr => pr.id === productId);
    setForm({ ...form, product_id: productId, product_code: p?.code || '', product_name: p?.name || '' });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><GitBranch className="h-4 w-4 text-primary" /></div>
            {editing ? 'Editar Rota' : 'Nova Rota'}
          </DialogTitle>
          <DialogDescription>Configure a rota produtiva e vincule a um produto</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Código *</Label><Input value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="ROT-001" /></div>
            <div className="space-y-1.5"><Label>Versão</Label><Input value={form.version || '1.0'} onChange={e => setForm({ ...form, version: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Produto</Label>
            <Select value={form.product_id || ''} onValueChange={handleProductChange}>
              <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
              <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={!form.code}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteProps { open: boolean; onOpenChange: (v: boolean) => void; onConfirm: () => void; }
export function DeleteRouteDialog({ open, onOpenChange, onConfirm }: DeleteProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Confirmar Exclusão</DialogTitle>
          <DialogDescription>Todas as etapas desta rota serão excluídas. Deseja continuar?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm}>Excluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
