export interface Point {
  lat: number;
  lng: number;
}

type Coordinate = [number, number];
type PolygonCoordinates = Coordinate[];

interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: PolygonCoordinates[];
}

export function parsePolygonFromGeoJson(
  value: unknown,
): PolygonCoordinates | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const polygon = value as Partial<GeoJsonPolygon>;
  if (polygon.type !== 'Polygon' || !Array.isArray(polygon.coordinates)) {
    return null;
  }

  const firstRing = polygon.coordinates[0];
  if (!Array.isArray(firstRing) || firstRing.length < 3) {
    return null;
  }

  const normalized = firstRing
    .filter((coord) => Array.isArray(coord) && coord.length >= 2)
    .map((coord) => [Number(coord[0]), Number(coord[1])] as Coordinate)
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));

  return normalized.length >= 3 ? normalized : null;
}

export function isPointInsidePolygon(
  point: Point,
  polygon: PolygonCoordinates,
): boolean {
  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}
