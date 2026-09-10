import { ListChecks, RefreshCw } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Button } from '@/ui/base/button';
import { AttentionCenter } from '@/shared/components/AttentionCenter';
import { QuickActions } from '@/shared/components/QuickActions';
import { usePendingWork } from '@/hooks/system/usePendingWork';

export default function Pendencias() {
  const { refetch, isLoading } = usePendingWork();

  return (
    <PageContainer>
      <PageHeader
        title="O que precisa da sua atenção?"
        description="Tudo que está parado esperando uma decisão sua, do mais grave para o menos grave."
        icon={ListChecks}
        actions={
          <Button variant="outline" className="gap-2" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Atualizar
          </Button>
        }
      />

      <div className="space-y-4">
        <AttentionCenter />
        <QuickActions />
      </div>
    </PageContainer>
  );
}
