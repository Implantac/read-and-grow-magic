import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Shield, Users, Headphones, Rocket, CheckCircle2 } from 'lucide-react';

interface Props {
  onWhatsApp: () => void;
}

const pillars = [
  { icon: Rocket, title: 'Implantação Assistida', desc: 'Configuração completa com acompanhamento técnico dedicado. Nada de "vire-se sozinho".' },
  { icon: Users, title: 'Treinamento Completo', desc: 'Capacitação para toda a equipe operar com autonomia desde o primeiro dia útil.' },
  { icon: Headphones, title: 'Suporte Especializado', desc: 'Atendimento humano em português com profissionais que entendem de gestão industrial.' },
  { icon: Shield, title: 'Estruturação de Processos', desc: 'Mais do que software — ajudamos a organizar sua empresa para crescer com previsibilidade.' },
];

export default function ConsultiveOfferSection({ onWhatsApp }: Props) {
  return (
    <section className="container mx-auto px-4 lg:px-8 py-20 md:py-28">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-5 font-medium px-4 py-1.5 text-xs">Abordagem consultiva</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Não é só software.{' '}
            <span className="text-primary inline">É a estruturação da sua empresa.</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            A USE SISTEMAS entrega uma solução consultiva: entendemos sua operação, configuramos tudo e acompanhamos até funcionar no seu contexto.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground">{p.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Lead filter + CTA */}
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/[0.02] border border-primary/15 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Esse sistema é para você?</p>
          <p className="text-lg md:text-xl font-bold text-foreground mb-2">
            A USE SISTEMAS é para empresas que querem <span className="text-primary">crescer com controle.</span>
          </p>
          <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
            Se sua empresa precisa de organização para escalar — menos retrabalho, mais lucro e decisões baseadas em dados — foi feita para você.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-6 max-w-md mx-auto">
            {['Indústrias', 'Atacado', 'Produção sob encomenda', 'Varejo'].map(s => (
              <span key={s} className="flex items-center gap-1.5 text-xs font-semibold text-primary/80 bg-primary/5 border border-primary/10 rounded-full px-3 py-1">
                <CheckCircle2 className="h-3 w-3" />{s}
              </span>
            ))}
          </div>
          <Button
            size="lg"
            className="gap-2 text-base px-10 h-14 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 font-semibold"
            onClick={onWhatsApp}
          >
            <MessageCircle className="h-5 w-5" /> Quero Ver Funcionando na Minha Empresa
          </Button>
        </div>
      </div>
    </section>
  );
}
