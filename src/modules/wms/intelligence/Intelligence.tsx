import WMSKpiStrip from "../components/WMSKpiStrip";
import RecommendationsPanel from "./RecommendationsPanel";

export default function Intelligence() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Warehouse Intelligence</h1>
        <p className="text-muted-foreground">
          Engine determinística que monitora ocupação, congestionamento, FEFO e balanceamento de docas.
        </p>
      </header>
      <WMSKpiStrip />
      <RecommendationsPanel />
    </div>
  );
}
