import { useAppStore } from '@/stores/useAppStore';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { ModuleKPISection } from '@/components/dashboard/ModuleKPISection';
import { ConsolidatedCharts } from '@/components/dashboard/ConsolidatedCharts';
import { GlobalAlerts } from '@/components/dashboard/GlobalAlerts';
import { UsagePanel } from '@/components/plan/UsagePanel';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { ExecutiveConsensus } from '@/components/executive/ExecutiveConsensus';
import { ExecutiveCouncilPanel } from '@/components/executive/ExecutiveCouncilPanel';
import { ExecutiveActionsPanel } from '@/components/executive/ExecutiveActionsPanel';
import { useDashboardData } from '@/hooks/system/useDashboardData';
import { useExecutiveDashboard, useUnifiedChat } from '@/hooks/ai/useExecutiveAI';
import {
  ShoppingCart, Wallet, Package, Factory, Truck, Warehouse,
  DollarSign, TrendingUp, ArrowDownCircle, ArrowUpCircle,
  RefreshCw, ShieldCheck, Scissors, Building, Database,
  Users, Target, Navigation
} from 'lucide-react';
import { Card, CardContent } from '@/ui/base/card';
import { Skeleton } from '@/ui/base/skeleton';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

const iconMap = [DollarSign, TrendingUp, ArrowDownCircle, ArrowUpCircle];

const colorClasses: Record<string, { bg: string; icon: string; ring: string }> = {
  primary: { bg: 'bg-primary/10', icon: 'text-primary', ring: 'ring-primary/20' },
  success: { bg: 'bg-success/10', icon: 'text-success', ring: 'ring-success/20' },
  warning: { bg: 'bg-warning/10', icon: 'text-warning', ring: 'ring-warning/20' },
  info: { bg: 'bg-info/10', icon: 'text-info', ring: 'ring-info/20' },
};

const emptyModulePerformance = [
  { name: 'Comercial', value: 0, color: 'hsl(var(--primary))' },
  { name: 'Financeiro', value: 0, color: 'hsl(var(--success))' },
  { name: 'Estoque', value: 0, color: 'hsl(var(--info))' },
  { name: 'WMS', value: 0, color: 'hsl(var(--warning))' },
  { name: 'Produção', value: 0, color: 'hsl(142, 76%, 36%)' },
  { name: 'Compras', value: 0, color: 'hsl(262, 83%, 58%)' },
];

