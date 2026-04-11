import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, ArrowRight, MessageCircle, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onLogin: () => void;
  onWhatsApp: () => void;
}

export default function LandingHeader({ onLogin, onWhatsApp }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { href: '#problemas', label: 'Problemas' },
    { href: '#solucao', label: 'Solução' },
    { href: '#beneficios', label: 'Benefícios' },
    { href: '#pricing', label: 'Planos' },
  ];

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-all duration-300',
      scrolled ? 'bg-background/90 backdrop-blur-xl border-b shadow-elevation-1' : 'bg-transparent'
    )}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-md">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">ERP Cloud</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground transition-colors font-medium">{l.label}</a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" onClick={onLogin} className="font-medium">Entrar</Button>
          <Button onClick={onWhatsApp} className="gap-1.5 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
            <MessageCircle className="h-4 w-4" /> Falar com Especialista
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-background border-b px-4 pb-4 animate-fade-in">
          <nav className="flex flex-col gap-3 mb-4">
            {links.map(l => (
              <a key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground transition-colors font-medium py-1" onClick={() => setMenuOpen(false)}>
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={onLogin} className="w-full">Entrar</Button>
            <Button onClick={onWhatsApp} className="w-full gap-1.5">
              <MessageCircle className="h-4 w-4" /> Falar com Especialista
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
