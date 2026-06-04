import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { MessageCircle, Play, CheckCircle2 } from 'lucide-react';

interface Props {
  onLogin: () => void;
  onWhatsApp: () => void;
}

const proofPoints = [
  '+120 empresas já operam com controle total',
  'Implantação assistida em até 7 dias',
  'Sem cartão de crédito para começar',
];

export default function VSLHeroSection({ onLogin, onWhatsApp }: Props) {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[900px] bg-[radial-gradient(ellipse_at_center,hsl(36_100%_50%/0.05),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.12)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.12)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      </div>

      <div className="container mx-auto px-4 pt-10 pb-14 md:pt-16 md:pb-20 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium gap-2 border border-border/50 bg-card/80 backdrop-blur-sm inline-flex">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            Vagas limitadas para implantação assistida
          </Badge>

          <h1 className="text-[1.75rem] sm:text-4xl md:text-[2.75rem] lg:text-5xl font-extrabold tracking-tight mb-5 leading-[1.1] text-foreground">
            Sua empresa cresce, mas o controle{' '}
            <span className="text-gradient-primary">não acompanha?</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
            Descubra como empresas estão eliminando retrabalho, atraso e desorganização com uma única plataforma inteligente — do pedido à entrega.
          </p>

          {/* VSL Video */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="relative aspect-video rounded-2xl bg-card border border-border/50 shadow-2xl overflow-hidden group cursor-pointer hover:shadow-[0_20px_60px_-12px_hsl(var(--primary)/0.15)] hover:border-primary/20 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-muted/80 via-card to-muted/60" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.04),transparent_70%)]" />

              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-primary/10 border-2 border-primary/25 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:bg-primary/15 group-hover:border-primary/40 group-hover:shadow-[0_0_50px_hsl(var(--primary)/0.3)] transition-all duration-500">
                    <Play className="h-9 w-9 md:h-10 md:w-10 text-primary ml-1" />
                  </div>
                  <p className="text-foreground font-bold text-lg md:text-xl">Assista e entenda em 2 minutos</p>
                  <p className="text-sm text-muted-foreground mt-1.5">Como a USE SISTEMAS transforma a operação da sua empresa</p>
                </div>
              </div>

              {/* Browser chrome */}
              <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border/30 z-20">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-warning/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-success/40" />
                </div>
              </div>
            </div>
          </div>

          {/* CTA abaixo do vídeo */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6">
            <Button
              size="lg"
              className="gap-2 text-base px-8 h-14 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 font-semibold"
              onClick={onWhatsApp}
            >
              <MessageCircle className="h-5 w-5" /> Quero Ver Funcionando na Minha Empresa
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 h-14 gap-2 hover:-translate-y-0.5 transition-all duration-300 font-semibold border-border bg-card/60 backdrop-blur-sm text-foreground"
              onClick={onLogin}
            >
              <Play className="h-4 w-4" /> Testar Grátis por 14 Dias
            </Button>
          </div>

          {/* Proof points */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center items-center mb-12">
            {proofPoints.map((point) => (
              <div key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <span>{point}</span>
              </div>
            ))}
          </div>

          {/* Copy reinforcement below video */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="text-center p-5 rounded-2xl bg-card/80 border border-border/40">
              <p className="text-2xl font-extrabold text-destructive mb-1">😤</p>
              <p className="text-sm font-bold text-foreground mb-1">O problema</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Quanto mais vende, mais desorganizado fica. Retrabalho, atraso e perda de lucro.</p>
            </div>
            <div className="text-center p-5 rounded-2xl bg-card/80 border border-border/40">
              <p className="text-2xl font-extrabold text-primary mb-1">⚡</p>
              <p className="text-sm font-bold text-foreground mb-1">A solução</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Uma plataforma que conecta vendas, produção, estoque e financeiro com IA.</p>
            </div>
            <div className="text-center p-5 rounded-2xl bg-card/80 border border-border/40">
              <p className="text-2xl font-extrabold text-success mb-1">📈</p>
              <p className="text-sm font-bold text-foreground mb-1">O resultado</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Controle total, menos erro, mais eficiência e lucro visível por pedido.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
