import osmGeoJson from "../../../assets/geo/lingshan-osm.json";
import type { MapPoint } from "../../../types/domain";

type Coordinate = [number, number];
type GeoFeature = {
  geometry?: { type: string; coordinates: unknown };
  properties?: Record<string, unknown>;
};
type GeoJson = { type: "FeatureCollection"; features: GeoFeature[] };

const geoJson = osmGeoJson as unknown as GeoJson;

function isCoordinate(value: unknown): value is Coordinate {
  return Array.isArray(value) && typeof value[0] === "number" && typeof value[1] === "number";
}

function collectCoordinates(value: unknown, coordinates: Coordinate[] = []) {
  if (isCoordinate(value)) {
    coordinates.push(value);
    return coordinates;
  }
  if (Array.isArray(value)) value.forEach((item) => collectCoordinates(item, coordinates));
  return coordinates;
}

function createProjector(features: GeoFeature[]) {
  const min = [Infinity, Infinity];
  const max = [-Infinity, -Infinity];
  features.forEach((feature) => {
    collectCoordinates(feature.geometry?.coordinates).forEach(([lon, lat]) => {
      min[0] = Math.min(min[0], lon);
      min[1] = Math.min(min[1], lat);
      max[0] = Math.max(max[0], lon);
      max[1] = Math.max(max[1], lat);
    });
  });

  return ([lon, lat]: Coordinate) => {
    const x = 38 + ((lon - min[0]) / Math.max(max[0] - min[0], 0.000001)) * 924;
    const y = 44 + (1 - (lat - min[1]) / Math.max(max[1] - min[1], 0.000001)) * 532;
    return [x, y];
  };
}

function toneColor(tone: MapPoint["tone"]) {
  if (tone === "danger") return "#ff6b5f";
  if (tone === "warning") return "#f0b84d";
  if (tone === "accent") return "#35d7c7";
  if (tone === "success") return "#7bd66f";
  return "#9fb8b4";
}

interface MapPointOverlayProps {
  activeLayers: Record<MapPoint["layer"], boolean>;
  points: MapPoint[];
  selectedId?: string;
  onSelect: (point: MapPoint) => void;
}

const project = createProjector(geoJson.features);

export function MapPointOverlay({ activeLayers, points, selectedId, onSelect }: MapPointOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[3]">
      {points.filter((point) => activeLayers[point.layer]).map((point) => {
        const [x, y] = project([point.lon, point.lat]);
        const selected = point.id === selectedId;
        const color = toneColor(point.tone);
        return (
          <button
            aria-pressed={selected}
            className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 text-left transition duration-200 active:scale-95"
            key={point.id}
            onClick={() => onSelect(point)}
            style={{ left: `${(x / 1000) * 100}%`, top: `${(y / 620) * 100}%` }}
            type="button"
          >
            <span
              className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: selected ? 42 : 30,
                height: selected ? 42 : 30,
                border: `2px solid ${color}`,
                background: `${color}24`,
                boxShadow: `0 0 28px ${color}66`
              }}
            />
            <span
              className="relative z-10 block h-3.5 w-3.5 rounded-full border border-white/80"
              style={{ background: color, boxShadow: `0 0 18px ${color}` }}
            />
            {(selected || point.tone === "danger") && (
              <span className="absolute left-5 top-4 hidden min-w-[132px] rounded-xl border border-white/15 bg-[#0b1c1d]/90 px-3 py-2 text-white shadow-[0_12px_32px_rgba(0,0,0,.28)] backdrop-blur-md sm:block">
                <strong className="block whitespace-nowrap text-xs">{point.name}</strong>
                <small className="block whitespace-nowrap text-[10px] text-white/66">{point.summary}</small>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
