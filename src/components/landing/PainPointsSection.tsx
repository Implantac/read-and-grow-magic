import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, XCircle, Clock, TrendingUp, Package, CreditCard } from 'lucide-react';

const pains = [
  { icon: Clock, title: 'Produção sempre atrasada', desc: 'Pedidos saem com atraso, clientes reclamam e você perde recompras. Sem visão clara do que está em andamento.', stat: '23%', statLabel: 'dos pedidos atrasam' },
  { icon: Package, title: 'Estoque descontrolado', desc: 'Produto some, contagem nunca bate, falta material na hora errada. Cada inventário revela prejuízo.', stat: '18%', statLabel: 'de perda por ruptura' },
  { icon: CreditCard, title: 'Lucro invisível', desc: 'Você vende, mas o dinheiro não aparece. Sem custo real calculado, impossível saber onde está o lucro.', stat: '12%', statLabel: 'do faturamento perdido' },
  { icon: XCircle, title: 'Pedidos se perdem', desc: 'Vendedor fecha, produção não sabe, estoque não separa. Informação se perde entre os setores.', stat: '3x', statLabel: 'mais retrabalho' },
  { icon: AlertTriangle, title: 'Erros manuais recorrentes', desc: 'Planilhas desatualizadas, conferência falha, dados duplicados. Cada erro custa tempo e dinheiro.', stat: '40h', statLabel: '/mês em retrabalho' },
  { icon: TrendingUp, title: 'Crescimento travado', desc: 'Quanto mais vende, mais caos. Escalar sem sistema é receita para prejuízo e perda de clientes.', stat: '2x', statLabel: 'mais caro pra operar' },
];

export default function PainPointsSection() {
  return (
    <section id="problemas" className="container mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <Badge variant="destructive" className="mb-4 font-medium">Diagnóstico</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Sua empresa sofre com <span className="text-destructive">algum desses problemas?</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Se identificou com pelo menos 2 itens, está perdendo dinheiro agora — e provavelmente sem perceber.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {pains.map((pain, i) => (
          <Card
            key={pain.title}
            className="group border-destructive/10 bg-card hover:border-destructive/30 hover:shadow-elevation-3 transition-all duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-destructive/8 flex items-center justify-center group-hover:bg-destructive/12 transition-colors">
                  <pain.icon className="h-6 w-6 text-destructive" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-destructive">{pain.stat}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{pain.statLabel}</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">{pain.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{pain.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
