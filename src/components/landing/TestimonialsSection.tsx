import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Carlos Mendes',
    role: 'Diretor de Operações',
    company: 'Indústria MetalForte',
    text: 'Reduzimos 35% do tempo operacional com a automação do pedido ao faturamento. O ROI veio no segundo mês de uso. Nunca mais voltamos ao modelo antigo.',
    metric: '-35%',
    metricLabel: 'tempo operacional',
    avatar: 'CM',
  },
  {
    name: 'Ana Beatriz',
    role: 'CFO',
    company: 'Distribuidora Nacional',
    text: 'O módulo financeiro e a inteligência artificial mudaram completamente como tomamos decisões. Antes era feeling, agora é dado. O fluxo de caixa nunca esteve tão previsível.',
    metric: '+28%',
    metricLabel: 'margem de lucro',
    avatar: 'AB',
  },
  {
    name: 'Roberto Lima',
    role: 'Gerente Comercial',
    company: 'TechParts Industrial',
    text: 'A IA comercial nos mostrou quais clientes estavam em risco e onde estavam as melhores oportunidades. Conversão subiu, e o time vendedor ficou mais estratégico.',
    metric: '+42%',
    metricLabel: 'taxa de conversão',
    avatar: 'RL',
  },
];

export default function TestimonialsSection() {
  return (
    <section id="depoimentos" className="container mx-auto px-4 lg:px-8 py-20 md:py-28">
      <div className="text-center mb-14">
        <Badge variant="outline" className="mb-5 font-medium px-4 py-1.5 text-xs">Cases de sucesso</Badge>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Empresas que já transformaram sua <span className="text-gradient-primary">operação</span>
        </h2>
        <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">Resultados reais de quem opera com a plataforma USE SISTEMAS.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
        {testimonials.map((t) => (
          <Card key={t.name} className="bg-card border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
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
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-primary/10">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}, {t.company}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-14 text-center">
        <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-[0.2em] mb-5">Empresas que confiam na USE SISTEMAS</p>
        <div className="flex items-center justify-center gap-8 md:gap-14 flex-wrap">
          {['MetalForte', 'Nacional', 'TechParts', 'IndusBR', 'LogiPro'].map(name => (
            <span key={name} className="text-sm font-bold text-muted-foreground/20 tracking-wider hover:text-muted-foreground/40 transition-colors duration-300">{name}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
