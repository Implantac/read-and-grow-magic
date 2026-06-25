import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { RadioGroup, RadioGroupItem } from '@/ui/base/radio-group';
import { Label } from '@/ui/base/label';
import { Alert, AlertDescription, AlertTitle } from '@/ui/base/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePlans } from '@/hooks/system/useSubscription';
import { useCurrentPlan } from '@/hooks/system/useCurrentPlan';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { moduleLabel } from '@/lib/moduleLabels';
import { useQueryClient } from '@tanstack/react-query';

type Cycle = 'monthly' | 'annual';

export default function Subscribe() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { currentCompany } = useEnterprise();

  const planParam = params.get('plan') ?? '';
  const moduleParam = params.get('module') ?? '';
  const cycleParam = (params.get('cycle') as Cycle) || 'monthly';

  const { data: plans = [], isLoading } = usePlans();
  const { data: current } = useCurrentPlan();

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [cycle, setCycle] = useState<Cycle>(cycleParam);
  const [submitting, setSubmitting] = useState(false);

  // Pré-seleciona o plano via ?plan=<id|slug|name>
  useEffect(() => {
    if (!plans.length) return;
    if (selectedPlanId) return;
    const match =
      plans.find((p) => p.id === planParam) ||
      plans.find((p) => p.slug?.toLowerCase() === planParam.toLowerCase()) ||
      plans.find((p) => p.name?.toLowerCase() === planParam.toLowerCase());
    if (match) {
      setSelectedPlanId(match.id);
      return;
    }
    // Fallback: menor plano que inclui o módulo solicitado
    if (moduleParam) {
      const ordered = [...plans].sort((a, b) => Number(a.price_monthly) - Number(b.price_monthly));
      const cheapest = ordered.find((p) => p.allowed_modules?.includes(moduleParam));
      if (cheapest) setSelectedPlanId(cheapest.id);
    }
  }, [plans, planParam, moduleParam, selectedPlanId]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  const total = selectedPlan
    ? cycle === 'annual'
      ? Number(selectedPlan.price_annual)
      : Number(selectedPlan.price_monthly)
    : 0;

  const handleConfirm = async () => {
    if (!selectedPlan) {
      toast({ title: 'Selecione um plano', variant: 'destructive' });
      return;
    }
    if (!currentCompany?.id) {
      toast({
        title: 'Empresa não identificada',
        description: 'Selecione uma empresa antes de assinar.',
        variant: 'destructive',
      });
      return;
    }
    setSubmitting(true);
    try {
      const now = new Date();
      const periodEnd = new Date(now);
      if (cycle === 'annual') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);

      const payload = {
        company_id: currentCompany.id,
        plan_id: selectedPlan.id,
        status: selectedPlan.trial_days > 0 ? 'trialing' : 'active',
        billing_cycle: cycle,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_end:
          selectedPlan.trial_days > 0
            ? new Date(now.getTime() + selectedPlan.trial_days * 86400000).toISOString()
            : null,
      };

      const { error } = await supabase
        .from('subscriptions')
        .upsert(payload, { onConflict: 'company_id' });
      if (error) throw error;

      toast({
        title: 'Assinatura confirmada',
        description: `Plano ${selectedPlan.name} ativado com sucesso.`,
      });
      await qc.invalidateQueries({ queryKey: ['current_plan'] });
      await qc.invalidateQueries({ queryKey: ['subscription'] });
      navigate('/dashboard');
    } catch (err: any) {
      toast({
        title: 'Não foi possível ativar a assinatura',
        description: err?.message ?? 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const label = moduleParam ? moduleLabel(moduleParam) : '';

  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-8">
      <div>
        <Link
          to="/upgrade"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para planos
        </Link>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Sparkles className="h-7 w-7 text-primary" /> Confirmar assinatura
        </h1>
        <p className="mt-1 text-muted-foreground">
          Revise o plano escolhido e ative agora para liberar o acesso imediato.
        </p>
      </div>

      {moduleParam && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>Recurso solicitado: {label}</AlertTitle>
          <AlertDescription>
            O plano selecionado já inclui {label} e ficará disponível assim que a assinatura for
            confirmada.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando planos…
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Escolha o plano</CardTitle>
              <CardDescription>
                Você pode trocar de plano depois — a cobrança é proporcional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedPlanId}
                onValueChange={setSelectedPlanId}
                className="space-y-3"
              >
                {plans.map((p) => {
                  const includes = !moduleParam || p.allowed_modules?.includes(moduleParam);
                  const isCurrent = current?.plan_id === p.id;
                  return (
                    <Label
                      key={p.id}
                      htmlFor={`plan-${p.id}`}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                        selectedPlanId === p.id
                          ? 'border-primary/60 ring-2 ring-primary/30'
                          : 'hover:border-primary/40'
                      } ${!includes ? 'opacity-60' : ''}`}
                    >
                      <RadioGroupItem
                        id={`plan-${p.id}`}
                        value={p.id}
                        disabled={!includes}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{p.name}</div>
                          <div className="flex items-center gap-2">
                            {isCurrent && <Badge variant="secondary">Atual</Badge>}
                            {!includes && (
                              <Badge variant="outline">Não inclui {label}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">{p.description}</div>
                        <div className="mt-1 text-sm">
                          R$ {Number(p.price_monthly).toLocaleString('pt-BR')}/mês · R${' '}
                          {Number(p.price_annual).toLocaleString('pt-BR')}/ano
                        </div>
                      </div>
                    </Label>
                  );
                })}
              </RadioGroup>

              <div className="mt-6">
                <div className="mb-2 text-sm font-medium">Ciclo de cobrança</div>
                <RadioGroup
                  value={cycle}
                  onValueChange={(v) => setCycle(v as Cycle)}
                  className="grid grid-cols-2 gap-3"
                >
                  <Label
                    htmlFor="cycle-monthly"
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${
                      cycle === 'monthly' ? 'border-primary/60 ring-2 ring-primary/30' : ''
                    }`}
                  >
                    <RadioGroupItem id="cycle-monthly" value="monthly" />
                    Mensal
                  </Label>
                  <Label
                    htmlFor="cycle-annual"
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${
                      cycle === 'annual' ? 'border-primary/60 ring-2 ring-primary/30' : ''
                    }`}
                  >
                    <RadioGroupItem id="cycle-annual" value="annual" />
                    Anual <Badge variant="secondary">economize</Badge>
                  </Label>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
              <CardDescription>
                {selectedPlan ? selectedPlan.name : 'Selecione um plano'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">
                R$ {total.toLocaleString('pt-BR')}
                <span className="text-sm font-normal text-muted-foreground">
                  /{cycle === 'annual' ? 'ano' : 'mês'}
                </span>
              </div>
              {selectedPlan && (
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> {selectedPlan.max_users} usuários
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />{' '}
                    {selectedPlan.max_orders_month.toLocaleString('pt-BR')} pedidos/mês
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />{' '}
                    {selectedPlan.allowed_modules?.length ?? 0} módulos inclusos
                  </li>
                  {selectedPlan.trial_days > 0 && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" /> {selectedPlan.trial_days} dias de
                      teste grátis
                    </li>
                  )}
                </ul>
              )}
              <Button
                className="w-full"
                onClick={handleConfirm}
                disabled={!selectedPlan || submitting}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedPlan?.trial_days
                  ? 'Iniciar período de teste'
                  : 'Confirmar assinatura'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Ao confirmar, você ativa o plano para a empresa atual. Você pode cancelar a qualquer
                momento.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
