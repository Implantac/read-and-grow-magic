import { Rocket } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';

const STEPS = [
  { n: 1, t: 'Confira seu perfil', d: 'Veja em qual empresa/filial você está logado e qual é seu papel (canto superior).' },
  { n: 2, t: 'Explore o menu', d: 'Passe o mouse em cada seção lateral. Ícones esmaecidos = módulo não contratado no seu plano.' },
  { n: 3, t: 'Abra o Dashboard', d: 'É o painel-mãe. Se algo estiver zerado, é porque falta cadastro — não é bug.' },
  { n: 4, t: 'Leia esta página', d: 'Escolha uma trilha de aprendizado que combine com seu perfil e siga na ordem.' },
  { n: 5, t: 'Treine em sandbox', d: 'Use dados de teste antes de operar em produção. Nada substitui a prática.' },
];

export function QuickStartCard() {
  return (
    <Card className="mt-8 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Rocket className="h-5 w-5 text-primary" /> Início rápido — 5 passos para não travar no primeiro dia
        </CardTitle>
        <CardDescription>
          Se você acabou de entrar no ERP, faça esta sequência antes de qualquer outra coisa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-lg border bg-background p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {s.n}
                </div>
                <p className="text-sm font-semibold">{s.t}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.d}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
