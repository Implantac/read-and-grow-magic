import { useState } from 'react';
import { ExportButton } from '@/shared/components/ExportButton';
import { Button } from '@/ui/base/button';
import { formatBRL, formatDate } from '@/lib/formatters';
import {
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowUpCircle,
  Calendar,
  Plus,
} from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import type { StockMovement } from '@/types/inventory';
import { useMovementsData } from './movements/useMovementsData';
import { MovementsFiltersCard } from './movements/MovementsFiltersCard';
import { MovementsTable } from './movements/MovementsTable';
import { MovementViewDialog } from './movements/MovementViewDialog';
import { MovementFormDialog } from './movements/MovementFormDialog';

export default function MovementsPage() {
  const { movements, filteredMovements, filters, setFilters, stats } = useMovementsData();
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <PageContainer>
      <PageHeader title="Movimentações" description="Controle de entradas e saídas de estoque">
        <ExportButton
          data={filteredMovements as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'documentNumber', label: 'Documento' },
            { key: 'productCode', label: 'Código Produto' },
            { key: 'productName', label: 'Produto' },
            { key: 'type', label: 'Tipo' },
            { key: 'direction', label: 'Direção' },
            { key: 'quantity', label: 'Quantidade' },
            { key: 'unitCost', label: 'Custo Unit.', format: (v) => formatBRL(Number(v)) },
            { key: 'totalCost', label: 'Total', format: (v) => formatBRL(Number(v)) },
            { key: 'operator', label: 'Operador' },
            { key: 'createdAt', label: 'Data', format: (v) => formatDate(v as string) },
          ]}
          filename="movimentacoes_estoque"
        />
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Movimentação
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title="Total de Movimentações"
          value={movements.length}
          icon={<ArrowLeftRight className="h-5 w-5" />}
          subtitle={`${stats.movementsToday} hoje`}
          index={0}
        />
        <KPICard
          title="Total Entradas"
          value={formatBRL(stats.totalEntries)}
          icon={<ArrowDownCircle className="h-5 w-5" />}
          accentColor="success"
          subtitle={`${stats.entriesCount} movimentações`}
          index={1}
        />
        <KPICard
          title="Total Saídas"
          value={formatBRL(stats.totalExits)}
          icon={<ArrowUpCircle className="h-5 w-5" />}
          accentColor="danger"
          subtitle={`${stats.exitsCount} movimentações`}
          index={2}
        />
        <KPICard
          title="Saldo Período"
          value={formatBRL(stats.totalEntries - stats.totalExits)}
          icon={<Calendar className="h-5 w-5" />}
          accentColor={stats.totalEntries - stats.totalExits >= 0 ? 'success' : 'danger'}
          subtitle="Entradas - Saídas"
          index={3}
        />
      </div>

      <MovementsFiltersCard filters={filters} setFilters={setFilters} />

      <MovementsTable
        rows={filteredMovements}
        onView={(m) => {
          setSelectedMovement(m);
          setIsViewOpen(true);
        }}
      />

      <MovementViewDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        movement={selectedMovement}
      />
      <MovementFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />
    </PageContainer>
  );
}
