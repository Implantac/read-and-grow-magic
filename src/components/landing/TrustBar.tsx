import { Building2, Globe, Shield, Clock, Headphones, Lock, Award, Zap, CheckCircle2 } from 'lucide-react';

const items = [
  { icon: Building2, label: 'Multi-empresa & Multi-filial' },
  { icon: Globe, label: '100% Cloud — Acesse de Qualquer Lugar' },
  { icon: Shield, label: 'LGPD Nativo' },
  { icon: Clock, label: 'Implantação em 7 Dias' },
  { icon: Lock, label: 'Criptografia de Ponta' },
  { icon: Headphones, label: 'Suporte Humano em PT-BR' },
  { icon: Award, label: 'ROI Comprovado' },
  { icon: Zap, label: 'IA Embarcada' },
  { icon: CheckCircle2, label: '+120 Empresas Operando' },
];

export default function TrustBar() {
  return (
    <section className="border-y border-border/50 bg-card/50 backdrop-blur-sm py-4 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <div
            key={`${item.label}-${i}`}
            className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground mx-5 md:mx-8"
          >
            <item.icon className="h-3.5 w-3.5 text-primary/60 shrink-0" />
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}
