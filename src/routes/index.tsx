import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { CheckCircle2, Circle, Clock, ArrowRight, ShieldCheck, Database, Zap, HardDrive, Lock } from 'lucide-react';

const PageLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const HardeningDashboard = () => {
  const phases = [
    { id: '0-5', title: 'Infra & Segurança Base', status: 'completed', description: 'Mapeamento, RLS, IDOR, Edge Security, Isolamento.' },
    { id: '6-10', title: 'Integridade & RBAC', status: 'completed', description: 'Ledger Imutável, RBAC, Precisão Financeira, Idempotência.' },
    { id: '11-15', title: 'Testes & Auditoria', status: 'completed', description: 'E2E-CORE, Auditoria de Eventos, Rate Limiting.' },
    { id: '16-20', title: 'Monitoramento & Refatoração', status: 'completed', description: 'Monitoring, Refatoração PCP/Financial, Services.' },
    { id: '21-25', title: 'UX & Performance', status: 'completed', description: 'Design System, PERF-GUARD, Database Indexes, LGPD.' },
    { id: '26-29', title: 'Governança & QA', status: 'completed', description: 'Documentação, DoD Permanente, No-Mock Policy.' },
    { id: '2A', title: 'Rede Operacional', status: 'in_progress', description: 'Hierarquia de Lojas/CD/Fábrica, Estoque em Trânsito.' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Master Plan — Hardening & Evolução</h1>
        <p className="text-muted-foreground text-lg">
          Certificação de Prontidão para Produção e Expansão de Rede Operacional.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {phases.map((phase) => (
          <Card key={phase.id} className={phase.status === 'completed' ? 'border-primary/20 bg-primary/5' : 'border-border'}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge variant={phase.status === 'completed' ? 'default' : 'outline'} className="mb-2">
                  FASE {phase.id}
                </Badge>
                {phase.status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Clock className="h-5 w-5 text-muted-foreground animate-pulse" />
                )}
              </div>
              <CardTitle className="text-xl">{phase.title}</CardTitle>
              <CardDescription>{phase.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm font-medium text-primary">
                {phase.status === 'completed' ? 'Concluído' : 'Em Execução'}
                {phase.status === 'in_progress' && <ArrowRight className="ml-2 h-4 w-4" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary bg-primary/5 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary fill-primary" />
            <CardTitle>Status da Fase 2A (Arquitetura de Rede)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-bold">Base de Dados</p>
                <p className="text-xs text-muted-foreground">Migrações de Rede Concluídas</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-primary/50">
              <HardDrive className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-bold">Contexto de Unidade</p>
                <p className="text-xs text-muted-foreground">Implementado no EnterpriseContext</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-bold">Isolamento Fiscal</p>
                <p className="text-xs text-muted-foreground">Estrutura de Contexto Pronta</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
              <Lock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-bold">RBAC por Unidade</p>
                <p className="text-xs text-muted-foreground">Hooks de Segurança Hardened</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
