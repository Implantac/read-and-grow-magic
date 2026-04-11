import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const testimonials = [
  { name: 'Carlos Mendes', role: 'Diretor, Indústria MetalForte', text: 'Reduzimos 35% do tempo operacional com a automação do pedido ao faturamento. O ROI veio no segundo mês.', metric: '-35% tempo' },
  { name: 'Ana Beatriz', role: 'CFO, Distribuidora Nacional', text: 'O módulo financeiro e a IA mudaram completamente a forma como tomamos decisões estratégicas.', metric: '+28% lucro' },
  { name: 'Roberto Lima', role: 'Gerente Comercial, TechParts', text: 'A IA comercial aumentou nossa taxa de conversão em 28%. A equipe agora sabe exatamente quem ligar.', metric: '+28% conversão' },
];

export default function TestimonialsSection() {
  return (
    <section id="depoimentos" className="container mx-auto px-4 py-20">
      <div className="text-center mb-14">
        <Badge variant="outline" className="mb-4">Quem já usa</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Resultados reais de empresas reais</h2>
        <p className="text-muted-foreground text-lg">Não é promessa. É resultado comprovado.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {testimonials.map((t) => (
          <Card key={t.name} className="bg-card/80 border-border/50 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <Badge variant="secondary" className="mb-4 text-primary font-bold">{t.metric}</Badge>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-4 w-4 fill-primary text-primary" />)}
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed italic">&quot;{t.text}&quot;</p>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
