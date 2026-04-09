import { useState } from 'react';
import { ExportButton } from '@/components/shared/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  FileText,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Package,
  Download,
  Printer,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  movementTypeConfig,
} from '@/config/inventory';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import type { ProductKardex, KardexEntry, MovementType } from '@/types/inventory';

export default function KardexPage() {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [kardexData, setKardexData] = useState<ProductKardex | null>(null);

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setKardexData(null);
  };

  const getTypeBadge = (type: MovementType) => {
    const config = movementTypeConfig.find((t) => t.value === type);
    return <Badge className={config?.color}>{config?.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <PageContainer>
      <PageHeader title="Kardex" description="Ficha de movimentação de estoque por produto">
        <ExportButton
          data={(kardexData?.entries || []) as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'date', label: 'Data', format: (v) => new Date(v as string).toLocaleDateString('pt-BR') },
            { key: 'documentNumber', label: 'Documento' },
            { key: 'type', label: 'Tipo' },
            { key: 'description', label: 'Descrição' },
            { key: 'quantityIn', label: 'Entrada' },
            { key: 'quantityOut', label: 'Saída' },
            { key: 'balance', label: 'Saldo' },
            { key: 'unitCost', label: 'Custo Unit.', format: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)) },
            { key: 'totalValue', label: 'Valor Total', format: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)) },
          ]}
          filename={`kardex_${kardexData?.productCode || 'produto'}`}
        />
        <Button variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </PageHeader>

      {/* Product Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Selecionar Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Produto</Label>
              <Select value={selectedProductId} onValueChange={handleProductChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empty">Nenhum produto cadastrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Período Inicial</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background"
                  defaultValue="2024-01-01"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Período Final</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background"
                  defaultValue="2024-01-31"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {kardexData && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(kardexData.currentBalance)} {kardexData.unit}
                </div>
                <p className="text-xs text-muted-foreground">Quantidade em estoque</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custo Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(kardexData.currentAverageCost)}
                </div>
                <p className="text-xs text-muted-foreground">Por unidade</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(kardexData.currentTotalValue)}
                </div>
                <p className="text-xs text-muted-foreground">Valor em estoque</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Movimentações</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kardexData.entries.length}</div>
                <p className="text-xs text-muted-foreground">No período selecionado</p>
              </CardContent>
            </Card>
          </div>

          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Ficha Kardex
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4 border-b pb-4">
                <div>
                  <Label className="text-muted-foreground">Código</Label>
                  <p className="font-medium">{kardexData.productCode}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground">Produto</Label>
                  <p className="font-medium">{kardexData.productName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Unidade</Label>
                  <p className="font-medium">{kardexData.unit}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Entrada</TableHead>
                    <TableHead className="text-right">Saída</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    <TableHead className="text-right">Custo Médio</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kardexData.entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center">
                        Nenhuma movimentação no período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    kardexData.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDate(entry.date)}</TableCell>
                        <TableCell className="font-medium">{entry.documentNumber}</TableCell>
                        <TableCell>{getTypeBadge(entry.type)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{entry.description}</TableCell>
                        <TableCell className="text-right">
                          {entry.quantityIn > 0 && (
                            <span className="flex items-center justify-end gap-1 text-green-600">
                              <ArrowDownCircle className="h-3 w-3" />
                              {formatNumber(entry.quantityIn)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.quantityOut > 0 && (
                            <span className="flex items-center justify-end gap-1 text-red-600">
                              <ArrowUpCircle className="h-3 w-3" />
                              {formatNumber(entry.quantityOut)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatNumber(entry.balance)}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.unitCost)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.averageCost)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(entry.totalValue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </PageContainer>
  );
}
