import { Shield, Globe, Lock, Server } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="border-t border-border/50 bg-card/30 py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-extrabold text-xs">U</span>
              </div>
              <div>
                <span className="font-extrabold text-lg block leading-none">USE SISTEMAS</span>
                <span className="text-[9px] font-medium text-muted-foreground tracking-widest uppercase">Gestão Empresarial Inteligente</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mt-3">
              Plataforma completa de gestão para indústrias, atacado e varejo. Controle total da operação com IA embarcada, do pedido à entrega.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="font-bold text-xs mb-3 uppercase tracking-wider text-muted-foreground">Navegação</p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="#problemas" className="hover:text-foreground transition-colors">Diagnóstico</a>
              <a href="#solucao" className="hover:text-foreground transition-colors">Plataforma</a>
              <a href="#beneficios" className="hover:text-foreground transition-colors">Resultados</a>
              <a href="#depoimentos" className="hover:text-foreground transition-colors">Cases</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Planos</a>
            </div>
          </div>

          {/* Trust */}
          <div>
            <p className="font-bold text-xs mb-3 uppercase tracking-wider text-muted-foreground">Infraestrutura</p>
            <div className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-primary/50" /> SSL/TLS Criptografado</div>
              <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-primary/50" /> LGPD Compliant</div>
              <div className="flex items-center gap-2"><Server className="h-3.5 w-3.5 text-primary/50" /> Backup automático diário</div>
              <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-primary/50" /> 99.9% uptime garantido</div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground/50">© {new Date().getFullYear()} USE SISTEMAS. Todos os direitos reservados.</p>
          <p className="text-xs text-muted-foreground/50">Tecnologia enterprise para empresas brasileiras.</p>
        </div>
      </div>
    </footer>
  );
}
