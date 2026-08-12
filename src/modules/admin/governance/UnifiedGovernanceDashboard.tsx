import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  ShieldCheck, 
  Brain, 
  Filter, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  Zap,
  Lock,
  History,
  Info
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/base/tabs";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// Mock data for the dashboard
const LEDGER_HISTORY = [
  { date: '01/08', movements: 120, audits: 45, anomalies: 0 },
  { date: '02/08', movements: 150, audits: 50, anomalies: 1 },
  { date: '03/08', movements: 180, audits: 60, anomalies: 0 },
  { date: '04/08', movements: 220, audits: 75, anomalies: 0 },
  { date: '05/08', movements: 210, audits: 70, anomalies: 2 },
  { date: '06/08', movements: 250, audits: 85, anomalies: 0 },
  { date: '07/08', movements: 300, audits: 100, anomalies: 0 },
];

const SECURITY_STATS = [
  { name: 'Auth Attempts', value: 450, status: 'secure' },
  { name: 'RLS Filtered', value: 1240, status: 'secure' },
  { name: 'Policy Hits', value: 8900, status: 'secure' },
  { name: 'Divergencies', value: 0, status: 'critical' },
];

export function UnifiedGovernanceDashboard() {
  const [module, setModule] = useState('all');
  const [period, setPeriod] = useState('7d');
  const [drillDown, setDrillDown] = useState<{ type: 'ledger' | 'security' | 'ai', module: string } | null>(null);

  if (drillDown) {
    return (
      <import { GovernanceDrillDown } from './GovernanceDrillDown' /> && 
      <GovernanceDrillDown 
        type={drillDown.type} 
        module={drillDown.module} 
        onBack={() => setDrillDown(null)} 
      />
    );
  }


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filters Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-4 rounded-xl border">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros de Visão:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={module} onValueChange={setModule}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Módulos</SelectItem>
              <SelectItem value="wms">WMS & Logística</SelectItem>
              <SelectItem value="financial">Financeiro</SelectItem>
              <SelectItem value="commercial">Comercial</SelectItem>
            </SelectContent>
          </Select>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] h-9">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Ledger KPI */}
        <Card className="border-blue-500/20 bg-blue-500/5 overflow-hidden group">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="h-4 w-4 text-blue-500" /> Ledger Logístico
              </CardTitle>
              <Badge variant="outline" className="border-blue-500/30 text-blue-600 bg-white">
                IMUTÁVEL
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-2xl font-black">1.432</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500" /> +12% vs período anterior
                </p>
              </div>
              <div className="h-10 w-24 opacity-50 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={LEDGER_HISTORY}>
                    <Area type="monotone" dataKey="movements" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Governance KPI */}
        <Card className="border-emerald-500/20 bg-emerald-500/5 overflow-hidden group">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Governança UEEF
              </CardTitle>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-white uppercase">
                SEC-LEVEL 3
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-2xl font-black">100%</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Lock className="h-3 w-3 text-emerald-500" /> RLS Isolation verified
                </p>
              </div>
              <Activity className="h-8 w-8 text-emerald-500/20 group-hover:text-emerald-500 transition-colors" />
            </div>
          </CardContent>
        </Card>

        {/* Autopilot KPI */}
        <Card className="border-amber-500/20 bg-amber-500/5 overflow-hidden group">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Brain className="h-4 w-4 text-amber-500" /> Autopilot IA
              </CardTitle>
              <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-white">
                PREDITIVO
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-2xl font-black">94.2%</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Zap className="h-3 w-3 text-amber-500" /> 84 recomendações geradas
                </p>
              </div>
              <ResponsiveContainer width={60} height={40}>
                <LineChart data={LEDGER_HISTORY}>
                  <Line type="monotone" dataKey="audits" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:w-[400px]">
          <TabsTrigger value="activity">Atividade Ledger</TabsTrigger>
          <TabsTrigger value="security">Segurança RLS</TabsTrigger>
          <TabsTrigger value="ai">IA Intelligence</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Rastreabilidade Imutável (Volume de Movimentações)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={LEDGER_HISTORY}>
                    <defs>
                      <linearGradient id="colorMovements" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="movements" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorMovements)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Métricas de Isolamento de Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {SECURITY_STATS.map((stat, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-full", stat.status === 'secure' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                          {stat.status === 'secure' ? <ShieldCheck className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                        </div>
                        <span className="text-sm font-medium">{stat.name}</span>
                      </div>
                      <div className="text-sm font-bold">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" /> Conformidade UEEF
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A Governança do sistema opera sob o modelo <strong>Evolution Mode (UEEF v1.0)</strong>. 
                  Todas as requisições ao banco de dados são filtradas por políticas de Row-Level Security (RLS) 
                  garantindo que o contexto de <code>company_id</code> seja inviolável.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-white">SEC-LEVEL 3</Badge>
                  <Badge variant="outline" className="bg-white">MULTI-TENANT ISOLATED</Badge>
                  <Badge variant="outline" className="bg-white">AUDIT TRIGGER ENABLED</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-5 w-5 text-amber-500" /> Ações do Autopilot IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: 'Sugestão de Compra Gerada', type: 'MRP', desc: 'Baseado em previsão de demanda para os próximos 15 dias.' },
                  { action: 'Alerta de Ruptura CD-01', type: 'RISK', desc: 'Item "X" com consumo acima da média sazonal.' },
                  { action: 'Otimização de Rota', type: 'TMS', desc: 'Consolidação de manifestos para CD Sul.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border hover:border-amber-500/30 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <Zap className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm truncate">{item.action}</span>
                        <Badge variant="secondary" className="text-[10px] uppercase font-black">{item.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0 text-primary">Ver Detalhes</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
