import { Zap } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="border-t bg-muted/20 py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">ERP Cloud</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#problemas" className="hover:text-foreground transition-colors">Problemas</a>
            <a href="#solucao" className="hover:text-foreground transition-colors">Solução</a>
            <a href="#beneficios" className="hover:text-foreground transition-colors">Benefícios</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Planos</a>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} ERP Cloud</p>
        </div>
      </div>
    </footer>
  );
}
