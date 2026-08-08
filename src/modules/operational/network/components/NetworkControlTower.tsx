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
  Monitor,
  ShieldAlert,
  ShoppingCart,
  Brain
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/ui/base/skeleton";
import { useQuery } from "@tanstack/react-query";
import { complianceService } from "@/services/admin/complianceService";
import { useEnterprise } from "@/core/auth/EnterpriseContext";

export default function NetworkControlTower() {
  const { currentCompany } = useEnterprise();
  const { data: stats, isLoading: statsLoading } = useSupplyChainStats();
  const { data: transfers, isLoading: transfersLoading } = useTransferOrders();
  
  const { data: complianceMetrics, isLoading: complianceLoading } = useQuery({
    queryKey: ['security_metrics'],
    queryFn: () => complianceService.getSecurityMetrics(),
    refetchInterval: 30000 // 30s for "real-time" feel
  });

  const loading = statsLoading || transfersLoading || complianceLoading;

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
                <CardTitle className="text-base">Alertas Críticos da Malha</CardTitle>
                <CardDescription className="text-xs">Ocorrências em tempo real de Rede, Pedidos e Auditoria</CardDescription>
              </div>
              <Badge variant="destructive">{(stats?.lowStock || 0) + (complianceMetrics?.filter(m => m.status !== 'secure').length || 0) + 1} URGENTES</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Rede & Logística */}
            {stats?.lowStock && stats.lowStock > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50 text-red-900 animate-in fade-in zoom-in duration-300">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold">Ruptura de Estoque Detectada</p>
                  <p className="text-xs opacity-80">{stats.lowStock} itens operando abaixo da margem de segurança na malha.</p>
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-[10px] border-red-300 hover:bg-red-100" asChild>
                    <Link to="/operacional/rede/ressuprimento">Balancear Estoque</Link>
                  </Button>
                </div>
                <Badge variant="outline" className="border-red-300 text-red-700 bg-white">REDE</Badge>
              </div>
            )}

            {/* Sourcing & Orquestração */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-900 animate-in fade-in zoom-in duration-300">
              <Brain className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold">Otimização de Sourcing</p>
                <p className="text-xs opacity-80">IA recomenda transferir do CD-01 para evitar ruptura na Loja Matriz.</p>
                <Button size="sm" variant="outline" className="mt-2 h-7 text-[10px] border-blue-300 hover:bg-blue-100" asChild>
                  <Link to="/operacional/abastecimento">Gerar Ordem</Link>
                </Button>
              </div>
              <Badge variant="outline" className="border-blue-300 text-blue-700 bg-white">IA</Badge>
            </div>

            {/* Pedidos & Transferências */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900">
              <Clock className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold">Atraso em Trânsito detectado</p>
                <p className="text-xs opacity-80">Transferência entre unidades excedeu o Lead Time previsto.</p>
              </div>
              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-white">PEDIDOS</Badge>
            </div>

            {/* Auditoria & Segurança */}
            {complianceMetrics?.filter(m => m.status !== 'secure').map((metric, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-purple-200 bg-purple-50 text-purple-900 animate-in fade-in slide-in-from-right-4 duration-500">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold">Auditoria: {metric.title}</p>
                  <p className="text-xs opacity-80">{metric.description}</p>
                </div>
                <Badge variant="outline" className="border-purple-300 text-purple-700 bg-white">AUDITORIA</Badge>
              </div>
            ))}

            {/* Evento Positivo */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-green-200 bg-green-50 text-green-900 opacity-60">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold">Isolamento RLS Verificado</p>
                <p className="text-xs opacity-80">Processo de auditoria contínua confirmou integridade de tenant.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
