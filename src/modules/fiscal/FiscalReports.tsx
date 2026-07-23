import { useState } from 'react';
import { toastSuccess } from '@/lib/toastHelpers';
import { FileSpreadsheet } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Separator } from '@/ui/base/separator';
import { reportTypeLabels } from '@/config/fiscal';
import { useFiscalReports } from '@/hooks/fiscal/useFiscalReports';
import { CreateReportDialog } from '@/components/fiscal/CreateReportDialog';
import type { FiscalReport } from '@/types/fiscal';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { computeTaxAggregates } from './reports/helpers';
import { TaxKPIs } from './reports/TaxKPIs';
import { TaxEvolutionChart } from './reports/TaxEvolutionChart';
import { TaxDistributionChart } from './reports/TaxDistributionChart';
import { ReportsTable } from './reports/ReportsTable';

export default function FiscalReportsPage() {
  const { reports, loading: _loading, generate, create } = useFiscalReports();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [generating, setGenerating] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filteredReports = reports.filter((r) => typeFilter === 'all' || r.type === typeFilter);
  const { totalTaxes, taxBreakdown, taxDistributionData, monthlyTaxData } = computeTaxAggregates(reports);

  const handleGenerate = async (report: FiscalReport) => {
    setGenerating(report.id);
    await generate(report.id);
    setGenerating(null);
  };

  const handleDownload = (report: FiscalReport) => {
    toastSuccess('Download Iniciado', `Baixando ${reportTypeLabels[report.type]}...`);
  };

  return (
    <PageContainer>
      <PageHeader title="Relatórios Fiscais" description="Gerencie e exporte seus relatórios fiscais e obrigações acessórias">
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <FileSpreadsheet className="h-4 w-4" />
          Novo Relatório
        </Button>
      </PageHeader>

      <TaxKPIs totalTaxes={totalTaxes} taxBreakdown={taxBreakdown} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TaxEvolutionChart data={monthlyTaxData} />
        <TaxDistributionChart data={taxDistributionData} />
      </div>

      <Separator />

      <ReportsTable
        reports={filteredReports}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        generating={generating}
        onGenerate={handleGenerate}
        onDownload={handleDownload}
      />

      <CreateReportDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={create} />
    </PageContainer>
  );
}
