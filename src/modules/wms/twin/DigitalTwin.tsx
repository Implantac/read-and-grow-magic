import { lazy, Suspense, useState } from "react";
import WMSKpiStrip from "../components/WMSKpiStrip";
import WarehouseMap from "./WarehouseMap";
import { Button } from "@/ui/base/button";
import { Card, CardContent } from "@/ui/base/card";

const WarehouseMap3D = lazy(() => import("./WarehouseMap3D"));

type View = "2d" | "3d";

export default function DigitalTwin() {
  const [view, setView] = useState<View>("2d");

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Digital Twin do Armazém</h1>
          <p className="text-muted-foreground">
            Representação visual ao vivo da ocupação, classes ABC e zonas críticas.
          </p>
        </div>
        <div className="inline-flex rounded-md border bg-card p-0.5" role="tablist" aria-label="Modo de visualização">
          <Button
            size="sm"
            variant={view === "2d" ? "default" : "ghost"}
            role="tab"
            aria-selected={view === "2d"}
            onClick={() => setView("2d")}
          >
            Mapa 2D
          </Button>
          <Button
            size="sm"
            variant={view === "3d" ? "default" : "ghost"}
            role="tab"
            aria-selected={view === "3d"}
            onClick={() => setView("3d")}
          >
            Visão 3D
          </Button>
        </div>
      </header>
      <WMSKpiStrip />
      {view === "2d" ? (
        <WarehouseMap />
      ) : (
        <Suspense
          fallback={
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Carregando renderização 3D…
              </CardContent>
            </Card>
          }
        >
          <WarehouseMap3D />
        </Suspense>
      )}
    </div>
  );
}
