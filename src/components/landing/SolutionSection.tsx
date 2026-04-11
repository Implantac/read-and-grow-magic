import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart3, Package, TrendingUp, Users, Shield, Brain, Truck, Factory,
  ChevronRight,
} from 'lucide-react';

const modules = [
  { icon: Users, label: 'Vendas & CRM', desc: 'Pipeline, funil, metas, comissões e IA de priorização de clientes.' },
  { icon: Factory, label: 'Produção & PCP', desc: 'Ordens de produção, ficha técnica, apontamento, capacidade e rastreabilidade.' },
  { icon: Package, label: 'Estoque & WMS', desc: 'Endereçamento, picking, conferência, inventário, lote e RFID.' },
  { icon: Truck, label: 'Logística & TMS', desc: 'Expedição, roteirização, transportadoras, prova de entrega.' },
  { icon: TrendingUp, label: 'Financeiro', desc: 'Contas a pagar/receber, fluxo de caixa, DRE e conciliação.' },
  { icon: Shield, label: 'Fiscal', desc: 'NF-e, NFC-e, apuração de impostos, SPED e relatórios fiscais.' },
  { icon: Brain, label: 'IA Integrada', desc: 'Previsão de demanda, sugestão de ações, alertas e chat gerencial.' },
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
    <section id="solucao" className="container mx-auto px-4 py-20">
      <div className="text-center mb-14">
        <Badge variant="outline" className="mb-4">A Solução</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Um sistema que controla <span className="text-primary">tudo</span>,<br />
          do pedido à entrega
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Não é só um ERP. É o cérebro da sua operação. Tudo integrado, tudo automático, tudo com inteligência artificial.
        </p>
      </div>

      {/* Flow */}
      <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto mb-14">
        {flow.map((step, i, arr) => (
          <div key={step.label} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-2">
              <div className="h-14 w-14 rounded-2xl bg-card border shadow-sm flex items-center justify-center">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
            </div>
            {i < arr.length - 1 && <ChevronRight className="h-5 w-5 text-muted-foreground/40 mt-[-20px]" />}
          </div>
        ))}
      </div>

      {/* Modules grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {modules.map((m) => (
          <Card key={m.label} className="group hover:border-primary/30 hover:shadow-lg transition-all duration-300 bg-card/80">
            <CardContent className="p-5">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
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
