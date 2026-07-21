import { useMemo, useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Skeleton } from '@/ui/base/skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/base/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/base/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/ui/base/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/base/popover';
import { ArrowDown, ArrowUp, ClipboardList, Package, Search, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBranches } from '@/hooks/useBranches';
import { useProductSearch, useStockAudit, type AuditRow } from '@/hooks/inventory/useStockAudit';
import { AuditMovementSheet } from './components/AuditMovementSheet';

export default function EstoqueAuditoria() {
  const [productId, setProductId] = useState<string>('');
  const [productLabel, setProductLabel] = useState<string>('');
  const [term, setTerm] = useState('');
  const [branchId, setBranchId] = useState<string>('');
  const [canal, setCanal] = useState<'ALL' | 'VAREJO_PDV' | 'ATACADO_INDUSTRIA'>('ALL');
  const [direction, setDirection] = useState<'ALL' | 'in' | 'out'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<AuditRow | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: products } = useProductSearch(term);
  const { data: branches } = useBranches();

  const { data: rows, isLoading } = useStockAudit({
    productId,
    branchId: branchId || null,
    canal: canal === 'ALL' ? null : canal,
    direction: direction === 'ALL' ? null : direction,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : null,
    dateTo: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : null,
  });

  const totals = useMemo(() => {
    const t = { in: 0, out: 0, balance: 0 };
    (rows ?? []).forEach((r) => {
      if (r.direction === 'in') t.in += r.quantity;
      else t.out += r.quantity;
    });
    t.balance = (rows?.[0]?.running_balance as number | undefined) ?? 0;
    return t;
  }, [rows]);

  return (
    <PageContainer>
      <PageHeader
        title="Auditoria de Estoque"
        description="Extrato cronológico e imutável de todas as movimentações do produto — como um extrato bancário."
        icon={ClipboardList}
      />

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2">
              <Label>Produto</Label>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between mt-1">
                    <span className="truncate">
                      {productLabel || 'Selecionar produto…'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[360px]" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar por código ou nome…"
                      value={term}
                      onValueChange={setTerm}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                      <CommandGroup>
                        {(products ?? []).map((p) => (
                          <CommandItem
                            key={p.id}
                            value={p.id}
                            onSelect={() => {
                              setProductId(p.id);
                              setProductLabel(`${p.code ?? ''} · ${p.name}`);
                              setPickerOpen(false);
                            }}
                          >
                            <Package className="mr-2 h-4 w-4" />
                            <span className="font-mono text-xs mr-2">{p.code ?? '—'}</span>
                            {p.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Filial</Label>
              <Select value={branchId || 'ALL'} onValueChange={(v) => setBranchId(v === 'ALL' ? '' : v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  {(branches ?? []).map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Canal</Label>
              <Select value={canal} onValueChange={(v) => setCanal(v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="VAREJO_PDV">Varejo (PDV)</SelectItem>
                  <SelectItem value="ATACADO_INDUSTRIA">Atacado / Indústria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>De</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Até</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={direction === 'ALL' ? 'default' : 'outline'}
              onClick={() => setDirection('ALL')}
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={direction === 'in' ? 'default' : 'outline'}
              onClick={() => setDirection('in')}
              className={direction === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              <ArrowUp className="h-3 w-3 mr-1" /> Entradas
            </Button>
            <Button
              size="sm"
              variant={direction === 'out' ? 'default' : 'outline'}
              onClick={() => setDirection('out')}
              className={direction === 'out' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              <ArrowDown className="h-3 w-3 mr-1" /> Saídas
            </Button>
          </div>
        </CardContent>
      </Card>

      {productId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <Card><CardContent className="pt-5">
            <div className="text-xs text-muted-foreground">Entradas (período)</div>
            <div className="text-2xl font-bold text-emerald-600 flex items-center gap-1">
              <ArrowUp className="h-5 w-5" /> {totals.in}
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <div className="text-xs text-muted-foreground">Saídas (período)</div>
            <div className="text-2xl font-bold text-red-600 flex items-center gap-1">
              <ArrowDown className="h-5 w-5" /> {totals.out}
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <div className="text-xs text-muted-foreground">Saldo final</div>
            <div className="text-2xl font-bold font-mono">{totals.balance}</div>
          </CardContent></Card>
        </div>
      )}

      <Card className="mt-4">
        <CardContent className="pt-6">
          {!productId ? (
            <EmptyState
              icon={Search}
              title="Selecione um produto"
              description="Escolha um produto acima para ver seu extrato cronológico de movimentações."
            />
          ) : isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : !rows || rows.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nenhuma movimentação encontrada"
              description="Ajuste os filtros ou verifique se este produto teve movimentações no período."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const isIn = r.direction === 'in';
                  return (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelected(r)}
                    >
                      <TableCell className="text-xs">
                        {format(new Date(r.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{r.type ?? '—'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {r.canal_operacional === 'VAREJO_PDV' ? 'Varejo' : r.canal_operacional === 'ATACADO_INDUSTRIA' ? 'Atacado' : '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.document_number || r.reference || '—'}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${isIn ? 'text-emerald-600' : 'text-red-600'}`}>
                        <span className="inline-flex items-center gap-1 justify-end">
                          {isIn ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {isIn ? '+' : '-'}{r.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{r.running_balance}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AuditMovementSheet
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        row={selected}
      />
    </PageContainer>
  );
}
