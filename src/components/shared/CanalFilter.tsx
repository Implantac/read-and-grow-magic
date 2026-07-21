import { Store, Factory, Layers } from 'lucide-react';
import { useCanalStore, CANAL_LABEL, type CanalFilter } from '@/stores/useCanalStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/base/select';
import { Badge } from '@/ui/base/badge';
import { useBranches } from '@/hooks/useBranches';

const CANAL_ICONS: Record<CanalFilter, React.ElementType> = {
  CONSOLIDADO: Layers,
  VAREJO_PDV: Store,
  ATACADO_INDUSTRIA: Factory,
};

interface Props {
  showBranch?: boolean;
  className?: string;
}

/**
 * Global operational-channel filter for the manager dashboard.
 * Reads/writes `useCanalStore` so all hooks/pages downstream react.
 */
export function CanalFilter({ showBranch = true, className }: Props) {
  const { canal, branchId, setCanal, setBranchId } = useCanalStore();
  const { data: branches = [] } = useBranches();
  const Icon = CANAL_ICONS[canal];

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 backdrop-blur px-3 py-1.5">
        <Icon className="h-4 w-4 text-primary" />
        <Select value={canal} onValueChange={(v) => setCanal(v as CanalFilter)}>
          <SelectTrigger
            className="h-8 w-[220px] border-0 bg-transparent focus:ring-0"
            aria-label="Filtro de canal operacional"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CONSOLIDADO">{CANAL_LABEL.CONSOLIDADO}</SelectItem>
            <SelectItem value="VAREJO_PDV">{CANAL_LABEL.VAREJO_PDV}</SelectItem>
            <SelectItem value="ATACADO_INDUSTRIA">{CANAL_LABEL.ATACADO_INDUSTRIA}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showBranch && (
        <Select
          value={branchId ?? '__all__'}
          onValueChange={(v) => setBranchId(v === '__all__' ? null : v)}
        >
          <SelectTrigger className="h-10 w-[220px]" aria-label="Filtro de filial">
            <SelectValue placeholder="Todas as filiais" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas as filiais</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}{' '}
                <Badge variant="outline" className="ml-2 text-[10px]">
                  {b.tipo}
                </Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
