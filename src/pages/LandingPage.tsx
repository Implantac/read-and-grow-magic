import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check, X, ArrowRight, BarChart3, Shield, Zap, Users, Package,
  TrendingUp, Star, Brain, Truck, Factory, CreditCard, ChevronRight,
  Globe, Clock, Headphones, Building2,
} from 'lucide-react';
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
  { icon: BarChart3, title: 'Dashboard Gerencial', desc: 'Visão 360° do seu negócio com KPIs em tempo real e alertas inteligentes' },
  { icon: Package, title: 'Gestão de Estoque & WMS', desc: 'Controle de inventário, picking, packing, expedição e rastreio RFID' },
  { icon: TrendingUp, title: 'Financeiro Completo', desc: 'Contas a pagar/receber, fluxo de caixa, DRE e conciliação bancária' },
  { icon: Users, title: 'Comercial Enterprise', desc: 'Pipeline de vendas, comissões, metas, funil e IA de priorização' },
  { icon: Shield, title: 'Fiscal & Compliance', desc: 'NF-e, NFC-e, SPED, apuração de impostos e relatórios fiscais' },
  { icon: Brain, title: 'IA Executiva', desc: 'Insights automáticos, previsão de cenários e chat gerencial com IA' },
];

const stats = [
  { value: '12+', label: 'Módulos integrados' },
  { value: '99.9%', label: 'Uptime garantido' },
  { value: '500+', label: 'Automações nativas' },
  { value: '24/7', label: 'Suporte técnico' },
];

const testimonials = [
  { name: 'Carlos Mendes', role: 'Diretor, Indústria MetalForte', text: 'Reduzimos 35% do tempo operacional com a automação do pedido ao faturamento. O ROI veio no segundo mês.' },
  { name: 'Ana Beatriz', role: 'CFO, Distribuidora Nacional', text: 'O módulo financeiro e a IA Executiva mudaram completamente a forma como tomamos decisões estratégicas.' },
  { name: 'Roberto Lima', role: 'Gerente Comercial, TechParts', text: 'A IA comercial aumentou nossa taxa de conversão em 28%. A equipe agora sabe exatamente quem ligar.' },
];

function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  return <span className="tabular-nums">{target}{suffix}</span>;
}

