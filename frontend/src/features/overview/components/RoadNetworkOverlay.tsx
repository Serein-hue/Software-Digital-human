import { useMemo } from "react";
import osmGeoJson from "../../../assets/geo/lingshan-osm.json";

type Coordinate = [number, number];
type GeoFeature = {
  geometry?: { type: string; coordinates: Coordinate[] | Coordinate[][] | Coordinate[][][] };
  properties?: Record<string, unknown>;
};
type GeoJson = { type: "FeatureCollection"; features: GeoFeature[] };

const geoJson = osmGeoJson as unknown as GeoJson;

function lineStrings(feature: GeoFeature): Coordinate[][] {
  if (feature.geometry?.type === "LineString") return [feature.geometry.coordinates as Coordinate[]];
  if (feature.geometry?.type === "MultiLineString") return feature.geometry.coordinates as Coordinate[][];
  return [];
}

function polygons(feature: GeoFeature): Coordinate[][][] {
  if (feature.geometry?.type === "Polygon") return [feature.geometry.coordinates as Coordinate[][]];
  if (feature.geometry?.type === "MultiPolygon") return feature.geometry.coordinates as Coordinate[][][];
  return [];
}

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

function collectBounds(features: GeoFeature[]) {
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
  return { min, max };
}

function createProjector(features: GeoFeature[]) {
  const { min, max } = collectBounds(features);
  const width = 924;
  const height = 532;
  return ([lon, lat]: Coordinate) => {
    const x = 38 + ((lon - min[0]) / Math.max(max[0] - min[0], 0.000001)) * width;
    const y = 44 + (1 - (lat - min[1]) / Math.max(max[1] - min[1], 0.000001)) * height;
    return [x, y];
  };
}

function pathFromLine(line: Coordinate[], project: (coord: Coordinate) => number[]) {
  return line
    .map((coord, index) => {
      const projected = project(coord);
      return `${index === 0 ? "M" : "L"}${projected[0].toFixed(2)} ${projected[1].toFixed(2)}`;
    })
    .join(" ");
}

function pathFromPolygon(rings: Coordinate[][], project: (coord: Coordinate) => number[]) {
  return rings
    .filter((ring) => ring.length > 2)
    .map((ring) => `${pathFromLine(ring, project)} Z`)
    .join(" ");
}

function areaStyle(feature: GeoFeature) {
  const className = String(feature.properties?.class ?? "");
  const natural = String(feature.properties?.natural ?? "");
  const landuse = String(feature.properties?.landuse ?? "");
  const leisure = String(feature.properties?.leisure ?? "");
  const tourism = String(feature.properties?.tourism ?? "");
  const building = String(feature.properties?.building ?? "");

  if (natural === "water" || className === "water") return { fill: "#1b7775", opacity: 0.28, stroke: "#58ded3" };
  if (leisure === "park" || landuse === "grass" || className === "green") return { fill: "#245f3d", opacity: 0.2, stroke: "#7bd66f" };
  if (tourism === "attraction" || className === "poi") return { fill: "#35d7c7", opacity: 0.18, stroke: "#8df0e5" };
  if (building || className === "building") return { fill: "#c69a58", opacity: 0.18, stroke: "#ffd787" };
  return { fill: "#526f66", opacity: 0.12, stroke: "#8ba5a0" };
}

export function RoadNetworkOverlay() {
  const { areas, roads } = useMemo(() => {
    const project = createProjector(geoJson.features);
    return {
      areas: geoJson.features.flatMap((feature, featureIndex) =>
        polygons(feature)
          .map((rings, polygonIndex) => ({
            id: `${featureIndex}-${polygonIndex}`,
            d: pathFromPolygon(rings, project),
            style: areaStyle(feature)
          }))
          .filter((area) => area.d)
      ),
      roads: geoJson.features.flatMap((feature, featureIndex) =>
        lineStrings(feature)
        .filter((line) => line.length > 1)
        .map((line, lineIndex) => ({
          id: `${featureIndex}-${lineIndex}`,
          d: pathFromLine(line, project),
          highway: String(feature.properties?.highway ?? feature.properties?.class ?? "")
        }))
        .filter((line) => line.d)
      )
    };
  }, []);

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[2] h-full w-full opacity-60 mix-blend-screen"
      preserveAspectRatio="none"
      viewBox="0 0 1000 620"
    >
      <defs>
        <filter id="roadGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.35" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g>
        {areas.map((area) => (
          <path
            d={area.d}
            fill={area.style.fill}
            fillOpacity={area.style.opacity}
            key={area.id}
            stroke={area.style.stroke}
            strokeOpacity="0.22"
            strokeWidth="0.5"
          />
        ))}
      </g>
      <g filter="url(#roadGlow)">
        {roads.map((road) => {
          const major = road.highway.includes("primary") || road.highway.includes("tertiary") || road.highway.includes("secondary");
          return (
            <path
              d={road.d}
              fill="none"
              key={road.id}
              stroke={major ? "#ffd787" : "#35d7c7"}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={major ? 0.72 : 0.38}
              strokeWidth={major ? 1.35 : 0.72}
            />
          );
        })}
      </g>
      <text fill="#8df0e5" fontSize="12" opacity="0.72" x="42" y="596">OSM 路网 186 features</text>
    </svg>
  );
}
