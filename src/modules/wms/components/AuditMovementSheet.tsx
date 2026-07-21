import { useQuery } from '@tanstack/react-query';
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
import { formatBRL } from '@/lib/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, ArrowUp, ArrowDown, User, Store, Factory, Hash } from 'lucide-react';
import type { AuditRow } from '@/hooks/inventory/useStockAudit';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: AuditRow | null;
}

/** Tenta localizar o documento original a partir de `reference` ou `document_number`. */
function useOriginalDoc(row: AuditRow | null) {
  return useQuery({
    queryKey: ['audit-doc', row?.id],
    enabled: !!row,
    staleTime: 60 * 1000,
    queryFn: async () => {
      if (!row) return null;
      const key = row.reference || row.document_number;
      if (!key) return null;

      // Tenta em ordem: orders → nfce → nfe → transferencias_canal
      const tryFind = async (
        table: 'orders' | 'nfce' | 'nfe' | 'transferencias_canal',
        cols: string
      ) => {
        const { data } = await supabase
          .from(table)
          .select(cols)
          .or(`id.eq.${isUuid(key) ? key : '00000000-0000-0000-0000-000000000000'},numero.eq.${escape(key)}`)
          .limit(1)
          .maybeSingle();
        return data ? { table, data } : null;
      };

      return (
        (await tryFind('orders', 'id, order_number, status, total_amount, created_at, client_name').catch(() => null)) ||
        (await tryFind('nfce', 'id, numero, status, valor_total, data_emissao').catch(() => null)) ||
        (await tryFind('nfe', 'id, numero, status, valor_total, data_emissao').catch(() => null)) ||
        (await tryFind('transferencias_canal', 'id, numero, status, canal_origem, canal_destino, created_at').catch(() => null)) ||
        null
      );
    },
  });
}

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
function escape(s: string) {
  return s.replace(/[,()]/g, '');
}

export function AuditMovementSheet({ open, onOpenChange, row }: Props) {
  const { data: doc, isLoading } = useOriginalDoc(row);
  const isIn = row?.direction === 'in';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {isIn ? (
              <ArrowUp className="h-5 w-5 text-emerald-600" />
            ) : (
              <ArrowDown className="h-5 w-5 text-red-600" />
            )}
            Movimentação {isIn ? 'de entrada' : 'de saída'}
          </SheetTitle>
          <SheetDescription>
            {row && format(new Date(row.created_at), "PPPp", { locale: ptBR })}
          </SheetDescription>
        </SheetHeader>

        {row && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Tipo" value={<Badge variant="outline">{row.type ?? '—'}</Badge>} />
              <Field
                label="Quantidade"
                value={
                  <span className={isIn ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {isIn ? '+' : '-'}{row.quantity}
                  </span>
                }
              />
              <Field label="Saldo após" value={<span className="font-mono">{row.running_balance}</span>} />
              <Field
                label="Canal"
                value={
                  <span className="flex items-center gap-1">
                    {row.canal_operacional === 'ATACADO_INDUSTRIA' ? (
                      <Factory className="h-3 w-3" />
                    ) : (
                      <Store className="h-3 w-3" />
                    )}
                    <Badge variant="secondary">{row.canal_operacional === 'VAREJO_PDV' ? 'Varejo' : 'Atacado'}</Badge>
                  </span>
                }
              />
              {row.unit_cost != null && (
                <Field label="Custo unit." value={formatBRL(row.unit_cost)} />
              )}
              {row.total_cost != null && (
                <Field label="Custo total" value={formatBRL(row.total_cost)} />
              )}
              {row.from_warehouse && <Field label="De" value={row.from_warehouse} />}
              {row.to_warehouse && <Field label="Para" value={row.to_warehouse} />}
              {row.operator && (
                <Field
                  label="Operador"
                  value={
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {row.operator}
                    </span>
                  }
                />
              )}
              {row.source && <Field label="Origem" value={row.source} />}
            </div>

            {row.notes && (
              <div className="rounded-md bg-muted/40 p-3 text-sm">
                <div className="text-xs text-muted-foreground mb-1">Observações</div>
                {row.notes}
              </div>
            )}

            <div className="border rounded-md p-4">
              <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                <FileText className="h-4 w-4" /> Documento original
              </div>
              {!row.reference && !row.document_number ? (
                <p className="text-xs text-muted-foreground">Movimentação manual, sem documento vinculado.</p>
              ) : isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : doc ? (
                <div className="space-y-1 text-sm">
                  <Badge variant="outline" className="capitalize">{doc.table.replace('_', ' ')}</Badge>
                  <pre className="mt-2 text-xs bg-muted/30 rounded p-2 overflow-auto">
                    {JSON.stringify(doc.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3" /> Referência: {row.reference || row.document_number}
                </p>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}
