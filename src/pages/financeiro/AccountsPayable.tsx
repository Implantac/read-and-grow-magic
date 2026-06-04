import { useState, useMemo } from 'react';
import { toastError, toastSuccess } from '@/lib/toastHelpers';
import { Plus, Zap } from 'lucide-react';
import { useBatchPayPayables } from '@/hooks/financial/useBatchPay';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/PageLoading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { financialCategories } from '@/config/financial';
import { PaymentMethod } from '@/types/financial';
import { useAccountsPayable, useCreateAccountPayable, useUpdateAccountPayable, useDeleteAccountPayable } from '@/hooks/financial/useAccountsPayable';
import { useCreatePaymentRecord } from '@/hooks/financial/usePaymentRecords';
import { useBankAccounts } from '@/hooks/financial/useBankAccounts';
import { useCostCenters } from '@/hooks/system/useCostCenters';
import { SettlementDialog, type SettlementTarget } from '@/components/financeiro/SettlementDialog';
import { formatBRL } from '@/lib/formatters';
import { AccountsPayableSummary } from '@/components/financeiro/AccountsPayableSummary';
import { AccountsPayableTable } from '@/components/financeiro/AccountsPayableTable';
import { AccountsPayableFilters } from '@/components/financeiro/AccountsPayableFilters';

export default function AccountsPayable() {
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
  const [isBatchPayOpen, setIsBatchPayOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [settlementTarget, setSettlementTarget] = useState<SettlementTarget | null>(null);

  const [formData, setFormData] = useState({
    description: '', supplier: '', category: '', amount: '', dueDate: '',
    invoiceNumber: '', notes: '', installments: '1', costCenterId: '', expenseType: 'variable',
  });
  
  const [batchForm, setBatchForm] = useState({
    paymentMethod: 'pix' as PaymentMethod, bankAccountId: '', notes: '',
  });

  const categories = useMemo(() => [...new Set(accounts.map(a => a.category))], [accounts]);

  const filteredAccounts = useMemo(() => accounts.filter(account => {
    const matchesSearch =
      account.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || account.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  }), [accounts, searchTerm, statusFilter, categoryFilter]);

  const summaryData = useMemo(() => {
    const now = new Date();
    const pending = accounts.filter(a => a.status === 'pending');
    return {
      total: accounts.filter(a => a.status !== 'paid' && a.status !== 'cancelled').reduce((s, a) => s + Number(a.open_amount ?? a.amount), 0),
      pending: pending.reduce((s, a) => s + Number(a.open_amount ?? a.amount), 0),
      pendingCount: pending.length,
      overdue: accounts.filter(a => a.status === 'overdue' || (a.status === 'pending' && new Date(a.due_date) < now)).reduce((s, a) => s + Number(a.open_amount ?? a.amount), 0),
      paid: accounts.filter(a => a.status === 'paid').reduce((s, a) => s + Number(a.paid_amount ?? a.amount), 0),
    };
  }, [accounts]);

  const handleSubmit = () => {
    if (!formData.description || !formData.supplier || !formData.amount || !formData.dueDate) {
      toastError('Preencha todos os campos obrigatórios');
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

  const openPayDialog = (account: any) => {
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

  const handleBatchPay = () => {
    if (!batchForm.bankAccountId) {
      toastError('Selecione a conta bancária');
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

      <AccountsPayableSummary summary={summaryData} />

      <Card>
        <CardContent className="pt-6">
          <AccountsPayableFilters 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            categories={categories}
            filteredData={filteredAccounts}
          />

          <div className="mt-6">
            <AccountsPayableTable 
              accounts={filteredAccounts}
              selectedIds={selectedIds}
              onToggleOne={toggleOne}
              onToggleAll={toggleAll}
              allSelected={allSelected}
              onPay={openPayDialog}
              onDelete={(id) => deleteMutation.mutate(id)}
              onView={(account) => setSelectedAccount(account)}
            />
          </div>
        </CardContent>
      </Card>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full border bg-background px-6 py-3 shadow-xl">
          <span className="text-sm font-medium">{selectedIds.size} selecionados ({formatBRL(selectableAccounts.filter(a => selectedIds.has(a.id)).reduce((s, a) => s + Number(a.open_amount ?? a.amount), 0))})</span>
          <Dialog open={isBatchPayOpen} onOpenChange={setIsBatchPayOpen}>
            <DialogTrigger asChild><Button size="sm" className="gap-2"><Zap className="h-4 w-4" />Pagar Lote</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Pagamento em Lote ({selectedIds.size} títulos)</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Conta Bancária</Label>
                  <Select value={batchForm.bankAccountId} onValueChange={(v) => setBatchForm({ ...batchForm, bankAccountId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                    <SelectContent>{bankAccounts.map(ba => <SelectItem key={ba.id} value={ba.id}>{ba.name} ({formatBRL(ba.balance)})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Forma de Pagamento</Label>
                  <Select value={batchForm.paymentMethod} onValueChange={(v) => setBatchForm({ ...batchForm, paymentMethod: v as PaymentMethod })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="transfer">Transferência</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBatchPayOpen(false)}>Cancelar</Button>
                <Button onClick={handleBatchPay} disabled={batchPay.isPending}>Confirmar Pagamento</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {settlementTarget && (
        <SettlementDialog 
          open={!!settlementTarget} 
          onOpenChange={(open) => !open && setSettlementTarget(null)} 
          target={settlementTarget} 
        />
      )}
    </PageContainer>
  );
}

