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
    <section id="pricing" className="bg-muted/30 border-y py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-4">
          <Badge variant="outline" className="mb-4">Planos</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Invista menos do que o custo de <span className="text-destructive">um erro</span></h2>
          <p className="text-muted-foreground text-lg mb-8">Comece grátis. Escale conforme cresce. Cancele quando quiser.</p>
        </div>

        <div className="flex justify-center gap-2 mb-10">
          <Button variant={billingCycle === 'monthly' ? 'default' : 'outline'} size="sm" onClick={() => setBillingCycle('monthly')}>Mensal</Button>
          <Button variant={billingCycle === 'annual' ? 'default' : 'outline'} size="sm" onClick={() => setBillingCycle('annual')}>
            Anual <Badge variant="secondary" className="ml-2 text-xs">-17%</Badge>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_annual / 12;
            const isPopular = plan.slug === 'profissional';
            return (
              <Card key={plan.id} className={cn('relative transition-all duration-300', isPopular ? 'border-primary shadow-xl shadow-primary/10 scale-[1.03]' : 'hover:border-primary/30 hover:shadow-lg')}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1 shadow-lg"><Star className="h-3 w-3" /> Mais Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold">{formatCurrency(price)}</span>
                    <span className="text-muted-foreground">/mês</span>
                    {billingCycle === 'annual' && <p className="text-xs text-muted-foreground mt-1">Cobrado {formatCurrency(plan.price_annual)}/ano</p>}
                  </div>
                  <Button className={cn('w-full mb-6', isPopular && 'shadow-md shadow-primary/25')} variant={isPopular ? 'default' : 'outline'} onClick={onLogin}>
                    Começar {plan.trial_days} dias grátis
                  </Button>
                  <div className="space-y-2 text-sm text-left">
                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /><span>{plan.max_users >= 9999 ? 'Usuários ilimitados' : `Até ${plan.max_users} usuários`}</span></div>
                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /><span>{plan.max_orders_month >= 9999 ? 'Pedidos ilimitados' : `${plan.max_orders_month} pedidos/mês`}</span></div>
                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /><span>{plan.storage_mb >= 50000 ? '50 GB' : `${(plan.storage_mb / 1024).toFixed(0)} GB`} armazenamento</span></div>
                    <div className="border-t pt-2 mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Módulos inclusos:</p>
                      {allModules.map((mod) => (
                        <div key={mod} className="flex items-center gap-2 py-0.5">
                          {plan.allowed_modules.includes(mod) ? <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <X className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />}
                          <span className={cn('text-xs', !plan.allowed_modules.includes(mod) && 'text-muted-foreground/40')}>{moduleLabels[mod] || mod}</span>
                        </div>
                      ))}
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
