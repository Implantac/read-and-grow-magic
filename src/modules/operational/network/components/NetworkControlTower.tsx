import { useSupplyChainStats, useTransferOrders } from "@/hooks/operational/network/useNetworkArchitecture";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { 
  Truck, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  ArrowRight,
  Monitor
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/ui/base/skeleton";

export default function NetworkControlTower() {
  const { data: stats, isLoading: statsLoading } = useSupplyChainStats();
  const { data: transfers, isLoading: transfersLoading } = useTransferOrders();

  const loading = statsLoading || transfersLoading;

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="h-[120px]"><Skeleton className="h-full w-full" /></Card>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: "Em Trânsito",
      value: stats?.inTransit || 0,
      description: "Transferências entre unidades",
      icon: Truck,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Rupturas Críticas",
      value: stats?.lowStock || 0,
      description: "Abaixo do estoque mínimo",
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-500/10"
    },
    {
      title: "Acuracidade",
      value: `${stats?.accuracy || 0}%`,
      description: "Precisão Sourcing IA",
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10"
    },
    {
      title: "Terminais Ativos",
      value: "24/25",
      description: "PDVs operacionais",
      icon: Monitor,
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-primary/10 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <div className={`p-2 rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Transferências Recentes</CardTitle>
                <CardDescription className="text-xs">Fluxo de mercadorias na malha</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-8 text-primary">
                <Link to="/operacional/rede/transferencias">Ver todas</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {transfers && transfers.length > 0 ? (
              transfers.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Truck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">TRF-{order.id.split('-')[0].toUpperCase()}</span>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span>{order.origin?.name}</span>
                        <ArrowRight className="h-2 w-2" />
                        <span>{order.destination?.name}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={order.status === 'shipped' ? 'default' : 'secondary'} className="text-[10px]">
                    {order.status === 'shipped' ? 'Em Trânsito' : order.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground border-2 border-dashed rounded-lg">
                <Clock className="h-6 w-6 mb-2 opacity-20" />
                <span className="text-sm italic">Nenhuma transferência recente</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-sm bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Alertas da Torre</CardTitle>
                <CardDescription className="text-xs">Ocorrências que exigem ação</CardDescription>
              </div>
              <Badge variant="destructive">2 URGENTES</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50 text-red-900">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">Ruptura Iminente: CD Sul</p>
                <p className="text-xs opacity-80">Produto 'Smart Widget' ficará sem saldo em 48h com base na demanda atual.</p>
                <Button size="sm" variant="outline" className="mt-2 h-7 text-[10px] border-red-300 hover:bg-red-100">Resolver agora</Button>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900">
              <Clock className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">Atraso em Trânsito: TRF-A92B</p>
                <p className="text-xs opacity-80">Transferência para Unidade Centro excedeu o Lead Time previsto em 4h.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border border-green-200 bg-green-50 text-green-900">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">Balanceamento Concluído</p>
                <p className="text-xs opacity-80">3 transferências sugeridas pela IA foram executadas com sucesso.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
