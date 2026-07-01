import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, DollarSign, AlertTriangle, Clock, CheckCircle, Mail, FileText } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { ExportButton } from '@/shared/components/ExportButton';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Card, CardContent } from '@/ui/base/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/ui/base/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Badge } from '@/ui/base/badge';
import { financialCategories } from '@/config/financial';
import { PaymentMethod, AccountReceivable } from '@/types/financial';
import { useAccountsReceivable, useCreateAccountReceivable, useUpdateAccountReceivable, useDeleteAccountReceivable } from '@/hooks/financial/useAccountsReceivable';
import { useCreatePaymentRecord } from '@/hooks/financial/usePaymentRecords';
import { useBankAccounts } from '@/hooks/financial/useBankAccounts';
import { useClients } from '@/hooks/commercial/useClients';
import { SettlementDialog, type SettlementTarget } from '@/components/financial/SettlementDialog';
import { AgingList } from '@/components/financial/AgingList';
import { AccountsReceivableSummary } from '@/components/financial/AccountsReceivableSummary';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';


import { formatBRL, formatDate } from '@/lib/formatters';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import { EmptyState } from '@/shared/components/EmptyState';
const paymentMethods: Record<PaymentMethod, string> = {
  pix: 'PIX', boleto: 'Boleto', credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito', transfer: 'Transferência', cash: 'Dinheiro', check: 'Cheque',
};

