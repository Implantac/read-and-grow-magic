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
    { id: '2A', title: 'Rede Operacional', status: 'completed', description: 'Hierarquia de Lojas/CD/Fábrica, Estoque em Trânsito.' },
    { id: '2B', title: 'Orquestração de Pedidos', status: 'in_progress', description: 'Cross-docking, Drop-shipping, Roteirização de Carga.' },
  ];

  const operationalRequirements = [
    { 
      id: 'crossdocking', 
      title: '1. Orquestração de Pedidos & Cross-docking', 
      icon: <Truck className="h-4 w-4" />,
      content: `O sistema orquestra a origem do estoque (Sourcing). Pedidos podem ser atendidos via estoque local, cross-docking (via CD sem armazenagem longa) ou drop-shipping (direto do fornecedor).`
    },
    { 
      id: 'roteirizacao', 
      title: '2. Roteirização de Carga & Last Mile', 
      icon: <TrendingUp className="h-4 w-4" />,
      content: `Agrupamento de pedidos por região, veículo e cubagem. Integração com mapas para otimização de rotas e monitoramento de entregas em tempo real.`
    },
    { 
      id: 'omnichannel', 
      title: '3. Omnichannel Real (BOPIS/Ship-from-Store)', 
      icon: <Store className="h-4 w-4" />,
      content: `Compra online e retira na loja (BOPIS). Envio a partir da loja mais próxima (Ship-from-store) para redução de custo de frete e tempo de entrega.`
    },
    { 
      id: 'fiscal_avancado', 
      title: '4. Fiscal em Rede (Venda por Ordem)', 
      icon: <ShieldCheck className="h-4 w-4" />,
      content: `Emissão automática de notas de Remessa, Venda por Ordem e Triangular. Garantia de conformidade fiscal em operações multi-unidade complexas.`
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Master Plan — Hardening & Evolução (Fase 2B)</h1>
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

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-primary bg-primary/5 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Torre de Controle Operacional (Live)</CardTitle>
                <CardDescription>Monitoramento em tempo real da rede e supply chain</CardDescription>
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
                <Zap className="h-6 w-6 text-primary fill-primary" />
                <div>
                  <CardTitle>Requisitos da Fase 2B (Orquestração de Pedidos)</CardTitle>
                  <CardDescription>Hardening de fluxos logísticos avançados e roteirização</CardDescription>
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
                <Truck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Orquestração (Sourcing)</p>
                  <p className="text-xs text-muted-foreground">Lógica de seleção de origem de estoque ativa.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 border border-border/50">
                <Settings className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Roteirização</p>
                  <p className="text-xs text-muted-foreground">Algoritmos de agrupamento e despacho em teste.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 border border-border/50">
                <Store className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Omnichannel</p>
                  <p className="text-xs text-muted-foreground">Módulo BOPIS e Ship-from-Store integrado.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 border border-border/50">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Rastreabilidade Last Mile</p>
                  <p className="text-xs text-muted-foreground">Monitoramento de status de entrega final.</p>
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
