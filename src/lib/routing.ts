import type { RoadDisruption, RouteMetrics, WasteNode } from '@/types/ecoroute';

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const haversineDistanceKm = (
  a: Pick<WasteNode, 'lat' | 'lng'>,
  b: Pick<WasteNode, 'lat' | 'lng'>
): number => {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const latitudeA = toRadians(a.lat);
  const latitudeB = toRadians(b.lat);
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

export const fetchOsrmRoute = async (coordinates: [number, number][]): Promise<RouteMetrics> => {
  if (coordinates.length < 2) {
    throw new Error('OSRM route requires at least two coordinates');
  }

  const path = coordinates.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson`);
  if (!response.ok) throw new Error('OSRM route request failed');
  const data = await response.json() as { routes: Array<{ distance: number; duration: number; geometry: { coordinates: [number, number][] } }> };
  const route = data.routes[0];
  if (!route) throw new Error('OSRM returned no route');

  return { mode: 'ECO_OPTIMIZED', coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]), visitedNodeIds: [], totalDistanceKm: route.distance / 1000, estimatedDurationMin: route.duration / 60, totalPayloadKg: 0, fuelConsumedLiter: route.distance / 1000 * 0.35, carbonEmissionKg: route.distance / 1000 * 0.35 * 2.68 };
};

const twoOpt = (route: WasteNode[]): WasteNode[] => {
  let best = [...route];
  let improved = true;

  while (improved) {
    improved = false;
    const currentDistance = best.reduce(
      (total, node, index) => index === 0 ? total : total + haversineDistanceKm(best[index - 1], node),
      0
    );

    for (let start = 1; start < best.length - 1; start += 1) {
      for (let end = start + 1; end < best.length; end += 1) {
        const candidate = [...best.slice(0, start), ...best.slice(start, end + 1).reverse(), ...best.slice(end + 1)];
        const candidateDistance = candidate.reduce(
          (total, node, index) => index === 0 ? total : total + haversineDistanceKm(candidate[index - 1], node),
          0
        );

        if (candidateDistance + 0.001 < currentDistance) {
          best = candidate;
          improved = true;
        }
      }
    }
  }

  return best;
};

export const optimizeTruckRoute = (nodes: WasteNode[]): WasteNode[] => {
  const stops = nodes.filter(
    (node) => (node.type === 'CENTRAL_BIN' || node.type === 'TPS') && node.fillPercentage >= 75
  );

  if (stops.length < 2) return stops;

  const remaining = [...stops];
  const ordered: WasteNode[] = [remaining.shift()!];
  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    const nearestIndex = remaining.reduce(
      (bestIndex, node, index) =>
        haversineDistanceKm(current, node) < haversineDistanceKm(current, remaining[bestIndex]) ? index : bestIndex,
      0
    );
    ordered.push(remaining.splice(nearestIndex, 1)[0]);
  }

  return twoOpt(ordered);
};

export const calculateTruckEmission = (distanceKm: number, payloadKg: number): number =>
  distanceKm * 0.35 * (1 + 0.15 * (payloadKg / 5000)) * 2.68;

export const buildDetourWaypoints = (
  stops: WasteNode[],
  destination: WasteNode | undefined,
  disruptions: RoadDisruption[]
): [number, number][] => {
  const waypoints: [number, number][] = stops.map((node) => [node.lat, node.lng]);
  if (destination) waypoints.push([destination.lat, destination.lng]);
  if (waypoints.length < 2 || disruptions.length === 0) return waypoints;

  const result: [number, number][] = [waypoints[0]];
  for (let index = 0; index < waypoints.length - 1; index += 1) {
    const start = waypoints[index];
    const end = waypoints[index + 1];
    const midpoint = { lat: (start[0] + end[0]) / 2, lng: (start[1] + end[1]) / 2 };

    for (const disruption of disruptions.filter((item) => item.isActive)) {
      if (haversineDistanceKm(midpoint, disruption) <= 2.5) {
        const offset = (disruption.radiusMeter + 260) / 111000;
        result.push([disruption.lat + offset * 0.4, disruption.lng + offset]);
      }
    }
    result.push(end);
  }

  return result;
};

