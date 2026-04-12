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

      <div className="relative container mx-auto px-4 lg:px-8 py-20 md:py-28 text-background">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 bg-destructive/90 text-destructive-foreground border-0 text-xs">Impacto financeiro</Badge>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">
            Cada dia sem controle custa{' '}
            <span className="text-primary">mais do que você imagina</span>
          </h2>
          <p className="text-sm md:text-base opacity-60 mb-10 max-w-2xl">
            Dados reais de empresas que operavam sem uma plataforma de gestão integrada.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {impacts.map((item) => (
              <div key={item.text} className="p-5 rounded-2xl bg-background/[0.04] border border-background/[0.08] hover:bg-background/[0.06] transition-colors duration-200">
                <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-primary font-extrabold text-2xl mb-1">{item.value}</p>
                <p className="text-sm opacity-70 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 mb-10">
            <p className="text-base md:text-lg font-semibold text-primary text-center leading-relaxed">
              Empresas sem gestão integrada perdem em média <span className="text-2xl font-extrabold">12%</span> do faturamento em ineficiência operacional.
            </p>
          </div>

          <div className="text-center">
            <Button
              size="lg"
              className="gap-2 text-base px-10 h-14 hover:-translate-y-0.5 transition-all duration-300"
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
