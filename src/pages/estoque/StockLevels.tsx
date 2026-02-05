import { useState } from 'react';
import { ExportButton } from '@/components/shared/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Package,
  Search,
  Eye,
  Filter,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ShoppingCart,
  BarChart3,
  RefreshCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  stockLevels as initialStockLevels,
  stockSummary,
  categories,
  stockLevelStatusConfig,
} from '@/data/inventoryMockData';
import { ABCCurveChart } from '@/components/estoque/ABCCurveChart';
import { InventoryTurnoverChart } from '@/components/estoque/InventoryTurnoverChart';
import type { StockLevel, StockLevelStatus, StockLevelFilters } from '@/types/inventory';

export default function StockLevelsPage() {
  const [stockLevels] = useState<StockLevel[]>(initialStockLevels);
  const [filters, setFilters] = useState<StockLevelFilters>({
    search: '',
    category: 'all',
    status: 'all',
  });
  const [selectedItem, setSelectedItem] = useState<StockLevel | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const filteredLevels = stockLevels.filter((level) => {
    const matchesSearch =
      filters.search === '' ||
      level.productName.toLowerCase().includes(filters.search.toLowerCase()) ||
      level.productCode.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = filters.category === 'all' || level.category === filters.category;
    const matchesStatus = filters.status === 'all' || level.status === filters.status;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const criticalItems = stockLevels.filter((l) => l.status === 'critical');
  const lowItems = stockLevels.filter((l) => l.status === 'low');
  const excessItems = stockLevels.filter((l) => l.status === 'excess');

  const getStatusBadge = (status: StockLevelStatus) => {
    const config = stockLevelStatusConfig.find((s) => s.value === status);
    return <Badge className={config?.color}>{config?.label}</Badge>;
  };

  const getStatusIcon = (status: StockLevelStatus) => {
    switch (status) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'excess':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getStockPercentage = (current: number, min: number, max: number) => {
    if (max === min) return 100;
    return Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100));
  };

  const getProgressColor = (status: StockLevelStatus) => {
    switch (status) {
      case 'critical':
        return 'bg-red-600';
      case 'low':
        return 'bg-amber-500';
      case 'excess':
        return 'bg-blue-500';
      default:
        return 'bg-green-500';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Níveis de Estoque</h1>
          <p className="text-muted-foreground">Monitoramento de saldos e alertas</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredLevels as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'productCode', label: 'Código' },
              { key: 'productName', label: 'Produto' },
              { key: 'category', label: 'Categoria' },
              { key: 'currentStock', label: 'Estoque Atual' },
              { key: 'minStock', label: 'Mínimo' },
              { key: 'maxStock', label: 'Máximo' },
              { key: 'totalValue', label: 'Valor Total', format: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)) },
              { key: 'status', label: 'Status' },
            ]}
            filename="niveis_estoque"
          />
          <Button variant="outline">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Gerar Pedido de Compra
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total em Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stockSummary.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              {stockSummary.activeProducts} produtos ativos
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Crítico</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalItems.length}</div>
            <p className="text-xs text-muted-foreground">Requer ação imediata</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{lowItems.length}</div>
            <p className="text-xs text-muted-foreground">Abaixo do mínimo</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque em Excesso</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{excessItems.length}</div>
            <p className="text-xs text-muted-foreground">Acima do máximo</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">Todos ({stockLevels.length})</TabsTrigger>
          <TabsTrigger value="critical" className="text-destructive">
            Críticos ({criticalItems.length})
          </TabsTrigger>
          <TabsTrigger value="low" className="text-amber-600">
            Baixos ({lowItems.length})
          </TabsTrigger>
          <TabsTrigger value="excess" className="text-blue-600">
            Excesso ({excessItems.length})
          </TabsTrigger>
          <TabsTrigger value="abc" className="gap-1">
            <BarChart3 className="h-4 w-4" />
            Curva ABC
          </TabsTrigger>
          <TabsTrigger value="turnover" className="gap-1">
            <RefreshCcw className="h-4 w-4" />
            Giro de Estoque
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {/* Filters */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou código..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={filters.category}
                  onValueChange={(value) => setFilters({ ...filters, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value as StockLevelStatus | 'all' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {stockLevelStatusConfig.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Stock Levels Table */}
          <StockLevelsTable
            levels={filteredLevels}
            onView={(item) => {
              setSelectedItem(item);
              setIsViewOpen(true);
            }}
            getStatusBadge={getStatusBadge}
            getStatusIcon={getStatusIcon}
            getStockPercentage={getStockPercentage}
            getProgressColor={getProgressColor}
            formatNumber={formatNumber}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        <TabsContent value="critical">
          <StockLevelsTable
            levels={criticalItems}
            onView={(item) => {
              setSelectedItem(item);
              setIsViewOpen(true);
            }}
            getStatusBadge={getStatusBadge}
            getStatusIcon={getStatusIcon}
            getStockPercentage={getStockPercentage}
            getProgressColor={getProgressColor}
            formatNumber={formatNumber}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        <TabsContent value="low">
          <StockLevelsTable
            levels={lowItems}
            onView={(item) => {
              setSelectedItem(item);
              setIsViewOpen(true);
            }}
            getStatusBadge={getStatusBadge}
            getStatusIcon={getStatusIcon}
            getStockPercentage={getStockPercentage}
            getProgressColor={getProgressColor}
            formatNumber={formatNumber}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        <TabsContent value="abc">
          <ABCCurveChart stockLevels={stockLevels} />
        </TabsContent>

        <TabsContent value="turnover">
          <InventoryTurnoverChart stockLevels={stockLevels} />
        </TabsContent>

        <TabsContent value="excess">
          <StockLevelsTable
            levels={excessItems}
            onView={(item) => {
              setSelectedItem(item);
              setIsViewOpen(true);
            }}
            getStatusBadge={getStatusBadge}
            getStatusIcon={getStatusIcon}
            getStockPercentage={getStockPercentage}
            getProgressColor={getProgressColor}
            formatNumber={formatNumber}
            formatCurrency={formatCurrency}
          />
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Estoque</DialogTitle>
            <DialogDescription>
              {selectedItem?.productCode} - {selectedItem?.productName}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="grid gap-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedItem.status)}
                {getStatusBadge(selectedItem.status)}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Nível de Estoque</span>
                  <span>{formatNumber(selectedItem.currentStock)} / {formatNumber(selectedItem.maxStock)}</span>
                </div>
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full transition-all ${getProgressColor(selectedItem.status)}`}
                    style={{
                      width: `${getStockPercentage(
                        selectedItem.currentStock,
                        0,
                        selectedItem.maxStock
                      )}%`,
                    }}
                  />
                  {/* Min stock indicator */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-amber-600"
                    style={{
                      left: `${(selectedItem.minStock / selectedItem.maxStock) * 100}%`,
                    }}
                  />
                  {/* Reorder point indicator */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-blue-600"
                    style={{
                      left: `${(selectedItem.reorderPoint / selectedItem.maxStock) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mín: {formatNumber(selectedItem.minStock)}</span>
                  <span>Repos: {formatNumber(selectedItem.reorderPoint)}</span>
                  <span>Máx: {formatNumber(selectedItem.maxStock)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Estoque Atual</Label>
                  <p className="font-medium">
                    {formatNumber(selectedItem.currentStock)} {selectedItem.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reservado</Label>
                  <p className="font-medium">
                    {formatNumber(selectedItem.reservedStock)} {selectedItem.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Disponível</Label>
                  <p className="font-medium text-green-600">
                    {formatNumber(selectedItem.availableStock)} {selectedItem.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dias de Estoque</Label>
                  <p className="font-medium">{selectedItem.daysOfStock} dias</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Consumo Médio/Dia</Label>
                  <p className="font-medium">
                    {formatNumber(selectedItem.averageDailyConsumption)} {selectedItem.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Valor em Estoque</Label>
                  <p className="font-medium">{formatCurrency(selectedItem.totalValue)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Última Compra</Label>
                  <p className="font-medium">{formatDate(selectedItem.lastPurchaseDate)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Última Venda</Label>
                  <p className="font-medium">{formatDate(selectedItem.lastSaleDate)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Fechar
            </Button>
            {selectedItem && (selectedItem.status === 'critical' || selectedItem.status === 'low') && (
              <Button>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Solicitar Compra
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface StockLevelsTableProps {
  levels: StockLevel[];
  onView: (item: StockLevel) => void;
  getStatusBadge: (status: StockLevelStatus) => React.ReactNode;
  getStatusIcon: (status: StockLevelStatus) => React.ReactNode;
  getStockPercentage: (current: number, min: number, max: number) => number;
  getProgressColor: (status: StockLevelStatus) => string;
  formatNumber: (value: number) => string;
  formatCurrency: (value: number) => string;
}

function StockLevelsTable({
  levels,
  onView,
  getStatusBadge,
  getStatusIcon,
  getStockPercentage,
  getProgressColor,
  formatNumber,
  formatCurrency,
}: StockLevelsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-48">Nível</TableHead>
              <TableHead className="text-right">Atual</TableHead>
              <TableHead className="text-right">Disponível</TableHead>
              <TableHead className="text-right">Dias</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  Nenhum item encontrado.
                </TableCell>
              </TableRow>
            ) : (
              levels.map((level) => (
                <TableRow key={level.id}>
                  <TableCell>{getStatusIcon(level.status)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{level.productCode}</div>
                      <div className="text-xs text-muted-foreground">{level.productName}</div>
                    </div>
                  </TableCell>
                  <TableCell>{level.category}</TableCell>
                  <TableCell>{getStatusBadge(level.status)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full transition-all ${getProgressColor(level.status)}`}
                          style={{
                            width: `${getStockPercentage(level.currentStock, 0, level.maxStock)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatNumber(level.minStock)}</span>
                        <span>{formatNumber(level.maxStock)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(level.currentStock)} {level.unit}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatNumber(level.availableStock)}
                  </TableCell>
                  <TableCell className="text-right">{level.daysOfStock}</TableCell>
                  <TableCell className="text-right">{formatCurrency(level.totalValue)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onView(level)}>
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
  );
}
