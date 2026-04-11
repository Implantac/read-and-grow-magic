import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, XCircle, Clock, TrendingUp, Package, CreditCard } from 'lucide-react';

const pains = [
  { icon: Clock, title: 'Produção sempre atrasada', desc: 'Pedidos saem com atraso, clientes reclamam e você perde vendas. Sem visão clara do que está em andamento.' },
  { icon: Package, title: 'Estoque virou bagunça', desc: 'Produto some, contagem nunca bate, falta material na hora errada. Cada inventário é um pesadelo.' },
  { icon: CreditCard, title: 'Lucro? Onde está?', desc: 'Você vende, mas o dinheiro não aparece. Sem saber o custo real, impossível ter lucro de verdade.' },
  { icon: XCircle, title: 'Pedidos se perdem', desc: 'Vendedor fecha, produção não sabe, estoque não separa. Informação se perde entre setores.' },
  { icon: AlertTriangle, title: 'Retrabalho constante', desc: 'Erros manuais, planilhas desatualizadas, conferência falha. Cada erro custa tempo e dinheiro.' },
  { icon: TrendingUp, title: 'Cresce, mas desorganizado', desc: 'Quanto mais vende, mais caos. Escalar sem sistema é receita pra prejuízo.' },
];

export default function PainPointsSection() {
  return (
    <section id="problemas" className="container mx-auto px-4 py-20">
      <div className="text-center mb-14">
        <Badge variant="destructive" className="mb-4">Isso acontece na sua empresa?</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Se você se identificou com <span className="text-destructive">pelo menos 2 itens</span>,<br />
          está perdendo dinheiro agora
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Não é falta de esforço. É falta de sistema. Sem controle, o crescimento vira caos.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {pains.map((pain) => (
          <Card key={pain.title} className="border-destructive/20 bg-destructive/[0.02] hover:border-destructive/40 transition-all duration-300">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                <pain.icon className="h-6 w-6 text-destructive" />
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
