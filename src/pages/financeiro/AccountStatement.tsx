import { useMemo, useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useClients } from '@/hooks/useClients';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useAccountStatement } from '@/hooks/useSettlement';
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';

import { formatBRL, formatDate } from '@/lib/formatters';
const fmt = (v: number) =>
  formatBRL(Number(v) || 0);

export default function AccountStatement() {
  const [entityType, setEntityType] = useState<'client' | 'supplier'>('client');
  const [entityId, setEntityId] = useState<string>('');
  const today = new Date().toISOString().slice(0, 10);
  const ago = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(ago);
  const [to, setTo] = useState(today);

  const { data: clients = [] } = useClients();
  const { suppliers } = useSuppliers();

  const { data: rows = [], isLoading } = useAccountStatement(entityId ? entityType : null, entityId || null, from, to);

  const list = entityType === 'client' ? clients : suppliers;

  const totals = useMemo(() => {
    const debit = rows.filter((r) => r.kind === 'debit').reduce((s, r) => s + Number(r.amount), 0);
    const credit = rows.filter((r) => r.kind === 'credit').reduce((s, r) => s + Number(r.amount), 0);
    const balance = rows.length > 0 ? Number(rows[rows.length - 1].running_balance) : 0;
    return { debit, credit, balance };
  }, [rows]);

  return (
    <PageContainer>
      <PageHeader
        title="Conta Corrente"
        description="Extrato unificado de cliente ou fornecedor: vendas, pagamentos, adiantamentos e compensações."
      />

      <Card>
        <CardContent className="pt-6 grid gap-3 md:grid-cols-[160px_1fr_160px_160px]">
          <Select value={entityType} onValueChange={(v: any) => { setEntityType(v); setEntityId(''); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="client">Cliente</SelectItem>
              <SelectItem value="supplier">Fornecedor</SelectItem>
            </SelectContent>
          </Select>
          <Select value={entityId} onValueChange={setEntityId}>
            <SelectTrigger><SelectValue placeholder={`Selecione um ${entityType === 'client' ? 'cliente' : 'fornecedor'}`} /></SelectTrigger>
            <SelectContent>
              {list.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </CardContent>
      </Card>

      {entityId && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex gap-2 items-center"><ArrowUpCircle className="h-4 w-4 text-destructive" />Débitos</CardTitle></CardHeader>
              <CardContent className="text-2xl font-bold">{fmt(totals.debit)}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex gap-2 items-center"><ArrowDownCircle className="h-4 w-4 text-success" />Créditos</CardTitle></CardHeader>
              <CardContent className="text-2xl font-bold">{fmt(totals.credit)}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex gap-2 items-center"><Wallet className="h-4 w-4 text-primary" />Saldo Período</CardTitle></CardHeader>
              <CardContent className={`text-2xl font-bold ${totals.balance >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(totals.balance)}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Extrato</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Carregando…</TableCell></TableRow>}
                  {!isLoading && rows.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Nenhum movimento no período</TableCell></TableRow>
                  )}
                  {rows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{formatDate(r.entry_date)}</TableCell>
                      <TableCell>
                        <Badge variant={r.kind === 'debit' ? 'destructive' : 'default'}>
                          {r.kind === 'debit' ? 'Débito' : 'Crédito'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs uppercase text-muted-foreground">{r.category}</TableCell>
                      <TableCell className="max-w-[360px] truncate">{r.description}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(r.amount)}</TableCell>
                      <TableCell className={`text-right font-bold ${Number(r.running_balance) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {fmt(Number(r.running_balance))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </PageContainer>
  );
}
