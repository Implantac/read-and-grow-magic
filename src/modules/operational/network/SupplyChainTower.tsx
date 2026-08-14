import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { 
  TowerControl, 
  AlertTriangle, 
  TrendingUp, 
  Truck, 
  Brain,
  Clock,
  ArrowRight,
  ChevronRight,
  Filter
} from "lucide-react";
import { useEstoqueMatrix } from "@/hooks/inventory/useEstoqueMatrix";
import { stockEngine } from "@/services/operational/inventory/stockEngine";
import { Link } from "react-router-dom";

export default function SupplyChainTower() {
  const { data: matrix = [], isLoading } = useEstoqueMatrix('', true);

  const stats = {
    ruptures: matrix.filter(m => m.quantity <= 0).length,
    critical: matrix.filter(m => {
        const p = stockEngine.calculateProjected(m);
        return p.status === 'critical';
    }).length,
    inTransit: 43, // Placeholder para integração real com transfers
    delayed: 12,
    suggestions: 87
  };

  return (
    <PageContainer loading={isLoading}>
      <PageHeader 
        title="Torre de Controle de Abastecimento" 
        description="Gestão preditiva e orquestração de malha logística Read & Grow"
        icon={TowerControl}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
          <Button size="sm" className="gap-2">
            <Brain className="h-4 w-4" /> IA: Otimizar Malha
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <StatCard title="Rupturas" value={stats.ruptures} icon={AlertTriangle} variant="destructive" />
        <StatCard title="Críticos" value={stats.critical} icon={TrendingUp} variant="warning" />
        <StatCard title="Em Trânsito" value={stats.inTransit} icon={Truck} variant="info" />
        <StatCard title="Atrasados" value={stats.delayed} icon={Clock} variant="destructive" />
        <StatCard title="Sugestões" value={stats.suggestions} icon={Brain} variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Prioridades de Abastecimento</CardTitle>
            <CardDescription>SKUs com maior risco de ruptura nos próximos 3 dias</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {matrix.slice(0, 8).map((item, idx) => {
                const projected = stockEngine.calculateProjected(item);
                return (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={projected.status === 'critical' ? 'text-destructive' : 'text-amber-500'}>
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{item.product_name}</p>
                        <p className="text-[10px] text-muted-foreground">{item.branch_name} | SKU: {item.product_code}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-6">
                        <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-medium">Cobertura</p>
                            <p className={`text-sm font-bold ${projected.status === 'critical' ? 'text-destructive' : 'text-amber-500'}`}>
                                {projected.coverageDays.toFixed(1)} dias
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-medium">Falta</p>
                            <p className="text-sm font-bold">{item.min_stock - projected.projected} un</p>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                            <Link to="/logistica/reposicao-inteligente">
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                    <CardTitle className="text-md">Saúde da Rede</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Lojas com Risco</span>
                        <Badge variant="outline" className="text-destructive border-destructive/20">{stats.critical} Unidades</Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Eficiência de Giro</span>
                        <span className="font-bold text-success">92.4%</span>
                    </div>
                    <Button className="w-full gap-2 mt-4" asChild>
                        <Link to="/operacional/saude-lojas">
                            Ver Mapa de Saúde <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-md flex items-center gap-2">
                        <Brain className="h-4 w-4 text-primary" /> Sugestões Pendentes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="p-3 rounded-lg border bg-accent/30 text-xs">
                            <p className="font-bold">Otimização de Surplus</p>
                            <p className="text-muted-foreground mt-1">Identificamos excesso de estoque em 4 lojas que podem suprir as rupturas do Shopping Norte.</p>
                            <Button variant="link" className="p-0 h-auto text-[10px] mt-2 text-primary" asChild>
                                <Link to="/logistica/reposicao-inteligente">Analisar agora</Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </PageContainer>
  );
}

function StatCard({ title, value, icon: Icon, variant = 'default' }: any) {
    const colors = {
        default: 'bg-muted/50 border-border',
        destructive: 'bg-destructive/5 border-destructive/20 text-destructive',
        warning: 'bg-amber-500/5 border-amber-500/20 text-amber-600',
        info: 'bg-blue-500/5 border-blue-500/20 text-blue-600',
        success: 'bg-success/5 border-success/20 text-success'
    };
    return (
        <Card className={colors[variant as keyof typeof colors]}>
            <CardContent className="p-4 flex flex-col items-center justify-center gap-1">
                <Icon className="h-4 w-4 opacity-70" />
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{title}</p>
                <p className="text-2xl font-black">{value}</p>
            </CardContent>
        </Card>
    );
}
