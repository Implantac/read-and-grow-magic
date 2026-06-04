import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { Users, Target, TrendingUp, Sparkles, Plus } from "lucide-react";

export default function CRMDashboard() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM Enterprise</h1>
          <p className="text-muted-foreground">Gestão estratégica de leads e oportunidades com IA.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            IA Forecast
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Oportunidade
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Leads Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +12% este mês
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pipeline (VGV)</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 4.2M</div>
            <Badge variant="secondary" className="mt-1">Alta Probabilidade</Badge>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Win Rate (IA)</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">64.2%</div>
            <p className="text-xs text-muted-foreground mt-1">Acima da média do setor</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Ciclo de Venda</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18 dias</div>
            <p className="text-xs text-muted-foreground mt-1">-2 dias vs mês anterior</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Funil de Vendas Consolidado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-end justify-between gap-2 px-4">
              {[
                { stage: 'Prospecção', val: 100, color: 'bg-primary/20' },
                { stage: 'Qualificação', val: 80, color: 'bg-primary/40' },
                { stage: 'Proposta', val: 60, color: 'bg-primary/60' },
                { stage: 'Negociação', val: 40, color: 'bg-primary/80' },
                { stage: 'Fechamento', val: 20, color: 'bg-primary' },
              ].map((s) => (
                <div key={s.stage} className="flex-1 flex flex-col items-center gap-2">
                  <div className={cn("w-full rounded-t-lg transition-all hover:brightness-110", s.color)} style={{ height: `${s.val}%` }} />
                  <span className="text-[10px] font-medium text-muted-foreground text-center uppercase tracking-tighter">{s.stage}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Insights da IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-100 dark:bg-purple-900/10 dark:border-purple-900/20">
              <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Oportunidade Crítica
              </h4>
              <p className="text-xs text-purple-600 dark:text-purple-300 mt-1">
                Cliente "Indústria Têxtil XPTO" tem 85% de chance de fechamento se contatado nas próximas 2h.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20">
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Ajuste de Previsão
              </h4>
              <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                A IA detectou uma sazonalidade atípica. Sugerimos focar em leads de "Fiações" para bater a meta.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
