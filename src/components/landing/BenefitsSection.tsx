import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, MessageCircle } from 'lucide-react';

interface Props {
  onWhatsApp: () => void;
}

const benefits = [
  { before: 'Produção atrasada', after: 'Entregue tudo no prazo' },
  { before: 'Estoque bagunçado', after: 'Estoque 100% organizado e rastreável' },
  { before: 'Lucro invisível', after: 'Saiba o lucro real de cada pedido' },
  { before: 'Pedidos perdidos', after: 'Do pedido à entrega, tudo automático' },
  { before: 'Planilhas manuais', after: 'Dashboards em tempo real' },
  { before: 'Decisão no escuro', after: 'IA sugere o que fazer' },
  { before: 'Equipe perdida', after: 'Cada um sabe exatamente o que fazer' },
  { before: 'Crescimento travado', after: 'Escale sem perder o controle' },
];

export default function BenefitsSection({ onWhatsApp }: Props) {
  return (
    <section id="beneficios" className="container mx-auto px-4 py-20">
      <div className="text-center mb-14">
        <Badge variant="outline" className="mb-4">Resultados</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          De <span className="text-destructive line-through opacity-70">caos</span> para{' '}
          <span className="text-primary">controle total</span>
        </h2>
        <p className="text-muted-foreground text-lg">Veja o que muda na sua empresa em poucos dias.</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4 mb-12">
        {benefits.map((b) => (
          <div key={b.after} className="flex items-center gap-4 p-4 rounded-xl bg-card border hover:border-primary/30 transition-colors">
            <span className="text-muted-foreground/50 line-through text-sm min-w-[160px] hidden sm:block">{b.before}</span>
            <span className="text-muted-foreground/30 hidden sm:block">→</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <span className="font-medium">{b.after}</span>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button size="lg" className="gap-2 text-lg px-8 h-14" onClick={onWhatsApp}>
          <MessageCircle className="h-5 w-5" /> Quero Esses Resultados
        </Button>
      </div>
    </section>
  );
}
