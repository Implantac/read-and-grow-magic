import { Badge } from '@/components/ui/badge';
import { XCircle, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

const beforeItems = [
  'Pedidos se perdem entre setores',
  'Estoque nunca fecha, falta e sobra',
  'Retrabalho constante e erros manuais',
  'Sem visibilidade do lucro real por pedido',
  'Decisões baseadas em "achismo"',
  'Equipe apagando incêndio todo dia',
];

const afterItems = [
  'Fluxo integrado do pedido à entrega',
  'Estoque preciso e rastreável em tempo real',
  'Processos automatizados com IA',
  'Margem e custo visíveis por produto e cliente',
  'Dashboards com dados atualizados ao vivo',
  'Equipe focada no que gera resultado',
];

export default function TransformationSection() {
  return (
    <section id="transformacao" className="bg-muted/20 border-y border-border/50 py-20 md:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-5 font-medium px-4 py-1.5 text-xs">Antes vs. Depois</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight text-foreground leading-snug overflow-visible">
            De caos operacional para{' '}
            <span className="text-gradient-primary">controle total.</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Veja a transformação real quando toda a operação está conectada em uma única plataforma inteligente.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-[1fr,auto,1fr] gap-6 md:gap-4 items-stretch">
          {/* ANTES */}
          <div className="p-6 rounded-2xl bg-card border border-destructive/20 shadow-md flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-4 w-4 text-destructive" />
              </div>
              <h3 className="font-bold text-destructive text-lg">Antes</h3>
            </div>
            <div className="flex flex-col gap-3 flex-1">
              {beforeItems.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-foreground/70">
                  <XCircle className="h-4 w-4 text-destructive/40 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-destructive/10">
              <p className="text-xs text-destructive/60 font-semibold text-center">😤 Mais trabalho, menos resultado</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center shadow-lg">
              <ArrowRight className="h-7 w-7 text-primary" />
            </div>
          </div>
          <div className="md:hidden flex justify-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center rotate-90">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </div>

          {/* DEPOIS */}
          <div className="p-6 rounded-2xl bg-card border border-success/20 shadow-md flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-success/30 to-transparent" />
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <h3 className="font-bold text-success text-lg">Depois</h3>
              <Sparkles className="h-4 w-4 text-primary ml-auto animate-pulse" />
            </div>
            <div className="flex flex-col gap-3 flex-1">
              {afterItems.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-foreground/85">
                  <CheckCircle2 className="h-4 w-4 text-success/70 shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-success/10">
              <p className="text-xs text-success/70 font-semibold text-center">📈 Menos erro, mais lucro, total controle</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
