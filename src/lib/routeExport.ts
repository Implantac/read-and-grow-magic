// Route export helpers: GPX 1.1 file + Google Maps directions URL.
// Stops with missing latitude/longitude are skipped.

interface ExportStop {
  sequence: number;
  latitude: number | null;
  longitude: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
}

interface Depot {
  depot_latitude: number | null;
  depot_longitude: number | null;
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!)
  );
}

function describe(stop: ExportStop): string {
  const parts = [stop.address, stop.city, stop.state].filter(Boolean) as string[];
  return parts.join(', ') || `Parada ${stop.sequence}`;
}

function geoStops(stops: ExportStop[]): Required<Pick<ExportStop, 'latitude' | 'longitude'>> &
  ExportStop[] extends never
  ? never
  : ExportStop[] {
  return stops
    .filter((s) => s.latitude != null && s.longitude != null)
    .sort((a, b) => a.sequence - b.sequence);
}

export function buildRouteGpx(opts: {
  routeName: string;
  depot: Depot | null | undefined;
  stops: ExportStop[];
}): string {
  const ordered = geoStops(opts.stops);
  const waypoints: { lat: number; lon: number; name: string }[] = [];

  if (opts.depot?.depot_latitude != null && opts.depot?.depot_longitude != null) {
    waypoints.push({
      lat: opts.depot.depot_latitude,
      lon: opts.depot.depot_longitude,
      name: 'Depósito (saída)',
    });
  }
  ordered.forEach((s) => {
    waypoints.push({
      lat: s.latitude!,
      lon: s.longitude!,
      name: `${s.sequence}. ${describe(s)}`,
    });
  });
  if (opts.depot?.depot_latitude != null && opts.depot?.depot_longitude != null) {
    waypoints.push({
      lat: opts.depot.depot_latitude,
      lon: opts.depot.depot_longitude,
      name: 'Depósito (retorno)',
    });
  }

  const meta = escapeXml(opts.routeName);
  const wpt = waypoints
    .map(
      (w) =>
        `  <wpt lat="${w.lat}" lon="${w.lon}"><name>${escapeXml(w.name)}</name></wpt>`,
    )
    .join('\n');
  const trkpts = waypoints
    .map((w) => `      <trkpt lat="${w.lat}" lon="${w.lon}"></trkpt>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Lovable TMS" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${meta}</name><time>${new Date().toISOString()}</time></metadata>
${wpt}
  <trk><name>${meta}</name><trkseg>
${trkpts}
  </trkseg></trk>
</gpx>
`;
}

export function buildGoogleMapsUrl(opts: {
  depot: Depot | null | undefined;
  stops: ExportStop[];
}): string | null {
  const ordered = geoStops(opts.stops);
  if (ordered.length === 0) return null;
  const points: string[] = [];
  const depotPt =
    opts.depot?.depot_latitude != null && opts.depot?.depot_longitude != null
      ? `${opts.depot.depot_latitude},${opts.depot.depot_longitude}`
      : null;
  if (depotPt) points.push(depotPt);
  ordered.forEach((s) => points.push(`${s.latitude},${s.longitude}`));
  if (depotPt) points.push(depotPt);
  // Google Maps directions accepts up to ~10 waypoints; we still build the URL,
  // truncation is up to the user.
  const path = points.map(encodeURIComponent).join('/');
  return `https://www.google.com/maps/dir/${path}`;
}

export function downloadGpx(filename: string, gpx: string): void {
  const blob = new Blob([gpx], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.gpx') ? filename : `${filename}.gpx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
