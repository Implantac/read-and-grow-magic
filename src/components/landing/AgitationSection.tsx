import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';

interface Props {
  onWhatsApp: () => void;
}

const impacts = [
  { icon: DollarSign, value: 'R$ 5.000+', text: 'perdidos em cada pedido que escapa ou atrasa.' },
  { icon: TrendingDown, value: '18%', text: 'de capital parado em estoque sem giro real.' },
  { icon: AlertTriangle, value: '3 em 10', text: 'clientes migram após um atraso na entrega.' },
];

export default function AgitationSection({ onWhatsApp }: Props) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-foreground" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(36_100%_50%/0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(207_90%_54%/0.04),transparent_50%)]" />

      <div className="relative container mx-auto px-4 lg:px-8 py-20 md:py-24 text-background">
        <div className="max-w-3xl mx-auto">
          <Badge className="mb-6 bg-destructive/90 text-destructive-foreground border-0 text-xs">Impacto financeiro</Badge>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-10 leading-tight">
            Cada dia sem controle custa{' '}
            <span className="text-primary">mais do que você imagina</span>
          </h2>

          <div className="space-y-4 mb-10">
            {impacts.map((item) => (
              <div key={item.text} className="flex items-center gap-4 p-4 rounded-xl bg-background/[0.04] border border-background/[0.08] hover:bg-background/[0.06] transition-colors duration-200">
                <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="text-primary font-bold text-lg">{item.value}</span>
                  <span className="text-sm opacity-80 ml-2">{item.text}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 mb-10">
            <p className="text-base md:text-lg font-semibold text-primary text-center leading-relaxed">
              Empresas com gestão manual perdem em média <span className="text-xl font-extrabold">12%</span> do faturamento em ineficiência.
            </p>
          </div>

          <div className="text-center">
            <Button
              size="lg"
              className="gap-2 text-base px-8 h-14 hover:-translate-y-0.5 transition-all duration-300"
              onClick={onWhatsApp}
            >
              <MessageCircle className="h-5 w-5" /> Quero Resolver Isso Agora
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
