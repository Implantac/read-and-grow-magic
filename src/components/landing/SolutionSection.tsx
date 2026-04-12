import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart3, Package, TrendingUp, Users, Shield, Brain, Truck, Factory,
  ChevronRight, Zap,
} from 'lucide-react';

const modules = [
  { icon: Users, label: 'Comercial & CRM', desc: 'Pipeline, funil, metas, comissões e priorização inteligente com IA.', highlight: 'Mais vendas' },
  { icon: Factory, label: 'Produção & PCP', desc: 'Ordens de produção, ficha técnica, apontamento e Kanban em tempo real.', highlight: 'Sem atrasos' },
  { icon: Package, label: 'Estoque & WMS', desc: 'Endereçamento, picking, conferência cega, lotes e rastreabilidade total.', highlight: 'Estoque preciso' },
  { icon: Truck, label: 'Logística & TMS', desc: 'Expedição, roteirização, rastreamento de entregas e comprovação digital.', highlight: 'Entrega certa' },
  { icon: TrendingUp, label: 'Financeiro', desc: 'Contas a pagar/receber, fluxo de caixa, DRE e conciliação bancária.', highlight: 'Lucro visível' },
  { icon: Shield, label: 'Fiscal & Contábil', desc: 'NF-e, NFC-e, apuração automática, balancete e relatórios fiscais.', highlight: 'Compliance' },
  { icon: Brain, label: 'Inteligência Artificial', desc: 'Previsão de demanda, alertas preditivos e assistente gerencial 24/7.', highlight: 'Decisão inteligente' },
  { icon: BarChart3, label: 'Dashboards Executivos', desc: 'Visão 360° da operação com indicadores em tempo real para diretoria.', highlight: 'Controle total' },
];

const flow = [
  { icon: Users, label: 'Venda' },
  { icon: Shield, label: 'Crédito' },
  { icon: Factory, label: 'Produção' },
  { icon: Package, label: 'Separação' },
  { icon: Truck, label: 'Entrega' },
  { icon: TrendingUp, label: 'Financeiro' },
];

export default function SolutionSection() {
  return (
    <section id="solucao" className="container mx-auto px-4 lg:px-8 py-20 md:py-28">
      <div className="text-center mb-14">
        <Badge variant="outline" className="mb-5 font-medium px-4 py-1.5 text-xs">A Plataforma</Badge>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Uma plataforma.{' '}
          <span className="text-gradient-primary">Toda a operação.</span>
        </h2>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
          8 módulos integrados nativamente com IA embarcada. Do pedido à entrega, sem retrabalho entre setores.
        </p>
      </div>

      {/* Flow pipeline */}
      <div className="max-w-4xl mx-auto mb-16">
        <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-5">Fluxo integrado ponta a ponta</p>
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 p-5 md:p-6 rounded-2xl bg-card border border-border/50 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          {flow.map((step, i, arr) => (
            <div key={step.label} className="flex items-center gap-2 md:gap-3">
              <div className="flex flex-col items-center gap-2 group">
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/15 shadow-sm flex items-center justify-center hover:shadow-lg hover:border-primary/30 hover:from-primary/20 transition-all duration-300">
                  <step.icon className="h-5 w-5 md:h-6 md:w-6 text-primary group-hover:scale-110 transition-transform duration-200" />
                </div>
                <span className="text-[11px] md:text-xs font-semibold text-muted-foreground">{step.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className="flex items-center mt-[-20px]">
                  <div className="w-4 h-px bg-primary/15" />
                  <ChevronRight className="h-3.5 w-3.5 text-primary/30" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modules grid */}
      <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
        {modules.map((m) => (
          <Card
            key={m.label}
            className="group hover:border-primary/25 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card border-border/50 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/12 to-primary/4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <m.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground leading-tight">{m.label}</h3>
                  <span className="text-[10px] font-semibold text-primary/70">{m.highlight}</span>
                </div>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">{m.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
