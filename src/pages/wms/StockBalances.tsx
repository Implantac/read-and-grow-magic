import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Search, Package } from 'lucide-react';
import { useStockBalances } from '@/hooks/useStockBalances';

const statusLabels: Record<string, string> = {
  available: 'Disponível',
  reserved: 'Reservado',
  blocked: 'Bloqueado',
  quarantine: 'Quarentena',
  damaged: 'Avariado',
  in_conference: 'Em Conferência',
  in_transit: 'Em Trânsito',
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  available: 'default',
  reserved: 'secondary',
  blocked: 'destructive',
  quarantine: 'outline',
  damaged: 'destructive',
};

export default function StockBalancesPage() {
  const { balances, loading } = useStockBalances();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = balances.filter(b => {
    const matchSearch = b.productName.toLowerCase().includes(search.toLowerCase()) ||
      b.productCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.stockStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalQty = balances.reduce((s, b) => s + b.quantity, 0);
  const totalReserved = balances.reduce((s, b) => s + b.reservedQty, 0);
  const totalAvailable = balances.reduce((s, b) => s + b.availableQty, 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Saldos de Estoque</h1>
        <p className="text-muted-foreground">Visão em tempo real por produto, lote, endereço e status</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registros</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{balances.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qtd Total</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalQty.toLocaleString('pt-BR')}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservado</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-500">{totalReserved.toLocaleString('pt-BR')}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponível</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-500">{totalAvailable.toLocaleString('pt-BR')}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Reserv.</TableHead>
                    <TableHead className="text-right">Disp.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 100).map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.productName}</TableCell>
                      <TableCell>{b.productCode}</TableCell>
                      <TableCell>{b.lotNumber || '-'}</TableCell>
                      <TableCell>{b.locationCode || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[b.stockStatus] || 'outline'}>
                          {statusLabels[b.stockStatus] || b.stockStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{b.quantity}</TableCell>
                      <TableCell className="text-right">{b.reservedQty}</TableCell>
                      <TableCell className="text-right font-semibold">{b.availableQty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum saldo encontrado</h3>
            <p>Os saldos são atualizados com as movimentações do WMS.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
