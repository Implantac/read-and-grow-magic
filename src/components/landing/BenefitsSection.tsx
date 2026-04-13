import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, MessageCircle, ArrowRight, XCircle } from 'lucide-react';

interface Props {
  onWhatsApp: () => void;
}

const benefits = [
  { before: 'Produção atrasada', after: 'Entregas no prazo com PCP inteligente' },
  { before: 'Estoque sem controle', after: 'Estoque 100% organizado e rastreável' },
  { before: 'Lucro invisível', after: 'Margem real de cada pedido na tela' },
  { before: 'Pedidos se perdem', after: 'Do pedido à entrega, fluxo automático' },
  { before: 'Relatórios manuais', after: 'Dashboards em tempo real para decisão' },
  { before: 'Decisões por achismo', after: 'IA recomenda o que fazer e quando agir' },
  { before: 'Equipe desorientada', after: 'Cada colaborador sabe sua prioridade' },
  { before: 'Crescimento travado', after: 'Escale a operação sem perder controle' },
];

export default function BenefitsSection({ onWhatsApp }: Props) {
  return (
    <section id="beneficios" className="container mx-auto px-4 lg:px-8 py-20 md:py-28">
      <div className="text-center mb-14">
        <Badge variant="outline" className="mb-5 font-medium px-4 py-1.5 text-xs">Resultados reais</Badge>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight text-foreground leading-snug overflow-visible">
          O que muda na sua operação{' '}
          <span className="text-gradient-primary">com a USE SISTEMAS</span>
        </h2>
        <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto">Resultados visíveis desde a primeira semana. Mais controle, menos erro, mais lucro.</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-2 mb-14">
        {benefits.map((b, i) => (
          <div
            key={b.after}
            className="flex items-center gap-3 sm:gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-success/25 hover:shadow-md transition-all duration-200 group"
          >
            <span className="text-[10px] font-bold text-muted-foreground/30 w-5 text-center shrink-0">{String(i + 1).padStart(2, '0')}</span>
            <XCircle className="h-4 w-4 text-destructive/25 shrink-0 hidden sm:block" />
            <span className="text-muted-foreground/40 line-through text-xs sm:text-sm min-w-[130px] hidden sm:block group-hover:text-destructive/40 transition-colors">
              {b.before}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/15 hidden sm:block shrink-0 group-hover:text-primary/50 transition-colors" />
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            <span className="font-semibold text-sm text-foreground">{b.after}</span>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button
          size="lg"
          className="gap-2 text-base px-10 h-14 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 font-semibold"
          onClick={onWhatsApp}
        >
          <MessageCircle className="h-5 w-5" /> Quero Esses Resultados na Minha Empresa
        </Button>
        <p className="text-xs text-muted-foreground mt-3">Resposta em menos de 2 horas · Sem compromisso</p>
      </div>
    </section>
  );
}
