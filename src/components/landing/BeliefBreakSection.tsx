import { Badge } from '@/components/ui/badge';
import { Users, Cog, AlertTriangle, Lightbulb } from 'lucide-react';

const blocks = [
  {
    icon: AlertTriangle,
    color: 'destructive',
    title: 'Ferramentas desconectadas',
    desc: 'Planilhas, sistemas isolados e WhatsApp não são gestão — são improviso que custa caro.',
  },
  {
    icon: Cog,
    color: 'warning',
    title: 'Processos manuais',
    desc: 'Cada informação digitada duas vezes é um erro esperando para acontecer. E cada erro custa dinheiro.',
  },
  {
    icon: Users,
    color: 'primary',
    title: 'Equipe sem visibilidade',
    desc: 'Sem um painel único, cada setor opera no escuro — e quando algo dá errado, a culpa cai nas pessoas.',
  },
];

export default function BeliefBreakSection() {
  return (
    <section className="container mx-auto px-4 lg:px-8 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-5 font-medium px-4 py-1.5 text-xs">Quebra de crença</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-5 tracking-tight text-foreground">
            O problema <span className="text-destructive">não</span> é sua equipe.
            <br className="hidden sm:block" />
            É a falta de <span className="text-primary">integração.</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Quando vendas, produção, estoque e financeiro não conversam entre si, o retrabalho é inevitável — independente de quão boa seja sua equipe.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 md:gap-5">
          {blocks.map((b) => (
            <div key={b.title} className="p-6 rounded-2xl bg-card border border-border/50 text-center hover:border-primary/20 hover:shadow-lg transition-all duration-300 group">
              <div className={`h-12 w-12 rounded-2xl bg-${b.color}/8 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300`}>
                <b.icon className={`h-5 w-5 text-${b.color}`} />
              </div>
              <p className="font-bold text-sm mb-2 text-foreground">{b.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 p-5 md:p-6 rounded-2xl bg-primary/5 border border-primary/15 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <p className="text-base md:text-lg font-bold text-foreground">A solução não é contratar mais gente.</p>
          </div>
          <p className="text-sm text-muted-foreground">
            É ter uma <span className="text-primary font-semibold">plataforma que integre tudo</span> — do pedido à entrega, do estoque ao financeiro.
          </p>
        </div>
      </div>
    </section>
  );
}
