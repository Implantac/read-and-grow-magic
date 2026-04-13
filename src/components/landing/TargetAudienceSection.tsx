import { Badge } from '@/components/ui/badge';
import { Factory, Warehouse, ShoppingBag, Shirt, Package, ClipboardList, ArrowRight } from 'lucide-react';

const segments = [
  { icon: Factory, label: 'Indústrias de transformação', desc: 'Metalurgia, plásticos, alimentos e mais' },
  { icon: ClipboardList, label: 'Produção sob encomenda', desc: 'Pedidos personalizados com rastreabilidade' },
  { icon: Warehouse, label: 'Atacado e distribuição', desc: 'Gestão de grandes volumes e multi-CD' },
  { icon: ShoppingBag, label: 'Varejo', desc: 'PDV, estoque e vendas integrados' },
  { icon: Shirt, label: 'Confecções e uniformes', desc: 'Fichas técnicas, grades e corte' },
  { icon: Package, label: 'Fábricas em geral', desc: 'Operação completa ponta a ponta' },
];

export default function TargetAudienceSection() {
  return (
    <section className="container mx-auto px-4 lg:px-8 py-16 md:py-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 font-medium px-4 py-1">Para quem é</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Indicado para <span className="text-primary inline">diversos segmentos</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Uma plataforma robusta, completa e escalável — independente do tamanho ou segmento da sua operação.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {segments.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border/50 hover:border-primary/25 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group cursor-default"
            >
              <div className="h-11 w-11 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 group-hover:scale-105 transition-all duration-300">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold leading-tight block">{s.label}</span>
                <span className="text-xs text-muted-foreground leading-snug">{s.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
