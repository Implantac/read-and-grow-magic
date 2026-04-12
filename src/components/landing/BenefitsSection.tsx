import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, MessageCircle, ArrowRight } from 'lucide-react';

interface Props {
  onWhatsApp: () => void;
}

const benefits = [
  { before: 'Produção atrasada', after: 'Entregas no prazo com PCP inteligente' },
  { before: 'Estoque bagunçado', after: 'Estoque 100% organizado e rastreável' },
  { before: 'Lucro invisível', after: 'Lucro real de cada pedido na tela' },
  { before: 'Pedidos perdidos', after: 'Do pedido à entrega, tudo automático' },
  { before: 'Planilhas manuais', after: 'Dashboards em tempo real para decisões' },
  { before: 'Decisões no escuro', after: 'IA sugere o que fazer e quando agir' },
  { before: 'Equipe sem rumo', after: 'Cada um sabe exatamente o que fazer' },
  { before: 'Crescimento travado', after: 'Escale sem perder o controle' },
];

export default function BenefitsSection({ onWhatsApp }: Props) {
  return (
    <section id="beneficios" className="container mx-auto px-4 lg:px-8 py-20 md:py-28">
      <div className="text-center mb-14">
        <Badge variant="outline" className="mb-4 font-medium">Transformação</Badge>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          De <span className="text-destructive line-through opacity-50">caos operacional</span> para{' '}
          <span className="text-gradient-primary">controle total</span>
        </h2>
        <p className="text-muted-foreground text-base md:text-lg">O que muda na sua empresa em poucos dias.</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-2.5 mb-14">
        {benefits.map((b) => (
          <div
            key={b.after}
            className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-card border border-border/50 hover:border-primary/25 hover:shadow-sm transition-all duration-200 group"
          >
            <span className="text-muted-foreground/30 line-through text-xs sm:text-sm min-w-[140px] hidden sm:block group-hover:text-destructive/30 transition-colors">
              {b.before}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/15 hidden sm:block shrink-0 group-hover:text-primary/40 transition-colors" />
            <CheckCircle2 className="h-4.5 w-4.5 text-success shrink-0" />
            <span className="font-medium text-sm">{b.after}</span>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button
          size="lg"
          className="gap-2 text-base px-8 h-14 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
          onClick={onWhatsApp}
        >
          <MessageCircle className="h-5 w-5" /> Quero Esses Resultados
        </Button>
      </div>
    </section>
  );
}
