import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2, BarChart3 } from 'lucide-react';
import { EquityEvolutionChart } from '@/components/contabilidade/EquityEvolutionChart';
import { MarginTrendChart } from '@/components/contabilidade/MarginTrendChart';
import { RevenueExpenseTrendChart } from '@/components/contabilidade/RevenueExpenseTrendChart';
import { ExpenseBreakdownChart } from '@/components/contabilidade/ExpenseBreakdownChart';
import { FinancialIndicatorsPanel } from '@/components/contabilidade/FinancialIndicatorsPanel';
import { TrialBalanceChart } from '@/components/contabilidade/TrialBalanceChart';
import { PeriodSelector } from '@/components/contabilidade/PeriodSelector';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { EquityEvolutionChart } from '@/components/contabilidade/EquityEvolutionChart';
import { MarginTrendChart } from '@/components/contabilidade/MarginTrendChart';
import { RevenueExpenseTrendChart } from '@/components/contabilidade/RevenueExpenseTrendChart';
import { ExpenseBreakdownChart } from '@/components/contabilidade/ExpenseBreakdownChart';
import { FinancialIndicatorsPanel } from '@/components/contabilidade/FinancialIndicatorsPanel';
import { TrialBalanceChart } from '@/components/contabilidade/TrialBalanceChart';
import { PeriodSelector } from '@/components/contabilidade/PeriodSelector';

export default function AccountingDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('jan-24');
  const [comparePeriod, setComparePeriod] = useState('dez-23');
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const handleExportPDF = useCallback(async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`painel-executivo-contabil-${selectedPeriod}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  }, [selectedPeriod]);

  return (
    <PageContainer>
      <PageHeader title="Painel Executivo Contábil" description="Visão consolidada dos indicadores contábeis">
        <Button variant="outline" onClick={handleExportPDF} disabled={isExporting} className="gap-2">
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          Exportar PDF
        </Button>
        <PeriodSelector
          value={selectedPeriod}
          onValueChange={setSelectedPeriod}
          compareValue={comparePeriod}
          onCompareChange={setComparePeriod}
        />
      </PageHeader>

      <div ref={dashboardRef} className="space-y-6">
        {/* Empty state message */}
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado contábil disponível</h3>
            <p className="text-muted-foreground mb-4">
              Cadastre lançamentos contábeis para visualizar os indicadores do painel executivo.
            </p>
            <Button onClick={() => navigate('/contabilidade/lancamentos')}>
              Ir para Lançamentos
            </Button>
          </CardContent>
        </Card>

        {/* Charts Row 1: Revenue & Equity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueExpenseTrendChart />
          <EquityEvolutionChart />
        </div>

        {/* Charts Row 2: Margins & Expenses */}
        <div className="grid gap-6 lg:grid-cols-2">
          <MarginTrendChart />
          <ExpenseBreakdownChart />
        </div>

        {/* Charts Row 3: Trial Balance */}
        <TrialBalanceChart />

        {/* Financial Indicators */}
        <FinancialIndicatorsPanel />
      </div>
    </div>
  );
}
