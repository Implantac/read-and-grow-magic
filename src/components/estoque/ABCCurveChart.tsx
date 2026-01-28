import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import type { StockLevel } from '@/types/inventory';

interface ABCCurveChartProps {
  stockLevels: StockLevel[];
}

interface ABCItem {
  productCode: string;
  productName: string;
  totalValue: number;
  percentOfTotal: number;
  cumulativePercent: number;
  classification: 'A' | 'B' | 'C';
}

const chartConfig = {
  value: {
    label: 'Valor',
    color: 'hsl(var(--chart-1))',
  },
  cumulative: {
    label: 'Acumulado',
    color: 'hsl(var(--chart-2))',
  },
};

export function ABCCurveChart({ stockLevels }: ABCCurveChartProps) {
  const abcData = useMemo(() => {
    // Sort by total value descending
    const sorted = [...stockLevels].sort((a, b) => b.totalValue - a.totalValue);
    const totalValue = sorted.reduce((sum, item) => sum + item.totalValue, 0);

    let cumulativePercent = 0;
    const data: ABCItem[] = sorted.map((item) => {
      const percentOfTotal = (item.totalValue / totalValue) * 100;
      cumulativePercent += percentOfTotal;

      let classification: 'A' | 'B' | 'C' = 'C';
      if (cumulativePercent <= 80) {
        classification = 'A';
      } else if (cumulativePercent <= 95) {
        classification = 'B';
      }

      return {
        productCode: item.productCode,
        productName: item.productName,
        totalValue: item.totalValue,
        percentOfTotal,
        cumulativePercent,
        classification,
      };
    });

    return data;
  }, [stockLevels]);

  const summary = useMemo(() => {
    const classA = abcData.filter((d) => d.classification === 'A');
    const classB = abcData.filter((d) => d.classification === 'B');
    const classC = abcData.filter((d) => d.classification === 'C');
    const total = abcData.reduce((sum, item) => sum + item.totalValue, 0);

    return {
      classA: {
        count: classA.length,
        percent: ((classA.length / abcData.length) * 100).toFixed(1),
        value: classA.reduce((sum, item) => sum + item.totalValue, 0),
        valuePercent: ((classA.reduce((sum, item) => sum + item.totalValue, 0) / total) * 100).toFixed(1),
      },
      classB: {
        count: classB.length,
        percent: ((classB.length / abcData.length) * 100).toFixed(1),
        value: classB.reduce((sum, item) => sum + item.totalValue, 0),
        valuePercent: ((classB.reduce((sum, item) => sum + item.totalValue, 0) / total) * 100).toFixed(1),
      },
      classC: {
        count: classC.length,
        percent: ((classC.length / abcData.length) * 100).toFixed(1),
        value: classC.reduce((sum, item) => sum + item.totalValue, 0),
        valuePercent: ((classC.reduce((sum, item) => sum + item.totalValue, 0) / total) * 100).toFixed(1),
      },
    };
  }, [abcData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value);
  };

  const getBarColor = (classification: string) => {
    switch (classification) {
      case 'A':
        return 'hsl(var(--chart-1))';
      case 'B':
        return 'hsl(var(--chart-3))';
      case 'C':
        return 'hsl(var(--chart-5))';
      default:
        return 'hsl(var(--chart-4))';
    }
  };

  // Limit to top 15 items for readability
  const chartData = abcData.slice(0, 15);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Curva ABC</CardTitle>
            <CardDescription>Classificação de produtos por valor em estoque</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-chart-1/20 text-chart-1 hover:bg-chart-1/30">
              A: {summary.classA.count} ({summary.classA.valuePercent}%)
            </Badge>
            <Badge className="bg-chart-3/20 text-chart-3 hover:bg-chart-3/30">
              B: {summary.classB.count} ({summary.classB.valuePercent}%)
            </Badge>
            <Badge className="bg-chart-5/20 text-chart-5 hover:bg-chart-5/30">
              C: {summary.classC.count} ({summary.classC.valuePercent}%)
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="productCode"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
              className="text-muted-foreground"
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(value) => formatCurrency(value)}
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                    if (name === 'cumulativePercent') {
                      return [`${Number(value).toFixed(1)}%`, 'Acumulado'];
                    }
                    return [formatCurrency(Number(value)), 'Valor'];
                  }}
                />
              }
            />
            <ReferenceLine
              yAxisId="right"
              y={80}
              stroke="hsl(var(--chart-1))"
              strokeDasharray="5 5"
              label={{ value: '80%', position: 'right', fontSize: 10 }}
            />
            <ReferenceLine
              yAxisId="right"
              y={95}
              stroke="hsl(var(--chart-3))"
              strokeDasharray="5 5"
              label={{ value: '95%', position: 'right', fontSize: 10 }}
            />
            <Bar yAxisId="left" dataKey="totalValue" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.classification)} />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulativePercent"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
            />
          </ComposedChart>
        </ChartContainer>

        {/* Summary Table */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-3 bg-chart-1/5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Classe A</span>
              <Badge variant="outline" className="bg-chart-1/20 text-chart-1">Alta prioridade</Badge>
            </div>
            <p className="mt-1 text-2xl font-bold">{summary.classA.count} itens</p>
            <p className="text-xs text-muted-foreground">
              {summary.classA.percent}% dos itens | {summary.classA.valuePercent}% do valor
            </p>
          </div>
          <div className="rounded-lg border p-3 bg-chart-3/5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Classe B</span>
              <Badge variant="outline" className="bg-chart-3/20 text-chart-3">Média prioridade</Badge>
            </div>
            <p className="mt-1 text-2xl font-bold">{summary.classB.count} itens</p>
            <p className="text-xs text-muted-foreground">
              {summary.classB.percent}% dos itens | {summary.classB.valuePercent}% do valor
            </p>
          </div>
          <div className="rounded-lg border p-3 bg-chart-5/5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Classe C</span>
              <Badge variant="outline" className="bg-chart-5/20 text-chart-5">Baixa prioridade</Badge>
            </div>
            <p className="mt-1 text-2xl font-bold">{summary.classC.count} itens</p>
            <p className="text-xs text-muted-foreground">
              {summary.classC.percent}% dos itens | {summary.classC.valuePercent}% do valor
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
