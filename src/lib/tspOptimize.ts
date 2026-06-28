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

  // 2-opt refinement: iteratively reverse segments while it shortens the loop.
  const depotP = { lat: depot.lat, lng: depot.lng };
  const coords = order.map((id) => {
    const s = withGeo.find((x) => x.id === id)!;
    return { lat: s.latitude as number, lng: s.longitude as number };
  });

  const tourDist = (pts: { lat: number; lng: number }[]) => {
    if (pts.length === 0) return 0;
    let d = haversine(depotP, pts[0]);
    for (let i = 0; i < pts.length - 1; i++) d += haversine(pts[i], pts[i + 1]);
    d += haversine(pts[pts.length - 1], depotP);
    return d;
  };

  let improved = true;
  let iter = 0;
  const maxIter = 50;
  while (improved && iter < maxIter) {
    improved = false;
    iter++;
    for (let i = 0; i < coords.length - 1; i++) {
      for (let k = i + 1; k < coords.length; k++) {
        const before =
          (i === 0 ? haversine(depotP, coords[i]) : haversine(coords[i - 1], coords[i])) +
          (k === coords.length - 1 ? haversine(coords[k], depotP) : haversine(coords[k], coords[k + 1]));
        const after =
          (i === 0 ? haversine(depotP, coords[k]) : haversine(coords[i - 1], coords[k])) +
          (k === coords.length - 1 ? haversine(coords[i], depotP) : haversine(coords[i], coords[k + 1]));
        if (after + 1e-9 < before) {
          const cSlice = coords.slice(i, k + 1).reverse();
          const oSlice = order.slice(i, k + 1).reverse();
          coords.splice(i, k - i + 1, ...cSlice);
          order.splice(i, k - i + 1, ...oSlice);
          improved = true;
        }
      }
    }
  }

  total = tourDist(coords);

  return {
    ordered: [...order, ...withoutGeo.map((s) => s.id)],
    totalKm: total,
    skipped: withoutGeo.length,
  };
}
