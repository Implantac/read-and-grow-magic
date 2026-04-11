import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Rocket, Factory, ShieldCheck, Gauge, Target } from 'lucide-react';

const diffs = [
  { icon: Factory, title: 'Feito para indústria', desc: 'Pensado para confecção, produção sob encomenda e distribuição. Não é um sistema genérico.' },
  { icon: Brain, title: 'IA embarcada', desc: 'Prevê problemas, prioriza clientes, otimiza picking e sugere ações automaticamente.' },
  { icon: Rocket, title: 'Implantação em 7 dias', desc: 'Nada de 6 meses de projeto. Em uma semana você já está operando com suporte dedicado.' },
  { icon: Gauge, title: 'Tudo integrado', desc: 'Comercial, produção, estoque, logística, financeiro e fiscal em um só lugar.' },
  { icon: ShieldCheck, title: 'Seguro e confiável', desc: 'Dados criptografados, backup automático, LGPD compliant e 99.9% de uptime.' },
  { icon: Target, title: 'ROI no primeiro mês', desc: 'Clientes recuperam o investimento em semanas com redução de erros e ganho de produtividade.' },
];

export default function DifferentialsSection() {
  return (
    <section className="bg-muted/20 border-y py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 font-medium">Diferenciais</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Não é mais um sistema genérico.
            <br className="hidden md:block" />
            É o <span className="text-gradient-primary">único</span> que você vai precisar.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {diffs.map((d, i) => (
            <Card
              key={d.title}
              className="bg-card hover:shadow-elevation-3 hover:-translate-y-1 transition-all duration-300 group"
            >
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/12 group-hover:scale-105 transition-all duration-300">
                  <d.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{d.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{d.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
