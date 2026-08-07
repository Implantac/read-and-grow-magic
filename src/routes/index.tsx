import { Suspense, lazy, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Database, 
  Zap, 
  HardDrive, 
  Lock, 
  BookOpen,
  ChevronDown,
  ChevronUp,
  Store,
  Truck,
  Factory,
  Building2,
  Package,
  TrendingUp,
  AlertTriangle,
  Settings,
  Shield,
  Search,
  LayoutDashboard,
  Network
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
    { id: '0-5', title: 'Infra & Segurança Base', status: 'completed', description: 'Mapeamento, RLS, IDOR, Edge Security, Isolamento.' },
    { id: '6-10', title: 'Integridade & RBAC', status: 'completed', description: 'Ledger Imutável, RBAC, Precisão Financeira, Idempotência.' },
    { id: '11-15', title: 'Testes & Auditoria', status: 'completed', description: 'E2E-CORE, Auditoria de Eventos, Rate Limiting.' },
    { id: '16-20', title: 'Monitoramento & Refatoração', status: 'completed', description: 'Monitoring, Refatoração PCP/Financial, Services.' },
    { id: '21-25', title: 'UX & Performance', status: 'completed', description: 'Design System, PERF-GUARD, Database Indexes, LGPD.' },
    { id: '26-29', title: 'Governança & QA', status: 'completed', description: 'Documentação, DoD Permanente, No-Mock Policy.' },
    { id: '2A', title: 'Rede Operacional', status: 'in_progress', description: 'Hierarquia de Lojas/CD/Fábrica, Estoque em Trânsito.' },
  ];

  const operationalRequirements = [
    { 
      id: 'modelo', 
      title: '1. Modelo de Rede (CNPJ ≠ Unidade ≠ Estoque)', 
      icon: <Building2 className="h-4 w-4" />,
      content: `O sistema distingue Entidade Jurídica, Unidade Operacional, Local Físico, Estoque e PDV. Estrutura: Grupo > Empresa/CNPJ > Unidade (Fábrica, CD, Loja) > Local de Estoque > PDV.`
    },
    { 
      id: 'unidade', 
      title: '2. Unidade Operacional Completa', 
      icon: <LayoutDashboard className="h-4 w-4" />,
      content: `Cada loja possui seu próprio operacional (PDV, caixa, turnos, estoque) e financeiro (DRE individualizado), com contexto fiscal próprio (Série, Numeração, IE).`
    },
    { 
      id: 'visoes', 
      title: '3-4. Visão Individual vs. Global', 
      icon: <Search className="h-4 w-4" />,
      content: `Gestores alternam entre Visão Individual (detalhes de uma loja) e Visão Global (consolidado do grupo) sem perda de rastreabilidade.`
    },
    { 
      id: 'estoque', 
      title: '6-7. Estoque por Localização', 
      icon: <Package className="h-4 w-4" />,
      content: `Controle granular: Físico, Reservado e Disponível por unidade. Itens vinculados a Stock Locations específicas para evitar confusão de saldos.`
    },
    { 
      id: 'reabastecimento', 
      title: '8-13. Reabastecimento Inteligente', 
      icon: <TrendingUp className="h-4 w-4" />,
      content: `Cálculo automático de necessidade baseado em: Venda Média, Lead Time, Estoque em Trânsito, Reservas e Sazonalidade. Hierarquia: Estoque Próprio > Transferência Interna > CD > Fábrica > Compra.`
    },
    { 
      id: 'transferencias', 
      title: '14-17. Transferências como Documentos Reais', 
      icon: <Truck className="h-4 w-4" />,
      content: `Workflow completo: Solicitada > Aprovada > Separação > Em Trânsito > Recebida > Conferida. Gestão automática de divergências e estoque 'Em Trânsito'.`
    },
    { 
      id: 'entidades', 
      title: '18-22. Entidades de Primeira Classe', 
      icon: <Factory className="h-4 w-4" />,
      content: `CD e Fábrica possuem fluxos específicos (Matéria-prima, WIP, Expedição). PDVs possuem identidade única para auditoria extrema.`
    },
    { 
      id: 'dash_corp', 
      title: '24-28. Torre de Controle & Supply Chain', 
      icon: <Shield className="h-4 w-4" />,
      content: `Painel consolidado para monitoramento de rupturas, excessos e sugestões de reabastecimento aprováveis pelo gestor, preparando a base para futura IA.`
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Master Plan — Hardening & Evolução (Fase 2A)</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Plataforma Enterprise: Prontidão para Produção e Rede Operacional.
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary bg-primary/5 px-4 py-1 text-sm font-semibold">
          VERSÃO 1.0 — HARDENED
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {phases.map((phase) => (
          <Card key={phase.id} className={cn(
            "transition-all hover:shadow-md",
            phase.status === 'completed' ? 'border-primary/20 bg-primary/5' : 'border-border'
          )}>
            <CardHeader className="pb-2 space-y-1">
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
              <CardTitle className="text-base font-bold">{phase.title}</CardTitle>
              <CardDescription className="text-xs line-clamp-2">{phase.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-primary">
                {phase.status === 'completed' ? 'Concluído' : 'Em Execução'}
                {phase.status === 'in_progress' && <ArrowRight className="ml-1 h-3 w-3" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-primary bg-primary/5 shadow-lg overflow-hidden">
          <CardHeader className="bg-primary/10 border-b border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary fill-primary" />
                <div>
                  <CardTitle>Requisitos da Fase 2A (Rede Operacional)</CardTitle>
                  <CardDescription>Hardening de fluxos críticos: Estoque, Fiscal e Operações</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30">
                CRÍTICO
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-6 space-y-4">
                {operationalRequirements.map((req) => (
                  <div key={req.id} className="border rounded-lg bg-background overflow-hidden transition-all">
                    <button 
                      onClick={() => setExpandedSection(expandedSection === req.id ? null : req.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-primary/10 text-primary">
                          {req.icon}
                        </div>
                        <span className="font-semibold text-sm">{req.title}</span>
                      </div>
                      {expandedSection === req.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {expandedSection === req.id && (
                      <div className="px-4 pb-4 text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2">
                        <Separator className="mb-4" />
                        <p className="leading-relaxed">{req.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-background shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-primary" />
                Infraestrutura Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 border border-border/50">
                <Database className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Base de Dados</p>
                  <p className="text-xs text-muted-foreground">Tabelas de rede e transferências migradas.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 border border-border/50">
                <HardDrive className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Contexto de Unidade</p>
                  <p className="text-xs text-muted-foreground">Seletor global e suporte a 'Todas' no Topbar.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 border border-border/50">
                <Settings className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Lógica de Reabastecimento</p>
                  <p className="text-xs text-muted-foreground">Motores de cálculo e políticas em implementação.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 border border-border/50">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Divergências</p>
                  <p className="text-xs text-muted-foreground">Monitoramento de ocorrências operacionais ativo.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-background shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <BookOpen className="h-12 w-12 text-primary/5 -rotate-12" />
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Manual Técnico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Toda nova funcionalidade deve respeitar o modelo de Rede Operacional para garantir integridade fiscal e financeira.
              </p>
              <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                <a href="/admin/manual">Acessar Documentação Completa</a>
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
