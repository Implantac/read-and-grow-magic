import { useState } from 'react';
import { Button } from "@/ui/base/button";
import { Plus, Search, Trash2, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/ui/base/dialog";
import { Input } from "@/ui/base/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import { Badge } from "@/ui/base/badge";
import { Separator } from "@/ui/base/separator";

interface RequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestDialog({ isOpen, onClose }: RequestDialogProps) {
  const [step, setStep] = useState(1);
  const [items, setItems] = useState([
    { id: 1, name: 'Produto X', stock: 8, min: 30, suggested: 92, requested: 92 },
  ]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 1 ? 'NOVA SOLICITAÇÃO DE MERCADORIA' : 'CONFIRMAR SOLICITAÇÃO'}
          </DialogTitle>
        </DialogHeader>
        
        {step === 1 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Tipo de Solicitação</label>
                <Select defaultValue="reposicao">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reposicao">🔄 Reposição Automática</SelectItem>
                    <SelectItem value="manual">📦 Transferência Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Origem Recomendada</label>
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                  <Badge className="bg-blue-500">CD CENTRAL</Badge>
                  <span className="text-[10px] text-muted-foreground font-medium">Lead time: 1 dia</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Itens da Solicitação</label>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black gap-1">
                  <Plus className="h-3 w-3" /> ADICIONAR ITEM
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b">
                    <tr className="text-left">
                      <th className="p-3 font-black uppercase tracking-widest text-[10px]">Produto</th>
                      <th className="p-3 font-black uppercase tracking-widest text-[10px] text-center">Atual</th>
                      <th className="p-3 font-black uppercase tracking-widest text-[10px] text-center">Mínimo</th>
                      <th className="p-3 font-black uppercase tracking-widest text-[10px] text-center text-primary">Sugestão</th>
                      <th className="p-3 font-black uppercase tracking-widest text-[10px] text-right">Pedir</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map(item => (
                      <tr key={item.id}>
                        <td className="p-3 font-bold">{item.name}</td>
                        <td className="p-3 text-center font-mono">{item.stock}</td>
                        <td className="p-3 text-center font-mono">{item.min}</td>
                        <td className="p-3 text-center font-black text-primary font-mono">{item.suggested}</td>
                        <td className="p-3 text-right">
                          <Input 
                            type="number" 
                            className="w-16 h-7 text-right font-bold ml-auto" 
                            value={item.requested}
                            onChange={(e) => setItems(items.map(i => i.id === item.id ? { ...i, requested: Number(e.target.value) } : i))}
                          />
                        </td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500">
                            <Trash2 className="h-3 w-3" />
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
          <div className="py-6 space-y-6">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-black uppercase text-lg">Resumo da Solicitação</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Esta solicitação será enviada para análise do CD Central. O lead time estimado para chegada é de 24h após aprovação.
              </p>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium uppercase tracking-widest">Itens Totais</span>
                <span className="font-black">92 unidades</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium uppercase tracking-widest">Origem</span>
                <span className="font-black">CD CENTRAL</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium uppercase tracking-widest">Prioridade</span>
                <Badge variant="outline" className="h-5 text-[9px] font-black border-red-200 text-red-500">ALTA (RUPTURA)</Badge>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 1 ? (
            <>
              <Button variant="ghost" onClick={onClose}>Descartar</Button>
              <Button onClick={() => setStep(2)}>
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
              <Button className="bg-primary hover:bg-primary/90 font-black">
                ENVIAR SOLICITAÇÃO
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
