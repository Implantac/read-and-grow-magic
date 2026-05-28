import { useState } from 'react';
import { Plus, Search, Eye, Trash2, DollarSign, AlertTriangle, Clock, CheckCircle, Zap } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useBatchPayPayables } from '@/hooks/useBatchPay';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/PageLoading';
import { KPICard } from '@/components/shared/KPICard';
import { ExportButton } from '@/components/shared/ExportButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { financialCategories } from '@/config/financial';
import { PaymentMethod } from '@/types/financial';
import { useToast } from '@/hooks/use-toast';
import { useAccountsPayable, useCreateAccountPayable, useUpdateAccountPayable, useDeleteAccountPayable } from '@/hooks/useAccountsPayable';
import { useCreatePaymentRecord } from '@/hooks/usePaymentRecords';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCostCenters } from '@/hooks/useCostCenters';
import { SettlementDialog, type SettlementTarget } from '@/components/financeiro/SettlementDialog';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { formatBRL, formatDate } from '@/lib/formatters';
const paymentMethods: Record<PaymentMethod, string> = {
  pix: 'PIX', boleto: 'Boleto', credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito', transfer: 'Transferência', cash: 'Dinheiro', check: 'Cheque',
};

const formatCurrency = (value: number) =>
  formatBRL(value);

