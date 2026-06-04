import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Truck, Package, Clock, BarChart3, MapPin } from "lucide-react";

export default function DistributionDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard de Distribuição</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos em Separação</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">85% dentro do SLA de 4h</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Veículos em Rota</CardTitle>
            <Truck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18 / 22</div>
            <p className="text-xs text-muted-foreground">4 em carregamento ou manutenção</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OTIF (On-Time In-Full)</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96.2%</div>
            <p className="text-xs text-muted-foreground">Meta: 98%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Giro</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 dias</div>
            <p className="text-xs text-muted-foreground">Redução de 1.5 dias vs mês anterior</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Status por Centro de Distribuição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>CD São Paulo (Matriz)</span>
                <span className="font-bold">Capacidade: 82%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>CD Joinville</span>
                <span className="font-bold">Capacidade: 45%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>CD Recife</span>
                <span className="font-bold">Capacidade: 68%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
