import { Building2, Globe, Shield, Clock, Headphones, Lock } from 'lucide-react';

const items = [
  { icon: Building2, label: 'Multi-empresa' },
  { icon: Globe, label: '100% Cloud' },
  { icon: Shield, label: 'LGPD Compliant' },
  { icon: Clock, label: 'Implantação 7 dias' },
  { icon: Lock, label: 'Criptografia SSL' },
  { icon: Headphones, label: 'Suporte em PT-BR' },
];

export default function TrustBar() {
  return (
    <section className="border-y bg-card/30 py-4">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-center overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-x-6 md:gap-x-10 whitespace-nowrap">
            {items.map((item, i) => (
              <div key={item.label} className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                <item.icon className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
