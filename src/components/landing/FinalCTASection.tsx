import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle } from 'lucide-react';

interface Props { onLogin: () => void; onWhatsApp: () => void }

export default function FinalCTASection({ onLogin, onWhatsApp }: Props) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-foreground" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(36_100%_50%/0.08),transparent_60%)]" />

      <div className="relative container mx-auto px-4 py-24 text-background text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Pronto para ter <span className="text-primary">controle total</span> da sua operação?
          </h2>
          <p className="text-lg opacity-80 mb-10">
            Pare de perder dinheiro com desorganização. Comece agora e veja resultado em dias, não meses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
              className="gap-2 text-base px-8 h-14 border-background/20 text-background hover:bg-background/10 hover:-translate-y-0.5 transition-all duration-300"
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
