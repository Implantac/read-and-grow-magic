import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Star } from 'lucide-react';
import { usePlans } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const moduleLabels: Record<string, string> = {
  comercial: 'Comercial', estoque: 'Estoque', financeiro: 'Financeiro',
  producao: 'Produção', fiscal: 'Fiscal', compras: 'Compras',
  wms: 'WMS', contabilidade: 'Contabilidade', rfid: 'RFID',
  credito: 'Crédito', relatorios: 'Relatórios', admin: 'Admin',
};
const allModules = Object.keys(moduleLabels);

interface Props { onLogin: () => void }

export default function PricingSection({ onLogin }: Props) {
  const { data: plans = [] } = usePlans();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <section id="pricing" className="bg-muted/20 border-y border-border/50 py-20 md:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-5">
          <Badge variant="outline" className="mb-4 font-medium">Planos</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Invista menos do que o custo de <span className="text-destructive">um erro</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg mb-8">
            Comece grátis. Escale conforme cresce. Cancele quando quiser.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-card border border-border/50 shadow-sm">
            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-lg px-5 h-9"
              onClick={() => setBillingCycle('monthly')}
            >
              Mensal
            </Button>
            <Button
              variant={billingCycle === 'annual' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-lg px-5 h-9 gap-1.5"
              onClick={() => setBillingCycle('annual')}
            >
              Anual <Badge variant="secondary" className="text-[10px] px-1.5 py-0">-17%</Badge>
            </Button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3 max-w-5xl mx-auto items-start">
          {plans.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_annual / 12;
            const isPopular = plan.slug === 'profissional';
            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative transition-all duration-300 border-border/50',
                  isPopular
                    ? 'border-primary/50 shadow-xl shadow-primary/10 md:scale-[1.03] bg-card ring-1 ring-primary/20'
                    : 'hover:border-primary/25 hover:shadow-lg bg-card'
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1 shadow-lg shadow-primary/20">
                      <Star className="h-3 w-3" /> Mais Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2 pt-6">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="text-center px-5 pb-6">
                  <div className="mb-6">
                    <span className="text-3xl md:text-4xl font-extrabold">{formatCurrency(price)}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                    {billingCycle === 'annual' && (
                      <p className="text-[11px] text-muted-foreground mt-1">Cobrado {formatCurrency(plan.price_annual)}/ano</p>
                    )}
                  </div>
                  <Button
                    className={cn(
                      'w-full mb-6 h-11',
                      isPopular && 'shadow-md shadow-primary/25'
                    )}
                    variant={isPopular ? 'default' : 'outline'}
                    onClick={onLogin}
                  >
                    Começar {plan.trial_days} dias grátis
                  </Button>
                  <div className="space-y-2 text-sm text-left">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      <span className="text-xs">{plan.max_users >= 9999 ? 'Usuários ilimitados' : `Até ${plan.max_users} usuários`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      <span className="text-xs">{plan.max_orders_month >= 9999 ? 'Pedidos ilimitados' : `${plan.max_orders_month} pedidos/mês`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      <span className="text-xs">{plan.storage_mb >= 50000 ? '50 GB' : `${(plan.storage_mb / 1024).toFixed(0)} GB`} armazenamento</span>
                    </div>
                    <div className="border-t border-border/50 pt-2.5 mt-3">
                      <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Módulos</p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        {allModules.map((mod) => (
                          <div key={mod} className="flex items-center gap-1.5 py-0.5">
                            {plan.allowed_modules.includes(mod)
                              ? <Check className="h-3 w-3 text-success shrink-0" />
                              : <X className="h-3 w-3 text-muted-foreground/20 shrink-0" />
                            }
                            <span className={cn(
                              'text-[11px]',
                              !plan.allowed_modules.includes(mod) && 'text-muted-foreground/30'
                            )}>
                              {moduleLabels[mod] || mod}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
