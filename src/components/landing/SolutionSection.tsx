import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart3, Package, TrendingUp, Users, Shield, Brain, Truck, Factory,
  ChevronRight,
} from 'lucide-react';

const modules = [
  { icon: Users, label: 'Vendas & CRM', desc: 'Pipeline, funil, metas, comissões e IA de priorização.' },
  { icon: Factory, label: 'Produção & PCP', desc: 'Ordens, ficha técnica, apontamento e rastreabilidade.' },
  { icon: Package, label: 'Estoque & WMS', desc: 'Endereçamento, picking, conferência e inventário.' },
  { icon: Truck, label: 'Logística & TMS', desc: 'Expedição, roteirização e prova de entrega.' },
  { icon: TrendingUp, label: 'Financeiro', desc: 'Contas, fluxo de caixa, DRE e conciliação.' },
  { icon: Shield, label: 'Fiscal', desc: 'NF-e, NFC-e, impostos e relatórios fiscais.' },
  { icon: Brain, label: 'IA Integrada', desc: 'Previsão de demanda, alertas e chat gerencial.' },
  { icon: BarChart3, label: 'Dashboards', desc: 'Visão 360° em tempo real da operação.' },
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
    <section id="solucao" className="container mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <Badge variant="outline" className="mb-4 font-medium">Solução completa</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Um sistema que controla <span className="text-gradient-primary">tudo</span>,
          <br className="hidden md:block" />
          do pedido à entrega
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Todos os módulos integrados, automação inteligente e IA embarcada. Nada de sistemas separados.
        </p>
      </div>

      {/* Flow pipeline */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 max-w-4xl mx-auto mb-16 p-6 rounded-2xl bg-muted/30 border">
        {flow.map((step, i, arr) => (
          <div key={step.label} className="flex items-center gap-2 md:gap-3">
            <div className="flex flex-col items-center gap-2">
              <div className="h-14 w-14 rounded-2xl bg-card border shadow-elevation-1 flex items-center justify-center hover:shadow-elevation-2 hover:border-primary/30 transition-all duration-200">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
            </div>
            {i < arr.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground/30 mt-[-20px]" />}
          </div>
        ))}
      </div>

      {/* Modules grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
        {modules.map((m, i) => (
          <Card
            key={m.label}
            className="group hover:border-primary/30 hover:shadow-elevation-3 hover:-translate-y-1 transition-all duration-300 bg-card"
          >
            <CardContent className="p-5">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/12 to-primary/4 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <m.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{m.label}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{m.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
