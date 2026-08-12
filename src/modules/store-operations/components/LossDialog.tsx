import { useState } from 'react';
import { Button } from "@/ui/base/button";
import { X, Check, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/ui/base/dialog";
import { Input } from "@/ui/base/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useProducts } from '@/hooks/inventory/useProducts';
import { storeService } from '@/services/operational/store/storeService';
import { toast } from 'sonner';

interface LossDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LossDialog({ isOpen, onClose }: LossDialogProps) {
  const { currentBranch } = useEnterprise();
  const { data: products } = useProducts();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 1,
    reason: 'avaria',
    notes: ''
  });

  const handleSubmit = async () => {
    if (!formData.product_id || !currentBranch?.id) {
      toast.error("Selecione um produto");
      return;
    }

    setLoading(true);
    try {
      await storeService.registerLoss({
        branch_id: currentBranch.id,
        product_id: formData.product_id,
        quantity: formData.quantity,
        reason: formData.reason,
        notes: formData.notes
      });
      toast.success("Perda registrada com sucesso");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao registrar perda");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            REGISTRAR PERDA / AVARIA
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Produto</label>
            <Select onValueChange={(val) => setFormData({...formData, product_id: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                {products?.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Quantidade</label>
              <Input 
                type="number" 
                min={1} 
                value={formData.quantity} 
                onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Motivo</label>
              <Select defaultValue="avaria" onValueChange={(val) => setFormData({...formData, reason: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="avaria">Avaria / Quebra</SelectItem>
                  <SelectItem value="vencimento">Vencimento</SelectItem>
                  <SelectItem value="furto">Furto / Roubo</SelectItem>
                  <SelectItem value="erro_estoque">Erro de Estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Observações</label>
            <Input 
              placeholder="Ex: Caiu da prateleira ao repor" 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button 
            className="bg-red-600 hover:bg-red-700" 
            onClick={handleSubmit}
            loading={loading}
          >
            REGISTRAR BAIXA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
