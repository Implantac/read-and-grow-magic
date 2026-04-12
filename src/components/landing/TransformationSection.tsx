import { Badge } from '@/components/ui/badge';
import { XCircle, CheckCircle2, ArrowRight } from 'lucide-react';

const beforeItems = [
  'Pedidos se perdem entre setores',
  'Estoque nunca fecha',
  'Retrabalho constante',
  'Zero visibilidade do lucro real',
  'Decisões no "achismo"',
];

const afterItems = [
  'Fluxo integrado do pedido à entrega',
  'Estoque preciso em tempo real',
  'Processos automatizados',
  'Margem e custo por produto visíveis',
  'Dashboards com dados atualizados',
];

export default function TransformationSection() {
  return (
    <section className="bg-muted/20 border-y border-border/50 py-20 md:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 font-medium px-4 py-1">Transformação</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            De caos operacional para{' '}
            <span className="text-gradient-primary">controle total.</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Veja o que muda quando toda a operação está conectada em uma única plataforma.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-[1fr,auto,1fr] gap-6 md:gap-4 items-start">
          {/* ANTES */}
          <div className="p-6 rounded-2xl bg-card border border-destructive/20 shadow-md">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-4 w-4 text-destructive" />
              </div>
              <h3 className="font-bold text-destructive text-lg">Antes</h3>
            </div>
            <div className="flex flex-col gap-3">
              {beforeItems.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-foreground/75">
                  <XCircle className="h-4 w-4 text-destructive/50 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center pt-16">
            <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="md:hidden flex justify-center">
            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center rotate-90">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </div>

          {/* DEPOIS */}
          <div className="p-6 rounded-2xl bg-card border border-success/20 shadow-md">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <h3 className="font-bold text-success text-lg">Depois</h3>
            </div>
            <div className="flex flex-col gap-3">
              {afterItems.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-foreground/85">
                  <CheckCircle2 className="h-4 w-4 text-success/70 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
