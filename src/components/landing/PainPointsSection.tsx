import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, XCircle, Clock, TrendingUp, Package, CreditCard } from 'lucide-react';

const pains = [
  { icon: Clock, title: 'Produção atrasada', desc: 'Pedidos saem com atraso e clientes migram para o concorrente. Sem visão clara do que está em andamento.', stat: '23%', statLabel: 'dos pedidos atrasam' },
  { icon: Package, title: 'Estoque descontrolado', desc: 'Contagem nunca bate, falta material na hora errada. Cada inventário revela prejuízo.', stat: '18%', statLabel: 'de perda por ruptura' },
  { icon: CreditCard, title: 'Lucro invisível', desc: 'Você vende, mas o dinheiro não aparece. Sem custo real, impossível saber onde está o lucro.', stat: '12%', statLabel: 'do faturamento perdido' },
  { icon: XCircle, title: 'Pedidos se perdem', desc: 'Vendedor fecha, produção não sabe, estoque não separa. Informação se perde entre setores.', stat: '3x', statLabel: 'mais retrabalho' },
  { icon: AlertTriangle, title: 'Erros manuais', desc: 'Planilhas desatualizadas, conferência falha, dados duplicados. Cada erro custa tempo e dinheiro.', stat: '40h', statLabel: '/mês em retrabalho' },
  { icon: TrendingUp, title: 'Crescimento travado', desc: 'Quanto mais vende, mais caos. Escalar sem sistema é receita para prejuízo.', stat: '2x', statLabel: 'mais caro operar' },
];

export default function PainPointsSection() {
  return (
    <section id="problemas" className="container mx-auto px-4 lg:px-8 py-20 md:py-28">
      <div className="text-center mb-14">
        <Badge variant="destructive" className="mb-4 font-medium">Diagnóstico</Badge>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Sua empresa sofre com <span className="text-destructive">algum desses problemas?</span>
        </h2>
        <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
          Se identificou com 2 ou mais, você está perdendo dinheiro — provavelmente sem perceber.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {pains.map((pain, i) => (
          <Card
            key={pain.title}
            className="group border-border/50 bg-card hover:border-destructive/25 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-11 w-11 rounded-xl bg-destructive/8 flex items-center justify-center group-hover:bg-destructive/12 transition-colors duration-300">
                  <pain.icon className="h-5 w-5 text-destructive" />
                </div>
                <div className="text-right">
                  <p className="text-xl sm:text-2xl font-bold text-destructive leading-none">{pain.stat}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{pain.statLabel}</p>
                </div>
              </div>
              <h3 className="text-base font-semibold mb-1.5">{pain.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{pain.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
