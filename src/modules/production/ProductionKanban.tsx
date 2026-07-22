import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Button } from '@/ui/base/button';
import { Skeleton } from '@/ui/base/skeleton';
import { cn } from '@/lib/utils';
import { Activity, ListOrdered, RefreshCw, Swords } from 'lucide-react';

import { WarModeDialog } from './kanban/WarModeDialog';
import { SequenceDialog } from './kanban/SequenceDialog';
import { BottleneckDialog } from './kanban/BottleneckDialog';
import { KanbanBoard } from './kanban/KanbanBoard';
import { KanbanKPIs, KanbanWipPanel, KanbanSuggestions, KanbanFilters } from './kanban/KanbanTopPanels';
import { useProductionKanban } from './kanban/useProductionKanban';

export default function ProductionKanban() {
  const k = useProductionKanban();

  if (k.loading) {
    return (
      <PageContainer>
        <Skeleton className="h-10 w-64 mb-4" />
        <div className="grid grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-96" />)}</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Kanban de Produção" description="Arraste as OPs entre colunas — priorização automática, WIP limits e Modo Guerra">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={k.handleRecalculate} disabled={k.recalculating}>
            <RefreshCw className={cn('h-4 w-4 mr-1', k.recalculating && 'animate-spin')} />
            Recalcular
          </Button>
          <Button variant="destructive" size="sm" onClick={k.handleWarMode} disabled={k.warModeLoading}>
            <Swords className="h-4 w-4 mr-1" />
            Modo Guerra
          </Button>
          <Button variant="secondary" size="sm" onClick={k.handleOptimizeSequence} disabled={k.sequenceLoading}>
            <ListOrdered className={cn('h-4 w-4 mr-1', k.sequenceLoading && 'animate-pulse')} />
            Otimizar Sequência
          </Button>
          <Button variant="outline" size="sm" onClick={k.handleBottleneckAnalysis} disabled={k.bottleneckLoading}>
            <Activity className={cn('h-4 w-4 mr-1', k.bottleneckLoading && 'animate-pulse')} />
            Gargalos
          </Button>
        </div>
      </PageHeader>

      <KanbanKPIs
        inProgressCount={k.inProgressCount}
        waitingMaterialCount={k.waitingMaterialCount}
        outsourcedCount={k.outsourcedCount}
        lateCount={k.lateCount}
        completedToday={k.completedToday}
      />

      <KanbanWipPanel wipMetrics={k.wipMetrics} />

      <KanbanSuggestions suggestions={k.suggestions} />

      <KanbanFilters
        searchTerm={k.searchTerm}
        setSearchTerm={k.setSearchTerm}
        sectorFilter={k.sectorFilter}
        setSectorFilter={k.setSectorFilter}
        priorityFilter={k.priorityFilter}
        setPriorityFilter={k.setPriorityFilter}
        sectors={k.sectors}
      />

      <KanbanBoard
        columns={k.columns}
        onDragEnd={k.handleDragEnd}
        onMove={k.moveOrder}
        outsourcingByOP={k.outsourcingByOP}
        timeLogs={k.timeLogs}
      />

      <WarModeDialog
        open={k.warModeOpen}
        onOpenChange={k.setWarModeOpen}
        result={k.warModeResult}
        loading={k.warModeLoading}
        onConfirm={k.handleConfirmWarMode}
      />

      <SequenceDialog
        open={k.sequenceOpen}
        onOpenChange={k.setSequenceOpen}
        result={k.sequenceResult}
        applying={k.applyingSequence}
        onApply={k.handleApplySequence}
      />

      <BottleneckDialog
        open={k.bottleneckOpen}
        onOpenChange={k.setBottleneckOpen}
        data={k.bottleneckData}
      />
    </PageContainer>
  );
}
