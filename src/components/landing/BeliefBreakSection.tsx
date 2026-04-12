import { Badge } from '@/components/ui/badge';
import { Users, Cog, AlertTriangle } from 'lucide-react';

export default function BeliefBreakSection() {
  return (
    <section className="container mx-auto px-4 lg:px-8 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 font-medium px-4 py-1">Reflexão</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight text-foreground">
            O problema <span className="text-destructive">não</span> é sua equipe.
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            É a falta de integração entre os setores. Quando vendas, produção, estoque e financeiro não conversam, o retrabalho é inevitável — independente de quão boa seja sua equipe.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 md:gap-5">
          <div className="p-6 rounded-2xl bg-card border border-border/50 text-center hover:border-primary/20 hover:shadow-lg transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-destructive/8 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <p className="font-bold text-sm mb-2 text-foreground">Ferramentas desconectadas</p>
            <p className="text-xs text-muted-foreground leading-relaxed">Planilhas, sistemas isolados e WhatsApp não são gestão — são improviso.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border/50 text-center hover:border-primary/20 hover:shadow-lg transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-warning/8 flex items-center justify-center mx-auto mb-4">
              <Cog className="h-5 w-5 text-warning" />
            </div>
            <p className="font-bold text-sm mb-2 text-foreground">Processos manuais</p>
            <p className="text-xs text-muted-foreground leading-relaxed">Cada informação precisa ser digitada duas, três vezes. Erros são questão de tempo.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border/50 text-center hover:border-primary/20 hover:shadow-lg transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="font-bold text-sm mb-2 text-foreground">Equipe sem visibilidade</p>
            <p className="text-xs text-muted-foreground leading-relaxed">Sem um painel único, cada setor opera no escuro — e a culpa cai nas pessoas.</p>
          </div>
        </div>

        <div className="mt-10 p-5 md:p-6 rounded-2xl bg-primary/5 border border-primary/15 text-center">
          <p className="text-base md:text-lg font-semibold text-foreground leading-relaxed">
            A solução não é contratar mais gente.{' '}
            <span className="text-primary">É ter uma plataforma que integre tudo.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
