import { RefObject } from 'react';
import { Button } from '@/ui/base/button';
import { Dialog, DialogTrigger } from '@/ui/base/dialog';
import { Clock, Download, ExternalLink, FileDown, Loader2, MapPin, Plus, Upload, Wand2 } from 'lucide-react';
import { StopDialog } from './StopDialog';
import { buildGoogleMapsUrl, buildRouteGpx, downloadGpx } from '@/lib/routeExport';
import { toastError, toastSuccess } from '@/lib/toastHelpers';

type Props = {
  fileInputRef: RefObject<HTMLInputElement>;
  importing: boolean;
  bulkGeocoding: boolean;
  computing: boolean;
  missingGeo: number;
  stops: any[];
  route: any;
  depot: any;
  open: boolean;
  setOpen: (v: boolean) => void;
  reorderPending: boolean;
  onImportCsv: (f: File) => void;
  onDownloadTemplate: () => void;
  onBulkGeocode: () => void;
  onComputeEta: () => void;
  onOptimize: () => void;
  onCreateStop: (payload: any) => void;
};

export function RouteToolbar(p: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      <input
        ref={p.fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) p.onImportCsv(f); }}
      />
      <Button size="sm" variant="outline" onClick={() => p.fileInputRef.current?.click()} disabled={p.importing}>
        {p.importing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
        Importar CSV
      </Button>
      <Button size="sm" variant="ghost" onClick={p.onDownloadTemplate} title="Baixar modelo de CSV">
        <FileDown className="h-4 w-4 mr-1" />Modelo
      </Button>
      <Button size="sm" variant="outline" onClick={p.onBulkGeocode} disabled={p.bulkGeocoding || p.missingGeo === 0}>
        {p.bulkGeocoding ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <MapPin className="h-4 w-4 mr-1" />}
        Geocodificar paradas{p.missingGeo > 0 ? ` (${p.missingGeo})` : ''}
      </Button>
      <Button size="sm" variant="outline" onClick={p.onComputeEta} disabled={p.computing || p.stops.length === 0}>
        {p.computing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Clock className="h-4 w-4 mr-1" />}
        Calcular ETA
      </Button>
      <Button
        size="sm" variant="outline" onClick={p.onOptimize}
        disabled={p.reorderPending || p.stops.length < 2}
        title="Reordena as paradas pelo menor caminho (nearest neighbor)"
      >
        <Wand2 className="h-4 w-4 mr-1" />Otimizar rota
      </Button>
      <Button
        size="sm" variant="outline"
        onClick={() => {
          const geocoded = p.stops.filter((s) => s.latitude != null && s.longitude != null);
          if (geocoded.length === 0) { toastError('Nenhuma parada geocodificada para exportar.'); return; }
          const gpx = buildRouteGpx({
            routeName: `Rota ${p.route.routeNumber ?? p.route.id.slice(0, 8)}`,
            depot: p.depot, stops: p.stops,
          });
          downloadGpx(`rota-${p.route.routeNumber ?? p.route.id.slice(0, 8)}`, gpx);
          toastSuccess(`GPX exportado (${geocoded.length} paradas)`);
        }}
        disabled={p.stops.length === 0}
        title="Baixar arquivo GPX para Garmin, Waze, OsmAnd e Google Earth"
      >
        <Download className="h-4 w-4 mr-1" />Exportar GPX
      </Button>
      <Button
        size="sm" variant="outline"
        onClick={() => {
          const url = buildGoogleMapsUrl({ depot: p.depot, stops: p.stops });
          if (!url) { toastError('Geocodifique as paradas antes de abrir no Google Maps.'); return; }
          window.open(url, '_blank', 'noopener,noreferrer');
        }}
        disabled={p.stops.length === 0}
        title="Abrir rota completa no Google Maps"
      >
        <ExternalLink className="h-4 w-4 mr-1" />Google Maps
      </Button>

      <Dialog open={p.open} onOpenChange={p.setOpen}>
        <DialogTrigger asChild>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova parada</Button>
        </DialogTrigger>
        <StopDialog
          routeId={p.route.id}
          nextSeq={p.stops.length + 1}
          onClose={() => p.setOpen(false)}
          onSubmit={p.onCreateStop}
        />
      </Dialog>
    </div>
  );
}
