import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';

interface Props {
  onWhatsApp: () => void;
}

export default function AgitationSection({ onWhatsApp }: Props) {
  return (
    <section className="bg-foreground text-background py-20">
      <div className="container mx-auto px-4 text-center max-w-3xl">
        <Badge className="mb-6 bg-destructive text-destructive-foreground">Atenção</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Cada dia sem controle custa caro
        </h2>
        <div className="space-y-4 text-lg opacity-90 mb-10">
          <p>
            Um único pedido perdido pode custar <strong className="text-primary">R$ 5.000+</strong>.
            Um inventário errado gera <strong className="text-primary">recompras desnecessárias</strong>.
            Um atraso na produção faz o cliente ir pro concorrente.
          </p>
          <p>
            Empresas que operam com planilhas e "controle manual" perdem em média{' '}
            <strong className="text-primary">12% do faturamento</strong> em ineficiência — sem nem perceber.
          </p>
          <p className="text-xl font-semibold text-primary">
            Quanto mais você demora pra resolver, mais dinheiro escapa.
          </p>
        </div>
        <Button
          size="lg"
          className="gap-2 text-lg px-8 h-14"
          onClick={onWhatsApp}
        >
          <MessageCircle className="h-5 w-5" /> Quero Resolver Isso Agora
        </Button>
      </div>
    </section>
  );
}
