import { Button } from "@/ui/base/button";
import { Plus, RefreshCw } from "lucide-react";
import { useBilling3PL } from "./billing3pl/useBilling3PL";
import { KPICards } from "./billing3pl/KPICards";
import { ContractsTable } from "./billing3pl/ContractsTable";
import { InvoicesTable } from "./billing3pl/InvoicesTable";
import { ContractDialog } from "./billing3pl/ContractDialog";
import { InvoiceDialog } from "./billing3pl/InvoiceDialog";

export default function Billing3PL() {
  const s = useBilling3PL();

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Faturamento 3PL</h1>
          <p className="text-sm text-muted-foreground">
            Contratos, tarifas e geração automática de faturas por movimentação e armazenagem.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void s.load()} aria-label="Recarregar">
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
          <Button onClick={() => s.setOpenContract(true)}>
            <Plus className="h-4 w-4 mr-2" /> Novo contrato
          </Button>
        </div>
      </header>

      <KPICards contracts={s.contracts} invoices={s.invoices} totalMTD={s.totalMTD} />

      <ContractsTable
        loading={s.loading}
        contracts={s.contracts}
        onGenerate={(c) => {
          s.setSelected(c);
          s.setOpenInvoice(true);
        }}
      />

      <InvoicesTable invoices={s.invoices} contracts={s.contracts} />

      <ContractDialog
        open={s.openContract}
        onOpenChange={s.setOpenContract}
        form={s.form}
        setForm={s.setForm}
        onSave={s.saveContract}
      />

      <InvoiceDialog
        open={s.openInvoice}
        onOpenChange={s.setOpenInvoice}
        selected={s.selected}
        period={s.period}
        setPeriod={s.setPeriod}
        onGenerate={s.generateInvoice}
      />
    </div>
  );
}
