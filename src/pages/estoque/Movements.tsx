import { useState, useMemo } from 'react';
import { useStockMovements } from '@/hooks/useWMSOperations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Plus,
  Search,
  Eye,
  Filter,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  movementTypeConfig,
} from '@/config/inventory';
import type { StockMovement, MovementType, MovementDirection, MovementFilters } from '@/types/inventory';

export default function MovementsPage() {
  const { movements: dbMovements, loading } = useStockMovements();
  const movements = useMemo<StockMovement[]>(() => dbMovements.map((m: any) => ({
    id: m.id, documentNumber: m.documentNumber, productId: m.productId || '',
    productCode: m.productCode, productName: m.productName,
    type: m.type as MovementType, direction: m.direction as MovementDirection,
    quantity: m.quantity, unitCost: m.unitCost, totalCost: m.totalCost,
    batch: m.batch, fromWarehouse: m.fromWarehouse, toWarehouse: m.toWarehouse,
    reference: m.reference, notes: m.notes, operator: m.operator, createdAt: m.createdAt,
  })), [dbMovements]);
  const [filters, setFilters] = useState<MovementFilters>({
    search: '',
    type: 'all',
    direction: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filteredMovements = movements.filter((movement) => {
    const matchesSearch =
      filters.search === '' ||
      movement.productName.toLowerCase().includes(filters.search.toLowerCase()) ||
      movement.productCode.toLowerCase().includes(filters.search.toLowerCase()) ||
      movement.documentNumber.toLowerCase().includes(filters.search.toLowerCase());
    const matchesType = filters.type === 'all' || movement.type === filters.type;
    const matchesDirection = filters.direction === 'all' || movement.direction === filters.direction;
    return matchesSearch && matchesType && matchesDirection;
  });

  const totalEntries = movements.filter((m) => m.direction === 'in').reduce((acc, m) => acc + m.totalCost, 0);
  const totalExits = movements.filter((m) => m.direction === 'out').reduce((acc, m) => acc + m.totalCost, 0);
  const movementsToday = movements.filter((m) => 
    format(new Date(m.createdAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  ).length;

  const getTypeBadge = (type: MovementType) => {
    const config = movementTypeConfig.find((t) => t.value === type);
    return <Badge className={config?.color}>{config?.label}</Badge>;
  };

  const getDirectionIcon = (direction: MovementDirection) => {
    return direction === 'in' ? (
      <ArrowDownCircle className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowUpCircle className="h-4 w-4 text-red-600" />
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimentações</h1>
          <p className="text-muted-foreground">Controle de entradas e saídas de estoque</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredMovements as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'documentNumber', label: 'Documento' },
              { key: 'productCode', label: 'Código Produto' },
              { key: 'productName', label: 'Produto' },
              { key: 'type', label: 'Tipo' },
              { key: 'direction', label: 'Direção' },
              { key: 'quantity', label: 'Quantidade' },
              { key: 'unitCost', label: 'Custo Unit.', format: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)) },
              { key: 'totalCost', label: 'Total', format: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)) },
              { key: 'operator', label: 'Operador' },
              { key: 'createdAt', label: 'Data', format: (v) => new Date(v as string).toLocaleDateString('pt-BR') },
            ]}
            filename="movimentacoes_estoque"
          />
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Movimentação
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Movimentações</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{movements.length}</div>
            <p className="text-xs text-muted-foreground">{movementsToday} hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalEntries)}</div>
            <p className="text-xs text-muted-foreground">
              {movements.filter((m) => m.direction === 'in').length} movimentações
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExits)}</div>
            <p className="text-xs text-muted-foreground">
              {movements.filter((m) => m.direction === 'out').length} movimentações
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Período</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalEntries - totalExits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalEntries - totalExits)}
            </div>
            <p className="text-xs text-muted-foreground">Entradas - Saídas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({ ...filters, type: value as MovementType | 'all' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {movementTypeConfig.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.direction}
              onValueChange={(value) => setFilters({ ...filters, direction: value as MovementDirection | 'all' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Direção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="in">Entradas</SelectItem>
                <SelectItem value="out">Saídas</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Data inicial"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
            <Input
              type="date"
              placeholder="Data final"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Custo Unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    Nenhuma movimentação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{getDirectionIcon(movement.direction)}</TableCell>
                    <TableCell className="font-medium">{movement.documentNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{movement.productCode}</div>
                        <div className="text-xs text-muted-foreground">{movement.productName}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(movement.type)}</TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={movement.direction === 'in' ? 'text-green-600' : 'text-red-600'}>
                        {movement.direction === 'in' ? '+' : '-'}{movement.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(movement.unitCost)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(movement.totalCost)}</TableCell>
                    <TableCell>{movement.operator}</TableCell>
                    <TableCell>{formatDate(movement.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedMovement(movement);
                          setIsViewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Movimentação</DialogTitle>
            <DialogDescription>{selectedMovement?.documentNumber}</DialogDescription>
          </DialogHeader>
          {selectedMovement && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Documento</Label>
                  <p className="font-medium">{selectedMovement.documentNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data</Label>
                  <p className="font-medium">{formatDate(selectedMovement.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Produto</Label>
                  <p className="font-medium">{selectedMovement.productCode}</p>
                  <p className="text-sm text-muted-foreground">{selectedMovement.productName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <div className="mt-1">{getTypeBadge(selectedMovement.type)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quantidade</Label>
                  <p className={`font-medium ${selectedMovement.direction === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedMovement.direction === 'in' ? '+' : '-'}{selectedMovement.quantity}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Custo Unitário</Label>
                  <p className="font-medium">{formatCurrency(selectedMovement.unitCost)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Custo Total</Label>
                  <p className="font-medium">{formatCurrency(selectedMovement.totalCost)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Operador</Label>
                  <p className="font-medium">{selectedMovement.operator}</p>
                </div>
                {selectedMovement.batch && (
                  <div>
                    <Label className="text-muted-foreground">Lote</Label>
                    <p className="font-medium">{selectedMovement.batch}</p>
                  </div>
                )}
                {selectedMovement.fromWarehouse && (
                  <div>
                    <Label className="text-muted-foreground">Origem</Label>
                    <p className="font-medium">{selectedMovement.fromWarehouse}</p>
                  </div>
                )}
                {selectedMovement.toWarehouse && (
                  <div>
                    <Label className="text-muted-foreground">Destino</Label>
                    <p className="font-medium">{selectedMovement.toWarehouse}</p>
                  </div>
                )}
                {selectedMovement.reference && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Referência</Label>
                    <p className="font-medium">{selectedMovement.reference}</p>
                  </div>
                )}
                {selectedMovement.notes && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Observações</Label>
                    <p className="font-medium">{selectedMovement.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Movimentação</DialogTitle>
            <DialogDescription>Registrar entrada ou saída de estoque</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Tipo de Movimentação *</Label>
              <Select defaultValue="purchase">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {movementTypeConfig.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Produto *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empty">Nenhum produto cadastrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input id="quantity" type="number" min="1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitCost">Custo Unitário *</Label>
                <Input id="unitCost" type="number" step="0.01" min="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch">Lote</Label>
              <Input id="batch" placeholder="LOT-XXXX" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Referência</Label>
              <Input id="reference" placeholder="NF, PV, OP..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" placeholder="Informações adicionais..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsFormOpen(false)}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
