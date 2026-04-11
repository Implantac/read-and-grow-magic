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
    text: 'A IA comercial aumentou nossa taxa de conversão em 28%. A equipe agora sabe exatamente quem ligar e quando.',
    metric: '+28%',
    metricLabel: 'conversão',
  },
];

export default function TestimonialsSection() {
  return (
    <section id="depoimentos" className="container mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <Badge variant="outline" className="mb-4 font-medium">Resultados comprovados</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Empresas que já transformaram sua operação
        </h2>
        <p className="text-muted-foreground text-lg">Resultados reais de quem já usa o sistema.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {testimonials.map((t) => (
          <Card key={t.name} className="bg-card border hover:shadow-elevation-3 hover:-translate-y-1 transition-all duration-300 group">
            <CardContent className="p-6">
              {/* Metric highlight */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-3xl font-extrabold text-primary">{t.metric}</p>
                  <p className="text-xs text-muted-foreground">{t.metricLabel}</p>
                </div>
                <Quote className="h-8 w-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>

              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">&quot;{t.text}&quot;</p>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}, {t.company}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
