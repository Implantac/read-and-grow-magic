import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ExportButton } from '@/components/shared/ExportButton';
import {
  CheckCircle2, XCircle, AlertTriangle, Search, Filter, Link2, Unlink, RefreshCw,
  ArrowUpRight, ArrowDownRight, Building2, Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ReconciliationStatus = 'reconciled' | 'pending' | 'divergent';

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  bankReference: string;
  status: ReconciliationStatus;
  matchedEntryId?: string;
}

interface SystemEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  reference: string;
  category: string;
  status: ReconciliationStatus;
  matchedBankId?: string;
}

const mockBankTransactions: BankTransaction[] = [
  { id: 'BK001', date: '2024-01-02', description: 'TED RECEBIDA - TECH SOLUTIONS', amount: 12500.00, type: 'credit', bankReference: 'TED-89012', status: 'reconciled', matchedEntryId: 'SYS001' },
  { id: 'BK002', date: '2024-01-03', description: 'PAG FORNEC - ABC LTDA', amount: 8000.00, type: 'debit', bankReference: 'PAG-45678', status: 'reconciled', matchedEntryId: 'SYS002' },
  { id: 'BK003', date: '2024-01-05', description: 'FOLHA PAGAMENTO JAN/24', amount: 125000.00, type: 'debit', bankReference: 'FOL-001', status: 'reconciled', matchedEntryId: 'SYS003' },
  { id: 'BK004', date: '2024-01-08', description: 'PIX RECEBIDO - COMERCIO ABC', amount: 8900.00, type: 'credit', bankReference: 'PIX-12345', status: 'pending' },
  { id: 'BK005', date: '2024-01-10', description: 'DEBITO ALUGUEL', amount: 8500.00, type: 'debit', bankReference: 'DEB-AUTO-001', status: 'reconciled', matchedEntryId: 'SYS005' },
  { id: 'BK006', date: '2024-01-12', description: 'PIX RECEBIDO - LOJA EPSILON', amount: 3200.00, type: 'credit', bankReference: 'PIX-23456', status: 'reconciled', matchedEntryId: 'SYS006' },
  { id: 'BK007', date: '2024-01-14', description: 'TED RECEBIDA - INDUSTRIA BETA', amount: 11800.00, type: 'credit', bankReference: 'TED-34567', status: 'divergent' },
  { id: 'BK008', date: '2024-01-15', description: 'DARF IMPOSTOS', amount: 5200.00, type: 'debit', bankReference: 'DARF-2024-01', status: 'reconciled', matchedEntryId: 'SYS008' },
  { id: 'BK009', date: '2024-01-18', description: 'TED RECEBIDA - CONSULTORIA', amount: 15000.00, type: 'credit', bankReference: 'TED-56789', status: 'pending' },
  { id: 'BK010', date: '2024-01-20', description: 'PAG MANUTENCAO EQUIP', amount: 3500.00, type: 'debit', bankReference: 'PAG-67890', status: 'pending' },
  { id: 'BK011', date: '2024-01-22', description: 'TED RECEBIDA - DIST DELTA', amount: 18750.00, type: 'credit', bankReference: 'TED-78901', status: 'pending' },
  { id: 'BK012', date: '2024-01-25', description: 'TARIFA BANCARIA', amount: 89.50, type: 'debit', bankReference: 'TAR-JAN-01', status: 'divergent' },
];

