import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, MessageCircle, ArrowRight } from 'lucide-react';

interface Props {
  onWhatsApp: () => void;
}

const benefits = [
  { before: 'Produção atrasada', after: 'Entregue tudo no prazo com PCP inteligente' },
  { before: 'Estoque bagunçado', after: 'Estoque 100% organizado e rastreável' },
  { before: 'Lucro invisível', after: 'Saiba o lucro real de cada pedido' },
  { before: 'Pedidos perdidos', after: 'Do pedido à entrega, tudo automático' },
  { before: 'Planilhas manuais', after: 'Dashboards em tempo real para decisões' },
  { before: 'Decisões no escuro', after: 'IA sugere o que fazer e quando agir' },
  { before: 'Equipe sem rumo', after: 'Cada um sabe exatamente o que fazer' },
  { before: 'Crescimento travado', after: 'Escale sem perder o controle' },
];

export default function BenefitsSection({ onWhatsApp }: Props) {
  return (
    <section id="beneficios" className="container mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <Badge variant="outline" className="mb-4 font-medium">Transformação</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          De <span className="text-destructive line-through opacity-60">caos operacional</span> para{' '}
          <span className="text-gradient-primary">controle total</span>
        </h2>
        <p className="text-muted-foreground text-lg">Veja o que muda na sua empresa em poucos dias.</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3 mb-14">
        {benefits.map((b, i) => (
          <div
            key={b.after}
            className="flex items-center gap-4 p-4 rounded-xl bg-card border hover:border-primary/30 hover:shadow-elevation-1 transition-all duration-200 group"
          >
            <span className="text-muted-foreground/40 line-through text-sm min-w-[160px] hidden sm:block group-hover:text-destructive/40 transition-colors">{b.before}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground/20 hidden sm:block shrink-0 group-hover:text-primary transition-colors" />
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <span className="font-medium text-sm md:text-base">{b.after}</span>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button
          size="lg"
          className="gap-2 text-base px-8 h-14 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all duration-300"
          onClick={onWhatsApp}
        >
          <MessageCircle className="h-5 w-5" /> Quero Esses Resultados
        </Button>
      </div>
    </section>
  );
}
