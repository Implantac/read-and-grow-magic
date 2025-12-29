import { useState } from 'react';
import { Plus, Filter, Download, Search, Eye, Edit, Trash2, DollarSign, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { mockAccountsPayable, financialCategories } from '@/data/financialMockData';
import { AccountPayable, PaymentStatus, PaymentMethod } from '@/types/financial';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<PaymentStatus, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
  paid: { label: 'Pago', color: 'success' },
  pending: { label: 'Pendente', color: 'warning' },
  overdue: { label: 'Vencido', color: 'error' },
  cancelled: { label: 'Cancelado', color: 'default' },
};

const paymentMethods: Record<PaymentMethod, string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  transfer: 'Transferência',
  cash: 'Dinheiro',
};

export default function AccountsPayable() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<AccountPayable[]>(mockAccountsPayable);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountPayable | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    supplier: '',
    category: '',
    amount: '',
    dueDate: '',
    invoiceNumber: '',
    notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');

  const categories = [...new Set(accounts.map(a => a.category))];

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = 
      account.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || account.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const summaryData = {
    total: accounts.reduce((sum, a) => sum + a.amount, 0),
    pending: accounts.filter(a => a.status === 'pending').reduce((sum, a) => sum + a.amount, 0),
    overdue: accounts.filter(a => a.status === 'overdue').reduce((sum, a) => sum + a.amount, 0),
    paid: accounts.filter(a => a.status === 'paid').reduce((sum, a) => sum + a.amount, 0),
  };

  const handleSubmit = () => {
    if (!formData.description || !formData.supplier || !formData.amount || !formData.dueDate) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const newAccount: AccountPayable = {
      id: `AP${String(accounts.length + 1).padStart(3, '0')}`,
      description: formData.description,
      supplier: formData.supplier,
      category: formData.category || 'Fornecedores',
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate,
      status: 'pending',
      invoiceNumber: formData.invoiceNumber,
      notes: formData.notes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setAccounts([newAccount, ...accounts]);
    setIsDialogOpen(false);
    setFormData({ description: '', supplier: '', category: '', amount: '', dueDate: '', invoiceNumber: '', notes: '' });
    toast({ title: 'Sucesso', description: 'Conta a pagar cadastrada com sucesso' });
  };

  const handlePay = () => {
    if (!selectedAccount) return;

    setAccounts(accounts.map(a => 
      a.id === selectedAccount.id 
        ? { ...a, status: 'paid' as PaymentStatus, paymentDate: new Date().toISOString().split('T')[0], paymentMethod }
        : a
    ));
    setIsPayDialogOpen(false);
    setSelectedAccount(null);
    toast({ title: 'Sucesso', description: 'Pagamento registrado com sucesso' });
  };

  const handleDelete = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
    toast({ title: 'Sucesso', description: 'Conta removida com sucesso' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contas a Pagar</h1>
          <p className="text-muted-foreground">Gerencie suas obrigações financeiras</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Conta a Pagar</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da conta"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="supplier">Fornecedor *</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Nome do fornecedor"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {financialCategories.filter(c => c.type === 'expense').map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Valor *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Vencimento *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoiceNumber">Número da Nota/Documento</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  placeholder="NF-0000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações adicionais"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total a Pagar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryData.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(summaryData.pending)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vencido</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(summaryData.overdue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(summaryData.paid)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição, fornecedor ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
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
                <TableHead>Fornecedor</TableHead>
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
                      {account.invoiceNumber && (
                        <div className="text-sm text-muted-foreground">{account.invoiceNumber}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{account.supplier}</TableCell>
                  <TableCell>{account.category}</TableCell>
                  <TableCell>
                    {format(new Date(account.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(account.amount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge type="payment" status={account.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {account.status !== 'paid' && account.status !== 'cancelled' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-success hover:text-success"
                          onClick={() => {
                            setSelectedAccount(account);
                            setIsPayDialogOpen(true);
                          }}
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAccounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nenhuma conta encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pay Dialog */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium">{selectedAccount.description}</p>
                <p className="text-sm text-muted-foreground">{selectedAccount.supplier}</p>
                <p className="mt-2 text-2xl font-bold">{formatCurrency(selectedAccount.amount)}</p>
              </div>
              <div className="grid gap-2">
                <Label>Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
            <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handlePay} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
