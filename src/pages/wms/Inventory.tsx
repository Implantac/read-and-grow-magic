import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search,
  Package,
  AlertTriangle,
  ArrowUpDown,
  Eye,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { 
  inventoryItems as initialItems, 
  inventoryMovements as initialMovements,
  inventoryCounts as initialCounts 
} from '@/data/wmsMockData';
import { InventoryItem, InventoryMovement, InventoryCount, InventoryStatus, MovementType } from '@/types/wms';

const statusConfig: Record<InventoryStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { label: 'Disponível', variant: 'default' },
  reserved: { label: 'Reservado', variant: 'secondary' },
  damaged: { label: 'Danificado', variant: 'destructive' },
  expired: { label: 'Vencido', variant: 'destructive' },
  quarantine: { label: 'Quarentena', variant: 'outline' }
};

const movementTypeConfig: Record<MovementType, { label: string; icon: React.ReactNode; color: string }> = {
  inbound: { label: 'Entrada', icon: <TrendingUp className="h-4 w-4" />, color: 'text-green-500' },
  outbound: { label: 'Saída', icon: <TrendingDown className="h-4 w-4" />, color: 'text-red-500' },
  transfer: { label: 'Transferência', icon: <ArrowRight className="h-4 w-4" />, color: 'text-blue-500' },
  adjustment: { label: 'Ajuste', icon: <RotateCcw className="h-4 w-4" />, color: 'text-amber-500' }
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [movements] = useState<InventoryMovement[]>(initialMovements);
  const [counts] = useState<InventoryCount[]>(initialCounts);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({ quantity: 0, reason: '' });

  const categories = [...new Set(items.map(i => i.category))];

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

  const handleViewDetails = (item: InventoryItem) => {
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustData({ quantity: 0, reason: '' });
    setAdjustOpen(true);
  };

  const handleConfirmAdjust = () => {
    if (!selectedItem || adjustData.quantity === 0 || !adjustData.reason) {
      toast.error('Preencha todos os campos');
      return;
    }

    const newQuantity = selectedItem.quantity + adjustData.quantity;
    if (newQuantity < 0) {
      toast.error('Quantidade resultante não pode ser negativa');
      return;
    }

    setItems(items.map(i => 
      i.id === selectedItem.id 
        ? { 
            ...i, 
            quantity: newQuantity,
            availableQty: i.availableQty + adjustData.quantity,
            lastMovement: new Date().toISOString()
          }
        : i
    ));

    toast.success('Ajuste realizado com sucesso!');
    setAdjustOpen(false);
    setSelectedItem(null);
  };

  const getStockLevel = (available: number, min: number, max: number) => {
    if (available <= min) return { level: 'low', color: 'text-red-500', percent: (available / max) * 100 };
    if (available <= min * 2) return { level: 'medium', color: 'text-amber-500', percent: (available / max) * 100 };
    return { level: 'high', color: 'text-green-500', percent: (available / max) * 100 };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventário</h1>
          <p className="text-muted-foreground">Controle de estoque e movimentações</p>
        </div>
      </div>

      {/* Summary Cards */}
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
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="counts">Contagens</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por código ou nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Stock Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens em Estoque
              </CardTitle>
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
                    <TableHead>Nível</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const stockLevel = getStockLevel(item.availableQty, item.minStock, item.maxStock);
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.productCode}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell className="text-right">
                          {item.availableQty} {item.unit}
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress value={stockLevel.percent} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[item.status].variant}>
                            {statusConfig[item.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenAdjust(item)}
                            >
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum item encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Histórico de Movimentações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead>Operador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => {
                    const config = movementTypeConfig[movement.type];
                    
                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {format(new Date(movement.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1 ${config.color}`}>
                            {config.icon}
                            {config.label}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{movement.productName}</p>
                            <p className="text-sm text-muted-foreground">{movement.productCode}</p>
                          </div>
                        </TableCell>
                        <TableCell>{movement.fromLocation || '-'}</TableCell>
                        <TableCell>{movement.toLocation || '-'}</TableCell>
                        <TableCell className={`text-right font-medium ${config.color}`}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </TableCell>
                        <TableCell>{movement.operator}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="counts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Contagens de Inventário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Data Agendada</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Divergências</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {counts.map((count) => (
                    <TableRow key={count.id}>
                      <TableCell className="font-medium">{count.countNumber}</TableCell>
                      <TableCell>{count.zone || 'Geral'}</TableCell>
                      <TableCell>
                        {format(new Date(count.scheduledDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{count.itemsCount}</TableCell>
                      <TableCell>
                        {count.discrepancies > 0 ? (
                          <span className="text-red-500 font-medium">{count.discrepancies}</span>
                        ) : (
                          <span className="text-green-500">0</span>
                        )}
                      </TableCell>
                      <TableCell>{count.operator || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          count.status === 'completed' ? 'outline' :
                          count.status === 'in_progress' ? 'default' :
                          count.status === 'cancelled' ? 'destructive' : 'secondary'
                        }>
                          {count.status === 'scheduled' && 'Agendada'}
                          {count.status === 'in_progress' && 'Em Andamento'}
                          {count.status === 'completed' && 'Concluída'}
                          {count.status === 'cancelled' && 'Cancelada'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Produto - {selectedItem?.productCode}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Produto</p>
                  <p className="font-medium">{selectedItem.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="font-medium">{selectedItem.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium">{selectedItem.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantidade Total</p>
                  <p className="font-medium">{selectedItem.quantity} {selectedItem.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reservado</p>
                  <p className="font-medium">{selectedItem.reservedQty} {selectedItem.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Disponível</p>
                  <p className="font-medium">{selectedItem.availableQty} {selectedItem.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estoque Mínimo</p>
                  <p className="font-medium">{selectedItem.minStock} {selectedItem.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estoque Máximo</p>
                  <p className="font-medium">{selectedItem.maxStock} {selectedItem.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Unitário</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedItem.value)}
                  </p>
                </div>
                {selectedItem.batch && (
                  <div>
                    <p className="text-sm text-muted-foreground">Lote</p>
                    <p className="font-medium">{selectedItem.batch}</p>
                  </div>
                )}
                {selectedItem.expirationDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Validade</p>
                    <p className="font-medium">
                      {format(new Date(selectedItem.expirationDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Última Movimentação</p>
                  <p className="font-medium">
                    {format(new Date(selectedItem.lastMovement), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Adjust Dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Estoque - {selectedItem?.productName}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Quantidade Atual:</strong> {selectedItem.quantity} {selectedItem.unit}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Ajuste (+ ou -)</label>
                <Input
                  type="number"
                  value={adjustData.quantity}
                  onChange={(e) => setAdjustData({ ...adjustData, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="Ex: +10 ou -5"
                />
                {adjustData.quantity !== 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Nova quantidade: {selectedItem.quantity + adjustData.quantity} {selectedItem.unit}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Motivo</label>
                <Input
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  placeholder="Motivo do ajuste"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmAdjust}>
              Confirmar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
