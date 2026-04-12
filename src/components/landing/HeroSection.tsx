import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, MessageCircle, Play, Shield, Zap, BarChart3, CheckCircle2, Users } from 'lucide-react';
import dashboardMockup from '@/assets/dashboard-mockup.jpg';

interface Props {
  onLogin: () => void;
  onWhatsApp: () => void;
}

const stats = [
  { value: '12+', label: 'Módulos integrados', icon: Zap },
  { value: '35%', label: 'Menos tempo operacional', icon: BarChart3 },
  { value: '7 dias', label: 'Implantação completa', icon: ArrowRight },
  { value: '99.9%', label: 'Disponibilidade', icon: Shield },
];

const quickWins = [
  'Gestão completa: vendas, produção, estoque e logística',
  'IA que antecipa gargalos e sugere ações em tempo real',
  'Implantação assistida em até 7 dias com suporte dedicado',
];

export default function HeroSection({ onLogin, onWhatsApp }: Props) {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[800px] bg-[radial-gradient(ellipse_at_center,hsl(36_100%_50%/0.06),transparent_60%)]" />
        <div className="absolute top-60 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,hsl(207_90%_54%/0.04),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.2)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.2)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      </div>

      <div className="container mx-auto px-4 pt-10 pb-12 md:pt-16 md:pb-16 lg:px-8">
        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center max-w-6xl mx-auto">
          {/* Left - Copy */}
          <div className="text-center lg:text-left animate-fade-in">
            <Badge variant="secondary" className="mb-5 px-4 py-1.5 text-sm font-medium gap-2 border border-border/50 bg-card/80 backdrop-blur-sm inline-flex">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              Implantação assistida — vagas limitadas
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight mb-5 leading-[1.15]">
              Sua{' '}
              <span className="text-gradient-primary inline">operação</span>
              {' '}sob controle total.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground mb-7 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Plataforma completa de gestão empresarial para indústrias, atacado e varejo. Produção, estoque, vendas e entregas — tudo integrado com IA.
            </p>

            {/* Quick wins */}
            <div className="flex flex-col gap-2.5 mb-7 items-center lg:items-start">
              {quickWins.map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm font-medium text-foreground/80">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-4">
              <Button
                size="lg"
                className="gap-2 text-base px-8 h-14 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 font-semibold"
                onClick={onWhatsApp}
              >
                <MessageCircle className="h-5 w-5" /> Quero Ver Funcionando
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 h-14 gap-2 hover:-translate-y-0.5 transition-all duration-300 bg-card/80 backdrop-blur-sm font-semibold border-border"
                onClick={onLogin}
              >
                <Play className="h-4 w-4" /> Testar Grátis 14 Dias
              </Button>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground">
              Sem cartão de crédito · Implantação em até 7 dias · Suporte humano
            </p>
          </div>

          {/* Right - Dashboard mockup */}
          <div className="animate-fade-in-up lg:order-last">
            <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-2xl bg-card max-h-[420px]">
              {/* Browser chrome bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border/30">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-warning/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-success/40" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="h-5 w-48 rounded-md bg-muted/60 text-[10px] flex items-center justify-center text-muted-foreground/50 font-medium">
                    app.usesistemas.com.br
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent z-10 pointer-events-none" />
                <img
                  src={dashboardMockup}
                  alt="Dashboard do sistema USE SISTEMAS mostrando métricas de produção, estoque e vendas"
                  className="w-full h-auto"
                  loading="eager"
                />
              </div>
            </div>
            {/* Social proof below mockup */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mt-4">
              <div className="flex -space-x-2">
                {['C', 'A', 'R', 'M'].map((letter, i) => (
                  <div
                    key={letter}
                    className="h-7 w-7 rounded-full border-2 border-background bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-[10px] font-bold text-primary"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">+120 empresas</span> já confiam na USE SISTEMAS
              </p>
            </div>
          </div>
        </div>

        {/* Stats bar below */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto mt-12 md:mt-14 px-2 sm:px-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="text-center bg-card/95 backdrop-blur-sm border border-border/40 rounded-xl p-3.5 md:p-5 shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <s.icon className="h-4 w-4 text-primary/50 mx-auto mb-2" />
              <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-primary">{s.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
