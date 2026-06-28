// Nearest-neighbor TSP heuristic for route stops.
// Returns the input ids reordered by minimizing total Haversine distance,
// starting (and ending) at the depot. Stops without coordinates are kept
// at the end in their original order so the result always covers everyone.

export interface GeoPoint {
  id: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
}

const R = 6371; // km

function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface TspResult {
  ordered: string[];          // full id list in suggested order
  totalKm: number;             // total distance depot → stops → depot for geocoded subset
  skipped: number;             // stops with no coordinates appended to the end
}

export function nearestNeighborTsp(
  stops: GeoPoint[],
  depot: { lat: number | null | undefined; lng: number | null | undefined },
): TspResult {
  const withGeo = stops.filter(
    (s) => typeof s.latitude === 'number' && typeof s.longitude === 'number',
  );
  const withoutGeo = stops.filter(
    (s) => typeof s.latitude !== 'number' || typeof s.longitude !== 'number',
  );

  if (
    withGeo.length === 0 ||
    typeof depot.lat !== 'number' ||
    typeof depot.lng !== 'number'
  ) {
    return {
      ordered: stops.map((s) => s.id),
      totalKm: 0,
      skipped: withoutGeo.length,
    };
  }

  const remaining = new Map(
    withGeo.map((s) => [
      s.id,
      { lat: s.latitude as number, lng: s.longitude as number },
    ]),
  );
  const order: string[] = [];
  let current = { lat: depot.lat, lng: depot.lng };
  let total = 0;

  while (remaining.size > 0) {
    let bestId: string | null = null;
    let bestDist = Infinity;
    for (const [id, p] of remaining) {
      const d = haversine(current, p);
      if (d < bestDist) {
        bestDist = d;
        bestId = id;
      }
    }
    if (!bestId) break;
    order.push(bestId);
    total += bestDist;
    current = remaining.get(bestId)!;
    remaining.delete(bestId);
  }

  // close the loop back to depot
  total += haversine(current, { lat: depot.lat, lng: depot.lng });

  return {
    ordered: [...order, ...withoutGeo.map((s) => s.id)],
    totalKm: total,
    skipped: withoutGeo.length,
  };
}
