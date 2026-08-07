import { Suspense, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Store,
  Truck,
  Package,
  AlertTriangle,
  LayoutDashboard,
  Network,
  RefreshCw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  Search,
  CheckSquare,
  BarChart3,
  ClipboardList
} from 'lucide-react';
import { ScrollArea } from "@/ui/base/scroll-area";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/base/button";
import { Separator } from "@/ui/base/separator";
import NetworkControlTower from '@/modules/operational/network/components/NetworkControlTower';

const PageLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const HardeningDashboard = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const phases = [
    { id: '2A', title: 'Rede Operacional', status: 'completed', description: 'Hierarquia de Lojas/CD/Fábrica, Estoque em Trânsito.' },
    { id: '2B', title: 'Controle Operacional de Lojas', status: 'in_progress', description: 'Central da Loja, Cockpit de Exceções, Saúde da Unidade, Inventário Cíclico.' },
    { id: '2C', title: 'Especificação & Blueprint', status: 'pending', description: 'Mapeamento de Atores, Operações Críticas e Regras de Autorização.' },
    { id: '3', title: 'Inteligência Logística IA', status: 'completed', description: 'Otimização de Slotting, IA Preditiva, Digital Twin.' },
    { id: '4', title: 'Auditoria & Compliance', status: 'completed', description: 'UEEF SEC-LEVEL 3, Certificação RLS, LGPD GA.' },
    { id: '5', title: 'Expansão & Ecossistema', status: 'completed', description: 'Marketplace, Multi-moeda, Expansão Global.' },
  ];

  const blueprintItems = [
    { 
      id: 'central_loja', 
      title: '1. Central da Loja: O Ponto de Entrada', 
      icon: <Store className="h-4 w-4" />,
      content: `Cada loja terá uma central operacional focada em gerir exceções (rupturas, divergências, atrasos) em vez de manutenção manual. Status operacional em % (ex: 94%).`
    },
    { 
      id: 'centro_tarefas', 
      title: '2. Centro de Tarefas Operacionais', 
      icon: <CheckSquare className="h-4 w-4" />,
      content: `Fila única de ações: conferir recebimento, aprovar ajustes, realizar inventário inteligente, fechar caixa. Rastreabilidade total: origem, responsável, prioridade e SLA.`
    },
    { 
      id: 'fluxos_rapidos', 
      title: '3. Fluxos Rápidos (Quick Actions)', 
      icon: <Zap className="h-4 w-4" />,
      content: `Ações executáveis em poucos cliques: Receber mercadoria, Solicitar abastecimento, Transferir produto, Registrar perda e Fechar caixa.`
    },
    { 
      id: 'ledger_estoque', 
      title: '4. Ledger de Estoque Imutável', 
      icon: <ClipboardList className="h-4 w-4" />,
      content: `Estoque baseado em movimentações imutáveis. Saldo é consequência de logs de VENDA, TRANSFERÊNCIA, RECEBIMENTO, INVENTÁRIO, etc.`
    },
    { 
      id: 'acuracidade_kpi', 
      title: '5. Acuracidade como KPI Estratégico', 
      icon: <BarChart3 className="h-4 w-4" />,
      content: `Índice de Acuracidade de Estoque por unidade. Drill-down das causas: divergência de recebimento, perdas não registradas, erros de inventário.`
    },
    { 
      id: 'auditoria_silenciosa', 
      title: '6. Auditoria Silenciosa & Anomalias', 
      icon: <Shield className="h-4 w-4" />,
      content: `Motor de anomalias operacionais: alerta para excesso de ajustes, cancelamentos suspeitos ou divergências recorrentes por unidade.`
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Master Plan — Fase 2B: Controle Operacional</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Blueprint Operacional: Complexidade no motor, simplicidade na operação.
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary bg-primary/5 px-4 py-1 text-sm font-semibold">
          BLUEPRINT V2.0 — OPERATIONAL
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {phases.map((phase) => (
          <Card key={phase.id} className={cn(
            "transition-all hover:shadow-md",
            phase.status === 'completed' ? 'border-primary/20 bg-primary/5' : 'border-border'
          )}>
            <CardHeader className="p-4 space-y-1">
              <div className="flex justify-between items-start">
                <Badge variant={phase.status === 'completed' ? 'default' : 'outline'} className="text-[10px] h-5">
                  PHASE {phase.id}
                </Badge>
                {phase.status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
                )}
              </div>
              <CardTitle className="text-sm font-bold truncate">{phase.title}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-primary bg-primary/5 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Torre de Controle Operacional (Supply Chain)</CardTitle>
                <CardDescription>Monitoramento centralizado de saúde da rede e exceções logísticas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <NetworkControlTower />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-primary bg-primary/5 shadow-lg overflow-hidden">
          <CardHeader className="bg-primary/10 border-b border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Blueprint Operacional: Critérios de Aceite</CardTitle>
                  <CardDescription>Regras mandatórias para a robustez da plataforma</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-6 space-y-4">
                {blueprintItems.map((req) => (
                  <div key={req.id} className="border rounded-lg bg-background overflow-hidden transition-all border-primary/20 shadow-sm">
                    <button 
                      onClick={() => setExpandedSection(expandedSection === req.id ? null : req.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-primary/10 text-primary">
                          {req.icon}
                        </div>
                        <span className="font-bold text-sm text-foreground">{req.title}</span>
                      </div>
                      {expandedSection === req.id ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />}
                    </button>
                    {expandedSection === req.id && (
                      <div className="px-4 pb-4 text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2">
                        <Separator className="mb-4 bg-primary/10" />
                        <p className="leading-relaxed font-medium">{req.content}</p>
                      </div>
                    )}
                  </div>
                ))}

                <div className="pt-4 px-2 bg-muted/20 p-4 rounded-lg">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Atores da Operação</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Operador PDV', 'Caixa', 'Estoquista', 'Gerente', 'Regional', 'CD Manager', 'Financeiro', 'Fiscal'].map(role => (
                      <Badge key={role} variant="secondary" className="bg-background text-foreground border-border">{role}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-background shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-primary font-black">
                <Zap className="h-5 w-5" /> REGRAS DE OURO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 text-sm">
                <div className="p-3 rounded-lg border bg-success/5 border-success/20">
                  <p className="font-bold text-success mb-1">Trabalhar por Exceção</p>
                  <p className="text-xs text-muted-foreground">O usuário não confere o que o sistema valida. Divergência exige motivo, evidência e aprovação.</p>
                </div>
                <div className="p-3 rounded-lg border bg-info/5 border-info/20">
                  <p className="font-bold text-info mb-1">Segregação de Funções</p>
                  <p className="text-xs text-muted-foreground">Solicita, Aprova e Executa devem ser pessoas diferentes para operações críticas.</p>
                </div>
                <div className="p-3 rounded-lg border bg-warning/5 border-warning/20">
                  <p className="font-bold text-warning mb-1">Rastreabilidade Visual</p>
                  <p className="text-xs text-muted-foreground">Toda transferência deve mostrar o pipeline: Solicitada → Aprovada → Separada → Expedida → Trânsito → Recebida.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-background shadow-md relative overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 font-black uppercase text-primary">
                <Search className="h-5 w-5" /> Status do Hardening
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span>Database Constraints</span>
                <Badge className="bg-success text-white">HARDENED</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>RLS Policies</span>
                <Badge className="bg-success text-white">SECURE</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Audit Ledger</span>
                <Badge className="bg-info text-white">ACTIVE</Badge>
              </div>
              <Separator />
              <Button size="sm" className="w-full text-xs font-bold" variant="outline" asChild>
                <a href="/admin/manual">Ver Auditoria UEEF</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default function MasterPlanRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route index element={<HardeningDashboard />} />
      </Routes>
    </Suspense>
  );
}
