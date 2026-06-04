import { Button } from '@/ui/base/button';
import { ArrowRight, MessageCircle, Zap, CheckCircle2 } from 'lucide-react';

interface Props { onLogin: () => void; onWhatsApp: () => void }

export default function FinalCTASection({ onLogin, onWhatsApp }: Props) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-foreground" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(36_100%_50%/0.08),transparent_50%)]" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="relative container mx-auto px-4 lg:px-8 py-20 md:py-28 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6 ring-4 ring-primary/5">
            <Zap className="text-primary h-6 w-6" />
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight leading-tight text-background">
            Sua empresa merece crescer{' '}
            <span className="text-primary">com controle.</span>
          </h2>
          <p className="text-base md:text-lg text-background/60 mb-8 max-w-lg mx-auto">
            Pare de perder dinheiro com desorganização. Comece agora e veja resultado em dias, não meses.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {['14 dias grátis', 'Sem cartão de crédito', 'Implantação assistida', 'Suporte humano'].map(item => (
              <span key={item} className="flex items-center gap-1.5 text-xs font-medium text-background/50">
                <CheckCircle2 className="h-3 w-3 text-primary/70" />{item}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button
              size="lg"
              className="gap-2 text-base px-10 h-14 shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300 font-semibold"
              onClick={onWhatsApp}
            >
              <MessageCircle className="h-5 w-5" /> Falar com Especialista
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-base px-8 h-14 border-background/30 text-background bg-background/5 hover:bg-background/15 hover:-translate-y-0.5 transition-all duration-300 font-semibold"
              onClick={onLogin}
            >
              Criar Conta Grátis <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
