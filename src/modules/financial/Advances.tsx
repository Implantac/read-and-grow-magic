import { useMemo, useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/ui/base/dialog';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Wallet, TrendingDown, TrendingUp, Sparkles } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';
import { useFinancialAdvances, type FinancialAdvanceRow } from '@/hooks/financial/useFinancialAdvances';
import { useUseAdvance } from '@/hooks/financial/useFinancialSettlements';
import { useAccountsReceivable } from '@/hooks/financial/useAccountsReceivable';
import { useAccountsPayable } from '@/hooks/financial/useAccountsPayable';
import { NewAdvanceDialog } from '@/components/financial/NewAdvanceDialog';
import { format } from 'date-fns';

import { formatBRL } from '@/lib/formatters';
export default function Advances() {
  const { data: advances = [], isLoading } = useFinancialAdvances();
  const { data: receivables = [] } = useAccountsReceivable();
  const { data: payables = [] } = useAccountsPayable();
  const useAdv = useUseAdvance();

  const [applyAdvance, setApplyAdvance] = useState<FinancialAdvanceRow | null>(null);
  const [targetId, setTargetId] = useState('');
  const [applyAmount, setApplyAmount] = useState('');

  const totals = useMemo(() => {
    const liabilities = advances.filter(a => a.party_type === 'client');
    const assets = advances.filter(a => a.party_type === 'supplier');
    return {
      clientRemaining: liabilities.reduce((s, a) => s + Number(a.remaining_amount), 0),
      supplierRemaining: assets.reduce((s, a) => s + Number(a.remaining_amount), 0),
      activeCount: advances.filter(a => Number(a.remaining_amount) > 0).length,
    };
  }, [advances]);

  if (isLoading) return <PageLoading message="Carregando adiantamentos..." />;

  const openApply = (adv: FinancialAdvanceRow) => {
    setApplyAdvance(adv);
    setTargetId('');
    setApplyAmount(String(adv.remaining_amount));
  };

  const targetList = applyAdvance?.party_type === 'client'
    ? receivables.filter((r: any) => r.status !== 'paid' && r.status !== 'cancelled' && r.client_id === applyAdvance.client_id)
    : payables.filter((p: any) => p.status !== 'paid' && p.status !== 'cancelled');

  const submitApply = () => {
    if (!applyAdvance || !targetId) return;
    const amt = Number(applyAmount.replace(',', '.')) || 0;
    if (amt <= 0 || amt > Number(applyAdvance.remaining_amount)) return;
    useAdv.mutate(
      {
        advanceId: applyAdvance.id,
        sourceType: applyAdvance.party_type === 'client' ? 'receivable' : 'payable',
        sourceId: targetId,
        amount: amt,
      },
      { onSuccess: () => setApplyAdvance(null) }
    );
  };

  const renderTable = (rows: FinancialAdvanceRow[]) => (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>{rows[0]?.party_type === 'client' ? 'Cliente' : 'Fornecedor / Origem'}</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-right">Usado</TableHead>
            <TableHead className="text-right">Disponível</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={7}><EmptyState compact icon={Wallet} title="Nenhum adiantamento" description="Registre adiantamentos recebidos ou pagos para aplicá-los em títulos abertos." /></TableCell></TableRow>
          ) : rows.map(a => {
            const remaining = Number(a.remaining_amount);
            return (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs">{format(new Date(a.received_date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{a.party_name}</TableCell>
                <TableCell className="text-right">{formatBRL(Number(a.amount))}</TableCell>
                <TableCell className="text-right">{formatBRL(Number(a.used_amount))}</TableCell>
                <TableCell className="text-right font-medium">{formatBRL(remaining)}</TableCell>
                <TableCell>
                  <Badge variant={a.status === 'consumed' ? 'secondary' : a.status === 'partial' ? 'outline' : 'default'}>
                    {a.status === 'consumed' ? 'Consumido' : a.status === 'partial' ? 'Parcial' : 'Disponível'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" disabled={remaining <= 0} onClick={() => openApply(a)}>
                    Aplicar
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        title="Adiantamentos"
        description="Controle de adiantamentos de clientes (passivo) e a fornecedores (ativo). Toda movimentação passa pelo ledger."
      >
        <NewAdvanceDialog />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <KPICard index={0} title="Saldo a compensar (clientes)" value={formatBRL(totals.clientRemaining)}
          icon={<TrendingDown className="h-5 w-5" />} accentColor="warning" />
        <KPICard index={1} title="Crédito com fornecedores" value={formatBRL(totals.supplierRemaining)}
          icon={<TrendingUp className="h-5 w-5" />} accentColor="success" />
        <KPICard index={2} title="Adiantamentos ativos" value={String(totals.activeCount)}
          icon={<Wallet className="h-5 w-5" />} accentColor="primary" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Gestão de adiantamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="client">
            <TabsList>
              <TabsTrigger value="client">De clientes</TabsTrigger>
              <TabsTrigger value="supplier">A fornecedores</TabsTrigger>
            </TabsList>
            <TabsContent value="client" className="mt-4">
              {renderTable(advances.filter(a => a.party_type === 'client'))}
            </TabsContent>
            <TabsContent value="supplier" className="mt-4">
              {renderTable(advances.filter(a => a.party_type === 'supplier'))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!applyAdvance} onOpenChange={(o) => !o && setApplyAdvance(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar adiantamento</DialogTitle>
            <DialogDescription>
              Compensa o saldo do adiantamento contra um título em aberto. Disponível: {applyAdvance && formatBRL(Number(applyAdvance.remaining_amount))}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{applyAdvance?.party_type === 'client' ? 'Conta a receber' : 'Conta a pagar'}</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger><SelectValue placeholder="Selecione um título em aberto" /></SelectTrigger>
                <SelectContent>
                  {targetList.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.description} — {formatBRL(Number(t.open_amount ?? t.amount))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {targetList.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum título em aberto para esta entidade.</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Valor a aplicar</Label>
              <Input type="number" step="0.01" min="0" value={applyAmount} onChange={e => setApplyAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyAdvance(null)}>Cancelar</Button>
            <Button onClick={submitApply} disabled={!targetId || useAdv.isPending}>
              {useAdv.isPending ? 'Aplicando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
