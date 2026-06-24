import { useSearchParams, Link } from 'react-router-dom';
import { Sparkles, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { usePlans } from '@/hooks/system/useSubscription';
import { useCurrentPlan } from '@/hooks/system/useCurrentPlan';

const MODULE_LABELS: Record<string, string> = {
  comercial: 'Comercial',
  estoque: 'Estoque',
  financeiro: 'Financeiro',
  producao: 'Produção (PCP)',
  fiscal: 'Fiscal (NF-e/SPED)',
  compras: 'Compras',
  wms: 'WMS',
  contabilidade: 'Contabilidade',
  rfid: 'RFID',
  credito: 'Crédito & Cobrança',
  relatorios: 'Relatórios Avançados',
  admin: 'Administração',
};

export default function Upgrade() {
  const [params] = useSearchParams();
  const requested = params.get('module') ?? '';
  const { data: plans = [], isLoading } = usePlans();
  const { data: current } = useCurrentPlan();

  const moduleLabel = MODULE_LABELS[requested] ?? requested;

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
            Faça upgrade do seu plano
          </h1>
          {requested && (
            <p className="mt-1 text-muted-foreground">
              O módulo <strong className="text-foreground">{moduleLabel}</strong> não está incluído
              no seu plano atual{current ? ` (${current.plan_name})` : ''}.
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Carregando planos…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => {
            const isCurrent = current?.plan_id === p.id;
            const includes = p.allowed_modules?.includes(requested);
            return (
              <Card
                key={p.id}
                className={
                  includes
                    ? 'border-primary/50 ring-1 ring-primary/30'
                    : ''
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{p.name}</CardTitle>
                    {isCurrent && <Badge variant="secondary">Atual</Badge>}
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
                  </ul>
                  <Button
                    className="w-full"
                    disabled={isCurrent}
                    variant={includes ? 'default' : 'outline'}
                  >
                    {isCurrent ? 'Plano atual' : includes ? 'Fazer upgrade' : 'Selecionar'}
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
