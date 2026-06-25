import { useSearchParams, Link } from 'react-router-dom';
import { Sparkles, Check, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Alert, AlertDescription, AlertTitle } from '@/ui/base/alert';
import { usePlans } from '@/hooks/system/useSubscription';
import { useCurrentPlan } from '@/hooks/system/useCurrentPlan';
import { moduleLabel } from '@/lib/moduleLabels';

export default function Upgrade() {
  const [params] = useSearchParams();
  const requested = params.get('module') ?? '';
  const requiredPlanName = params.get('plan') ?? '';
  const reason = params.get('reason') ?? '';
  const { data: plans = [], isLoading } = usePlans();
  const { data: current } = useCurrentPlan();

  const label = requested ? moduleLabel(requested) : '';
  const headline =
    reason === 'plan_required'
      ? 'Assinatura necessária'
      : reason === 'module_locked'
        ? `${label || 'Este módulo'} indisponível no seu plano`
        : 'Faça upgrade do seu plano';

  const subtext =
    reason === 'plan_required'
      ? requiredPlanName
        ? `Para liberar ${label || 'este recurso'}, ative o plano ${requiredPlanName}.`
        : `Você precisa de uma assinatura ativa para usar ${label || 'este recurso'}.`
      : reason === 'module_locked'
        ? requiredPlanName
          ? `O módulo ${label} requer o plano ${requiredPlanName}${
              current ? ` (seu plano atual: ${current.plan_name})` : ''
            }.`
          : `O módulo ${label} não está incluído no seu plano${
              current ? ` ${current.plan_name}` : ''
            }.`
        : requested
          ? `O módulo ${label} não está incluído no seu plano atual${
              current ? ` (${current.plan_name})` : ''
            }.`
          : '';

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/dashboard"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Sparkles className="h-7 w-7 text-primary" />
            {headline}
          </h1>
          {subtext && <p className="mt-1 text-muted-foreground">{subtext}</p>}
        </div>
      </div>

      {reason && requested && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>
            {label}
            {requiredPlanName ? ` • requer ${requiredPlanName}` : ''}
          </AlertTitle>
          <AlertDescription>
            {reason === 'plan_required'
              ? 'Sua empresa ainda não possui uma assinatura ativa.'
              : `O recurso solicitado faz parte de um plano superior${
                  current ? ` ao seu (${current.plan_name})` : ''
                }.`}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="text-center text-muted-foreground">Carregando planos…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => {
            const isCurrent = current?.plan_id === p.id;
            const includes = p.allowed_modules?.includes(requested);
            const isRequired =
              !!requiredPlanName &&
              p.name?.toLowerCase() === requiredPlanName.toLowerCase();
            const highlight = isRequired || (!requiredPlanName && includes);
            return (
              <Card
                key={p.id}
                className={highlight ? 'border-primary/60 ring-2 ring-primary/40' : ''}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{p.name}</CardTitle>
                    <div className="flex gap-1">
                      {isRequired && <Badge>Recomendado</Badge>}
                      {isCurrent && <Badge variant="secondary">Atual</Badge>}
                    </div>
                  </div>
                  <CardDescription>{p.description}</CardDescription>
                  <div className="mt-2 text-3xl font-bold">
                    R$ {Number(p.price_monthly).toLocaleString('pt-BR')}
                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1.5 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" /> {p.max_users} usuários
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />{' '}
                      {p.max_orders_month.toLocaleString('pt-BR')} pedidos/mês
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />{' '}
                      {(p.allowed_modules?.length ?? 0)} módulos inclusos
                    </li>
                    {requested && (
                      <li className="flex items-center gap-2">
                        {includes ? (
                          <>
                            <Check className="h-4 w-4 text-primary" /> Inclui {label}
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 text-muted-foreground" />{' '}
                            <span className="text-muted-foreground">Não inclui {label}</span>
                          </>
                        )}
                      </li>
                    )}
                  </ul>
                  <Button
                    className="w-full"
                    disabled={isCurrent}
                    variant={highlight ? 'default' : 'outline'}
                  >
                    {isCurrent ? 'Plano atual' : highlight ? 'Fazer upgrade' : 'Selecionar'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

