import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import type { PaymentMethod } from '@/types/financial';
import { useAccountsReceivable, useCreateAccountReceivable, useDeleteAccountReceivable } from '@/hooks/financial/useAccountsReceivable';
import { useCreatePaymentRecord } from '@/hooks/financial/usePaymentRecords';
import { useBankAccounts } from '@/hooks/financial/useBankAccounts';
import { useClients } from '@/hooks/commercial/useClients';
import { SettlementDialog, type SettlementTarget } from '@/components/financial/SettlementDialog';
import { AgingList } from '@/components/financial/AgingList';
import { AccountsReceivableSummary } from '@/components/financial/AccountsReceivableSummary';
import { formatBRL } from '@/lib/formatters';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import { CreateReceivableDialog, type ReceivableFormData } from './accounts-receivable/CreateReceivableDialog';
import { ReceivableFilters } from './accounts-receivable/ReceivableFilters';
import { ReceivableTable } from './accounts-receivable/ReceivableTable';
import { ReceivePaymentDialog, type ReceivePaymentForm } from './accounts-receivable/ReceivePaymentDialog';
import { ReceivableDetailsDialog } from './accounts-receivable/ReceivableDetailsDialog';

export default function AccountsReceivable() {
  const { data: accounts = [], isLoading } = useAccountsReceivable();
  const { data: clients = [] } = useClients();
  const { data: bankAccounts = [] } = useBankAccounts();
  const createMutation = useCreateAccountReceivable();
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

  const [formData, setFormData] = useState<ReceivableFormData>({
    description: '', clientId: '', category: '', amount: '', dueDate: '',
    invoiceNumber: '', notes: '', installments: '1',
  });

  const [payForm, setPayForm] = useState<ReceivePaymentForm>({
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

  const resetForm = () => setFormData({ description: '', clientId: '', category: '', amount: '', dueDate: '', invoiceNumber: '', notes: '', installments: '1' });

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

    if (amount <= 0) { toastError('Informe o valor do recebimento'); return; }
    if (amount > openAmount + 0.01) {
      toastError(`Valor maior que o saldo em aberto (${formatBRL(openAmount)})`, undefined, 'Atenção');
      return;
    }
    if (!payForm.bankAccountId) { toastError('Selecione a conta bancária'); return; }

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

  if (isLoading) return <PageLoading message="Carregando contas a receber..." />;

  return (
    <PageContainer>
      <PageHeader title="Contas a Receber" description="Gerencie seus recebíveis e cobranças">
        <CreateReceivableDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          formData={formData}
          setFormData={setFormData}
          clients={clients}
          onSubmit={handleSubmit}
          isPending={createMutation.isPending}
        />
      </PageHeader>

      <AccountsReceivableSummary accounts={accounts} />
      <AgingList accounts={accounts} />

      <ReceivableFilters
        searchTerm={searchTerm} onSearchChange={setSearchTerm}
        statusFilter={statusFilter} onStatusChange={setStatusFilter}
        categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter}
        categories={categories}
        filteredAccounts={filteredAccounts}
      />

      <ReceivableTable
        accounts={filteredAccounts}
        now={now}
        onReceive={openReceiveDialog}
        onView={(a) => { setSelectedAccount(a); setIsDetailOpen(true); }}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      <ReceivePaymentDialog
        open={isReceiveDialogOpen}
        onOpenChange={setIsReceiveDialogOpen}
        account={selectedAccount}
        payForm={payForm}
        setPayForm={setPayForm}
        bankAccounts={bankAccounts}
        onConfirm={handleReceive}
        isPending={createPayment.isPending}
      />

      <ReceivableDetailsDialog open={isDetailOpen} onOpenChange={setIsDetailOpen} account={selectedAccount} />

      <SettlementDialog
        open={!!settlementTarget}
        onOpenChange={(v) => !v && setSettlementTarget(null)}
        target={settlementTarget}
      />
    </PageContainer>
  );
}
