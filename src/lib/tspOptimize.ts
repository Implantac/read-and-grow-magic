// Nearest-neighbor TSP heuristic for route stops.
// Returns the input ids reordered by minimizing total Haversine distance,
// starting (and ending) at the depot. Stops without coordinates are kept
// at the end in their original order so the result always covers everyone.

export interface GeoPoint {
  id: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  timeWindowStart?: string | null; // 'HH:MM' or 'HH:MM:SS'
  timeWindowEnd?: string | null;
  serviceMinutes?: number | null;
}

/** Per-stop arrival evaluation produced by `checkTimeWindows`. */
export interface FeasibilityStop {
  id: string;
  arrivalMin: number;          // minutes from depot departure
  windowStartMin: number | null;
  windowEndMin: number | null;
  status: 'ok' | 'early' | 'late' | 'no-window' | 'no-geo';
}

export interface FeasibilityReport {
  stops: FeasibilityStop[];
  lateCount: number;
  earlyCount: number;
  totalMinutes: number;        // depot → all stops → depot, incl. service & wait
}

function parseHHMM(s?: string | null): number | null {
  if (!s) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(s);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
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

/**
 * Simulates the planned tour against per-stop time windows.
 *
 * - `orderedIds` is the sequence of stops as currently planned.
 * - `stops` provides geo + window + service info, looked up by id.
 * - `depot` is the start/end point.
 * - `departureHHMM` is the wall-clock start time (e.g. "08:00").
 * - `avgSpeedKmh` defaults to 40 km/h for urban delivery.
 *
 * Travel time = haversine_km / avgSpeed * 60. If arrival is before the
 * window opens, the driver waits (idle time counts toward totalMinutes).
 * Arrival after window close marks the stop as `late`.
 */
export function checkTimeWindows(
  orderedIds: string[],
  stops: GeoPoint[],
  depot: { lat: number | null | undefined; lng: number | null | undefined },
  departureHHMM: string = '08:00',
  avgSpeedKmh: number = 40,
): FeasibilityReport {
  const byId = new Map(stops.map((s) => [s.id, s]));
  const depart = parseHHMM(departureHHMM) ?? 8 * 60;
  const result: FeasibilityStop[] = [];

  if (typeof depot.lat !== 'number' || typeof depot.lng !== 'number') {
    return { stops: [], lateCount: 0, earlyCount: 0, totalMinutes: 0 };
  }

  let current = { lat: depot.lat, lng: depot.lng };
  let clock = depart; // minutes since midnight

  for (const id of orderedIds) {
    const s = byId.get(id);
    if (!s || typeof s.latitude !== 'number' || typeof s.longitude !== 'number') {
      result.push({ id, arrivalMin: clock - depart, windowStartMin: null, windowEndMin: null, status: 'no-geo' });
      continue;
    }
    const km = haversine(current, { lat: s.latitude, lng: s.longitude });
    clock += (km / avgSpeedKmh) * 60;

    const wStart = parseHHMM(s.timeWindowStart);
    const wEnd = parseHHMM(s.timeWindowEnd);
    let status: FeasibilityStop['status'] = 'no-window';
    if (wStart != null || wEnd != null) {
      if (wStart != null && clock < wStart) {
        status = 'early';
        clock = wStart; // wait for window to open
      } else if (wEnd != null && clock > wEnd) {
        status = 'late';
      } else {
        status = 'ok';
      }
    }
    result.push({
      id,
      arrivalMin: Math.round(clock - depart),
      windowStartMin: wStart,
      windowEndMin: wEnd,
      status,
    });

    clock += Math.max(0, s.serviceMinutes ?? 10);
    current = { lat: s.latitude, lng: s.longitude };
  }

  // return to depot
  const back = haversine(current, { lat: depot.lat, lng: depot.lng });
  clock += (back / avgSpeedKmh) * 60;

  return {
    stops: result,
    lateCount: result.filter((r) => r.status === 'late').length,
    earlyCount: result.filter((r) => r.status === 'early').length,
    totalMinutes: Math.round(clock - depart),
  };
}
