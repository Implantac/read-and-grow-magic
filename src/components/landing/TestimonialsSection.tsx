import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Carlos Mendes',
    role: 'Diretor de Operações',
    company: 'Indústria MetalForte',
    text: 'Reduzimos 35% do tempo operacional com a automação do pedido ao faturamento. O ROI veio no segundo mês.',
    metric: '-35%',
    metricLabel: 'tempo operacional',
  },
  {
    name: 'Ana Beatriz',
    role: 'CFO',
    company: 'Distribuidora Nacional',
    text: 'O módulo financeiro e a IA mudaram completamente a forma como tomamos decisões estratégicas.',
    metric: '+28%',
    metricLabel: 'margem de lucro',
  },
  {
    name: 'Roberto Lima',
    role: 'Gerente Comercial',
    company: 'TechParts',
    text: 'A IA comercial aumentou nossa conversão em 28%. A equipe agora sabe exatamente quem ligar e quando.',
    metric: '+28%',
    metricLabel: 'conversão',
  },
];

export default function TestimonialsSection() {
  return (
    <section id="depoimentos" className="container mx-auto px-4 lg:px-8 py-20 md:py-28">
      <div className="text-center mb-16">
        <Badge variant="outline" className="mb-4 font-medium">Resultados comprovados</Badge>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Empresas que já transformaram sua operação
        </h2>
        <p className="text-muted-foreground text-base md:text-lg">Resultados reais de quem já usa a USE SISTEMAS.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
        {testimonials.map((t) => (
          <Card key={t.name} className="bg-card border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-3xl font-extrabold text-primary leading-none">{t.metric}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{t.metricLabel}</p>
                </div>
                <Quote className="h-8 w-8 text-primary/8 group-hover:text-primary/15 transition-colors duration-300" />
              </div>

              <div className="flex gap-0.5 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-3.5 w-3.5 fill-primary text-primary" />
                ))}
              </div>

              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">&quot;{t.text}&quot;</p>

              <div className="border-t border-border/50 pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}, {t.company}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-xs text-muted-foreground/50 mb-4 font-semibold uppercase tracking-wider">Empresas que confiam na USE SISTEMAS</p>
        <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap opacity-25">
          {['MetalForte', 'Nacional', 'TechParts', 'IndusBR', 'LogiPro'].map(name => (
            <span key={name} className="text-sm font-bold text-muted-foreground tracking-wider">{name}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
