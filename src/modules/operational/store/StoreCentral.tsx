import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { Progress } from "@/ui/base/progress";
import { useStoreCentral } from "@/hooks/operational/store/useStoreCentral";
import { 
  Store, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Truck, 
  RefreshCw, 
  ChevronRight, 
  CheckCircle2, 
  Heart,
  ShieldCheck,
  DollarSign,
  Ticket,
  Clock,
  ArrowRight,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Skeleton } from "@/ui/base/skeleton";

export default function StoreCentral() {
  const { kpis, alerts, health, reliability, isLoading, refetch } = useStoreCentral();

  if (isLoading) {
    return (
      <PageContainer loading>
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Central da Loja" 
        description="Painel operacional integrado para gestão de unidade"
        icon={Store}
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            Loja Operacional
          </Badge>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} /> Atualizar
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lado Esquerdo: Resumo e KPIs */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Dashboard Superior */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard 
              title="Vendas Hoje" 
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis?.sales || 0)} 
              icon={DollarSign}
              trend="+12%"
              variant="default"
            />
            <KPICard 
              title="Ticket Médio" 
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis?.ticketAverage || 0)} 
              icon={Ticket}
              trend="+5%"
              variant="default"
            />
            <KPICard 
              title="Estoque" 
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((kpis?.stockValue || 0) / 1000) + ' mil'} 
              icon={Package}
              variant="info"
            />
            <KPICard 
              title="Rupturas" 
              value={kpis?.ruptures || 0} 
              icon={AlertTriangle}
              variant={ (kpis?.ruptures || 0) > 0 ? "warning" : "success" }
            />
          </div>

          {/* O que precisa da sua atenção? */}
          <Card className="border-primary/20 shadow-elevation-2">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Prioridades Operacionais (Orquestradas)</CardTitle>

                  <CardDescription>Pendências críticas detectadas pelo Ecossistema Global (EOE)</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/5 animate-pulse">
                    {alerts?.filter(a => a.type === 'critical').length} Críticos
                  </Badge>
                  <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                    UEEF Nível 4
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary opacity-20" />
                    <p className="text-xs text-muted-foreground mt-2">Carregando tarefas críticas...</p>
                  </div>
                ) : alerts?.length > 0 ? (
                  alerts.map((alert) => (
                    <div key={alert.id} className="p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors group relative overflow-hidden">
                      {alert.type === 'critical' && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                      )}
                      <div className={cn(
                        "p-2 rounded-full ring-1 ring-inset relative z-10",
                        alert.type === 'critical' ? "bg-destructive/10 text-destructive ring-destructive/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : 
                        alert.type === 'warning' ? "bg-warning/10 text-warning ring-warning/20" : "bg-primary/10 text-primary ring-primary/20"
                      )}>
                        {alert.category === 'rupture' && <AlertTriangle className="h-5 w-5" />}
                        {alert.category === 'receiving' && <Package className="h-5 w-5" />}
                        {alert.category === 'transfer' && <Truck className="h-5 w-5" />}
                        {alert.category === 'cashier' && <DollarSign className="h-5 w-5" />}
                        {alert.category === 'replenishment' && <RefreshCw className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm">{alert.title}</p>
                          {alert.actionPath && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                              <Link to={alert.actionPath}>
                                {alert.actionLabel || 'Tratar'} <ChevronRight className="h-3 w-3" />
                              </Link>
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Nenhuma pendência crítica encontrada.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seção Operacional Secundária */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-md flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Transferências & Recebimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-accent/30">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-primary/10 text-primary">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{kpis?.inTransit || 0} Em Trânsito</p>
                      <p className="text-[10px] text-muted-foreground">Previsão: Hoje</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-[10px] h-7">Rastrear</Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-accent/30">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-success/10 text-success">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{kpis?.receiving || 0} Recebido</p>
                      <p className="text-[10px] text-muted-foreground">Aguardando conferência</p>
                    </div>
                  </div>
                  <Button variant="default" size="sm" className="text-[10px] h-7">Conferir</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-md flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" /> Reabastecimento Sugerido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sugestões Pendentes</span>
                    <span className="font-bold">{kpis?.itemsPending || 0} itens</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-destructive font-medium bg-destructive/5 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Risco de Ruptura Alto
                    </div>
                    <span>{kpis?.unitsPending || 0} un</span>
                  </div>
                  <Button className="w-full gap-2 mt-2">
                    Analisar Sugestão <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lado Direito: Saúde e Índices */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" /> Saúde Operacional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center py-4">
                <div className="text-4xl font-black text-primary">{health?.score}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Score Total</div>
                <Badge className={cn(
                  "mt-2 text-white",
                  health?.status === 'excellent' ? "bg-success hover:bg-success/90" : 
                  health?.status === 'attention' ? "bg-amber-500 hover:bg-amber-600" : 
                  "bg-destructive hover:bg-destructive/90"
                )}>
                  {health?.status === 'excellent' ? 'Excelente' : 
                   health?.status === 'attention' ? 'Atenção' : 'Crítico'}
                </Badge>
              </div>
              <div className="space-y-3">
                {health?.factors.map((factor) => (
                  <div key={factor.label} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-medium">
                      <span>{factor.label}</span>
                      <span>{factor.score}%</span>
                    </div>
                    <Progress value={factor.score} className="h-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success" /> Acuracidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{reliability}%</div>
              <p className="text-[10px] text-muted-foreground mt-1">Confiabilidade do estoque baseada em inventários cíclicos.</p>
              <div className="mt-4 pt-4 border-t space-y-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Ranking Eficiência</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Posição na Rede</span>
                  <span className="font-bold text-primary">{health?.networkPosition || '—'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed border-primary/40 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-primary/70">Auditoria Cíclica (Smart)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <ClipboardList className="h-4 w-4" />
                <span className="text-sm font-bold">12 SKUs Críticos</span>
              </div>
              <p className="text-[10px] text-muted-foreground">O motor de inteligência selecionou itens de alto giro e risco de ruptura para conferência hoje.</p>
              <Button variant="default" size="sm" className="w-full text-xs font-bold shadow-sm" asChild>
                <Link to="/estoque/inventario">Iniciar Contagem Cíclica</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

function KPICard({ title, value, icon: Icon, trend, variant = 'default' }: { 
  title: string, 
  value: string | number, 
  icon: any, 
  trend?: string,
  variant?: 'default' | 'info' | 'warning' | 'success'
}) {
  return (
    <Card className={cn(
      "border-border/50",
      variant === 'info' && "bg-info/5 border-info/20",
      variant === 'warning' && "bg-warning/5 border-warning/20",
      variant === 'success' && "bg-success/5 border-success/20",
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-xl font-bold">{value}</p>
            {trend && (
              <p className="text-[10px] font-bold text-success">{trend} <TrendingUp className="inline h-2 w-2" /></p>
            )}
          </div>
          <Icon className={cn(
            "h-4 w-4",
            variant === 'default' && "text-muted-foreground",
            variant === 'info' && "text-info",
            variant === 'warning' && "text-warning",
            variant === 'success' && "text-success",
          )} />
        </div>
      </CardContent>
    </Card>
  );
}
