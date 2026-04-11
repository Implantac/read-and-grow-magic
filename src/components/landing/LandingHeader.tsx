import { Button } from '@/components/ui/button';
import { Zap, ArrowRight, MessageCircle } from 'lucide-react';

interface Props {
  onLogin: () => void;
  onWhatsApp: () => void;
}

export default function LandingHeader({ onLogin, onWhatsApp }: Props) {
  return (
    <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] flex items-center justify-center shadow-md">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">ERP Cloud</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#problemas" className="text-muted-foreground hover:text-foreground transition-colors">Problemas</a>
          <a href="#solucao" className="text-muted-foreground hover:text-foreground transition-colors">Solução</a>
          <a href="#beneficios" className="text-muted-foreground hover:text-foreground transition-colors">Benefícios</a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Planos</a>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onLogin} className="hidden sm:inline-flex">Entrar</Button>
          <Button onClick={onWhatsApp} className="gap-1.5 shadow-lg shadow-primary/25">
            <MessageCircle className="h-4 w-4" /> Falar com Especialista
          </Button>
        </div>
      </div>
    </header>
  );
}
