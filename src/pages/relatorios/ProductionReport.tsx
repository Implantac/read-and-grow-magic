import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, ComposedChart, Line,
} from 'recharts';
import { Download, Factory, Target, AlertTriangle, Gauge } from 'lucide-react';
import { productionMonthly, productionByLine, defectsByType, materialConsumptionReport } from '@/data/reportsMockData';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function ProductionReport() {
  const totalProduzido = productionMonthly.reduce((s, m) => s + m.produzido, 0);
  const totalPlanejado = productionMonthly.reduce((s, m) => s + m.planejado, 0);
  const avgEficiencia = (productionMonthly.reduce((s, m) => s + m.eficiencia, 0) / productionMonthly.length).toFixed(1);
  const totalDefeitos = defectsByType.reduce((s, d) => s + d.quantidade, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatório de Produção</h1>
          <p className="text-muted-foreground">Eficiência, qualidade e consumo de materiais</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Exportar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produção Total</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProduzido.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">de {totalPlanejado.toLocaleString('pt-BR')} planejados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência Média</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{avgEficiencia}%</div>
            <p className="text-xs text-success">Acima da meta de 93%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atingimento Meta</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((totalProduzido / totalPlanejado) * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Planejado vs Realizado</p>
          </CardContent>
        </Card>
        <Card className="border-warning/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defeitos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{totalDefeitos}</div>
            <p className="text-xs text-muted-foreground">{((totalDefeitos / totalProduzido) * 100).toFixed(2)}% taxa de defeito</p>
          </CardContent>
        </Card>
      </div>

      {/* Production vs Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Produção Planejada vs Realizada</CardTitle>
          <CardDescription>Comparativo mensal com linha de eficiência</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={productionMonthly}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis yAxisId="right" orientation="right" domain={[90, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Legend />
              <Bar yAxisId="left" dataKey="planejado" name="Planejado" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} opacity={0.5} />
              <Bar yAxisId="left" dataKey="produzido" name="Produzido" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" dataKey="eficiencia" name="Eficiência %" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Production Lines */}
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Linha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {productionByLine.map((line) => (
              <div key={line.linha} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{line.linha}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={line.eficiencia >= 96 ? 'bg-success/10 text-success' : line.eficiencia >= 93 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}>
                      {line.eficiencia}%
                    </Badge>
                    {line.paradas > 0 && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive">
                        {line.paradas} paradas
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress value={line.eficiencia} className="h-2" />
                <p className="text-xs text-muted-foreground">{line.produzido}/{line.meta} unidades</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Defects Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Defeitos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={defectsByType} dataKey="quantidade" nameKey="tipo" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}
                  label={({ tipo, percent }) => `${tipo} ${percent}%`} labelLine={false}>
                  {defectsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Material Consumption Table */}
      <Card>
        <CardHeader>
          <CardTitle>Consumo de Materiais</CardTitle>
          <CardDescription>Variação entre consumo planejado e realizado</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Planejado</TableHead>
                <TableHead className="text-right">Consumido</TableHead>
                <TableHead className="text-right">Variação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materialConsumptionReport.map((row) => (
                <TableRow key={row.material}>
                  <TableCell className="font-medium">{row.material}</TableCell>
                  <TableCell className="text-right">{row.planejado.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right">{row.consumido.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={row.variacao <= 0 ? 'bg-success/10 text-success' : row.variacao <= 2 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}>
                      {row.variacao > 0 ? '+' : ''}{row.variacao}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
