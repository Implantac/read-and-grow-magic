import { Pause, Play, Trash2, X } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { ScrollArea } from '@/ui/base/scroll-area';
import { formatBRL } from '@/lib/formatters';
import type { ParkedSale } from './pdvParkedStorage';

interface Props {
  open: boolean;
  parked: ParkedSale[];
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function PDVParkedDialog({ open, parked, onResume, onDelete, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 bg-background/85 backdrop-blur-md flex items-center justify-center" onClick={onClose}>
      <div className="bg-background border-2 rounded-2xl p-6 w-[540px] max-h-[80vh] flex flex-col shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-3 right-3 text-muted-foreground hover:text-foreground" onClick={onClose} aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-lg"><Pause className="h-5 w-5" /></div>
          <div>
            <h3 className="font-black text-lg">Cupons suspensos</h3>
            <p className="text-xs text-muted-foreground">Retome uma venda que ficou aguardando.</p>
          </div>
        </div>
        <ScrollArea className="flex-1 -mx-2 px-2">
          {parked.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Nenhum cupom suspenso.</div>
          ) : (
            <div className="space-y-2">
              {parked.map((p) => (
                <div key={p.id} className="flex items-center gap-3 border rounded-lg p-3 hover:border-primary transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">
                      {p.label || `Cupom · ${p.items.length} itens`}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(p.parkedAt).toLocaleString('pt-BR')}
                      {p.customerName ? ` · ${p.customerName}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] uppercase font-bold text-muted-foreground">Total</div>
                    <div className="font-black tabular-nums text-primary">{formatBRL(p.total)}</div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onResume(p.id)}>
                    <Play className="h-3.5 w-3.5" /> Retomar
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
