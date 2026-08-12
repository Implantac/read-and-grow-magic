
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { 
  ArrowLeft, 
  History, 
  ShieldCheck, 
  Brain, 
  Search, 
  Filter,
  Calendar,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Zap,
  Lock,
  ExternalLink
} from 'lucide-react';
import { Input } from "@/ui/base/input";
import { ScrollArea } from "@/ui/base/scroll-area";
import { cn } from "@/lib/utils";
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface GovernanceDrillDownProps {
  type: 'ledger' | 'security' | 'ai';
  module: string;
  onBack: () => void;
}

const MOCK_EVENTS = {
  ledger: [
    { id: '1', time: '14:25:32', user: 'admin@empresa.com', action: 'Transferência de Estoque', status: 'confirmed', hash: '0x74a...3b2', module: 'WMS' },
    { id: '2', time: '14:10:15', user: 'ia.autopilot', action: 'MRP Reorder Suggestion', status: 'confirmed', hash: '0x89b...1c4', module: 'Logística' },
    { id: '3', time: '13:45:00', user: 'gerente.vendas', action: 'Aprovação de Crédito', status: 'confirmed', hash: '0x22d...9f1', module: 'Comercial' },
    { id: '4', time: '13:20:10', user: 'operador.01', action: 'Entrada de NF-e', status: 'warning', hash: '0xfe3...882', module: 'Fiscal' },
  ],
  security: [
    { id: '1', time: '15:00:01', type: 'RLS Filter', detail: 'Attempted access to company_id 45 (denied)', severity: 'high', module: 'Finaceiro' },
    { id: '2', time: '14:45:22', type: 'Policy Hit', detail: 'SELECT on public.products (allowed)', severity: 'low', module: 'WMS' },
    { id: '3', time: '14:30:10', type: 'Auth Verify', detail: 'MFA Success - user admin', severity: 'low', module: 'Admin' },
  ],
  ai: [
    { id: '1', time: '12:00:00', model: 'DemandPredictor-v2', decision: 'Ajuste de Estoque Mínimo +15%', confidence: '98%', module: 'WMS' },
    { id: '2', time: '11:30:00', model: 'RiskAnalyzer', decision: 'Alerta: Atraso Fornecedor "Metalurgia SA"', confidence: '85%', module: 'Compras' },
    { id: '3', time: '10:00:00', model: 'PricingEngine', decision: 'Sugestão de Markup Dinâmico', confidence: '92%', module: 'Comercial' },
  ]
};

const CHART_DATA = [
  { name: 'Seg', events: 400, confidence: 90, alerts: 2 },
  { name: 'Ter', events: 300, confidence: 92, alerts: 5 },
  { name: 'Qua', events: 600, confidence: 88, alerts: 1 },
  { name: 'Qui', events: 800, confidence: 95, alerts: 0 },
  { name: 'Sex', events: 500, confidence: 91, alerts: 3 },
  { name: 'Sáb', events: 200, confidence: 94, alerts: 0 },
  { name: 'Dom', events: 100, confidence: 98, alerts: 0 },
];

export function GovernanceDrillDown({ type, module, onBack }: GovernanceDrillDownProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const getTitle = () => {
    switch (type) {
      case 'ledger': return 'Detalhamento do Ledger Logístico';
      case 'security': return 'Log de Segurança & Conformidade UEEF';
      case 'ai': return 'Decisões e Aprendizado de IA';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'ledger': return <History className="h-6 w-6 text-blue-500" />;
      case 'security': return <ShieldCheck className="h-6 w-6 text-emerald-500" />;
      case 'ai': return <Brain className="h-6 w-6 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background border">
              {getIcon()}
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">{getTitle()}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-[10px] uppercase">{module === 'all' ? 'Ecosistema Global' : `Módulo: ${module}`}</Badge>
                <span>•</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Últimos 7 dias</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="font-bold">
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
          <Button size="sm" className="font-bold">
            <Search className="h-4 w-4 mr-2" /> Auditoria Completa
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">Tendência de Atividade</CardTitle>
            <CardDescription>Eventos processados e nível de confiança do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="events" fill="#3b82f6" fillOpacity={0.1} stroke="#3b82f6" />
                  <Bar dataKey="alerts" barSize={20} fill="#ef4444" />
                  <Line type="monotone" dataKey="confidence" stroke="#f59e0b" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Resumo do Período</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de Eventos</span>
                <span className="text-lg font-black">2.432</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Alertas Críticos</span>
                <Badge variant="destructive">12</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Disponibilidade</span>
                <span className="text-sm font-bold text-emerald-600">99.99%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest">Status da Governança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-bold">
                <CheckCircle2 className="h-4 w-4" /> RLS Políticas Verificadas
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 text-blue-700 border border-blue-500/20 text-xs font-bold">
                <Lock className="h-4 w-4" /> Criptografia em Repouso
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/20 text-xs font-bold">
                <Zap className="h-4 w-4" /> AI Autopilot Monitorado
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-base font-bold">Timeline Detalhada</CardTitle>
              <CardDescription>Rastreabilidade imutável de cada ação no sistema</CardDescription>
            </div>
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Filtrar eventos..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {type === 'ledger' && MOCK_EVENTS.ledger.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/30 transition-colors group">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <History className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{event.action}</span>
                      <Badge variant="secondary" className="text-[10px]">{event.module}</Badge>
                      {event.status === 'warning' && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {event.time}</span>
                      <span>•</span>
                      <span>Usuário: {event.user}</span>
                      <span>•</span>
                      <code className="bg-muted px-1 rounded">Hash: {event.hash}</code>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {type === 'security' && MOCK_EVENTS.security.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/30 transition-colors group">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                    event.severity === 'high' ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                  )}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{event.type}</span>
                      <Badge className={cn(
                        "text-[10px]",
                        event.severity === 'high' ? "bg-red-500" : "bg-emerald-500"
                      )}>{event.severity.toUpperCase()}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{event.detail}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {event.time}</span>
                      <span>•</span>
                      <span>Módulo: {event.module}</span>
                    </div>
                  </div>
                </div>
              ))}

              {type === 'ai' && MOCK_EVENTS.ai.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/30 transition-colors group">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Brain className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{event.decision}</span>
                      <Badge variant="outline" className="text-[10px]">{event.model}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {event.time}</span>
                      <span>•</span>
                      <span>Módulo: {event.module}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-bold">Confiança: {event.confidence}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0 text-[10px] h-7 font-black">VALIDAR AÇÃO</Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
