import { useState } from 'react';
import { ExportButton } from '@/components/shared/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RotateCcw,
  Plus,
  ArrowUpDown,
  Package,
  MapPin,
  Calendar
} from 'lucide-react';
import { 
  inventoryMovements as initialMovements,
  inventoryItems,
  storageLocations
} from '@/data/wmsMockData';
import { InventoryMovement, MovementType } from '@/types/wms';

const movementTypeConfig: Record<MovementType, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  inbound: { label: 'Entrada', icon: <TrendingUp className="h-4 w-4" />, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900' },
  outbound: { label: 'Saída', icon: <TrendingDown className="h-4 w-4" />, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900' },
  transfer: { label: 'Transferência', icon: <ArrowRight className="h-4 w-4" />, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900' },
  adjustment: { label: 'Ajuste', icon: <RotateCcw className="h-4 w-4" />, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900' }
};

export default function WMSMovementsPage() {
  const [movements, setMovements] = useState<InventoryMovement[]>(initialMovements);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [newMovementOpen, setNewMovementOpen] = useState(false);
  const [newMovement, setNewMovement] = useState<Partial<InventoryMovement>>({
    type: 'transfer',
    quantity: 0,
    reason: ''
  });

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = 
      movement.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || movement.type === typeFilter;
    
    // Date filter
    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = movement.createdAt.startsWith(format(new Date(), 'yyyy-MM-dd'));
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = new Date(movement.createdAt) >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = new Date(movement.createdAt) >= monthAgo;
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  // Statistics
  const todayMovements = movements.filter(m => 
    m.createdAt.startsWith(format(new Date(), 'yyyy-MM-dd'))
  ).length;

  const inboundCount = movements.filter(m => m.type === 'inbound').length;
  const outboundCount = movements.filter(m => m.type === 'outbound').length;
  const transferCount = movements.filter(m => m.type === 'transfer').length;
  const adjustmentCount = movements.filter(m => m.type === 'adjustment').length;

  const handleCreateMovement = () => {
    if (!newMovement.productCode || !newMovement.quantity || !newMovement.reason) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (newMovement.type === 'transfer' && !newMovement.fromLocation && !newMovement.toLocation) {
      toast.error('Informe origem e destino para transferência');
      return;
    }

    const product = inventoryItems.find(p => p.productCode === newMovement.productCode);
    
    const movement: InventoryMovement = {
      id: Date.now().toString(),
      productCode: newMovement.productCode!,
      productName: product?.productName || 'Produto Desconhecido',
      type: newMovement.type as MovementType,
      fromLocation: newMovement.fromLocation,
      toLocation: newMovement.toLocation,
      quantity: newMovement.quantity!,
      reason: newMovement.reason!,
      operator: 'Usuário Atual',
      createdAt: new Date().toISOString()
    };

    setMovements([movement, ...movements]);
    toast.success('Movimentação registrada com sucesso!');
    setNewMovementOpen(false);
    setNewMovement({ type: 'transfer', quantity: 0, reason: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimentações WMS</h1>
          <p className="text-muted-foreground">Registro e histórico de movimentações no armazém</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredMovements as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'productCode', label: 'Código' },
              { key: 'productName', label: 'Produto' },
              { key: 'type', label: 'Tipo' },
              { key: 'fromLocation', label: 'Origem' },
              { key: 'toLocation', label: 'Destino' },
              { key: 'quantity', label: 'Quantidade' },
              { key: 'reason', label: 'Motivo' },
              { key: 'operator', label: 'Operador' },
              { key: 'createdAt', label: 'Data', format: (v) => new Date(v as string).toLocaleDateString('pt-BR') },
            ]}
            filename="movimentacoes_wms"
          />
          <Button onClick={() => setNewMovementOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Movimentação
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayMovements}</div>
            <p className="text-xs text-muted-foreground">Movimentações</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{inboundCount}</div>
            <p className="text-xs text-muted-foreground">Total registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outboundCount}</div>
            <p className="text-xs text-muted-foreground">Total registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transferências</CardTitle>
            <ArrowRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{transferCount}</div>
            <p className="text-xs text-muted-foreground">Total registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ajustes</CardTitle>
            <RotateCcw className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{adjustmentCount}</div>
            <p className="text-xs text-muted-foreground">Total registradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto, código ou motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="inbound">Entrada</SelectItem>
                <SelectItem value="outbound">Saída</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
                <SelectItem value="adjustment">Ajuste</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo Período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Último Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
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
                <TableHead>Motivo</TableHead>
                <TableHead>Operador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.map((movement) => {
                const config = movementTypeConfig[movement.type];
                
                return (
                  <TableRow key={movement.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(movement.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${config.bgColor} ${config.color} border-0`}>
                        <span className="flex items-center gap-1">
                          {config.icon}
                          {config.label}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{movement.productName}</p>
                        <p className="text-sm text-muted-foreground">{movement.productCode}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {movement.fromLocation ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {movement.fromLocation}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {movement.toLocation ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {movement.toLocation}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${config.color}`}>
                      {movement.type === 'inbound' ? '+' : movement.type === 'outbound' || movement.quantity < 0 ? '' : ''}
                      {movement.quantity}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={movement.reason}>
                      {movement.reason}
                    </TableCell>
                    <TableCell>{movement.operator}</TableCell>
                  </TableRow>
                );
              })}
              {filteredMovements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma movimentação encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Movement Dialog */}
      <Dialog open={newMovementOpen} onOpenChange={setNewMovementOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Movimentação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tipo de Movimentação</label>
              <Select 
                value={newMovement.type} 
                onValueChange={(v) => setNewMovement({ ...newMovement, type: v as MovementType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(movementTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        {config.icon}
                        {config.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Produto</label>
              <Select 
                value={newMovement.productCode} 
                onValueChange={(v) => setNewMovement({ ...newMovement, productCode: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map(item => (
                    <SelectItem key={item.id} value={item.productCode}>
                      {item.productCode} - {item.productName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(newMovement.type === 'transfer' || newMovement.type === 'outbound') && (
              <div>
                <label className="text-sm font-medium">Origem</label>
                <Select 
                  value={newMovement.fromLocation} 
                  onValueChange={(v) => setNewMovement({ ...newMovement, fromLocation: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {storageLocations.map(loc => (
                      <SelectItem key={loc.id} value={loc.code}>
                        {loc.code} - Zona {loc.zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(newMovement.type === 'transfer' || newMovement.type === 'inbound') && (
              <div>
                <label className="text-sm font-medium">Destino</label>
                <Select 
                  value={newMovement.toLocation} 
                  onValueChange={(v) => setNewMovement({ ...newMovement, toLocation: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {storageLocations.filter(l => l.code !== newMovement.fromLocation).map(loc => (
                      <SelectItem key={loc.id} value={loc.code}>
                        {loc.code} - Zona {loc.zone} (Disp: {loc.capacity - loc.occupied})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Quantidade</label>
              <Input
                type="number"
                min={newMovement.type === 'adjustment' ? undefined : 1}
                value={newMovement.quantity || ''}
                onChange={(e) => setNewMovement({ ...newMovement, quantity: parseInt(e.target.value) || 0 })}
                placeholder={newMovement.type === 'adjustment' ? 'Use valores negativos para reduzir' : 'Quantidade'}
              />
              {newMovement.type === 'adjustment' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Use valores negativos para ajustes de redução
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Motivo</label>
              <Textarea
                value={newMovement.reason}
                onChange={(e) => setNewMovement({ ...newMovement, reason: e.target.value })}
                placeholder="Descreva o motivo da movimentação..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewMovementOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateMovement}>
              Registrar Movimentação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
