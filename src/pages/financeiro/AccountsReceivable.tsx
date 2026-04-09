import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, DollarSign, AlertTriangle, Clock, CheckCircle, Mail, Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/PageLoading';
import { KPICard } from '@/components/shared/KPICard';
import { ExportButton } from '@/components/shared/ExportButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { financialCategories } from '@/config/financial';
import { PaymentStatus, PaymentMethod } from '@/types/financial';
import { useToast } from '@/hooks/use-toast';
import { useAccountsReceivable, useCreateAccountReceivable, useUpdateAccountReceivable, useDeleteAccountReceivable } from '@/hooks/useAccountsReceivable';
import { useClients } from '@/hooks/useClients';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const paymentMethods: Record<PaymentMethod, string> = {
  pix: 'PIX', boleto: 'Boleto', credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito', transfer: 'Transferência', cash: 'Dinheiro',
};

export default function AccountsReceivable() {
  const { toast } = useToast();
  const { data: accounts = [], isLoading } = useAccountsReceivable();
  const { data: clients = [] } = useClients();
  const createMutation = useCreateAccountReceivable();
  const updateMutation = useUpdateAccountReceivable();
  const deleteMutation = useDeleteAccountReceivable();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<typeof accounts[0] | null>(null);
  const [formData, setFormData] = useState({
    description: '', clientId: '', category: '', amount: '', dueDate: '', invoiceNumber: '', notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');

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

  const summaryData = {
    total: accounts.reduce((sum, a) => sum + Number(a.amount), 0),
    pending: accounts.filter(a => a.status === 'pending').reduce((sum, a) => sum + Number(a.amount), 0),
    overdue: accounts.filter(a => a.status === 'overdue').reduce((sum, a) => sum + Number(a.amount), 0),
    received: accounts.filter(a => a.status === 'paid').reduce((sum, a) => sum + Number(a.amount), 0),
  };

  const handleSubmit = () => {
    if (!formData.description || !formData.clientId || !formData.amount || !formData.dueDate) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    const client = clients.find(c => c.id === formData.clientId);
    createMutation.mutate({
      description: formData.description,
      client_name: client?.name || '',
      client_id: formData.clientId,
      category: formData.category || 'Vendas',
      amount: parseFloat(formData.amount),
      due_date: formData.dueDate,
      invoice_number: formData.invoiceNumber || null,
      notes: formData.notes || null,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ description: '', clientId: '', category: '', amount: '', dueDate: '', invoiceNumber: '', notes: '' });
      }
    });
  };

  const handleReceive = () => {
    if (!selectedAccount) return;
    updateMutation.mutate({
      id: selectedAccount.id,
      status: 'paid',
      payment_date: new Date().toISOString(),
      payment_method: paymentMethod,
    }, {
      onSuccess: () => {
        setIsReceiveDialogOpen(false);
        setSelectedAccount(null);
        toast({ title: 'Sucesso', description: 'Recebimento registrado com sucesso' });
      }
    });
  };

  const handleSendReminder = (account: typeof accounts[0]) => {
    toast({ title: 'Lembrete enviado', description: `Lembrete de cobrança enviado para ${account.client_name}` });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isLoading) {
    return <PageLoading message="Carregando contas a receber..." />;
  }

  return (
    <PageContainer>
      <PageHeader title="Contas a Receber" description="Gerencie seus recebíveis e cobranças">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Nova Conta</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nova Conta a Receber</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição da conta" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="client">Cliente *</Label>
                  <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {financialCategories.filter(c => c.type === 'income').map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Valor *</Label>
                  <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0,00" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Vencimento *</Label>
                  <Input id="dueDate" type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoiceNumber">Número da Nota</Label>
                <Input id="invoiceNumber" value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} placeholder="NF-0000" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Observações adicionais" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total a Receber" value={formatCurrency(summaryData.total)} icon={<DollarSign className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Pendente" value={formatCurrency(summaryData.pending)} icon={<Clock className="h-5 w-5" />} accentColor="warning" index={1} />
        <KPICard title="Vencido" value={formatCurrency(summaryData.overdue)} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={2} />
        <KPICard title="Recebido" value={formatCurrency(summaryData.received)} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={3} />
      </div>

      {/* Filters */}
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
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="paid">Recebido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
              </SelectContent>
            </Select>
            <ExportButton
              data={filteredAccounts as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'description', label: 'Descrição' },
                { key: 'client_name', label: 'Cliente' },
                { key: 'category', label: 'Categoria' },
                { key: 'due_date', label: 'Vencimento', format: (v) => new Date(v as string).toLocaleDateString('pt-BR') },
                { key: 'amount', label: 'Valor', format: (v) => formatCurrency(Number(v)) },
                { key: 'status', label: 'Status' },
              ]}
              filename="contas_receber"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
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
                      {account.invoice_number && <div className="text-sm text-muted-foreground">{account.invoice_number}</div>}
                    </div>
                  </TableCell>
                  <TableCell>{account.client_name}</TableCell>
                  <TableCell>{account.category}</TableCell>
                  <TableCell>{format(new Date(account.due_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(Number(account.amount))}</TableCell>
                  <TableCell><StatusBadge type="payment" status={account.status} /></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {account.status !== 'paid' && account.status !== 'cancelled' && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success" onClick={() => { setSelectedAccount(account); setIsReceiveDialogOpen(true); }} title="Registrar recebimento">
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          {account.status === 'overdue' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-warning hover:text-warning" onClick={() => handleSendReminder(account)} title="Enviar lembrete">
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(account.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAccounts.length === 0 && (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Nenhuma conta encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Receive Dialog */}
      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Recebimento</DialogTitle></DialogHeader>
          {selectedAccount && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium">{selectedAccount.description}</p>
                <p className="text-sm text-muted-foreground">{selectedAccount.client_name}</p>
                <p className="mt-2 text-2xl font-bold">{formatCurrency(Number(selectedAccount.amount))}</p>
              </div>
              <div className="grid gap-2">
                <Label>Forma de Recebimento</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(paymentMethods).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceiveDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleReceive} disabled={updateMutation.isPending} className="gap-2">
              <CheckCircle className="h-4 w-4" />Confirmar Recebimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
