import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle } from 'lucide-react';

interface Props { onLogin: () => void; onWhatsApp: () => void }

export default function FinalCTASection({ onLogin, onWhatsApp }: Props) {
  return (
    <section className="container mx-auto px-4 py-24 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Pronto para ter <span className="text-primary">controle total</span> da sua operação?
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          Chega de perder dinheiro com desorganização. Comece agora, veja resultado em dias.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="gap-2 text-lg px-10 h-14 shadow-lg shadow-primary/25" onClick={onWhatsApp}>
            <MessageCircle className="h-5 w-5" /> Falar com Especialista
          </Button>
          <Button size="lg" variant="outline" className="gap-2 text-lg px-8 h-14" onClick={onLogin}>
            Criar Conta Grátis <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
