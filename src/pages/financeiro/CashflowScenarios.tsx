import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCashflowScenarios } from '@/hooks/useCashflowScenarios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatBRL, formatNumber } from '@/lib/formatters';

export default function CashflowScenariosPage() {
  const [days, setDays] = useState(30);
  const { data = [], isLoading } = useCashflowScenarios(days);

  const chartData = data.map((d) => ({
    day: format(new Date(d.day), 'dd/MM', { locale: ptBR }),
    Realista: Number(d.balance_real.toFixed(2)),
    Otimista: Number(d.balance_optimistic.toFixed(2)),
    Pessimista: Number(d.balance_pessimistic.toFixed(2)),
  }));

  const last = data[data.length - 1];
  const negativeDay = data.find((d) => d.balance_real < 0);

  return (
    <PageContainer>
      <PageHeader
        title="📊 Fluxo de Caixa por Cenário"
        description="Projeção realista, otimista (+receitas, -despesas) e pessimista (-30% receitas, +10% despesas)."
        actions={
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Saldo realista em {days}d</p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">
              R$ {(last?.balance_real ?? formatNumber(0), 2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Cenário otimista</p>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="text-2xl font-bold text-success">
              R$ {(last?.balance_optimistic ?? formatNumber(0), 2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Cenário pessimista</p>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-destructive">
              R$ {(last?.balance_pessimistic ?? formatNumber(0), 2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {negativeDay && (
        <Card className="border-destructive">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-semibold">Atenção: saldo negativo projetado</p>
              <p className="text-sm text-muted-foreground">
                No cenário realista, seu saldo fica negativo em {format(new Date(negativeDay.day), 'dd/MM/yyyy')}.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Projeção de saldo — próximos {days} dias</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center text-muted-foreground">Carregando...</div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  formatter={(v: number) => `${formatBRL(v)}`}
                />
                <Legend />
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="Otimista" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Realista" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="Pessimista" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
