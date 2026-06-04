import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/ui/base/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { fmt } from './ExecutiveKPICards';

interface Props {
  productMargins: any[];
  lowMarginProducts: any[];
}

export function ExecutiveMarginsTab({ productMargins, lowMarginProducts }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600" />Produtos Mais Rentáveis</CardTitle>
          </CardHeader>
          <CardContent>
            {productMargins.length > 0 ? (
              <div className="space-y-3">
                {productMargins.slice(0, 6).map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>Receita: {fmt(p.revenue)}</span><span>·</span><span>Qtd: {p.qty}</span>
                      </div>
                    </div>
                    <Badge className={cn('text-[10px]', p.marginPct >= 30 ? 'bg-emerald-500/20 text-emerald-700' : p.marginPct >= 15 ? 'bg-blue-500/20 text-blue-700' : 'bg-destructive/20 text-destructive')}>
                      {p.marginPct}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center text-muted-foreground py-8">Cadastre produtos com custo para análise de margem</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" />Produtos com Margem Baixa (&lt;15%)</CardTitle>
          </CardHeader>
          <CardContent>
            {lowMarginProducts.length > 0 ? (
              <div className="space-y-3">
                {lowMarginProducts.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Receita: {fmt(p.revenue)} · Custo: {fmt(p.cost)}</p>
                    </div>
                    <Badge variant="destructive" className="text-[10px]">{p.marginPct}%</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-8 w-8 mx-auto text-emerald-500/50 mb-2" />
                <p className="text-xs text-muted-foreground">Todos os produtos com margem saudável ✓</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {productMargins.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Margem por Produto (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ marginPct: { label: 'Margem %', color: 'hsl(var(--chart-1))' } }} className="h-[300px]">
              <BarChart data={productMargins.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis type="number" tickFormatter={(v) => `${v}%`} className="text-xs" />
                <YAxis dataKey="name" type="category" width={120} className="text-xs" tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v}%`} />} />
                <Bar dataKey="marginPct" radius={[0, 4, 4, 0]}>
                  {productMargins.slice(0, 10).map((p: any, i: number) => (
                    <Cell key={i} fill={p.marginPct >= 30 ? 'hsl(var(--chart-1))' : p.marginPct >= 15 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
