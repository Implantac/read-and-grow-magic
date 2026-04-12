import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle } from 'lucide-react';

interface Props { onLogin: () => void; onWhatsApp: () => void }

export default function FinalCTASection({ onLogin, onWhatsApp }: Props) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-foreground" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(36_100%_50%/0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(207_90%_54%/0.04),transparent_50%)]" />

      <div className="relative container mx-auto px-4 lg:px-8 py-20 md:py-24 text-background text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Pronto para ter <span className="text-primary">controle total</span>?
          </h2>
          <p className="text-base md:text-lg opacity-70 mb-10 max-w-lg mx-auto">
            Pare de perder dinheiro com desorganização. Comece agora e veja resultado em dias.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button
              size="lg"
              className="gap-2 text-base px-10 h-14 shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300"
              onClick={onWhatsApp}
            >
              <MessageCircle className="h-5 w-5" /> Falar com Especialista
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-base px-8 h-14 border-background/15 text-background hover:bg-background/10 hover:-translate-y-0.5 transition-all duration-300"
              onClick={onLogin}
            >
              Criar Conta Grátis <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs opacity-40 mt-6">
            Sem cartão de crédito · Cancele quando quiser · Suporte humano
          </p>
        </div>
      </div>
    </section>
  );
}
