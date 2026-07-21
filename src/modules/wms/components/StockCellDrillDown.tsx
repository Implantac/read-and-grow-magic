import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Factory, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/ui/base/sheet';
import { Badge } from '@/ui/base/badge';
import { Skeleton } from '@/ui/base/skeleton';
import { EmptyState } from '@/shared/components/EmptyState';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productId: string | null;
  productName: string | null;
  branchId: string | null;
  branchName: string | null;
  canal: 'VAREJO_PDV' | 'ATACADO_INDUSTRIA' | null;
  currentBalance: number;
}

interface MovementRow {
  id: string;
  created_at: string;
  direction: string;
  quantity: number;
  type: string | null;
  document_number: string | null;
  reference: string | null;
  notes: string | null;
}

export function StockCellDrillDown({
  open,
  onOpenChange,
  productId,
  productName,
  branchId,
  branchName,
  canal,
  currentBalance,
}: Props) {
  const { data, isLoading } = useQuery<MovementRow[]>({
    queryKey: ['stock-cell-drilldown', productId, branchId, canal],
    enabled: open && !!productId && !!branchId && !!canal,
    staleTime: 15 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('id, created_at, direction, quantity, type, document_number, reference, notes')
        .eq('product_id', productId!)
        .eq('branch_id', branchId!)
        .eq('canal_operacional', canal!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as MovementRow[];
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{productName ?? 'Produto'}</SheetTitle>
          <SheetDescription>
            <div className="flex items-center gap-2 mt-1">
              {canal === 'ATACADO_INDUSTRIA' ? (
                <Factory className="h-4 w-4" />
              ) : (
                <Store className="h-4 w-4" />
              )}
              <span className="font-medium">{branchName}</span>
              <Badge variant="secondary">
                {canal === 'VAREJO_PDV' ? 'Varejo' : 'Atacado'}
              </Badge>
            </div>
            <div className="mt-2 text-sm">
              Saldo atual:{' '}
              <span className="font-semibold text-foreground">
                {currentBalance.toLocaleString('pt-BR')}
              </span>
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Últimas 50 movimentações (Ledger)
          </h3>

          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))
          ) : !data || data.length === 0 ? (
            <EmptyState
              title="Sem movimentações"
              description="Este produto ainda não tem histórico neste canal/filial."
            />
          ) : (
            data.map((m) => {
              const isIn = m.direction === 'in';
              return (
                <div
                  key={m.id}
                  className="flex items-start gap-3 rounded-md border border-border/50 p-3 hover:bg-muted/30"
                >
                  <div
                    className={
                      isIn
                        ? 'mt-1 rounded-full bg-emerald-500/15 p-1.5 text-emerald-500'
                        : 'mt-1 rounded-full bg-destructive/15 p-1.5 text-destructive'
                    }
                  >
                    {isIn ? (
                      <ArrowUp className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">
                        {m.type ?? (isIn ? 'Entrada' : 'Saída')}
                      </span>
                      <span
                        className={
                          isIn
                            ? 'text-sm font-semibold tabular-nums text-emerald-500'
                            : 'text-sm font-semibold tabular-nums text-destructive'
                        }
                      >
                        {isIn ? '+' : '−'}
                        {Number(m.quantity).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {m.document_number ? `Doc ${m.document_number}` : ''}
                      {m.reference ? ` · ${m.reference}` : ''}
                      {m.notes ? ` · ${m.notes}` : ''}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(m.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
