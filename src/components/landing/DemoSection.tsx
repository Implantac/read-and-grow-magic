import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Play, BarChart3, Factory, Package, Users, TrendingUp } from 'lucide-react';
import dashboardMockup from '@/assets/dashboard-mockup.jpg';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'comercial', label: 'Comercial', icon: Users },
  { id: 'producao', label: 'Produção', icon: Factory },
  { id: 'estoque', label: 'Estoque', icon: Package },
  { id: 'financeiro', label: 'Financeiro', icon: TrendingUp },
];

const tabContent: Record<string, { title: string; desc: string }> = {
  dashboard: { title: 'Visão completa em tempo real', desc: 'KPIs, alertas e indicadores de todos os módulos em uma única tela.' },
  comercial: { title: 'Pipeline e funil de vendas', desc: 'Gerencie oportunidades, metas, comissões e previsão de receita com IA.' },
  producao: { title: 'PCP e chão de fábrica', desc: 'Ordens de produção, apontamento, Kanban e rastreabilidade completa.' },
  estoque: { title: 'WMS integrado', desc: 'Endereçamento, picking, conferência cega, lotes e inventário em tempo real.' },
  financeiro: { title: 'Controle financeiro total', desc: 'Contas a pagar/receber, fluxo de caixa, DRE e conciliação bancária.' },
};

export default function DemoSection() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const active = tabContent[activeTab];

  return (
    <section className="bg-muted/20 border-y border-border/50 py-20 md:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 font-medium px-4 py-1">Veja na prática</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 tracking-tight">
            Conheça cada módulo <span className="text-gradient-primary">por dentro</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Explore as telas reais da plataforma — tudo integrado, tudo em um lugar.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-3xl mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/20'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-foreground">{active.title}</h3>
            <p className="text-sm text-muted-foreground">{active.desc}</p>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-2xl bg-card">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border/30">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
                <div className="h-2.5 w-2.5 rounded-full bg-warning/40" />
                <div className="h-2.5 w-2.5 rounded-full bg-success/40" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="h-5 w-48 rounded-md bg-muted/60 text-[10px] flex items-center justify-center text-muted-foreground/50 font-medium">
                  app.usesistemas.com.br/{activeTab}
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent z-10 pointer-events-none" />
              <img
                src={dashboardMockup}
                alt={`Tela do módulo ${active.title} — USE SISTEMAS`}
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            * Telas reais da plataforma em ambiente de demonstração
          </p>
        </div>
      </div>
    </section>
  );
}