const mockSystemEntries: SystemEntry[] = [
  { id: 'SYS001', date: '2024-01-02', description: 'Recebimento - NF-2024-0099', amount: 12500.00, type: 'income', reference: 'AR-099', category: 'Vendas', status: 'reconciled', matchedBankId: 'BK001' },
  { id: 'SYS002', date: '2024-01-03', description: 'Pagamento fornecedor - ABC Ltda', amount: 8000.00, type: 'expense', reference: 'AP-045', category: 'Fornecedores', status: 'reconciled', matchedBankId: 'BK002' },
  { id: 'SYS003', date: '2024-01-05', description: 'Folha de pagamento', amount: 125000.00, type: 'expense', reference: 'AP004', category: 'Folha', status: 'reconciled', matchedBankId: 'BK003' },
  { id: 'SYS004', date: '2024-01-08', description: 'Recebimento - NF-2024-0100', amount: 25000.00, type: 'income', reference: 'AR-100', category: 'Vendas', status: 'pending' },
  { id: 'SYS005', date: '2024-01-10', description: 'Aluguel do galpão', amount: 8500.00, type: 'expense', reference: 'AP002', category: 'Aluguel', status: 'reconciled', matchedBankId: 'BK005' },
  { id: 'SYS006', date: '2024-01-12', description: 'Recebimento PIX - Loja Epsilon', amount: 3200.00, type: 'income', reference: 'AR005', category: 'Vendas', status: 'reconciled', matchedBankId: 'BK006' },
  { id: 'SYS007', date: '2024-01-14', description: 'Recebimento - Comércio ABC', amount: 8900.00, type: 'income', reference: 'AR002', category: 'Vendas', status: 'pending' },
  { id: 'SYS008', date: '2024-01-15', description: 'Pagamento de impostos', amount: 5200.00, type: 'expense', reference: 'IMP-001', category: 'Impostos', status: 'reconciled', matchedBankId: 'BK008' },
  { id: 'SYS009', date: '2024-01-18', description: 'Recebimento - Serviços consultoria', amount: 15000.00, type: 'income', reference: 'AR-098', category: 'Serviços', status: 'pending' },
  { id: 'SYS010', date: '2024-01-20', description: 'Manutenção equipamentos', amount: 3500.00, type: 'expense', reference: 'AP-050', category: 'Fornecedores', status: 'pending' },
];

