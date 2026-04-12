import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Timer, MessageCircle, CheckCircle2, Shield, Headphones, Gift } from 'lucide-react';

interface Props { onWhatsApp: () => void }

const guarantees = [
  { icon: Gift, text: '14 dias grátis para testar' },
  { icon: Headphones, text: 'Implantação assistida inclusa' },
  { icon: Shield, text: 'Garantia de satisfação' },
  { icon: CheckCircle2, text: 'Treinamento completo' },
];

export default function UrgencySection({ onWhatsApp }: Props) {
  return (
    <section className="relative overflow-hidden py-20 md:py-28 border-y">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,hsl(36_100%_50%/0.05),transparent_60%)]" />

      <div className="relative container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-6">
              <Timer className="h-4 w-4 text-primary animate-pulse" />
              <Badge variant="secondary" className="text-primary font-semibold text-xs border border-primary/20">Vagas limitadas</Badge>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Apenas <span className="text-primary">5 novas implantações</span> por mês
            </h2>
            <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-lg mx-auto">
              Limitamos para garantir qualidade e acompanhamento personalizado em cada empresa.
            </p>
          </div>

          {/* Offer box */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-lg mb-10">
            <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6">O que está incluso</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {guarantees.map((g) => (
                <div key={g.text} className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/30">
                  <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                    <g.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold">{g.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Button
              size="lg"
              className="gap-2 text-base px-10 h-14 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
              onClick={onWhatsApp}
            >
              <MessageCircle className="h-5 w-5" /> Garantir Minha Vaga
            </Button>
            <p className="text-xs text-muted-foreground mt-3">Sem compromisso · Cancele quando quiser</p>
          </div>
        </div>
      </div>
    </section>
  );
}
