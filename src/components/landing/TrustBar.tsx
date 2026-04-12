import { Building2, Globe, Shield, Clock, Headphones, Lock, Award, Zap } from 'lucide-react';

const items = [
  { icon: Building2, label: 'Multi-empresa' },
  { icon: Globe, label: '100% Cloud' },
  { icon: Shield, label: 'LGPD Compliant' },
  { icon: Clock, label: 'Implantação 7 dias' },
  { icon: Lock, label: 'Criptografia SSL' },
  { icon: Headphones, label: 'Suporte em PT-BR' },
  { icon: Award, label: 'ROI garantido' },
  { icon: Zap, label: 'IA embarcada' },
];

export default function TrustBar() {
  return (
    <section className="border-y border-border/50 bg-card/40 backdrop-blur-sm py-4 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <div
            key={`${item.label}-${i}`}
            className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground mx-5 md:mx-7"
          >
            <item.icon className="h-3.5 w-3.5 text-primary/50 shrink-0" />
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}
