import { Building2, Globe, Shield, Clock, Headphones } from 'lucide-react';

export default function TrustBar() {
  return (
    <section className="border-y bg-muted/30 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
          <div className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4" /> Multi-empresa</div>
          <div className="flex items-center gap-2 text-sm"><Globe className="h-4 w-4" /> 100% Cloud</div>
          <div className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4" /> LGPD Compliant</div>
          <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4" /> Implantação em 7 dias</div>
          <div className="flex items-center gap-2 text-sm"><Headphones className="h-4 w-4" /> Suporte em português</div>
        </div>
      </div>
    </section>
  );
}
