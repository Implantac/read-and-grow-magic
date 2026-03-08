import { useState, useEffect } from 'react';
import { ExportButton } from '@/components/shared/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Package, AlertTriangle, ClipboardList } from 'lucide-react';
import { useWMSInventory } from '@/hooks/useWMSInventory';
import type { InventoryStatus } from '@/types/wms';

const statusConfig: Record<InventoryStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { label: 'Disponível', variant: 'default' },
  reserved: { label: 'Reservado', variant: 'secondary' },
  damaged: { label: 'Danificado', variant: 'destructive' },
  expired: { label: 'Vencido', variant: 'destructive' },
  quarantine: { label: 'Quarentena', variant: 'outline' }
};

export default function InventoryPage() {
  const { items, counts, loading } = useWMSInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalValue = items.reduce((sum, i) => sum + (i.quantity * i.value), 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const lowStockItems = items.filter(i => i.availableQty <= i.minStock).length;
  const expiredItems = items.filter(i => i.status === 'expired').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventário</h1>
          <p className="text-muted-foreground">Controle de estoque e movimentações</p>
        </div>
        <ExportButton
          data={filteredItems as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'productCode', label: 'Código' },
            { key: 'productName', label: 'Produto' },
            { key: 'category', label: 'Categoria' },
            { key: 'location', label: 'Localização' },
            { key: 'quantity', label: 'Quantidade' },
            { key: 'availableQty', label: 'Disponível' },
            { key: 'value', label: 'Valor', format: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)) },
            { key: 'status', label: 'Status' },
          ]}
          filename="inventario_wms"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">{totalItems} itens em estoque</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SKUs Cadastrados</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground">{categories.length} categorias</p>
          </CardContent>
        </Card>
        <Card className={lowStockItems > 0 ? 'border-amber-500' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Abaixo do mínimo</p>
          </CardContent>
        </Card>
        <Card className={expiredItems > 0 ? 'border-red-500' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{expiredItems}</div>
            <p className="text-xs text-muted-foreground">Produtos vencidos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock">Estoque</TabsTrigger>
          <TabsTrigger value="counts">Contagens ({counts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar por código ou nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(statusConfig).map(([key, config]) => <SelectItem key={key} value={key}>{config.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Itens em Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead className="text-right">Disponível</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum item encontrado</TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.productCode}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell className="text-right">{item.availableQty} {item.unit}</TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[item.status]?.variant || 'default'}>
                            {statusConfig[item.status]?.label || item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="counts" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Contagens de Inventário</CardTitle></CardHeader>
            <CardContent>
              {counts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhuma contagem registrada</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Zona</TableHead>
                      <TableHead>Data Agendada</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead>Discrepâncias</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {counts.map(count => (
                      <TableRow key={count.id}>
                        <TableCell className="font-mono">{count.countNumber}</TableCell>
                        <TableCell>{count.zone || '-'}</TableCell>
                        <TableCell>{new Date(count.scheduledDate).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{count.itemsCount}</TableCell>
                        <TableCell className={count.discrepancies > 0 ? 'text-destructive font-medium' : ''}>{count.discrepancies}</TableCell>
                        <TableCell><Badge variant="outline">{count.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
