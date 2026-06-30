import WMSKpiStrip from "../components/WMSKpiStrip";
import WarehouseMap from "./WarehouseMap";

export default function DigitalTwin() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Digital Twin do Armazém</h1>
        <p className="text-muted-foreground">
          Representação visual ao vivo da ocupação, classes ABC e zonas críticas.
        </p>
      </header>
      <WMSKpiStrip />
      <WarehouseMap />
    </div>
  );
}