export default function AccountsReceivable() {
  const { data: accounts = [], isLoading } = useAccountsReceivable();
  const { data: clients = [] } = useClients();
  const { data: bankAccounts = [] } = useBankAccounts();
  const createMutation = useCreateAccountReceivable();
  const updateMutation = useUpdateAccountReceivable();
  const deleteMutation = useDeleteAccountReceivable();
  const createPayment = useCreatePaymentRecord();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<typeof accounts[0] | null>(null);
  const [settlementTarget, setSettlementTarget] = useState<SettlementTarget | null>(null);

  // Create form
  const [formData, setFormData] = useState({
    description: '', clientId: '', category: '', amount: '', dueDate: '',
    invoiceNumber: '', notes: '', installments: '1',
  });

  // Payment form
  const [payForm, setPayForm] = useState({
    amount: '', interest: '0', penalty: '0', discount: '0',
    paymentMethod: 'pix' as PaymentMethod, bankAccountId: '', notes: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });

  const now = new Date();
  const categories = [...new Set(accounts.map(a => a.category))];

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch =
      account.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || account.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const pendingAccounts = accounts.filter(a => a.status !== 'paid' && a.status !== 'cancelled');
  const summaryData = {
    total: pendingAccounts.reduce((s, a) => s + Number(a.open_amount ?? a.amount), 0),
    pending: accounts.filter(a => a.status === 'pending').reduce((s, a) => s + Number(a.open_amount ?? a.amount), 0),
    overdue: accounts.filter(a => {
      const isOverdue = a.status === 'overdue' || (a.status === 'pending' && new Date(a.due_date) < now);
      return isOverdue;
    }).reduce((s, a) => s + Number(a.open_amount ?? a.amount), 0),
    received: accounts.filter(a => a.status === 'paid').reduce((s, a) => s + Number(a.paid_amount ?? a.amount), 0),
  };

  const handleSubmit = () => {
    if (!formData.description || !formData.clientId || !formData.amount || !formData.dueDate) {
      toastError('Preencha todos os campos obrigatórios');
      return;
    }
    const client = clients.find(c => c.id === formData.clientId);
    const totalAmount = parseFloat(formData.amount);
    const installments = parseInt(formData.installments) || 1;

    if (installments === 1) {
      createMutation.mutate({
        description: formData.description,
        client_name: client?.name || '',
        client_id: formData.clientId,
        category: formData.category || 'Vendas',
        amount: totalAmount,
        original_amount: totalAmount,
        open_amount: totalAmount,
        due_date: formData.dueDate,
        invoice_number: formData.invoiceNumber || null,
        notes: formData.notes || null,
        installment_number: 1,
        total_installments: 1,
      }, { onSuccess: () => { setIsDialogOpen(false); resetForm(); } });
    } else {
      const installmentAmount = Math.round((totalAmount / installments) * 100) / 100;
      const baseDate = new Date(formData.dueDate);

      for (let i = 0; i < installments; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        const isLast = i === installments - 1;
        const amount = isLast ? totalAmount - installmentAmount * (installments - 1) : installmentAmount;

        createMutation.mutate({
          description: `${formData.description} (${i + 1}/${installments})`,
          client_name: client?.name || '',
          client_id: formData.clientId,
          category: formData.category || 'Vendas',
          amount,
          original_amount: amount,
          open_amount: amount,
          due_date: dueDate.toISOString().split('T')[0],
          invoice_number: formData.invoiceNumber || null,
          notes: formData.notes || null,
          installment_number: i + 1,
          total_installments: installments,
        });
      }
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const resetForm = () => setFormData({ description: '', clientId: '', category: '', amount: '', dueDate: '', invoiceNumber: '', notes: '', installments: '1' });

  const openReceiveDialog = (account: typeof accounts[0]) => {
    setSettlementTarget({
      source_type: 'receivable',
      source_id: account.id,
      description: account.description,
      party_name: account.client_name,
      party_id: account.client_id,
      amount_total: Number(account.amount),
      paid_amount: Number(account.paid_amount || 0),
    });
  };

  const handleReceive = () => {
    if (!selectedAccount) return;
    const amount = parseFloat(payForm.amount) || 0;
    const interest = parseFloat(payForm.interest) || 0;
    const penalty = parseFloat(payForm.penalty) || 0;
    const discount = parseFloat(payForm.discount) || 0;
    const totalPaid = amount + interest + penalty - discount;
    const openAmount = Number(selectedAccount.open_amount ?? selectedAccount.amount);

    if (amount <= 0) {
      toastError('Informe o valor do recebimento');
      return;
    }
    if (amount > openAmount + 0.01) {
      toastError(`Valor maior que o saldo em aberto (${formatBRL(openAmount)})`, undefined, 'Atenção');
      return;
    }
    if (!payForm.bankAccountId) {
      toastError('Selecione a conta bancária');
      return;
    }

    // O trigger process_payment_record já atualiza accounts_receivable + financial_ledger automaticamente.

    createPayment.mutate({
      receivable_id: selectedAccount.id,
      payable_id: null,
      amount, interest, penalty, discount, total_paid: totalPaid,
      payment_method: payForm.paymentMethod,
      payment_date: payForm.paymentDate,
      bank_account_id: payForm.bankAccountId,
      notes: payForm.notes || null,
      created_by: null,
    }, {
      onSuccess: () => {
        const isFull = openAmount - amount <= 0.01;
        setIsReceiveDialogOpen(false);
        setSelectedAccount(null);
        toastSuccess('Sucesso', isFull ? 'Título quitado com sucesso' : 'Baixa parcial registrada com sucesso');
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

  if (isLoading) return <PageLoading message="Carregando contas a receber..." />;

  return (
    <PageContainer>
      <PageHeader title="Contas a Receber" description="Gerencie seus recebíveis e cobranças">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Nova Conta</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nova Conta a Receber</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Descrição *</Label>
                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição da conta" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Cliente *</Label>
                  <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{financialCategories.filter(c => c.type === 'income').map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}</SelectContent>
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
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {parseInt(formData.installments) > 1 && formData.amount && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium">Parcelamento: {formData.installments}x de {formatBRL(parseFloat(formData.amount) / parseInt(formData.installments))}</p>
                  <p className="text-muted-foreground">Parcelas com vencimento mensal a partir de {formData.dueDate}</p>
                </div>
              )}
              <div className="grid gap-2">
                <Label>Número da Nota</Label>
                <Input value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} placeholder="NF-0000" />
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Observações adicionais" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <AccountsReceivableSummary accounts={accounts} />


      {/* Aging Summary Bar */}
      <AgingList accounts={accounts} />


      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por descrição, cliente ou documento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="paid">Recebido</SelectItem>
                <SelectItem value="renegotiated">Renegociado</SelectItem>
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
                { key: 'client_name', label: 'Cliente' },
                { key: 'category', label: 'Categoria' },
                { key: 'due_date', label: 'Vencimento', format: (v) => formatDate(v as string) },
                { key: 'amount', label: 'Valor Original', format: (v) => formatBRL(Number(v)) },
                { key: 'open_amount', label: 'Em Aberto', format: (v) => formatBRL(Number(v ?? 0)) },
                { key: 'paid_amount', label: 'Pago', format: (v) => formatBRL(Number(v ?? 0)) },
                { key: 'status', label: 'Status' },
              ]}
              filename="contas_receber"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Original</TableHead>
                <TableHead className="text-right">Em Aberto</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{account.description}</div>
                      {account.invoice_number && <div className="text-xs text-muted-foreground">{account.invoice_number}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{account.client_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{format(new Date(account.due_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      {getAgingBadge(account.due_date, account.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">{formatBRL(Number(account.original_amount ?? account.amount))}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{formatBRL(Number(account.open_amount ?? account.amount))}</TableCell>
                  <TableCell className="text-right text-sm text-success">{formatBRL(Number(account.paid_amount ?? 0))}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {account.total_installments && account.total_installments > 1
                      ? `${account.installment_number}/${account.total_installments}`
                      : '-'}
                  </TableCell>
                  <TableCell><StatusBadge type="payment" status={account.status} /></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {account.status !== 'paid' && account.status !== 'cancelled' && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success" onClick={() => openReceiveDialog(account)} title="Registrar recebimento">
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          {(account.status === 'overdue' || (account.status === 'pending' && new Date(account.due_date) < now)) && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-warning hover:text-warning" title="Enviar cobrança"
                              onClick={() => toastSuccess('Lembrete enviado', `Cobrança enviada para ${account.client_name}`)}>
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedAccount(account); setIsDetailOpen(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(account.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAccounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="p-4">
                    <EmptyState
                      compact
                      title="Nenhuma conta encontrada"
                      description="Ajuste os filtros ou registre um novo lançamento para começar."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Receive Dialog - Professional */}
      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Recebimento</DialogTitle></DialogHeader>
          {selectedAccount && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium">{selectedAccount.description}</p>
                <p className="text-sm text-muted-foreground">{selectedAccount.client_name}</p>
                <div className="mt-2 flex justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Original</p>
                    <p className="font-medium">{formatBRL(Number(selectedAccount.original_amount ?? selectedAccount.amount))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Em Aberto</p>
                    <p className="text-xl font-bold text-primary">{formatBRL(Number(selectedAccount.open_amount ?? selectedAccount.amount))}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Valor Recebido *</Label>
                  <Input type="number" step="0.01" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Juros</Label>
                  <Input type="number" step="0.01" value={payForm.interest} onChange={(e) => setPayForm({ ...payForm, interest: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Multa</Label>
                  <Input type="number" step="0.01" value={payForm.penalty} onChange={(e) => setPayForm({ ...payForm, penalty: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Desconto</Label>
                  <Input type="number" step="0.01" value={payForm.discount} onChange={(e) => setPayForm({ ...payForm, discount: e.target.value })} />
                </div>
              </div>

              <div className="rounded-md border p-3 bg-accent/50">
                <p className="text-xs text-muted-foreground">Total Líquido</p>
                <p className="text-lg font-bold">
                  {formatBRL(
                    (parseFloat(payForm.amount) || 0) + (parseFloat(payForm.interest) || 0) + (parseFloat(payForm.penalty) || 0) - (parseFloat(payForm.discount) || 0)
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Forma de Recebimento *</Label>
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
                  <Label className="text-xs">Data do Recebimento *</Label>
                  <Input type="date" value={payForm.paymentDate} onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Observações</Label>
                <Textarea value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} className="h-16" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceiveDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleReceive} disabled={createPayment.isPending} className="gap-2">
              <CheckCircle className="h-4 w-4" />Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detalhes do Título</DialogTitle></DialogHeader>
          {selectedAccount && (
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-muted-foreground">Descrição</p><p className="font-medium">{selectedAccount.description}</p></div>
                <div><p className="text-muted-foreground">Cliente</p><p className="font-medium">{selectedAccount.client_name}</p></div>
                <div><p className="text-muted-foreground">Categoria</p><p>{selectedAccount.category}</p></div>
                <div><p className="text-muted-foreground">Nota Fiscal</p><p>{selectedAccount.invoice_number || '-'}</p></div>
                <div><p className="text-muted-foreground">Vencimento</p><p>{format(new Date(selectedAccount.due_date), 'dd/MM/yyyy', { locale: ptBR })}</p></div>
                <div><p className="text-muted-foreground">Parcela</p><p>{selectedAccount.total_installments && selectedAccount.total_installments > 1 ? `${selectedAccount.installment_number}/${selectedAccount.total_installments}` : 'Única'}</p></div>
                <div><p className="text-muted-foreground">Valor Original</p><p className="font-medium">{formatBRL(Number(selectedAccount.original_amount ?? selectedAccount.amount))}</p></div>
                <div><p className="text-muted-foreground">Em Aberto</p><p className="font-medium text-primary">{formatBRL(Number(selectedAccount.open_amount ?? selectedAccount.amount))}</p></div>
                <div><p className="text-muted-foreground">Pago</p><p className="text-success">{formatBRL(Number(selectedAccount.paid_amount ?? 0))}</p></div>
                <div><p className="text-muted-foreground">Juros</p><p>{formatBRL(Number(selectedAccount.interest ?? 0))}</p></div>
                <div><p className="text-muted-foreground">Multa</p><p>{formatBRL(Number(selectedAccount.penalty ?? 0))}</p></div>
                <div><p className="text-muted-foreground">Desconto</p><p>{formatBRL(Number(selectedAccount.discount_amount ?? 0))}</p></div>
              </div>
              {selectedAccount.notes && <div><p className="text-muted-foreground">Observações</p><p>{selectedAccount.notes}</p></div>}
            </div>
          )}
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
