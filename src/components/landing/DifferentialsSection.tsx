import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Rocket, Factory, ShieldCheck, Gauge, Target } from 'lucide-react';

const diffs = [
  { icon: Factory, title: 'Feito pra indústria', desc: 'Pensado para confecção, produção sob encomenda e distribuição. Não é um sistema genérico.' },
  { icon: Brain, title: 'IA que trabalha por você', desc: 'Sugere ações, prevê problemas, prioriza clientes e otimiza picking automaticamente.' },
  { icon: Rocket, title: 'Implantação em 7 dias', desc: 'Nada de 6 meses de projeto. Em uma semana você já está operando.' },
  { icon: Gauge, title: 'Tudo em um só lugar', desc: 'Comercial, produção, estoque, logística, financeiro e fiscal. Sem gambiarras.' },
  { icon: ShieldCheck, title: 'Seguro e confiável', desc: 'Dados criptografados, backup automático, LGPD compliant, 99.9% uptime.' },
  { icon: Target, title: 'ROI no primeiro mês', desc: 'Clientes recuperam o investimento em semanas com redução de erros e ganho de produtividade.' },
];

export default function DifferentialsSection() {
  return (
    <section className="bg-muted/30 border-y py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4">Por que nós?</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Não é só mais um sistema.<br />É o <span className="text-primary">único</span> que você vai precisar.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {diffs.map((d) => (
            <Card key={d.title} className="bg-card/80 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
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
