import { Card, CardContent } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Skeleton } from '@/ui/base/skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { Pencil, Trash2, Route, Clock, Plus } from 'lucide-react';
import type { ProductionRouteRow } from '@/hooks/production/useProductionRoutes';

interface Props {
  loading: boolean;
  routes: ProductionRouteRow[];
  search: string;
  selectedRoute: string | null;
  onSelect: (id: string) => void;
  onEdit: (r: ProductionRouteRow) => void;
  onDelete: (id: string) => void;
  onClearSearch: () => void;
  onNew: () => void;
}

export function RoutesList({ loading, routes, search, selectedRoute, onSelect, onEdit, onDelete, onClearSearch, onNew }: Props) {
  return (
    <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : routes.length === 0 ? (
        <EmptyState
          icon={Route}
          title={search ? 'Nenhuma rota encontrada' : 'Nenhuma rota cadastrada'}
          description={search
            ? 'Ajuste a busca para localizar a rota desejada.'
            : 'Cadastre rotas de produção para definir o fluxo padrão de fabricação por produto.'}
          action={search
            ? { label: 'Limpar busca', onClick: onClearSearch, variant: 'outline' }
            : { label: 'Nova Rota', onClick: onNew, icon: Plus }}
          compact
        />
      ) : routes.map(r => (
        <Card
          key={r.id}
          className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${selectedRoute === r.id ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20' : 'border-border/40'}`}
          onClick={() => onSelect(r.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-bold text-primary">{r.code}</span>
                  <Badge variant="outline" className="text-[10px] h-5">v{r.version}</Badge>
                  {!r.is_active && <Badge variant="destructive" className="text-[10px] h-5">Inativa</Badge>}
                </div>
                <p className="text-sm text-muted-foreground truncate">{r.product_name || 'Sem produto vinculado'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="gap-1 text-xs"><Clock className="h-3 w-3" />{r.total_time_minutes} min</Badge>
                </div>
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); onEdit(r); }}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); onDelete(r.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
