import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Timer, MessageCircle, CheckCircle2 } from 'lucide-react';

interface Props { onWhatsApp: () => void }

const guarantees = [
  'Implantação assistida',
  'Treinamento incluso',
  '14 dias grátis',
  'Garantia de satisfação',
];

export default function UrgencySection({ onWhatsApp }: Props) {
  return (
    <section className="relative overflow-hidden py-20 md:py-24 border-y">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,hsl(36_100%_50%/0.05),transparent_60%)]" />

      <div className="relative container mx-auto px-4 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <Timer className="h-4 w-4 text-primary animate-pulse" />
            <Badge variant="secondary" className="text-primary font-semibold text-xs border border-primary/20">Vagas limitadas</Badge>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Apenas <span className="text-primary">5 novas implantações</span> por mês
          </h2>
          <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-lg mx-auto">
            Limitamos para garantir qualidade na implantação e acompanhamento personalizado.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mb-10">
            {guarantees.map((g) => (
              <div key={g} className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                {g}
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="gap-2 text-base px-10 h-14 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
            onClick={onWhatsApp}
          >
            <MessageCircle className="h-5 w-5" /> Garantir Minha Vaga
          </Button>
        </div>
      </div>
    </section>
  );
}