export default function AccountsPayable() {
  const { toast } = useToast();
  const { data: accounts = [], isLoading } = useAccountsPayable();
  const { data: bankAccounts = [] } = useBankAccounts();
  const { data: costCenters = [] } = useCostCenters();
  const createMutation = useCreateAccountPayable();
  const updateMutation = useUpdateAccountPayable();
  const deleteMutation = useDeleteAccountPayable();
  const createPayment = useCreatePaymentRecord();
  const batchPay = useBatchPayPayables();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [isBatchPayOpen, setIsBatchPayOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<typeof accounts[0] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [settlementTarget, setSettlementTarget] = useState<SettlementTarget | null>(null);

  const [formData, setFormData] = useState({
    description: '', supplier: '', category: '', amount: '', dueDate: '',
    invoiceNumber: '', notes: '', installments: '1', costCenterId: '', expenseType: 'variable',
  });
  const [payForm, setPayForm] = useState({
    amount: '', interest: '0', penalty: '0', discount: '0',
    paymentMethod: 'pix' as PaymentMethod, bankAccountId: '', notes: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });
  const [batchForm, setBatchForm] = useState({
    paymentMethod: 'pix' as PaymentMethod, bankAccountId: '', notes: '',
  });

  const now = new Date();
  const categories = [...new Set(accounts.map(a => a.category))];

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch =
      account.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || account.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const pendingAccounts = accounts.filter(a => a.status !== 'paid' && a.status !== 'cancelled');
  const summaryData = {
    total: pendingAccounts.reduce((s, a) => s + Number(a.open_amount ?? a.amount), 0),
    pending: accounts.filter(a => a.status === 'pending').reduce((s, a) => s + Number(a.open_amount ?? a.amount), 0),
    overdue: accounts.filter(a => a.status === 'overdue' || (a.status === 'pending' && new Date(a.due_date) < now)).reduce((s, a) => s + Number(a.open_amount ?? a.amount), 0),
    paid: accounts.filter(a => a.status === 'paid').reduce((s, a) => s + Number(a.paid_amount ?? a.amount), 0),
  };

  const handleSubmit = () => {
    if (!formData.description || !formData.supplier || !formData.amount || !formData.dueDate) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    const totalAmount = parseFloat(formData.amount);
    const installments = parseInt(formData.installments) || 1;
    const installmentAmount = Math.round((totalAmount / installments) * 100) / 100;
    const baseDate = new Date(formData.dueDate);

    for (let i = 0; i < installments; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      const isLast = i === installments - 1;
      const amount = isLast ? totalAmount - installmentAmount * (installments - 1) : installmentAmount;

      createMutation.mutate({
        description: installments > 1 ? `${formData.description} (${i + 1}/${installments})` : formData.description,
        supplier: formData.supplier,
        category: formData.category || 'Fornecedores',
        amount,
        original_amount: amount,
        open_amount: amount,
        due_date: dueDate.toISOString().split('T')[0],
        invoice_number: formData.invoiceNumber || null,
        notes: formData.notes || null,
        installment_number: i + 1,
        total_installments: installments,
        cost_center_id: formData.costCenterId || null,
        expense_type: formData.expenseType,
      });
    }
    setIsDialogOpen(false);
    setFormData({ description: '', supplier: '', category: '', amount: '', dueDate: '', invoiceNumber: '', notes: '', installments: '1', costCenterId: '', expenseType: 'variable' });
  };

  const openPayDialog = (account: typeof accounts[0]) => {
    setSettlementTarget({
      source_type: 'payable',
      source_id: account.id,
      description: account.description,
      party_name: account.supplier,
      party_id: null,
      amount_total: Number(account.amount),
      paid_amount: Number(account.paid_amount || 0),
    });
  };

  const handlePay = () => {
    if (!selectedAccount) return;
    const amount = parseFloat(payForm.amount) || 0;
    const interest = parseFloat(payForm.interest) || 0;
    const penalty = parseFloat(payForm.penalty) || 0;
    const discount = parseFloat(payForm.discount) || 0;
    const totalPaid = amount + interest + penalty - discount;
    const openAmount = Number(selectedAccount.open_amount ?? selectedAccount.amount);

    if (amount <= 0) {
      toast({ title: 'Erro', description: 'Informe o valor do pagamento', variant: 'destructive' });
      return;
    }
    if (amount > openAmount + 0.01) {
      toast({ title: 'Atenção', description: `Valor maior que o saldo em aberto (${formatCurrency(openAmount)})`, variant: 'destructive' });
      return;
    }
    if (!payForm.bankAccountId) {
      toast({ title: 'Erro', description: 'Selecione a conta bancária', variant: 'destructive' });
      return;
    }

    // O trigger process_payment_record já atualiza accounts_payable + financial_ledger automaticamente.
    // Não duplicar UPDATE no cliente.
    createPayment.mutate({
      payable_id: selectedAccount.id,
      receivable_id: null,
      amount, interest, penalty, discount, total_paid: totalPaid,
      payment_method: payForm.paymentMethod,
      payment_date: payForm.paymentDate,
      bank_account_id: payForm.bankAccountId,
      notes: payForm.notes || null,
      created_by: null,
    }, {
      onSuccess: () => {
        const isFull = openAmount - amount <= 0.01;
        setIsPayDialogOpen(false);
        setSelectedAccount(null);
        toast({ title: 'Sucesso', description: isFull ? 'Título quitado' : 'Baixa parcial registrada' });
      }
    });
  };

  const getDaysOverdue = (dueDate: string) => {
    const days = differenceInDays(now, new Date(dueDate));
    return days > 0 ? days : 0;
  };

  const getAgingBadge = (dueDate: string, status: string) => {
    if (status === 'paid' || status === 'cancelled') return null;
    const days = getDaysOverdue(dueDate);
    if (days === 0) return null;
    if (days <= 7) return <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10 text-xs">{days}d</Badge>;
    if (days <= 30) return <Badge variant="outline" className="text-warning border-warning/50 bg-warning/20 text-xs">{days}d</Badge>;
    return <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5 text-xs">{days}d</Badge>;
  };

  const selectableAccounts = filteredAccounts.filter(a => a.status !== 'paid' && a.status !== 'cancelled');
  const selectableIds = selectableAccounts.map(a => a.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every(id => selectedIds.has(id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(selectableIds));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };
  const selectedTotal = selectableAccounts
    .filter(a => selectedIds.has(a.id))
    .reduce((s, a) => s + Number(a.open_amount ?? a.amount), 0);

  const handleBatchPay = () => {
    if (!batchForm.bankAccountId) {
      toast({ title: 'Erro', description: 'Selecione a conta bancária', variant: 'destructive' });
      return;
    }
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    batchPay.mutate(
      { ids, bank_account_id: batchForm.bankAccountId, payment_method: batchForm.paymentMethod, notes: batchForm.notes || undefined },
      { onSuccess: () => { setIsBatchPayOpen(false); setSelectedIds(new Set()); setBatchForm({ paymentMethod: 'pix', bankAccountId: '', notes: '' }); } }
    );
  };

  if (isLoading) return <PageLoading message="Carregando contas a pagar..." />;

  return (
    <PageContainer>
      <PageHeader title="Contas a Pagar" description="Gerencie suas obrigações financeiras">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Nova Conta</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nova Conta a Pagar</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Descrição *</Label>
                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição da conta" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Fornecedor *</Label>
                  <Input value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} placeholder="Nome do fornecedor" />
                </div>
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{financialCategories.filter(c => c.type === 'expense').map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Valor Total *</Label>
                  <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0,00" />
                </div>
                <div className="grid gap-2">
                  <Label>Vencimento *</Label>
                  <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Parcelas</Label>
                  <Select value={formData.installments} onValueChange={(v) => setFormData({ ...formData, installments: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Centro de Custo</Label>
                  <Select value={formData.costCenterId} onValueChange={(v) => setFormData({ ...formData, costCenterId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{costCenters.map(cc => <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Tipo de Despesa</Label>
                  <Select value={formData.expenseType} onValueChange={(v) => setFormData({ ...formData, expenseType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixa</SelectItem>
                      <SelectItem value="variable">Variável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Número da Nota/Documento</Label>
                <Input value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} placeholder="NF-0000" />
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total em Aberto" value={formatCurrency(summaryData.total)} icon={<DollarSign className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="A Vencer" value={formatCurrency(summaryData.pending)} subtitle={`${accounts.filter(a => a.status === 'pending').length} títulos`} icon={<Clock className="h-5 w-5" />} accentColor="warning" index={1} />
        <KPICard title="Vencido" value={formatCurrency(summaryData.overdue)} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={2} />
        <KPICard title="Pago" value={formatCurrency(summaryData.paid)} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={3} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por descrição, fornecedor ou documento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
            <ExportButton
              data={filteredAccounts as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'description', label: 'Descrição' },
                { key: 'supplier', label: 'Fornecedor' },
                { key: 'category', label: 'Categoria' },
                { key: 'due_date', label: 'Vencimento', format: (v) => formatDate(v as string) },
                { key: 'amount', label: 'Valor Original', format: (v) => formatCurrency(Number(v)) },
                { key: 'open_amount', label: 'Em Aberto', format: (v) => formatCurrency(Number(v ?? 0)) },
                { key: 'status', label: 'Status' },
              ]}
              filename="contas_pagar"
            />
          </div>
        </CardContent>
      </Card>

      {selectedIds.size > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-3 py-3">
            <div className="text-sm">
              <span className="font-semibold">{selectedIds.size}</span> selecionado(s) · Total{' '}
              <span className="font-semibold text-primary">{formatCurrency(selectedTotal)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Limpar</Button>
              <Button size="sm" className="gap-2" onClick={() => setIsBatchPayOpen(true)}>
                <Zap className="h-4 w-4" />Pagar em Lote
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Selecionar tudo" />
                </TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Original</TableHead>
                <TableHead className="text-right">Em Aberto</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => {
                const selectable = account.status !== 'paid' && account.status !== 'cancelled';
                return (
                <TableRow key={account.id} data-state={selectedIds.has(account.id) ? 'selected' : undefined}>
                  <TableCell>
                    {selectable && (
                      <Checkbox
                        checked={selectedIds.has(account.id)}
                        onCheckedChange={() => toggleOne(account.id)}
                        aria-label="Selecionar conta"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{account.description}</div>
                      {account.invoice_number && <div className="text-xs text-muted-foreground">{account.invoice_number}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{account.supplier}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{format(new Date(account.due_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      {getAgingBadge(account.due_date, account.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">{formatCurrency(Number(account.original_amount ?? account.amount))}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{formatCurrency(Number(account.open_amount ?? account.amount))}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {account.total_installments && account.total_installments > 1 ? `${account.installment_number}/${account.total_installments}` : '-'}
                  </TableCell>
                  <TableCell><StatusBadge type="payment" status={account.status} /></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {selectable && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success" onClick={() => openPayDialog(account)}>
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(account.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )})}
              {filteredAccounts.length === 0 && (
                <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted-foreground">Nenhuma conta encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pay Dialog */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Pagamento</DialogTitle></DialogHeader>
          {selectedAccount && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium">{selectedAccount.description}</p>
                <p className="text-sm text-muted-foreground">{selectedAccount.supplier}</p>
                <div className="mt-2 flex justify-between">
                  <div><p className="text-xs text-muted-foreground">Original</p><p className="font-medium">{formatCurrency(Number(selectedAccount.original_amount ?? selectedAccount.amount))}</p></div>
                  <div className="text-right"><p className="text-xs text-muted-foreground">Em Aberto</p><p className="text-xl font-bold text-primary">{formatCurrency(Number(selectedAccount.open_amount ?? selectedAccount.amount))}</p></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label className="text-xs">Valor Pago *</Label><Input type="number" step="0.01" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label className="text-xs">Juros</Label><Input type="number" step="0.01" value={payForm.interest} onChange={(e) => setPayForm({ ...payForm, interest: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label className="text-xs">Multa</Label><Input type="number" step="0.01" value={payForm.penalty} onChange={(e) => setPayForm({ ...payForm, penalty: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label className="text-xs">Desconto</Label><Input type="number" step="0.01" value={payForm.discount} onChange={(e) => setPayForm({ ...payForm, discount: e.target.value })} /></div>
              </div>

              <div className="rounded-md border p-3 bg-accent/50">
                <p className="text-xs text-muted-foreground">Total Líquido</p>
                <p className="text-lg font-bold">{formatCurrency((parseFloat(payForm.amount) || 0) + (parseFloat(payForm.interest) || 0) + (parseFloat(payForm.penalty) || 0) - (parseFloat(payForm.discount) || 0))}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Forma de Pagamento *</Label>
                  <Select value={payForm.paymentMethod} onValueChange={(v) => setPayForm({ ...payForm, paymentMethod: v as PaymentMethod })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(paymentMethods).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Conta Bancária *</Label>
                  <Select value={payForm.bankAccountId} onValueChange={(v) => setPayForm({ ...payForm, bankAccountId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{bankAccounts.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Data do Pagamento *</Label>
                  <Input type="date" value={payForm.paymentDate} onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-1.5"><Label className="text-xs">Observações</Label><Textarea value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} className="h-16" /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handlePay} disabled={createPayment.isPending} className="gap-2"><CheckCircle className="h-4 w-4" />Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Pay Dialog */}
      <Dialog open={isBatchPayOpen} onOpenChange={setIsBatchPayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Pagar em Lote</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Títulos selecionados</p>
                  <p className="text-2xl font-bold">{selectedIds.size}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total a pagar</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(selectedTotal)}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Forma de Pagamento *</Label>
              <Select value={batchForm.paymentMethod} onValueChange={(v) => setBatchForm({ ...batchForm, paymentMethod: v as PaymentMethod })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(paymentMethods).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Conta Bancária *</Label>
              <Select value={batchForm.bankAccountId} onValueChange={(v) => setBatchForm({ ...batchForm, bankAccountId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{bankAccounts.map(b => <SelectItem key={b.id} value={b.id}>{b.name} — {formatCurrency(Number(b.balance))}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Observações</Label>
              <Textarea value={batchForm.notes} onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })} className="h-16" placeholder="Opcional" />
            </div>

            <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
              Ao confirmar, todos os títulos selecionados serão quitados pelo valor em aberto na conta escolhida.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBatchPayOpen(false)}>Cancelar</Button>
            <Button onClick={handleBatchPay} disabled={batchPay.isPending} className="gap-2">
              <Zap className="h-4 w-4" />Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SettlementDialog
        open={!!settlementTarget}
        onOpenChange={(v) => !v && setSettlementTarget(null)}
        target={settlementTarget}
      />
    </PageContainer>
  );
}
