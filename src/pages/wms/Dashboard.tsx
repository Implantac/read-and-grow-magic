import { useWMSDashboardStats } from '@/hooks/useWMSOperations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Warehouse, Package, PackagePlus, PackageSearch, PackageCheck, Truck,
  CheckCircle, MapPin, ArrowUpDown
} from 'lucide-react';

export default function WMSDashboardPage() {
  const { stats, recentMovements, loading } = useWMSDashboardStats();

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
            <div className="text-2xl font-bold">{stats.receiving}</div>
            <p className="text-xs text-muted-foreground">Pendentes/Em andamento</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Picking</CardTitle>
            <PackageSearch className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Ordens ativas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Packing</CardTitle>
            <PackageCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Para embalar</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prontos p/ Expedição</CardTitle>
            <Truck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Aguardando envio</p>
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
                  <span className="font-medium">0%</span>
                </div>
                <Progress value={0} className="h-3" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Endereços</p>
                  <p className="font-medium">0</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Capacidade</p>
                  <p className="font-medium">0/0</p>
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
              <Package className="h-4 w-4" />
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Nenhum alerta</span>
            </div>
            <Link to="/wms/inventario">
              <Button variant="outline" size="sm" className="w-full mt-2">
                Ver Inventário
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Urgent Pickings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PackageSearch className="h-4 w-4" />
              Pickings Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Nenhum picking urgente</span>
            </div>
            <Link to="/wms/picking">
              <Button variant="outline" size="sm" className="w-full mt-2">
                Ver Todos Pickings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Movements - Empty State */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Movimentações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma movimentação registrada
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
