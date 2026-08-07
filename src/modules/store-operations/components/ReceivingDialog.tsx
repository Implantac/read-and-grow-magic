import { useState } from 'react';
import { Card, CardContent } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { X, Check, Camera, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/ui/base/dialog";
import { Input } from "@/ui/base/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";

interface ReceivingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transferId?: string;
}

export function ReceivingDialog({ isOpen, onClose, transferId = "TR-00182" }: ReceivingDialogProps) {
  const [items, setItems] = useState([
    { id: 1, name: 'Produto A', expected: 50, received: 50 },
    { id: 2, name: 'Produto B', expected: 20, received: 18 },
    { id: 3, name: 'Produto C', expected: 17, received: 17 },
  ]);

  const handleUpdate = (id: number, val: number) => {
    setItems(items.map(i => i.id === id ? { ...i, received: val } : i));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>CONFERÊNCIA {transferId}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-3 font-black text-[10px] uppercase text-muted-foreground px-4 py-2 bg-muted/50 rounded-lg">
            <span>Produto</span>
            <span className="text-right">Esperado</span>
            <span className="text-right">Recebido</span>
          </div>
          
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className={cn(
                "grid grid-cols-3 items-center px-4 py-2 border rounded-lg",
                item.received !== item.expected ? "border-amber-500/50 bg-amber-500/5" : "border-border"
              )}>
                <span className="text-sm font-bold">{item.name}</span>
                <span className="text-right font-mono text-sm">{item.expected}</span>
                <Input 
                  type="number" 
                  value={item.received} 
                  onChange={(e) => handleUpdate(item.id, Number(e.target.value))}
                  className="w-20 ml-auto h-8 text-right font-bold"
                />
              </div>
            ))}
          </div>

          {items.some(i => i.received !== i.expected) && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-black text-xs uppercase">Divergência detectada</span>
              </div>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Motivo da divergência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qnt">Quantidade divergente</SelectItem>
                  <SelectItem value="avaria">Produto avariado</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="w-full gap-2">
                <Camera className="h-4 w-4" /> Adicionar Evidência
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Check className="h-4 w-4 mr-2" /> RECEBER CONFERIDO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Minimal cn implementation for the component locally if not importing @/lib/utils
function cn(...classes: string[]) { return classes.filter(Boolean).join(' '); }
