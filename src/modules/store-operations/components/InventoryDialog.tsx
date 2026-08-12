import { useState } from 'react';
import { Button } from "@/ui/base/button";
import { Check, ClipboardList, AlertCircle, Package, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/ui/base/dialog";
import { Input } from "@/ui/base/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useProducts } from '@/hooks/inventory/useProducts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/ui/base/badge';
import { ScrollArea } from '@/ui/base/scroll-area';

interface InventoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InventoryDialog({ isOpen, onClose }: InventoryDialogProps) {
  const { currentBranch } = useEnterprise();
  const { data: products } = useProducts();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10);

  const addItem = (product: any) => {
    if (items.find(i => i.id === product.id)) return;
    setItems([...items, { ...product, counted_qty: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateQty = (id: string, qty: number) => {
    setItems(items.map(i => i.id === id ? { ...i, counted_qty: qty } : i));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Aqui integraria com o backend real para criar a tarefa de inventário
      // Por enquanto, simulamos o sucesso
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Inventário registrado com sucesso");
      onClose();
    } catch (error) {
      toast.error("Erro ao registrar inventário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tight text-primary">
            <ClipboardList className="h-5 w-5" />
            {step === 1 ? 'INICIAR CONTAGEM DE ESTOQUE' : 'CONFIRMAR RESULTADOS'}
          </DialogTitle>
        </DialogHeader>
        
        {step === 1 ? (
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar produtos por nome ou SKU..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {searchTerm && (
              <div className="border rounded-lg divide-y bg-muted/20">
                {filteredProducts?.map(p => (
                  <button 
                    key={p.id} 
                    className="w-full text-left p-3 hover:bg-primary/5 flex items-center justify-between"
                    onClick={() => addItem(p)}
                  >
                    <div>
                      <p className="text-sm font-bold">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{p.sku || 'SEM SKU'}</p>
                    </div>
                    <Badge variant="outline">Adicionar</Badge>
                  </button>
                ))}
              </div>
            )}

            <ScrollArea className="h-[300px] border rounded-xl p-4 bg-background">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                  <Package className="h-12 w-12 mb-2" />
                  <p className="text-sm font-bold uppercase tracking-widest">Nenhum item selecionado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
                      <div>
                        <p className="text-sm font-bold">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">{item.sku}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input 
                          type="number" 
                          className="w-20 text-right font-black" 
                          value={item.counted_qty}
                          onChange={(e) => updateQty(item.id, Number(e.target.value))}
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="text-red-500">
                          X
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <div className="py-6 space-y-4">
             <div className="bg-amber-500/10 p-4 border border-amber-500/20 rounded-xl flex items-start gap-3">
               <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
               <div className="text-sm">
                 <p className="font-bold text-amber-700 uppercase text-xs">Atenção</p>
                 <p className="text-amber-600 font-medium">Você está prestes a consolidar a contagem de {items.length} itens. Divergências detectadas gerarão ajustes automáticos no Ledger Logístico.</p>
               </div>
             </div>
             
             <div className="divide-y border rounded-xl bg-background">
               {items.map(item => (
                 <div key={item.id} className="p-4 flex justify-between items-center">
                   <span className="text-sm font-bold uppercase">{item.name}</span>
                   <Badge className="bg-primary font-mono text-lg px-4">{item.counted_qty}</Badge>
                 </div>
               ))}
             </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button 
                className="bg-primary font-black uppercase tracking-widest text-[10px]" 
                disabled={items.length === 0}
                onClick={() => setStep(2)}
              >
                Revisar Contagem
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep(1)} disabled={loading}>Voltar</Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest text-[10px]" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Processando..." : "FINALIZAR INVENTÁRIO"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
