import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowRight, BarChart3, Shield, Zap, Users, Package, TrendingUp, Star } from 'lucide-react';
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

const allModules = ['comercial', 'estoque', 'financeiro', 'producao', 'fiscal', 'compras', 'wms', 'contabilidade', 'rfid', 'credito', 'relatorios', 'admin'];

const features = [
  { icon: BarChart3, title: 'Dashboard Gerencial', desc: 'Visão completa do seu negócio em tempo real' },
  { icon: Package, title: 'Gestão de Estoque', desc: 'Controle total de inventário e movimentações' },
  { icon: TrendingUp, title: 'Financeiro Completo', desc: 'Contas a pagar, receber, fluxo de caixa e DRE' },
  { icon: Users, title: 'Comercial Enterprise', desc: 'Pipeline de vendas, comissões e metas' },
  { icon: Shield, title: 'Segurança Total', desc: 'RLS, RBAC e auditoria completa' },
  { icon: Zap, title: 'Automações', desc: 'Fluxo integrado do pedido ao faturamento' },
];

export default function LandingPage() {
  const { data: plans = [] } = usePlans();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ERP Cloud</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')}>Entrar</Button>
            <Button onClick={() => navigate('/login')}>Começar Grátis</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-4">🚀 14 dias grátis • Sem cartão de crédito</Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          ERP completo para sua empresa<br />
          <span className="text-primary">crescer de verdade</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Gerencie comercial, financeiro, estoque, produção, fiscal e logística
          em uma única plataforma integrada. Do pedido à entrega.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" className="gap-2 text-lg px-8" onClick={() => navigate('/login')}>
            Começar Grátis <ArrowRight className="h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
            Ver Planos
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Tudo que sua empresa precisa</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Card key={i} className="border-muted/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Planos e Preços</h2>
        <p className="text-center text-muted-foreground mb-8">Escolha o plano ideal para sua operação</p>

        <div className="flex justify-center gap-2 mb-10">
          <Button variant={billingCycle === 'monthly' ? 'default' : 'outline'} size="sm" onClick={() => setBillingCycle('monthly')}>Mensal</Button>
          <Button variant={billingCycle === 'annual' ? 'default' : 'outline'} size="sm" onClick={() => setBillingCycle('annual')}>
            Anual <Badge variant="secondary" className="ml-2 text-xs">-17%</Badge>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan, i) => {
            const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_annual / 12;
            const isPopular = plan.slug === 'profissional';
            return (
              <Card key={plan.id} className={cn('relative', isPopular && 'border-primary shadow-lg scale-105')}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1"><Star className="h-3 w-3" /> Mais Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{formatCurrency(price)}</span>
                    <span className="text-muted-foreground">/mês</span>
                    {billingCycle === 'annual' && (
                      <p className="text-xs text-muted-foreground mt-1">Cobrado {formatCurrency(plan.price_annual)}/ano</p>
                    )}
                  </div>

                  <Button className="w-full mb-6" variant={isPopular ? 'default' : 'outline'} onClick={() => navigate('/login')}>
                    Começar {plan.trial_days} dias grátis
                  </Button>

                  <div className="space-y-2 text-sm text-left">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      <span>{plan.max_users >= 9999 ? 'Usuários ilimitados' : `Até ${plan.max_users} usuários`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      <span>{plan.max_orders_month >= 9999 ? 'Pedidos ilimitados' : `${plan.max_orders_month} pedidos/mês`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      <span>{plan.storage_mb >= 50000 ? '50 GB' : `${(plan.storage_mb / 1024).toFixed(0)} GB`} armazenamento</span>
                    </div>
                    <div className="border-t pt-2 mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Módulos inclusos:</p>
                      {allModules.map(mod => (
                        <div key={mod} className="flex items-center gap-2">
                          {plan.allowed_modules.includes(mod) ? (
                            <Check className="h-3.5 w-3.5 text-success shrink-0" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                          )}
                          <span className={cn(!plan.allowed_modules.includes(mod) && 'text-muted-foreground/50')}>
                            {moduleLabels[mod] || mod}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
          <CardContent className="p-10">
            <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
            <p className="text-muted-foreground mb-6">Teste grátis por 14 dias. Sem compromisso, sem cartão de crédito.</p>
            <Button size="lg" className="gap-2 text-lg px-8" onClick={() => navigate('/login')}>
              Criar Conta Grátis <ArrowRight className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ERP Cloud. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
