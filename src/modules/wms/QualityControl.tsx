import { useState } from "react";
import { Button } from "@/ui/base/button";
import { RefreshCw } from "lucide-react";
import { KPICards } from "./quality/KPICards";
import { LotsTable, type FilterValue } from "./quality/LotsTable";
import { RecentChecksList } from "./quality/RecentChecksList";
import { InspectDialog } from "./quality/InspectDialog";
import { useQualityControl } from "./quality/useQualityControl";
import type { Lot } from "./quality/types";

export default function QualityControl() {
  const { lots, recentChecks, loading, kpi, saving, load, submitInspection } = useQualityControl();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("pending");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Lot | null>(null);

  const openInspect = (lot: Lot) => {
    setSelected(lot);
    setOpen(true);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Controle de Qualidade</h1>
          <p className="text-muted-foreground">
            Inspeção de lotes recebidos, quarentena e rastreabilidade de não-conformidades.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          Atualizar
        </Button>
      </header>

      <KPICards kpi={kpi} />

      <LotsTable
        lots={lots}
        loading={loading}
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
        onInspect={openInspect}
      />

      <RecentChecksList checks={recentChecks} />

      <InspectDialog
        open={open}
        onOpenChange={setOpen}
        lot={selected}
        saving={saving}
        onSubmit={submitInspection}
      />
    </div>
  );
}
