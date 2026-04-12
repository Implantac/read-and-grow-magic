import { Zap, Shield } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="border-t bg-card/30 py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">ERP Cloud</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              O sistema completo para indústrias que querem crescer com controle, eficiência e inteligência artificial.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="font-semibold text-xs mb-3 uppercase tracking-wider text-muted-foreground">Navegação</p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="#problemas" className="hover:text-foreground transition-colors">Problemas</a>
              <a href="#solucao" className="hover:text-foreground transition-colors">Solução</a>
              <a href="#beneficios" className="hover:text-foreground transition-colors">Benefícios</a>
              <a href="#depoimentos" className="hover:text-foreground transition-colors">Depoimentos</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Planos</a>
            </div>
          </div>

          {/* Trust */}
          <div>
            <p className="font-semibold text-xs mb-3 uppercase tracking-wider text-muted-foreground">Segurança & Suporte</p>
            <div className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-primary/50" /> Dados criptografados (SSL/TLS)</div>
              <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-primary/50" /> LGPD Compliant</div>
              <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-primary/50" /> Backup automático diário</div>
              <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-primary/50" /> 99.9% de disponibilidade</div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground/60">© {new Date().getFullYear()} ERP Cloud. Todos os direitos reservados.</p>
          <p className="text-xs text-muted-foreground/60">Feito com tecnologia de ponta para indústrias brasileiras.</p>
        </div>
      </div>
    </footer>
  );
}
