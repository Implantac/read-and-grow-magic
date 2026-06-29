import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RouteStop } from '@/hooks/tms/useRoutePlanning';

// Fix default marker icons (Leaflet expects assets at /, Vite breaks it)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const numberedIcon = (n: number, color: string, late = false) =>
  L.divIcon({
    className: 'route-stop-marker',
    html: `<div style="background:${color};color:#fff;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;border:${late ? '3px solid #ef4444' : '2px solid #fff'};box-shadow:0 1px 4px rgba(0,0,0,.4);${late ? 'outline:2px solid rgba(239,68,68,.35);outline-offset:1px;' : ''}">${n}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

const depotIcon = L.divIcon({
  className: 'route-depot-marker',
  html: `<div style="background:#1A2234;color:#FF9800;width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;border:2px solid #FF9800;box-shadow:0 1px 4px rgba(0,0,0,.4);">CD</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const STATUS_COLOR: Record<string, string> = {
  pending: '#64748b',
  en_route: '#3b82f6',
  arrived: '#0ea5e9',
  completed: '#22c55e',
  failed: '#ef4444',
  skipped: '#a3a3a3',
};

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [map, points]);
  return null;
}

interface StopFeasibility {
  status: 'ok' | 'early' | 'late' | 'no-window' | 'no-geo';
  arrivalMin?: number;
  windowEndMin?: number | null;
}

interface Props {
  stops: RouteStop[];
  depot?: { lat: number | null | undefined; lng: number | null | undefined } | null;
  height?: number;
  feasibility?: Record<string, StopFeasibility>;
  onReorder?: (orderedIds: string[]) => void;
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function RouteMap({ stops, depot, height = 360, feasibility }: Props) {
  const geocoded = useMemo(
    () =>
      stops
        .filter((s) => s.latitude != null && s.longitude != null)
        .map((s) => ({
          ...s,
          lat: Number(s.latitude),
          lng: Number(s.longitude),
        })),
    [stops],
  );

  const depotPoint = useMemo(() => {
    if (depot?.lat != null && depot?.lng != null) {
      return [Number(depot.lat), Number(depot.lng)] as [number, number];
    }
    return null;
  }, [depot]);

  const linePoints = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = [];
    if (depotPoint) pts.push(depotPoint);
    for (const g of geocoded) pts.push([g.lat, g.lng]);
    if (depotPoint) pts.push(depotPoint);
    return pts;
  }, [geocoded, depotPoint]);

  const fitPoints = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = geocoded.map((g) => [g.lat, g.lng]);
    if (depotPoint) pts.push(depotPoint);
    return pts;
  }, [geocoded, depotPoint]);

  if (fitPoints.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
        style={{ height }}
      >
        Nenhuma parada geocodificada. Use “Geocodificar paradas” para preencher coordenadas.
      </div>
    );
  }

  const center = fitPoints[0];

  return (
    <div className="rounded-md overflow-hidden border" style={{ height }}>
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={fitPoints} />
        {depotPoint && (
          <Marker position={depotPoint} icon={depotIcon}>
            <Popup>Centro de Distribuição</Popup>
          </Marker>
        )}
        {geocoded.map((s) => {
          const fz = feasibility?.[s.id];
          const late = fz?.status === 'late';
          const fmtMin = (m?: number) => {
            if (m == null) return '';
            const h = Math.floor(m / 60);
            const mm = String(Math.round(m % 60)).padStart(2, '0');
            return `${h}h${mm}`;
          };
          const windowEndHHMM = (m?: number | null) => {
            if (m == null) return '';
            const h = String(Math.floor(m / 60)).padStart(2, '0');
            const mm = String(m % 60).padStart(2, '0');
            return `${h}:${mm}`;
          };
          return (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              icon={numberedIcon(s.sequence, STATUS_COLOR[s.status] ?? '#64748b', late)}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <div className="font-semibold">
                    Parada #{s.sequence}
                    {late && <span style={{ color: '#ef4444', marginLeft: 6 }}>· ATRASADA</span>}
                  </div>
                  {s.address && <div>{s.address}</div>}
                  {(s.city || s.state) && <div>{[s.city, s.state].filter(Boolean).join(' / ')}</div>}
                  <div>Status: {s.status}</div>
                  {s.planned_eta && (
                    <div>ETA: {new Date(s.planned_eta).toLocaleString('pt-BR')}</div>
                  )}
                  {fz && fz.arrivalMin != null && (
                    <div style={{ color: late ? '#ef4444' : undefined }}>
                      Chegada simulada: +{fmtMin(fz.arrivalMin)}
                      {fz.windowEndMin != null && ` · janela até ${windowEndHHMM(fz.windowEndMin)}`}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        {linePoints.length >= 2 && (
          <Polyline positions={linePoints} pathOptions={{ color: '#FF9800', weight: 3, opacity: 0.75, dashArray: '6 8' }} />
        )}
      </MapContainer>
    </div>
  );
}
