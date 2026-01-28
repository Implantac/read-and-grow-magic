import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Warehouse,
  Package,
  PackagePlus,
  PackageSearch,
  PackageCheck,
  Truck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  CheckCircle,
  MapPin,
  ArrowUpDown
} from 'lucide-react';
import { 
  wmsSummary,
  receivingOrders,
  pickingOrders,
  packingOrders,
  storageLocations,
  inventoryMovements,
  inventoryItems
} from '@/data/wmsMockData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function WMSDashboardPage() {
  // Calculate real-time stats
  const pendingReceiving = receivingOrders.filter(o => o.status === 'pending' || o.status === 'in_progress').length;
  const activePicking = pickingOrders.filter(o => o.status === 'pending' || o.status === 'assigned' || o.status === 'in_progress').length;
  const pendingPacking = packingOrders.filter(o => o.status === 'pending' || o.status === 'packing').length;
  const readyToShip = packingOrders.filter(o => o.status === 'packed').length;
  
  // Storage stats
  const totalCapacity = storageLocations.reduce((sum, l) => sum + l.capacity, 0);
  const totalOccupied = storageLocations.reduce((sum, l) => sum + l.occupied, 0);
  const occupancyRate = Math.round((totalOccupied / totalCapacity) * 100);
  
  // Inventory alerts
  const lowStockItems = inventoryItems.filter(i => i.availableQty <= i.minStock).length;
  const expiredItems = inventoryItems.filter(i => i.status === 'expired').length;
  const quarantineItems = inventoryItems.filter(i => i.status === 'quarantine').length;

  // Recent movements
  const recentMovements = inventoryMovements.slice(0, 5);

  // Urgent pickings
  const urgentPickings = pickingOrders.filter(o => o.priority === 'urgent' && o.status !== 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard WMS</h1>
          <p className="text-muted-foreground">Visão geral das operações do armazém</p>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebimentos</CardTitle>
            <PackagePlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReceiving}</div>
            <p className="text-xs text-muted-foreground">Pendentes/Em andamento</p>
            <Link to="/wms/recebimento">
              <Button variant="link" className="px-0 mt-2 h-auto">
                Ver todos <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Picking</CardTitle>
            <PackageSearch className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePicking}</div>
            <p className="text-xs text-muted-foreground">Ordens ativas</p>
            <Link to="/wms/picking">
              <Button variant="link" className="px-0 mt-2 h-auto">
                Ver todos <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Packing</CardTitle>
            <PackageCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPacking}</div>
            <p className="text-xs text-muted-foreground">Para embalar</p>
            <Link to="/wms/packing">
              <Button variant="link" className="px-0 mt-2 h-auto">
                Ver todos <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prontos p/ Expedição</CardTitle>
            <Truck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readyToShip}</div>
            <p className="text-xs text-muted-foreground">Aguardando envio</p>
            <Link to="/wms/packing">
              <Button variant="link" className="px-0 mt-2 h-auto">
                Ver todos <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Storage Occupancy */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Ocupação do Armazém
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Taxa de Ocupação</span>
                  <span className={occupancyRate > 85 ? 'text-destructive font-medium' : 'font-medium'}>
                    {occupancyRate}%
                  </span>
                </div>
                <Progress value={occupancyRate} className="h-3" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Endereços</p>
                  <p className="font-medium">{storageLocations.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Capacidade</p>
                  <p className="font-medium">{totalOccupied}/{totalCapacity}</p>
                </div>
              </div>
              <Link to="/wms/enderecamento">
                <Button variant="outline" size="sm" className="w-full">
                  <MapPin className="h-4 w-4 mr-2" />
                  Ver Endereçamento
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">Estoque Baixo</span>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    {lowStockItems}
                  </Badge>
                </div>
              )}
              {expiredItems > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Produtos Vencidos</span>
                  </div>
                  <Badge variant="destructive">{expiredItems}</Badge>
                </div>
              )}
              {quarantineItems > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-orange-50 dark:bg-orange-950">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Em Quarentena</span>
                  </div>
                  <Badge variant="outline" className="border-orange-500 text-orange-600">
                    {quarantineItems}
                  </Badge>
                </div>
              )}
              {lowStockItems === 0 && expiredItems === 0 && quarantineItems === 0 && (
                <div className="flex items-center gap-2 p-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Nenhum alerta</span>
                </div>
              )}
              <Link to="/wms/inventario">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Ver Inventário
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Urgent Pickings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pickings Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {urgentPickings.length > 0 ? (
                urgentPickings.slice(0, 3).map((picking) => (
                  <div key={picking.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
                    <div>
                      <p className="text-sm font-medium">{picking.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{picking.customerName}</p>
                    </div>
                    <Badge className="bg-red-500 text-white">URGENTE</Badge>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 p-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Nenhum picking urgente</span>
                </div>
              )}
              <Link to="/wms/picking">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Ver Todos Pickings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Movimentações Recentes
            </CardTitle>
            <Link to="/wms/movimentacoes">
              <Button variant="outline" size="sm">
                Ver Todas
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentMovements.map((movement) => {
              const isInbound = movement.type === 'inbound';
              const isOutbound = movement.type === 'outbound';
              
              return (
                <div key={movement.id} className="flex items-center gap-4 p-3 rounded-lg border">
                  <div className={`p-2 rounded-full ${
                    isInbound ? 'bg-green-100 text-green-600' :
                    isOutbound ? 'bg-red-100 text-red-600' :
                    movement.type === 'transfer' ? 'bg-blue-100 text-blue-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {isInbound ? <TrendingUp className="h-4 w-4" /> :
                     isOutbound ? <TrendingDown className="h-4 w-4" /> :
                     movement.type === 'transfer' ? <ArrowRight className="h-4 w-4" /> :
                     <Package className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{movement.productName}</span>
                      <Badge variant="outline" className="text-xs">
                        {movement.productCode}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {movement.reason}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      isInbound ? 'text-green-600' :
                      isOutbound ? 'text-red-600' :
                      'text-muted-foreground'
                    }`}>
                      {isInbound ? '+' : ''}{movement.quantity}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(movement.createdAt), 'HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Link to="/wms/recebimento">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <PackagePlus className="h-6 w-6" />
                <span>Novo Recebimento</span>
              </Button>
            </Link>
            <Link to="/wms/picking">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <PackageSearch className="h-6 w-6" />
                <span>Iniciar Picking</span>
              </Button>
            </Link>
            <Link to="/wms/movimentacoes">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <ArrowUpDown className="h-6 w-6" />
                <span>Nova Movimentação</span>
              </Button>
            </Link>
            <Link to="/wms/inventario">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Package className="h-6 w-6" />
                <span>Ajuste Inventário</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
