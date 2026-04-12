import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart3, Package, TrendingUp, Users, Shield, Brain, Truck, Factory,
  ChevronRight,
} from 'lucide-react';

const modules = [
  { icon: Users, label: 'Vendas & CRM', desc: 'Pipeline, funil, metas, comissões e IA de priorização.' },
  { icon: Factory, label: 'Produção & PCP', desc: 'Ordens, ficha técnica, apontamento e Kanban.' },
  { icon: Package, label: 'Estoque & WMS', desc: 'Endereçamento, picking, conferência e lotes.' },
  { icon: Truck, label: 'Logística & TMS', desc: 'Expedição, roteirização e prova de entrega.' },
  { icon: TrendingUp, label: 'Financeiro', desc: 'Contas, fluxo de caixa, DRE e conciliação.' },
  { icon: Shield, label: 'Fiscal', desc: 'NF-e, NFC-e, apuração e relatórios fiscais.' },
  { icon: Brain, label: 'IA Integrada', desc: 'Previsão de demanda, alertas e chat gerencial.' },
  { icon: BarChart3, label: 'Dashboards', desc: 'Visão 360° em tempo real de toda a operação.' },
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
      <div className="text-center mb-16">
        <Badge variant="outline" className="mb-4 font-medium">Solução completa</Badge>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Para empresas que produzem, vendem e precisam de{' '}
          <span className="text-gradient-primary">controle total</span>
        </h2>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
          8 módulos integrados nativamente. IA embarcada. Zero retrabalho entre setores — do pedido à entrega.
        </p>
      </div>

      {/* Flow pipeline */}
      <div className="max-w-4xl mx-auto mb-16">
        <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Fluxo integrado</p>
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 p-5 md:p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
          {flow.map((step, i, arr) => (
            <div key={step.label} className="flex items-center gap-2 md:gap-3">
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 shadow-sm flex items-center justify-center hover:shadow-md hover:border-primary/25 transition-all duration-300 group">
                  <step.icon className="h-5 w-5 md:h-6 md:w-6 text-primary group-hover:scale-110 transition-transform duration-200" />
                </div>
                <span className="text-[11px] md:text-xs font-medium text-muted-foreground">{step.label}</span>
              </div>
              {i < arr.length - 1 && (
                <ChevronRight className="h-4 w-4 text-primary/25 mt-[-20px]" />
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
            className="group hover:border-primary/25 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card border-border/50"
          >
            <CardContent className="p-5 sm:p-6">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/12 to-primary/4 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <m.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-sm mb-1.5">{m.label}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{m.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
