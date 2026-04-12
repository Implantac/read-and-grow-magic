import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Menu, X, ArrowRight } from 'lucide-react';
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
    { href: '#depoimentos', label: 'Depoimentos' },
    { href: '#pricing', label: 'Planos' },
  ];

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-all duration-500',
      scrolled ? 'bg-background/80 backdrop-blur-2xl border-b border-border/50 shadow-sm' : 'bg-transparent'
    )}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-md group-hover:shadow-glow transition-all duration-300 group-hover:scale-105">
            <span className="text-primary-foreground font-extrabold text-sm">U</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-extrabold tracking-tight">USE SISTEMAS</span>
            <span className="text-[9px] font-medium text-muted-foreground tracking-widest uppercase">Gestão Empresarial</span>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 font-medium"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2.5">
          <Button variant="ghost" size="sm" onClick={onLogin} className="font-medium gap-1.5">
            Entrar <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            onClick={onWhatsApp}
            className="gap-1.5 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-px transition-all duration-300"
          >
            <MessageCircle className="h-4 w-4" /> Falar com Especialista
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button className="lg:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={cn(
        'lg:hidden overflow-hidden transition-all duration-300',
        menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="bg-background/95 backdrop-blur-xl border-b px-4 pb-5 pt-2">
          <nav className="flex flex-col gap-1 mb-4">
            {links.map(l => (
              <a
                key={l.href}
                href={l.href}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium py-2.5 px-3 rounded-lg"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={onLogin} className="w-full h-11">Entrar</Button>
            <Button onClick={onWhatsApp} className="w-full h-11 gap-1.5">
              <MessageCircle className="h-4 w-4" /> Falar com Especialista
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
