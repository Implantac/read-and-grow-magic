import { User, Search } from 'lucide-react';
import { Input } from '@/ui/base/input';
import { Badge } from '@/ui/base/badge';
import { ScrollArea } from '@/ui/base/scroll-area';
import type { DbClient } from '@/hooks/commercial/useClients';
import { maskDoc } from './types';

interface Props {
  open: boolean;
  query: string;
  filteredClients: DbClient[];
  onQueryChange: (v: string) => void;
  onSelect: (c: DbClient) => void;
  onClose: () => void;
}

/**
 * PDVCustomerPicker — modal de busca e seleção de cliente para vincular à venda.
 * Sobreposto ao PDV; ESC ou clique fora fecham.
 */
export function PDVCustomerPicker({ open, query, filteredClients, onQueryChange, onSelect, onClose }: Props) {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}
    >
      <div
        className="bg-background border-2 rounded-2xl p-6 w-[520px] max-h-[70vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Selecionar cliente"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-primary/10 text-primary rounded-lg"><User className="h-5 w-5" /></div>
          <div>
            <h3 className="font-black text-lg">Identificar cliente</h3>
            <p className="text-xs text-muted-foreground">Busque por nome, CPF/CNPJ ou email.</p>
          </div>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Buscar cliente..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <ScrollArea className="flex-1 -mx-2 px-2">
          <div className="space-y-1">
            {filteredClients.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Nenhum cliente encontrado.</div>
            ) : filteredClients.map((c) => (
              <button
                key={c.id}
                className="w-full text-left p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => onSelect(c)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{c.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground truncate">
                      {maskDoc(c.document || '')} {c.email ? `· ${c.email}` : ''}
                    </div>
                  </div>
                  {c.abc_classification && (
                    <Badge variant="secondary" className="text-[9px]">{c.abc_classification}</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