export default function Dashboard() {
  const { activeCompany, activeBranch } = useAppStore();
  const { segment } = useEnterprise();
  const { data, isLoading } = useDashboardData();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: executiveData } = useExecutiveDashboard(1, segment);
  const { sendMessage } = useUnifiedChat();

  const insights = executiveData?.insights || [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['dashboard-consolidated'] });
    setTimeout(() => setIsRefreshing(false), 600);
  };

  if (isLoading) {
    return (
      <main className="space-y-6" role="status" aria-live="polite" aria-label="Carregando dashboard">
        <div>
          <Skeleton className="h-8 w-72 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))}
        </div>
        <span className="sr-only">Carregando indicadores do dashboard…</span>
      </main>
    );
  }

  const {
    mainKPIs = [], commercialKPIs = [], financialKPIs = [], inventoryKPIs = [],
    productionKPIs = [], purchasingKPIs = [], wmsKPIs = [],
    hrKPIs = [], crmKPIs = [], logisticKPIs = [],
    statusDistribution = [], alerts = [],
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard Consolidado</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visão geral • {activeCompany?.name}{activeBranch ? ` - ${activeBranch.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2 text-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            Atualizar
          </Button>
          <p className="text-xs text-muted-foreground">
            Auto-refresh 60s
          </p>
        </div>
      </div>

      {/* Centro de Comando e Orquestração IA - Cockpit Panorâmico */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-8 xl:col-span-9 h-full">
          <ExecutiveCouncilPanel />
        </div>
        <div className="lg:col-span-4 xl:col-span-3 h-full">
          <ExecutiveConsensus />
        </div>
      </div>

      {/* Ações Recomendadas */}
      {insights.length > 0 && (
        <ExecutiveActionsPanel 
          actions={insights.slice(0, 3).map((ins: any) => ({
            title: ins.title,
            description: ins.description,
            impact: ins.impact_estimate,
            priority: ins.severity,
            module: ins.module
          }))}
          onExecute={sendMessage}
        />
      )}

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mainKPIs.map((kpi, idx) => {
          const Icon = iconMap[idx] || DollarSign;
          const colors = colorClasses[kpi.color] || colorClasses.primary;
          return (
            <Card
              key={kpi.title}
              className="hover-lift group cursor-default"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.title}</p>
                    <p className="text-2xl font-bold text-foreground tabular-nums animate-count-up">{kpi.value}</p>
                    <div className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                      kpi.change >= 0
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    )}>
                      {kpi.change >= 0 ? '↑' : '↓'} {Math.abs(kpi.change).toFixed(1)}%
                    </div>
                  </div>
                  <div className={cn('rounded-xl p-2.5 ring-1 transition-transform duration-200 group-hover:scale-110', colors.bg, colors.ring)}>
                    <Icon className={cn('h-5 w-5', colors.icon)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* KPIs por Módulo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ModuleKPISection title="Comercial" icon={ShoppingCart} kpis={commercialKPIs} accentColor="bg-primary" />
        <ModuleKPISection title="Financeiro" icon={Wallet} kpis={financialKPIs} accentColor="bg-success" />
        {segment !== 'services' && <ModuleKPISection title="Estoque" icon={Package} kpis={inventoryKPIs} accentColor="bg-info" />}
        {segment !== 'services' && <ModuleKPISection title="WMS" icon={Warehouse} kpis={wmsKPIs} accentColor="bg-warning" />}
        {segment === 'textile' && <ModuleKPISection title="Produção" icon={Factory} kpis={productionKPIs} accentColor="bg-[hsl(142,76%,36%)]" />}
        
        {/* Vertical Specific Shortcuts */}
        {segment === 'textile' && (
          <Card className="border-l-4 border-l-purple-500 bg-purple-500/5 hover:bg-purple-500/10 transition-all cursor-pointer" onClick={() => window.location.href='/vertical/textile'}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl"><Factory className="text-purple-600 h-6 w-6" /></div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Vertical</p>
                <p className="font-bold">Indústria Têxtil</p>
                <p className="text-[10px] text-purple-600 font-medium">Acessar Dashboard Especializado →</p>
              </div>
            </CardContent>
          </Card>
        )}
        {segment === 'apparel' && (
          <Card className="border-l-4 border-l-orange-500 bg-orange-500/5 hover:bg-orange-500/10 transition-all cursor-pointer" onClick={() => window.location.href='/vertical/apparel'}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-xl"><Scissors className="text-orange-600 h-6 w-6" /></div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Vertical</p>
                <p className="font-bold">Confecção & Moda</p>
                <p className="text-[10px] text-orange-600 font-medium">Acessar Dashboard Especializado →</p>
              </div>
            </CardContent>
          </Card>
        )}
        {segment === 'pharma' && (
          <Card className="border-l-4 border-l-blue-500 bg-blue-500/5 hover:bg-blue-500/10 transition-all cursor-pointer" onClick={() => window.location.href='/vertical/pharma'}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl"><ShieldCheck className="text-blue-600 h-6 w-6" /></div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Vertical</p>
                <p className="font-bold">Farmacêutico</p>
                <p className="text-[10px] text-blue-600 font-medium">Acessar Dashboard Especializado →</p>
              </div>
            </CardContent>
          </Card>
        )}
        {segment === 'retail' && (
          <Card className="border-l-4 border-l-pink-500 bg-pink-500/5 hover:bg-pink-500/10 transition-all cursor-pointer" onClick={() => window.location.href='/vertical/retail'}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-pink-500/10 rounded-xl"><ShoppingCart className="text-pink-600 h-6 w-6" /></div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Vertical</p>
                <p className="font-bold">Varejo & Redes</p>
                <p className="text-[10px] text-pink-600 font-medium">Acessar Dashboard Especializado →</p>
              </div>
            </CardContent>
          </Card>
        )}
        {segment === 'distribution' && (
          <Card className="border-l-4 border-l-green-500 bg-green-500/5 hover:bg-green-500/10 transition-all cursor-pointer" onClick={() => window.location.href='/vertical/distribution'}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl"><Truck className="text-green-600 h-6 w-6" /></div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Vertical</p>
                <p className="font-bold">Distribuição & Atacado</p>
                <p className="text-[10px] text-green-600 font-medium">Acessar Dashboard Especializado →</p>
              </div>
            </CardContent>
          </Card>
        )}
        {segment === 'wholesaler' && (
          <Card className="border-l-4 border-l-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all cursor-pointer" onClick={() => window.location.href='/vertical/wholesaler'}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl"><Database className="text-emerald-600 h-6 w-6" /></div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Vertical</p>
                <p className="font-bold">Atacadista</p>
                <p className="text-[10px] text-emerald-600 font-medium">Acessar Dashboard Especializado →</p>
              </div>
            </CardContent>
          </Card>
        )}
        {segment === 'holding' && (
          <Card className="border-l-4 border-l-slate-500 bg-slate-500/5 hover:bg-slate-500/10 transition-all cursor-pointer" onClick={() => window.location.href='/vertical/holding'}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-slate-500/10 rounded-xl"><Building className="text-slate-600 h-6 w-6" /></div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Vertical</p>
                <p className="font-bold">Holding & Grupos</p>
                <p className="text-[10px] text-slate-600 font-medium">Acessar Consolidação →</p>
              </div>
            </CardContent>
          </Card>
        )}

        <ModuleKPISection title="Compras" icon={Truck} kpis={purchasingKPIs} accentColor="bg-[hsl(262,83%,58%)]" />
        <ModuleKPISection title="RH & Capital Humano" icon={Users} kpis={hrKPIs} accentColor="bg-pink-500" />
        <ModuleKPISection title="CRM & Marketing" icon={Target} kpis={crmKPIs} accentColor="bg-indigo-500" />
        <ModuleKPISection title="Logística & TMS" icon={Navigation} kpis={logisticKPIs} accentColor="bg-cyan-500" />
      </div>

      {/* Gráficos Consolidados */}
      <ConsolidatedCharts
        modulePerformance={data?.modulePerformance || emptyModulePerformance}
        statusDistribution={statusDistribution}
      />

      {/* Alertas + Faturamento + Atividades */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1 space-y-6">
          <GlobalAlerts alerts={alerts} />
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
              <ShieldCheck className="h-3 w-3" /> Integridade do Core
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Sincronização</span>
                <Badge variant="outline" className="text-[9px] bg-success/10 text-success border-success/20">Real-time</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Motor de Regras</span>
                <span className="text-[10px] font-bold">L4 Enterprise</span>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-3 space-y-6">
          <UsagePanel />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <RevenueChart />
            </div>
            <RecentActivities />
          </div>
        </div>
      </div>
    </div>
  );
}
