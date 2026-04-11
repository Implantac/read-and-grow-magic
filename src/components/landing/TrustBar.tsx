import { Building2, Globe, Shield, Clock, Headphones, Lock } from 'lucide-react';

const items = [
  { icon: Building2, label: 'Multi-empresa' },
  { icon: Globe, label: '100% Cloud' },
  { icon: Shield, label: 'LGPD Compliant' },
  { icon: Clock, label: 'Implantação em 7 dias' },
  { icon: Lock, label: 'Dados criptografados' },
  { icon: Headphones, label: 'Suporte em português' },
];

export default function TrustBar() {
  return (
    <section className="border-y bg-card/50 py-5">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-muted-foreground">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm font-medium">
              <item.icon className="h-4 w-4 text-primary/70" />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
