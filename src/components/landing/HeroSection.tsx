import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, MessageCircle, Play } from 'lucide-react';

interface Props {
  onLogin: () => void;
  onWhatsApp: () => void;
}

export default function HeroSection({ onLogin, onWhatsApp }: Props) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,hsl(36_100%_50%/0.08),transparent_70%)]" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_center,hsl(207_90%_54%/0.06),transparent_70%)]" />
      </div>

      <div className="container mx-auto px-4 pt-16 pb-20 md:pt-20 md:pb-24 text-center">
        <div className="animate-fade-in">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Vagas limitadas para implantação em Abril
          </Badge>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1] animate-slide-in">
          Sua produção atrasada, estoque<br className="hidden md:block" /> bagunçado e{' '}
          <span className="bg-gradient-to-r from-destructive to-destructive/80 bg-clip-text text-transparent">
            lucro sumindo?
          </span>
          <br />
          <span className="bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] bg-clip-text text-transparent mt-2 block">
            Isso acaba agora.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in leading-relaxed">
          O sistema que{' '}
          <strong className="text-foreground">organiza sua operação inteira</strong> — do pedido
          à entrega — com inteligência artificial. Você volta a ter{' '}
          <strong className="text-foreground">controle, prazo e lucro de verdade</strong>.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 animate-fade-in">
          <Button
            size="lg"
            className="gap-2 text-lg px-8 h-14 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
            onClick={onWhatsApp}
          >
            <MessageCircle className="h-5 w-5" /> Quero Ver Funcionando
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 h-14 gap-2"
            onClick={onLogin}
          >
            <Play className="h-4 w-4" /> Testar Grátis 14 Dias
          </Button>
        </div>

        <p className="text-sm text-muted-foreground animate-fade-in mb-12">
          Sem cartão de crédito • Implantação em até 7 dias • Suporte humano em português
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in">
          {[
            { value: '12+', label: 'Módulos integrados' },
            { value: '35%', label: 'Menos tempo operacional' },
            { value: '7 dias', label: 'Implantação completa' },
            { value: '24/7', label: 'Suporte técnico' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl md:text-4xl font-extrabold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
