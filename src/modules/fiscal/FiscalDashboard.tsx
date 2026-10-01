import { DFeMonitor } from './dashboard/DFeMonitor';
import { FiscalAIPanel } from './dashboard/FiscalAIPanel';
import { FiscalHeader } from './dashboard/FiscalHeader';
import { FiscalKPIs } from './dashboard/FiscalKPIs';
import { FiscalEmissionMonitor } from './dashboard/FiscalEmissionMonitor';
import { ManualLinkDialog } from './dashboard/ManualLinkDialog';
import { XMLReviewDialog } from './dashboard/XMLReviewDialog';
import { useXMLImport } from './dashboard/useXMLImport';

export default function FiscalDashboard() {
  const {
    isUploading,
    isProcessing,
    xmlData,
    showReview,
    setShowReview,
    showManualLinking,
    setShowManualLinking,
    activeItemIndex,
    progress,
    systemProducts,
    allowedUnits,
    selectedBranchId,
    setSelectedBranchId,
    documentIssue,
    handleManualLink,
    confirmManualLink,
    handleFileUpload,
    processImport,
  } = useXMLImport();

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <FiscalHeader isUploading={isUploading} onFileUpload={handleFileUpload} />

      <XMLReviewDialog
        open={showReview}
        onOpenChange={setShowReview}
        xmlData={xmlData}
        isProcessing={isProcessing}
        progress={progress}
        allowedUnits={allowedUnits}
        selectedBranchId={selectedBranchId}
        onBranchChange={setSelectedBranchId}
        documentIssue={documentIssue}
        onManualLink={handleManualLink}
        onConfirm={processImport}
      />

      <ManualLinkDialog
        open={showManualLinking}
        onOpenChange={setShowManualLinking}
        activeItemIndex={activeItemIndex}
        xmlData={xmlData}
        systemProducts={systemProducts}
        onConfirm={confirmManualLink}
      />

      <FiscalKPIs />

      <FiscalEmissionMonitor />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <DFeMonitor />
        <FiscalAIPanel />
      </div>
    </div>
  );
}
