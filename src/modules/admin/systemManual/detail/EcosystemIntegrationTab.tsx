import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Network, ArrowRight, Activity, Database, Shield } from 'lucide-react';
import type { ModuleManual } from '../content-types';
import { getFoundation } from '../foundation';

export function EcosystemIntegrationTab({ manual }: { manual: ModuleManual }) {
  const foundation = useMemo(() => getFoundation(manual.slug), [manual.slug]);

  if (!foundation || !foundation.integrations || foundation.integrations.length === 0) {
    return (
      <div className="mt-4 p-8 text-center border rounded-lg bg-muted/20">
        <Network className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Fluxo de Dados Isolado</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Este módulo opera de forma independente ou suas integrações ainda estão sendo mapeadas pela equipe de implantação.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Módulo no Ecossistema Read & Grow</CardTitle>
              <CardDescription>
                Este módulo não é uma ilha. Veja como ele alimenta e é alimentado pelo resto do sistema.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-primary/20 before:to-transparent">
            {foundation.integrations.map((it, i) => (
              <div key={i} className="relative flex items-center gap-6 group">
                <div className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full bg-background border-2 border-primary shadow-sm z-10 transition-transform group-hover:scale-110">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="ml-12 w-full p-4 rounded-xl border bg-background hover:border-primary/40 transition-all hover:shadow-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-primary/30 text-primary">
                      {it.with}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-semibold">{manual.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {it.what}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" /> Auditoria Transversal
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            Todas as movimentações deste módulo são registradas no <strong>Ledger Logístico</strong>, 
            garantindo que qualquer alteração tenha reflexo auditável em Finanças e Controladoria.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Governança UEEF
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            Este módulo segue rigorosamente o <strong>SEC-LEVEL 3</strong>, protegendo dados entre multi-tenants 
            e garantindo que permissões de 'Operador' não acessem funções de 'Estratégico'.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${className} ${variant === 'outline' ? 'border' : ''}`}>
      {children}
    </span>
  );
}
