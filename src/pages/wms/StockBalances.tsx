import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Search, Package, Lock, CheckCircle } from 'lucide-react';
import { useStockBalances } from '@/hooks/useStockBalances';
import { ExportButton } from '@/components/shared/ExportButton';

import { formatNumber } from '@/lib/formatters';
const statusLabels: Record<string, string> = {
  available: 'Disponível', reserved: 'Reservado', blocked: 'Bloqueado',
  quarantine: 'Quarentena', damaged: 'Avariado', in_conference: 'Em Conferência', in_transit: 'Em Trânsito',
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  available: 'default', reserved: 'secondary', blocked: 'destructive', quarantine: 'outline', damaged: 'destructive',
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

  return (
    <PageContainer loading={loading}>
      <PageHeader
        title="Saldos de Estoque"
        description="Visão em tempo real por produto, lote, endereço e status"
        actions={
          <ExportButton
            data={filtered as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'productCode', label: 'Código' },
              { key: 'productName', label: 'Produto' },
              { key: 'lotNumber', label: 'Lote' },
              { key: 'locationCode', label: 'Endereço' },
              { key: 'quantity', label: 'Qtd' },
              { key: 'reservedQty', label: 'Reservado' },
              { key: 'availableQty', label: 'Disponível' },
              { key: 'stockStatus', label: 'Status' },
            ]}
            filename="saldos_estoque_wms"
          />
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Registros" value={balances.length} icon={Database} index={0} />
        <KPICard title="Qtd Total" value={formatNumber(totalQty)} icon={Package} index={1} />
        <KPICard title="Reservado" value={formatNumber(totalReserved)} icon={Lock} index={2} color="warning" />
        <KPICard title="Disponível" value={formatNumber(totalAvailable)} icon={CheckCircle} index={3} color="success" />
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
                {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
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
                      <TableCell className="font-mono text-xs">{b.productCode}</TableCell>
                      <TableCell className="font-mono text-xs">{b.lotNumber || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{b.locationCode || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[b.stockStatus] || 'outline'}>{statusLabels[b.stockStatus] || b.stockStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{b.quantity}</TableCell>
                      <TableCell className="text-right">{b.reservedQty}</TableCell>
                      <TableCell className="text-right font-semibold">{b.availableQty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filtered.length > 100 && (
              <div className="p-4 text-center text-sm text-muted-foreground">Exibindo 100 de {filtered.length} registros. Use os filtros para refinar.</div>
            )}
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
    </PageContainer>
  );
}
