import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Package } from "lucide-react";
import { useKitAssembly } from "./kitAssembly/useKitAssembly";
import { NewKitDialog } from "./kitAssembly/NewKitDialog";
import { KitsTable } from "./kitAssembly/KitsTable";
import { AssembliesTable } from "./kitAssembly/AssembliesTable";
import { AssembleKitDialog } from "./kitAssembly/AssembleKitDialog";
import type { KitRow } from "./kitAssembly/types";

export default function KitAssembly() {
  const { kits, products, assemblies, loading, reload } = useKitAssembly();
  const [openAssemble, setOpenAssemble] = useState<KitRow | null>(null);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" /> Montagem de Kits (VAS)
          </h1>
          <p className="text-muted-foreground">
            Cadastre kits com seus componentes e execute montagens consumindo estoque por tenant.
          </p>
        </div>
        <NewKitDialog products={products} onCreated={reload} />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Kits Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <KitsTable kits={kits} loading={loading} onAssemble={setOpenAssemble} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Montagens</CardTitle>
        </CardHeader>
        <CardContent>
          <AssembliesTable assemblies={assemblies} />
        </CardContent>
      </Card>

      <AssembleKitDialog
        kit={openAssemble}
        onClose={() => setOpenAssemble(null)}
        onDone={() => {
          setOpenAssemble(null);
          reload();
        }}
      />
    </div>
  );
}
