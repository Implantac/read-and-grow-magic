import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';

interface Props {
  onWhatsApp: () => void;
}

const impacts = [
  { icon: DollarSign, text: 'Um pedido perdido pode custar R$ 5.000+ em faturamento.' },
  { icon: TrendingDown, text: 'Estoque errado gera recompras desnecessárias e capital parado.' },
  { icon: AlertTriangle, text: 'Atrasos na produção fazem o cliente ir para o concorrente.' },
];

export default function AgitationSection({ onWhatsApp }: Props) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-foreground" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(36_100%_50%/0.08),transparent_60%)]" />

      <div className="relative container mx-auto px-4 py-24 text-background">
        <div className="max-w-3xl mx-auto">
          <Badge className="mb-6 bg-destructive/90 text-destructive-foreground border-0">Impacto financeiro</Badge>

          <h2 className="text-3xl md:text-4xl font-bold mb-10 leading-tight">
            Cada dia sem controle custa{' '}
            <span className="text-primary">mais do que você imagina</span>
          </h2>

          <div className="space-y-6 mb-10">
            {impacts.map((item) => (
              <div key={item.text} className="flex items-start gap-4 p-4 rounded-xl bg-background/5 border border-background/10">
                <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-base leading-relaxed opacity-90">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 mb-10">
            <p className="text-lg md:text-xl font-semibold text-primary text-center">
              Empresas com controle manual perdem em média 12% do faturamento em ineficiência — sem nem perceber.
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
