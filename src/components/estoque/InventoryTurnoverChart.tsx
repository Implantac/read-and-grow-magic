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
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import type { StockLevel } from '@/types/inventory';

interface InventoryTurnoverChartProps {
  stockLevels: StockLevel[];
}

interface TurnoverItem {
  productCode: string;
  productName: string;
  category: string;
  currentStock: number;
  daysOfStock: number;
  averageDailyConsumption: number;
  turnoverRate: number; // times per year
  classification: 'high' | 'medium' | 'low' | 'stagnant';
  totalValue: number;
}

const chartConfig = {
  turnover: {
    label: 'Giro',
    color: 'hsl(var(--chart-1))',
  },
  days: {
    label: 'Dias',
    color: 'hsl(var(--chart-2))',
  },
};

export function InventoryTurnoverChart({ stockLevels }: InventoryTurnoverChartProps) {
  const turnoverData = useMemo(() => {
    const data: TurnoverItem[] = stockLevels.map((item) => {
      // Calculate annual turnover rate
      // Turnover = Annual consumption / Average inventory
      const annualConsumption = item.averageDailyConsumption * 365;
      const averageInventory = item.currentStock > 0 ? item.currentStock : 1;
      const turnoverRate = annualConsumption / averageInventory;

      let classification: 'high' | 'medium' | 'low' | 'stagnant' = 'stagnant';
      if (turnoverRate >= 12) {
        classification = 'high'; // Turns over at least once a month
      } else if (turnoverRate >= 4) {
        classification = 'medium'; // Turns over at least once a quarter
      } else if (turnoverRate >= 1) {
        classification = 'low'; // Turns over at least once a year
      }

      return {
        productCode: item.productCode,
        productName: item.productName,
        category: item.category,
        currentStock: item.currentStock,
        daysOfStock: item.daysOfStock,
        averageDailyConsumption: item.averageDailyConsumption,
        turnoverRate: Math.round(turnoverRate * 10) / 10,
        classification,
        totalValue: item.totalValue,
      };
    });

    return data.sort((a, b) => b.turnoverRate - a.turnoverRate);
  }, [stockLevels]);

  const summary = useMemo(() => {
    const high = turnoverData.filter((d) => d.classification === 'high');
    const medium = turnoverData.filter((d) => d.classification === 'medium');
    const low = turnoverData.filter((d) => d.classification === 'low');
    const stagnant = turnoverData.filter((d) => d.classification === 'stagnant');

    const avgTurnover = turnoverData.reduce((sum, item) => sum + item.turnoverRate, 0) / turnoverData.length;
    const avgDaysOfStock = turnoverData.reduce((sum, item) => sum + item.daysOfStock, 0) / turnoverData.length;
    const stagnantValue = stagnant.reduce((sum, item) => sum + item.totalValue, 0);

    return {
      high: high.length,
      medium: medium.length,
      low: low.length,
      stagnant: stagnant.length,
      avgTurnover: Math.round(avgTurnover * 10) / 10,
      avgDaysOfStock: Math.round(avgDaysOfStock),
      stagnantValue,
    };
  }, [turnoverData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getBarColor = (classification: string) => {
    switch (classification) {
      case 'high':
        return 'hsl(var(--chart-1))';
      case 'medium':
        return 'hsl(var(--chart-3))';
      case 'low':
        return 'hsl(var(--chart-4))';
      case 'stagnant':
        return 'hsl(var(--destructive))';
      default:
        return 'hsl(var(--chart-5))';
    }
  };

  // Limit chart to top/bottom items for readability
  const topItems = turnoverData.slice(0, 8);
  const bottomItems = turnoverData.filter((d) => d.classification === 'stagnant' || d.classification === 'low').slice(0, 8);

  // Category distribution
  const categoryData = useMemo(() => {
    const categories: Record<string, { count: number; avgTurnover: number; totalValue: number }> = {};
    
    turnoverData.forEach((item) => {
      if (!categories[item.category]) {
        categories[item.category] = { count: 0, avgTurnover: 0, totalValue: 0 };
      }
      categories[item.category].count++;
      categories[item.category].avgTurnover += item.turnoverRate;
      categories[item.category].totalValue += item.totalValue;
    });

    return Object.entries(categories).map(([category, data]) => ({
      category,
      count: data.count,
      avgTurnover: Math.round((data.avgTurnover / data.count) * 10) / 10,
      totalValue: data.totalValue,
    })).sort((a, b) => b.avgTurnover - a.avgTurnover);
  }, [turnoverData]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giro Médio Anual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgTurnover}x</div>
            <p className="text-xs text-muted-foreground">
              Média de {summary.avgDaysOfStock} dias em estoque
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alto Giro (&gt;12x/ano)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.high}</div>
            <p className="text-xs text-muted-foreground">Produtos com giro mensal</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baixo Giro (1-4x/ano)</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{summary.low}</div>
            <p className="text-xs text-muted-foreground">Atenção necessária</p>
          </CardContent>
        </Card>
        <Card className="border-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estagnados (&lt;1x/ano)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.stagnant}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.stagnantValue)} parado
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Produtos com Maior Giro
            </CardTitle>
            <CardDescription>Top 8 produtos por taxa de giro anual</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart
                data={topItems}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis
                  type="category"
                  dataKey="productCode"
                  tick={{ fontSize: 10 }}
                  width={70}
                  className="text-muted-foreground"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, item) => [
                        `${value}x/ano (${item.payload.daysOfStock} dias)`,
                        'Giro',
                      ]}
                    />
                  }
                />
                <Bar dataKey="turnoverRate" radius={[0, 4, 4, 0]}>
                  {topItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.classification)} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bottom Performers / Items needing attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Produtos com Baixo Giro
            </CardTitle>
            <CardDescription>Itens que precisam de atenção ou liquidação</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart
                data={bottomItems}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis
                  type="category"
                  dataKey="productCode"
                  tick={{ fontSize: 10 }}
                  width={70}
                  className="text-muted-foreground"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, item) => [
                        `${value}x/ano (${item.payload.daysOfStock} dias) - ${formatCurrency(item.payload.totalValue)}`,
                        'Giro',
                      ]}
                    />
                  }
                />
                <Bar dataKey="turnoverRate" radius={[0, 4, 4, 0]}>
                  {bottomItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.classification)} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Turnover by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Giro por Categoria</CardTitle>
          <CardDescription>Análise de giro médio e valor por categoria de produto</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              data={categoryData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => [
                      `${value}x/ano (${item.payload.count} itens, ${formatCurrency(item.payload.totalValue)})`,
                      'Giro Médio',
                    ]}
                  />
                }
              />
              <Bar dataKey="avgTurnover" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.avgTurnover >= 12
                        ? 'hsl(var(--chart-1))'
                        : entry.avgTurnover >= 4
                        ? 'hsl(var(--chart-3))'
                        : entry.avgTurnover >= 1
                        ? 'hsl(var(--chart-4))'
                        : 'hsl(var(--destructive))'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
