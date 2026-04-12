import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Rocket, Factory, ShieldCheck, Gauge, Target } from 'lucide-react';

const diffs = [
  { icon: Factory, title: 'Feito para quem produz e vende', desc: 'Pensado para indústrias de transformação, produção sob encomenda, atacado e varejo.' },
  { icon: Brain, title: 'IA embarcada', desc: 'Prevê problemas, prioriza clientes, otimiza picking e sugere ações automaticamente.' },
  { icon: Rocket, title: 'Implantação em 7 dias', desc: 'Nada de meses de projeto. Em uma semana você já está operando com suporte dedicado.' },
  { icon: Gauge, title: 'Tudo integrado', desc: 'Comercial, produção, estoque, logística, financeiro e fiscal — zero retrabalho.' },
  { icon: ShieldCheck, title: 'Seguro e confiável', desc: 'Dados criptografados, backup automático, LGPD e 99.9% de disponibilidade.' },
  { icon: Target, title: 'ROI no primeiro mês', desc: 'Clientes recuperam o investimento em semanas com redução de erros operacionais.' },
];

export default function DifferentialsSection() {
  return (
    <section className="bg-muted/20 border-y py-20 md:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 font-medium">Diferenciais</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Por que a <span className="text-gradient-primary">USE SISTEMAS</span> é diferente?
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Uma plataforma que combina gestão integrada, inteligência artificial e visão completa do negócio.
          </p>
        </div>
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {diffs.map((d) => (
            <Card
              key={d.title}
              className="bg-card border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
            >
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-2xl bg-primary/8 flex items-center justify-center mb-5 group-hover:bg-primary/12 group-hover:scale-105 transition-all duration-300">
                  <d.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-bold mb-2">{d.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{d.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
