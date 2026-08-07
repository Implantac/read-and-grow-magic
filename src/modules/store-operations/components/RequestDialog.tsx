import { useState } from 'react';
import { Button } from "@/ui/base/button";
import { Plus, Search, Trash2, ArrowRight, Truck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/ui/base/dialog";
import { Input } from "@/ui/base/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import { Badge } from "@/ui/base/badge";
import { Separator } from "@/ui/base/separator";
import { cn } from "@/lib/utils";

interface RequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'reposicao' | 'manual';
}

export function RequestDialog({ isOpen, onClose, initialType = 'reposicao' }: RequestDialogProps) {
  const [step, setStep] = useState(1);
  const [items, setItems] = useState([
    { id: 1, name: 'Produto X', stock: 8, min: 30, suggested: 92, requested: 92 },
  ]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
            {step === 1 ? 'NOVA SOLICITAÇÃO DE MERCADORIA' : 'CONFIRMAR SOLICITAÇÃO'}
          </DialogTitle>
        </DialogHeader>
        
        {step === 1 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Tipo de Solicitação</label>
                <Select defaultValue={initialType}>
                  <SelectTrigger className="font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reposicao" className="text-xs font-bold uppercase tracking-tight">🔄 Reposição Automática</SelectItem>
                    <SelectItem value="manual" className="text-xs font-bold uppercase tracking-tight">📦 Transferência Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Origem Recomendada</label>
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                  <Badge className="bg-blue-500 font-black px-2 py-0.5">CD CENTRAL</Badge>
                  <span className="text-[10px] text-muted-foreground font-medium">Lead time: 1 dia</span>
                </div>
              </div>
            </div>

            <Separator className="bg-primary/10" />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Itens da Solicitação</label>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black gap-1 hover:bg-primary/5">
                  <Plus className="h-3 w-3" /> ADICIONAR ITEM
                </Button>
              </div>
              
              <div className="border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b">
                    <tr className="text-left">
                      <th className="p-3 font-black uppercase tracking-widest text-[10px]">Produto</th>
                      <th className="p-3 font-black uppercase tracking-widest text-[10px] text-center">Atual</th>
                      <th className="p-3 font-black uppercase tracking-widest text-[10px] text-center">Mínimo</th>
                      <th className="p-3 font-black uppercase tracking-widest text-[10px] text-center text-primary">IA: Sugestão</th>
                      <th className="p-3 font-black uppercase tracking-widest text-[10px] text-right">Pedir</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5 bg-background">
                    {items.map(item => (
                      <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                        <td className="p-3 font-black uppercase tracking-tight text-[11px]">{item.name}</td>
                        <td className="p-3 text-center font-mono font-medium">{item.stock}</td>
                        <td className="p-3 text-center font-mono font-medium text-muted-foreground">{item.min}</td>
                        <td className="p-3 text-center font-black text-primary font-mono">{item.suggested}</td>
                        <td className="p-3 text-right">
                          <Input 
                            type="number" 
                            className="w-16 h-8 text-right font-black ml-auto border-primary/20 focus-visible:ring-primary" 
                            value={item.requested}
                            onChange={(e) => setItems(items.map(i => i.id === item.id ? { ...i, requested: Number(e.target.value) } : i))}
                          />
                        </td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 shadow-inner">
                <Truck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-black uppercase text-xl tracking-tight">Revisar Solicitação</h3>
              <p className="text-sm text-muted-foreground max-w-sm font-medium">
                Esta solicitação será enviada para análise do CD Central. O lead time estimado para chegada é de 24h após aprovação.
              </p>
            </div>

            <div className="bg-muted/30 p-5 rounded-2xl border border-primary/10 shadow-sm space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-black uppercase tracking-widest opacity-70">Volume de Itens</span>
                <span className="font-black text-sm">92 UNIDADES</span>
              </div>
              <Separator className="bg-primary/5" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-black uppercase tracking-widest opacity-70">Origem Destinada</span>
                <Badge variant="outline" className="font-black px-2 border-primary/20 text-primary">CD CENTRAL</Badge>
              </div>
              <Separator className="bg-primary/5" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-black uppercase tracking-widest opacity-70">Prioridade Operacional</span>
                <Badge className="h-6 text-[10px] font-black bg-red-500 hover:bg-red-600 shadow-sm px-3 uppercase tracking-tighter">ALTA: RISCO DE RUPTURA</Badge>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 mt-4">
          {step === 1 ? (
            <>
              <Button variant="ghost" className="font-black uppercase text-[10px] tracking-widest" onClick={onClose}>Descartar</Button>
              <Button className="font-black uppercase text-[10px] tracking-widest px-6" onClick={() => setStep(2)}>
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="font-black uppercase text-[10px] tracking-widest" onClick={() => setStep(1)}>Voltar</Button>
              <Button className="bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest px-8 shadow-lg shadow-primary/20">
                ENVIAR SOLICITAÇÃO
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
