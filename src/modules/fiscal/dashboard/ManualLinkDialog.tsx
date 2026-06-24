import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/base/dialog";
import { Link as LinkIcon, Plus, Search } from "lucide-react";
import { SystemProduct, XMLData } from "./types";

interface ManualLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeItemIndex: number | null;
  xmlData: XMLData | null;
  systemProducts: SystemProduct[];
  onConfirm: (productId: string) => void;
}

export function ManualLinkDialog({
  open,
  onOpenChange,
  activeItemIndex,
  xmlData,
  systemProducts,
  onConfirm,
}: ManualLinkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" />
            Vincular Produto do Sistema
          </DialogTitle>
        </DialogHeader>

        {activeItemIndex !== null && xmlData && (
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg border">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Item no XML</p>
              <p className="font-medium text-sm">{xmlData.products[activeItemIndex].description}</p>
              <p className="text-[10px] text-muted-foreground">Ref Fornecedor: {xmlData.products[activeItemIndex].code}</p>
            </div>

            <div className="space-y-2">
              <Label>Pesquisar no Catálogo Local</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Nome ou código do produto..." className="pl-9" />
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {systemProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-primary cursor-pointer transition-all hover:bg-primary/5 group"
                  onClick={() => onConfirm(p.id)}
                >
                  <div>
                    <p className="text-sm font-bold group-hover:text-primary transition-colors">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">Cód: {p.code}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
