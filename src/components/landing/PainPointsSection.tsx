import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, XCircle, Clock, TrendingUp, Package, CreditCard } from 'lucide-react';

const pains = [
  { icon: Clock, title: 'Produção atrasada', desc: 'Pedidos saem com atraso e clientes migram para o concorrente.', stat: '23%', statLabel: 'dos pedidos atrasam' },
  { icon: Package, title: 'Estoque descontrolado', desc: 'Contagem nunca bate, falta material na hora errada.', stat: '18%', statLabel: 'de perda por ruptura' },
  { icon: CreditCard, title: 'Lucro invisível', desc: 'Você vende, mas não sabe onde está o lucro de cada pedido.', stat: '12%', statLabel: 'do faturamento perdido' },
  { icon: XCircle, title: 'Pedidos se perdem', desc: 'Vendedor fecha, produção não sabe, estoque não separa.', stat: '3x', statLabel: 'mais retrabalho' },
  { icon: AlertTriangle, title: 'Erros manuais', desc: 'Planilhas desatualizadas, conferência falha, dados duplicados.', stat: '40h', statLabel: '/mês em retrabalho' },
  { icon: TrendingUp, title: 'Crescimento travado', desc: 'Quanto mais vende, mais caos. Escalar sem controle é prejuízo.', stat: '2x', statLabel: 'mais caro operar' },
];

export default function PainPointsSection() {
  return (
    <section id="problemas" className="container mx-auto px-4 lg:px-8 py-20 md:py-28">
      <div className="text-center mb-14">
        <Badge variant="destructive" className="mb-4 font-medium px-4 py-1">Diagnóstico operacional</Badge>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Sua empresa sofre com <span className="text-destructive">algum desses problemas?</span>
        </h2>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
          Se identificou com 2 ou mais, sua operação está sangrando dinheiro — provavelmente sem você perceber.
        </p>
      </div>
      <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {pains.map((pain, i) => (
          <Card
            key={pain.title}
            className="group border-border/50 bg-card hover:border-destructive/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-destructive/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="h-12 w-12 rounded-2xl bg-destructive/8 flex items-center justify-center group-hover:bg-destructive/12 group-hover:scale-105 transition-all duration-300">
                  <pain.icon className="h-5 w-5 text-destructive" />
                </div>
                <div className="text-right">
                  <p className="text-2xl sm:text-3xl font-extrabold text-destructive leading-none">{pain.stat}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{pain.statLabel}</p>
                </div>
              </div>
              <h3 className="text-base font-bold mb-2">{pain.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{pain.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
