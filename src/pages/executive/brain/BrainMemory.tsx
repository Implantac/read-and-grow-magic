import { Search } from 'lucide-react';
import { Card, CardContent } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Badge } from '@/ui/base/badge';

interface BrainMemoryProps {
  memories: any[];
  filteredMemories: any[];
  memorySearch: string;
  setMemorySearch: (v: string) => void;
  memorySearchRef: React.RefObject<HTMLInputElement>;
}

export function BrainMemory({ memories, filteredMemories, memorySearch, setMemorySearch, memorySearchRef }: BrainMemoryProps) {
  return (
    <div className="space-y-3">
      {memories.length > 0 && (
        <div className="relative" role="search">
          <label htmlFor="brain-memory-search" className="sr-only">Buscar nas memórias</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="brain-memory-search"
            ref={memorySearchRef}
            type="search"
            value={memorySearch}
            onChange={(e) => setMemorySearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape' && memorySearch) { e.preventDefault(); setMemorySearch(''); } }}
            placeholder="Buscar nas memórias..."
            aria-label="Buscar nas memórias"
            aria-keyshortcuts="Control+K Escape"
            aria-controls="brain-memory-results"
            className="pl-9"
          />
          <p className="sr-only" aria-live="polite">
            {filteredMemories.length} {filteredMemories.length === 1 ? 'memória encontrada' : 'memórias encontradas'}
          </p>
        </div>
      )}
      {filteredMemories.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {memories.length === 0
              ? 'Nenhuma memória ainda. O cérebro acumula fatos, padrões e regras a cada análise.'
              : 'Nenhuma memória corresponde à busca.'}
          </CardContent>
        </Card>
      )}
      <div id="brain-memory-results" className="grid gap-2 md:grid-cols-2" role="list" aria-label="Memórias do Cérebro">
        {filteredMemories.map((m) => (
          <Card key={m.id} role="listitem" className="hover:border-primary/40 transition-colors focus-within:ring-2 focus-within:ring-ring">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] uppercase">{m.category}</Badge>
                <Badge variant="secondary" className="text-[10px]">{m.scope}</Badge>
                <span className="text-[10px] text-muted-foreground ml-auto">imp. {m.importance}</span>
              </div>
              <p className="text-xs font-mono font-semibold truncate">{m.key}</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words font-sans line-clamp-4">
                {typeof m.value === 'string' ? m.value : JSON.stringify(m.value, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
