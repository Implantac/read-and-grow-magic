import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Timer, MessageCircle } from 'lucide-react';

interface Props { onWhatsApp: () => void }

export default function UrgencySection({ onWhatsApp }: Props) {
  return (
    <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20 border-y">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 mb-6">
          <Timer className="h-5 w-5 text-primary animate-pulse" />
          <Badge variant="secondary" className="text-primary font-bold text-sm">Vagas limitadas</Badge>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Só aceitamos <span className="text-primary">5 novas implantações</span> por mês
        </h2>
        <p className="text-muted-foreground text-lg mb-4">
          Para garantir qualidade na implantação e acompanhamento personalizado, limitamos o número de novos clientes.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          ✅ Implantação assistida &nbsp;·&nbsp; ✅ Treinamento incluso &nbsp;·&nbsp; ✅ 14 dias grátis &nbsp;·&nbsp; ✅ Garantia de satisfação
        </p>
        <Button size="lg" className="gap-2 text-lg px-10 h-14 shadow-lg shadow-primary/25" onClick={onWhatsApp}>
          <MessageCircle className="h-5 w-5" /> Garantir Minha Vaga
        </Button>
      </div>
    </section>
  );
}
