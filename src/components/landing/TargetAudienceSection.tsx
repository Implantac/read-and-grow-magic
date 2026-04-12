import { Badge } from '@/components/ui/badge';
import { Factory, Warehouse, ShoppingBag, Shirt, Package, ClipboardList } from 'lucide-react';

const segments = [
  { icon: Factory, label: 'Indústrias de transformação' },
  { icon: ClipboardList, label: 'Produção sob encomenda' },
  { icon: Warehouse, label: 'Atacado e distribuição' },
  { icon: ShoppingBag, label: 'Varejo' },
  { icon: Shirt, label: 'Confecções e uniformes' },
  { icon: Package, label: 'Fábricas em geral' },
];

export default function TargetAudienceSection() {
  return (
    <section className="container mx-auto px-4 lg:px-8 py-16 md:py-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 font-medium">Para quem é</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Indicado para <span className="text-gradient-primary">diversos segmentos</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Um sistema robusto, completo e escalável — independente do tamanho ou segmento da sua operação.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
          {segments.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 p-4 md:p-5 rounded-xl bg-card border border-border/50 hover:border-primary/25 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/12 group-hover:scale-105 transition-all duration-300">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-semibold leading-tight">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
