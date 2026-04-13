import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Rocket, Factory, ShieldCheck, Gauge, Target } from 'lucide-react';

const diffs = [
  { icon: Factory, title: 'Feito para quem produz e vende', desc: 'Projetado para indústrias, atacado, varejo e produção sob encomenda — não é um sistema genérico adaptado.', num: '01' },
  { icon: Brain, title: 'IA que trabalha por você', desc: 'Prevê gargalos, prioriza clientes de risco, otimiza picking e sugere ações antes que o problema aconteça.', num: '02' },
  { icon: Rocket, title: 'Operando em 7 dias', desc: 'Implantação assistida com consultoria, migração de dados e treinamento. Sem meses de projeto.', num: '03' },
  { icon: Gauge, title: 'Integração nativa ponta a ponta', desc: 'Comercial, produção, estoque, logística, financeiro e fiscal — tudo conectado, zero retrabalho entre setores.', num: '04' },
  { icon: ShieldCheck, title: 'Segurança enterprise', desc: 'Dados criptografados, backup automático, LGPD nativo, auditoria completa e 99.9% de uptime garantido.', num: '05' },
  { icon: Target, title: 'ROI mensurável', desc: 'Clientes recuperam o investimento em semanas com redução de erros, ganho de eficiência e visibilidade do lucro.', num: '06' },
];

export default function DifferentialsSection() {
  return (
    <section id="diferenciais" className="bg-muted/20 border-y border-border/50 py-20 md:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-5 font-medium px-4 py-1.5 text-xs">Por que a USE SISTEMAS</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            O que nos torna <span className="text-primary inline">diferentes</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Não é só um sistema. É uma plataforma que combina gestão integrada, inteligência artificial e visão 360° do negócio.
          </p>
        </div>
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {diffs.map((d) => (
            <Card
              key={d.title}
              className="bg-card border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div className="h-12 w-12 rounded-2xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/12 group-hover:scale-105 transition-all duration-300">
                    <d.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-3xl font-extrabold text-muted-foreground/[0.06] group-hover:text-primary/[0.08] transition-colors duration-300">{d.num}</span>
                </div>
                <h3 className="text-base font-bold mb-2 text-foreground">{d.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{d.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
