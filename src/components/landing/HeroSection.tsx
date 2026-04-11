import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, MessageCircle, Play, Shield, Zap, BarChart3 } from 'lucide-react';
import dashboardMockup from '@/assets/dashboard-mockup.jpg';

interface Props {
  onLogin: () => void;
  onWhatsApp: () => void;
}

export default function HeroSection({ onLogin, onWhatsApp }: Props) {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle gradient backgrounds */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-[radial-gradient(ellipse_at_center,hsl(36_100%_50%/0.06),transparent_70%)]" />
        <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,hsl(207_90%_54%/0.04),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_center,hsl(36_100%_50%/0.03),transparent_70%)]" />
      </div>

      <div className="container mx-auto px-4 pt-20 pb-12 md:pt-28 md:pb-16">
        {/* Top badge */}
        <div className="text-center animate-fade-in">
          <Badge variant="secondary" className="mb-8 px-4 py-1.5 text-sm font-medium gap-2 border border-border/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            Implantação assistida — vagas limitadas em Abril
          </Badge>
        </div>

        {/* Headline */}
        <h1 className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-[1.08] animate-fade-in">
          Controle total da sua operação,
          <br className="hidden md:block" />
          <span className="text-gradient-primary">do pedido à entrega.</span>
        </h1>

        <p className="text-center text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in leading-relaxed">
          O ERP industrial com IA que integra vendas, produção, estoque e logística.
          Menos retrabalho, mais lucro, decisões em tempo real.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 animate-fade-in">
          <Button
            size="lg"
            className="gap-2 text-base px-8 h-14 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
            onClick={onWhatsApp}
          >
            <MessageCircle className="h-5 w-5" /> Agendar Demonstração
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-base px-8 h-14 gap-2 hover:-translate-y-0.5 transition-all duration-300"
            onClick={onLogin}
          >
            <Play className="h-4 w-4" /> Testar Grátis 14 Dias
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground animate-fade-in mb-16">
          Sem cartão de crédito · Implantação em até 7 dias · Suporte humano em português
        </p>

        {/* Dashboard mockup */}
        <div className="max-w-5xl mx-auto animate-fade-in-up">
          <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-elevation-4 bg-card">
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent z-10 pointer-events-none" />
            <img
              src={dashboardMockup}
              alt="Dashboard do sistema ERP Cloud mostrando métricas de produção, estoque e vendas"
              className="w-full h-auto"
              loading="eager"
            />
          </div>
          {/* Floating stats below mockup */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto -mt-8 relative z-20 px-4">
            {[
              { value: '12+', label: 'Módulos integrados', icon: Zap },
              { value: '35%', label: 'Menos tempo operacional', icon: BarChart3 },
              { value: '7 dias', label: 'Implantação completa', icon: ArrowRight },
              { value: '99.9%', label: 'Disponibilidade', icon: Shield },
            ].map((s) => (
              <div key={s.label} className="text-center bg-card border border-border/50 rounded-xl p-4 shadow-elevation-2 hover-lift">
                <p className="text-2xl md:text-3xl font-extrabold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