export default function LandingPage() {
  const { data: plans = [] } = usePlans();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ─── Header ─── */}
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[hsl(36,100%,50%)] to-[hsl(36,100%,40%)] flex items-center justify-center shadow-md">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">ERP Cloud</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Planos</a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Depoimentos</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')}>Entrar</Button>
            <Button onClick={() => navigate('/login')} className="gap-1.5">
              Começar Grátis <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,hsl(36_100%_50%/0.08),transparent_70%)]" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_center,hsl(207_90%_54%/0.06),transparent_70%)]" />
        </div>

        <div className="container mx-auto px-4 pt-20 pb-24 text-center">
          <div className="animate-fade-in">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              14 dias grátis • Sem cartão de crédito
            </Badge>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] animate-slide-in">
            O ERP que sua empresa<br />
            <span className="bg-gradient-to-r from-[hsl(36,100%,50%)] to-[hsl(36,100%,60%)] bg-clip-text text-transparent">
              precisa para crescer
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in leading-relaxed">
            Gerencie comercial, financeiro, estoque, produção, fiscal e logística
            em uma única plataforma integrada com <strong className="text-foreground">inteligência artificial</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in">
            <Button size="lg" className="gap-2 text-lg px-8 h-13 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all" onClick={() => navigate('/login')}>
              Começar Grátis <ArrowRight className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 h-13" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
              Ver Planos
            </Button>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl md:text-4xl font-extrabold text-primary">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Social Proof Bar ─── */}
      <section className="border-y bg-muted/30 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4" /> Multi-empresa</div>
            <div className="flex items-center gap-2 text-sm"><Globe className="h-4 w-4" /> 100% Cloud</div>
            <div className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4" /> LGPD Compliant</div>
            <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4" /> Setup em 5 minutos</div>
            <div className="flex items-center gap-2 text-sm"><Headphones className="h-4 w-4" /> Suporte em português</div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4">Recursos</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Tudo que sua empresa precisa</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">Uma plataforma completa para gerenciar toda a operação, do pedido à entrega.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Card key={i} className="group border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Integration Flow ─── */}
      <section className="bg-muted/30 border-y py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4">Fluxo Integrado</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Do pedido à entrega, tudo automatizado</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Cada módulo se conecta automaticamente, eliminando retrabalho e erros manuais.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
            {[
              { icon: Users, label: 'Venda' },
              { icon: CreditCard, label: 'Crédito' },
              { icon: Package, label: 'Separação' },
              { icon: Truck, label: 'Expedição' },
              { icon: BarChart3, label: 'Faturamento' },
              { icon: TrendingUp, label: 'Financeiro' },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-14 w-14 rounded-2xl bg-card border shadow-sm flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
                </div>
                {i < arr.length - 1 && <ChevronRight className="h-5 w-5 text-muted-foreground/40 mt-[-20px]" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4">Depoimentos</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Resultados reais de quem usa</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <Card key={i} className="bg-card/80 border-border/50">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-4 w-4 fill-primary text-primary" />)}
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed italic">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="bg-muted/30 border-y py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-4">
            <Badge variant="outline" className="mb-4">Planos</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos que cabem na sua operação</h2>
            <p className="text-muted-foreground text-lg mb-8">Comece grátis. Escale conforme cresce.</p>
          </div>

          <div className="flex justify-center gap-2 mb-10">
            <Button variant={billingCycle === 'monthly' ? 'default' : 'outline'} size="sm" onClick={() => setBillingCycle('monthly')}>Mensal</Button>
            <Button variant={billingCycle === 'annual' ? 'default' : 'outline'} size="sm" onClick={() => setBillingCycle('annual')}>
              Anual <Badge variant="secondary" className="ml-2 text-xs">Economize 17%</Badge>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_annual / 12;
              const isPopular = plan.slug === 'profissional';
              return (
                <Card key={plan.id} className={cn(
                  'relative transition-all duration-300',
                  isPopular ? 'border-primary shadow-xl shadow-primary/10 scale-[1.03]' : 'hover:border-primary/30 hover:shadow-lg',
                )}>
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
                      {billingCycle === 'annual' && (
                        <p className="text-xs text-muted-foreground mt-1">Cobrado {formatCurrency(plan.price_annual)}/ano</p>
                      )}
                    </div>

                    <Button className={cn('w-full mb-6', isPopular && 'shadow-md shadow-primary/25')} variant={isPopular ? 'default' : 'outline'} onClick={() => navigate('/login')}>
                      Começar {plan.trial_days} dias grátis
                    </Button>

                    <div className="space-y-2 text-sm text-left">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{plan.max_users >= 9999 ? 'Usuários ilimitados' : `Até ${plan.max_users} usuários`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{plan.max_orders_month >= 9999 ? 'Pedidos ilimitados' : `${plan.max_orders_month} pedidos/mês`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{plan.storage_mb >= 50000 ? '50 GB' : `${(plan.storage_mb / 1024).toFixed(0)} GB`} armazenamento</span>
                      </div>
                      <div className="border-t pt-2 mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Módulos inclusos:</p>
                        {allModules.map(mod => (
                          <div key={mod} className="flex items-center gap-2 py-0.5">
                            {plan.allowed_modules.includes(mod) ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                            )}
                            <span className={cn('text-xs', !plan.allowed_modules.includes(mod) && 'text-muted-foreground/40')}>
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
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para transformar sua operação?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Teste grátis por 14 dias. Sem compromisso, sem cartão de crédito.
          </p>
          <Button size="lg" className="gap-2 text-lg px-10 h-13 shadow-lg shadow-primary/25" onClick={() => navigate('/login')}>
            Criar Conta Grátis <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t bg-muted/20 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(36,100%,50%)] to-[hsl(36,100%,40%)] flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">ERP Cloud</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Planos</a>
              <a href="#testimonials" className="hover:text-foreground transition-colors">Depoimentos</a>
            </div>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} ERP Cloud</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
