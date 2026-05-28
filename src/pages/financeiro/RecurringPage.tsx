import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  FREQUENCY_LABELS,
  RecurringFrequency,
  RecurringKind,
  useCreateRecurring,
  useGenerateRecurringEntries,
  useRecurringList,
  useUpdateRecurringStatus,
} from '@/hooks/useFinancialRecurring';
import { Pause, Play, Plus, RefreshCw, X } from 'lucide-react';
import { format } from 'date-fns';
import { formatNumber } from '@/lib/formatters';

const STATUS_VARIANT: Record<string, any> = {
  active: 'default',
  paused: 'secondary',
  cancelled: 'destructive',
  finished: 'outline',
};

export default function RecurringPage() {
  const [open, setOpen] = useState(false);
  const { data: recurring = [] } = useRecurringList();
  const create = useCreateRecurring();
  const updateStatus = useUpdateRecurringStatus();
  const generate = useGenerateRecurringEntries();

  const [form, setForm] = useState({
    kind: 'payable' as RecurringKind,
    description: '',
    party_name: '',
    amount: 0,
    frequency: 'monthly' as RecurringFrequency,
    start_date: new Date().toISOString().slice(0, 10),
    next_run_date: new Date().toISOString().slice(0, 10),
    adjustment_percent: 0,
    notes: '',
  });

  const totals = {
    active: recurring.filter((r) => r.status === 'active').length,
    monthlyValue: recurring
      .filter((r) => r.status === 'active' && r.frequency === 'monthly')
      .reduce((s, r) => s + Number(r.amount || 0), 0),
  };

  return (
    <PageContainer>
      <PageHeader
        title="🔁 Recorrências Financeiras"
        description="Contratos recorrentes (aluguel, assinaturas, mensalidades) com geração automática e reajuste anual."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => generate.mutate()} disabled={generate.isPending}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Gerar pendentes
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nova recorrência
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova recorrência</DialogTitle>
                  <DialogDescription>
                    Defina contratos que geram contas a pagar ou receber automaticamente.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tipo</Label>
                      <Select
                        value={form.kind}
                        onValueChange={(v: RecurringKind) => setForm({ ...form, kind: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="payable">A Pagar</SelectItem>
                          <SelectItem value="receivable">A Receber</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Frequência</Label>
                      <Select
                        value={form.frequency}
                        onValueChange={(v: RecurringFrequency) => setForm({ ...form, frequency: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(FREQUENCY_LABELS) as RecurringFrequency[]).map((f) => (
                            <SelectItem key={f} value={f}>{FREQUENCY_LABELS[f]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Ex: Aluguel sede"
                    />
                  </div>
                  <div>
                    <Label>{form.kind === 'payable' ? 'Fornecedor' : 'Cliente'}</Label>
                    <Input
                      value={form.party_name}
                      onChange={(e) => setForm({ ...form, party_name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Reajuste anual (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.adjustment_percent}
                        onChange={(e) => setForm({ ...form, adjustment_percent: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Início</Label>
                      <Input
                        type="date"
                        value={form.start_date}
                        onChange={(e) => setForm({ ...form, start_date: e.target.value, next_run_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Próxima geração</Label>
                      <Input
                        type="date"
                        value={form.next_run_date}
                        onChange={(e) => setForm({ ...form, next_run_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={async () => {
                      await create.mutateAsync(form as any);
                      setOpen(false);
                    }}
                    disabled={create.isPending || !form.description || !form.party_name || form.amount <= 0}
                  >
                    Criar recorrência
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Recorrências ativas</p>
            <p className="text-2xl font-bold">{totals.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Compromisso mensal</p>
            <p className="text-2xl font-bold">
              R$ {formatNumber(totals.monthlyValue, 2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total cadastrado</p>
            <p className="text-2xl font-bold">{recurring.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recorrências</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Parte</TableHead>
                <TableHead>Frequência</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Próxima</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recurring.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhuma recorrência cadastrada.
                  </TableCell>
                </TableRow>
              )}
              {recurring.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Badge variant={r.kind === 'receivable' ? 'default' : 'secondary'}>
                      {r.kind === 'receivable' ? 'Receber' : 'Pagar'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{r.description}</TableCell>
                  <TableCell>{r.party_name}</TableCell>
                  <TableCell>{FREQUENCY_LABELS[r.frequency]}</TableCell>
                  <TableCell>R$ {formatNumber(Number(r.amount), 2)}</TableCell>
                  <TableCell>{format(new Date(r.next_run_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.status === 'active' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateStatus.mutate({ id: r.id, status: 'paused' })}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {r.status === 'paused' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateStatus.mutate({ id: r.id, status: 'active' })}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {r.status !== 'cancelled' && r.status !== 'finished' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateStatus.mutate({ id: r.id, status: 'cancelled' })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