export default function BankReconciliation() {
  const [bankTransactions, setBankTransactions] = useState(mockBankTransactions);
  const [systemEntries, setSystemEntries] = useState(mockSystemEntries);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState<string[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<string[]>([]);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);

  const filteredBank = bankTransactions.filter(t => {
    const matchesSearch = search === '' || t.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSystem = systemEntries.filter(e => {
    const matchesSearch = search === '' || e.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const reconciledCount = bankTransactions.filter(t => t.status === 'reconciled').length;
  const pendingCount = bankTransactions.filter(t => t.status === 'pending').length;
  const divergentCount = bankTransactions.filter(t => t.status === 'divergent').length;

  const bankBalance = bankTransactions.reduce((sum, t) => sum + (t.type === 'credit' ? t.amount : -t.amount), 0);
  const systemBalance = systemEntries.reduce((sum, e) => sum + (e.type === 'income' ? e.amount : -e.amount), 0);
  const difference = bankBalance - systemBalance;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getStatusBadge = (status: ReconciliationStatus) => {
    switch (status) {
      case 'reconciled':
        return <Badge className="bg-success/10 text-success border-success/30"><CheckCircle2 className="mr-1 h-3 w-3" />Conciliado</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning/30"><AlertTriangle className="mr-1 h-3 w-3" />Pendente</Badge>;
      case 'divergent':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/30"><XCircle className="mr-1 h-3 w-3" />Divergente</Badge>;
    }
  };

  const handleManualMatch = () => {
    if (selectedBank.length === 1 && selectedSystem.length === 1) {
      setBankTransactions(prev => prev.map(t =>
        t.id === selectedBank[0] ? { ...t, status: 'reconciled' as ReconciliationStatus, matchedEntryId: selectedSystem[0] } : t
      ));
      setSystemEntries(prev => prev.map(e =>
        e.id === selectedSystem[0] ? { ...e, status: 'reconciled' as ReconciliationStatus, matchedBankId: selectedBank[0] } : e
      ));
      setSelectedBank([]);
      setSelectedSystem([]);
      setIsMatchDialogOpen(false);
    }
  };

  const handleAutoReconcile = () => {
    const updatedBank = [...bankTransactions];
    const updatedSystem = [...systemEntries];

    updatedBank.forEach(bt => {
      if (bt.status !== 'pending') return;
      const match = updatedSystem.find(se =>
        se.status === 'pending' &&
        Math.abs(se.amount - bt.amount) < 0.01 &&
        ((bt.type === 'credit' && se.type === 'income') || (bt.type === 'debit' && se.type === 'expense'))
      );
      if (match) {
        bt.status = 'reconciled';
        bt.matchedEntryId = match.id;
        match.status = 'reconciled';
        match.matchedBankId = bt.id;
      }
    });

    setBankTransactions(updatedBank);
    setSystemEntries(updatedSystem);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conciliação Bancária</h1>
          <p className="text-muted-foreground">Compare extrato bancário com lançamentos do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAutoReconcile} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Conciliar Automático
          </Button>
          <ExportButton
            data={bankTransactions as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'date', label: 'Data' },
              { key: 'description', label: 'Descrição' },
              { key: 'amount', label: 'Valor', format: (v) => formatCurrency(Number(v)) },
              { key: 'type', label: 'Tipo' },
              { key: 'status', label: 'Status' },
            ]}
            filename="conciliacao-bancaria"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Banco</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(bankBalance)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Sistema</CardTitle>
            <Building2 className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(systemBalance)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Diferença</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${Math.abs(difference) > 0.01 ? 'text-warning' : 'text-success'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${Math.abs(difference) > 0.01 ? 'text-warning' : 'text-success'}`}>
              {formatCurrency(difference)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conciliados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-success">{reconciledCount}</div>
            <p className="text-xs text-muted-foreground">{((reconciledCount / bankTransactions.length) * 100).toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-warning">{pendingCount}</div>
            <p className="text-xs text-destructive">{divergentCount} divergentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar transações..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="reconciled">Conciliados</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="divergent">Divergentes</SelectItem>
          </SelectContent>
        </Select>
        {selectedBank.length > 0 && selectedSystem.length > 0 && (
          <Button onClick={() => setIsMatchDialogOpen(true)} className="gap-2">
            <Link2 className="h-4 w-4" />
            Vincular Selecionados
          </Button>
        )}
      </div>

      {/* Two Column Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bank Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Extrato Bancário
              <Badge variant="outline" className="ml-auto">{filteredBank.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBank.map(t => (
                  <TableRow key={t.id} className={t.status === 'reconciled' ? 'opacity-60' : ''}>
                    <TableCell>
                      {t.status === 'pending' && (
                        <Checkbox
                          checked={selectedBank.includes(t.id)}
                          onCheckedChange={(checked) => {
                            setSelectedBank(checked ? [t.id] : []);
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{format(new Date(t.date), 'dd/MM', { locale: ptBR })}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {t.type === 'credit' ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />}
                        <span className="text-sm truncate max-w-[180px]">{t.description}</span>
                      </div>
                    </TableCell>
                    <TableCell className={`text-right text-sm font-medium ${t.type === 'credit' ? 'text-success' : 'text-destructive'}`}>
                      {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(t.status)}</TableCell>
                  </TableRow>
                ))}
                {filteredBank.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhuma transação encontrada</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* System Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Lançamentos do Sistema
              <Badge variant="outline" className="ml-auto">{filteredSystem.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSystem.map(e => (
                  <TableRow key={e.id} className={e.status === 'reconciled' ? 'opacity-60' : ''}>
                    <TableCell>
                      {e.status === 'pending' && (
                        <Checkbox
                          checked={selectedSystem.includes(e.id)}
                          onCheckedChange={(checked) => {
                            setSelectedSystem(checked ? [e.id] : []);
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{format(new Date(e.date), 'dd/MM', { locale: ptBR })}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {e.type === 'income' ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />}
                        <span className="text-sm truncate max-w-[180px]">{e.description}</span>
                      </div>
                    </TableCell>
                    <TableCell className={`text-right text-sm font-medium ${e.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                      {e.type === 'income' ? '+' : '-'}{formatCurrency(e.amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(e.status)}</TableCell>
                  </TableRow>
                ))}
                {filteredSystem.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum lançamento encontrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Match Confirmation Dialog */}
      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Conciliação Manual</DialogTitle>
            <DialogDescription>Vincular a transação bancária ao lançamento do sistema selecionado?</DialogDescription>
          </DialogHeader>
          {selectedBank.length === 1 && selectedSystem.length === 1 && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Banco</p>
                <p className="font-medium text-sm">{bankTransactions.find(t => t.id === selectedBank[0])?.description}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(bankTransactions.find(t => t.id === selectedBank[0])?.amount || 0)}</p>
              </div>
              <div className="flex justify-center"><Link2 className="h-5 w-5 text-primary" /></div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Sistema</p>
                <p className="font-medium text-sm">{systemEntries.find(e => e.id === selectedSystem[0])?.description}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(systemEntries.find(e => e.id === selectedSystem[0])?.amount || 0)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMatchDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleManualMatch}>Confirmar Conciliação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
