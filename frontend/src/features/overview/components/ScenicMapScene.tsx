import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import osmGeoJson from "../../../assets/geo/lingshan-osm.json";
import type { MapPoint } from "../../../types/domain";

type LayerId = MapPoint["layer"];
type Coordinate = [number, number];
type GeoFeature = {
  type?: string;
  geometry?: { type: string; coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][] };
  properties?: Record<string, unknown>;
};
type GeoJson = { type: "FeatureCollection"; features: GeoFeature[] };

interface ScenicMapSceneProps {
  points: MapPoint[];
  activeLayers: Record<LayerId, boolean>;
  selectedId?: string;
  onSelect: (point: MapPoint) => void;
  overlayOnly?: boolean;
}

const geoJson = osmGeoJson as unknown as GeoJson;

function isLineFeature(feature: GeoFeature) {
  return feature.geometry?.type === "LineString" || feature.geometry?.type === "MultiLineString";
}

function asLineStrings(feature: GeoFeature): Coordinate[][] {
  if (!feature.geometry) return [];
  if (feature.geometry.type === "LineString") return [feature.geometry.coordinates as Coordinate[]];
  if (feature.geometry.type === "MultiLineString") return feature.geometry.coordinates as Coordinate[][];
  return [];
}

function asPolygons(feature: GeoFeature): Coordinate[][][] {
  if (!feature.geometry) return [];
  if (feature.geometry.type === "Polygon") return [feature.geometry.coordinates as Coordinate[][]];
  if (feature.geometry.type === "MultiPolygon") return feature.geometry.coordinates as Coordinate[][][];
  return [];
}

function asPointCoordinates(feature: GeoFeature): Coordinate[] {
  if (!feature.geometry) return [];
  if (feature.geometry.type === "Point") return [feature.geometry.coordinates as unknown as Coordinate];
  if (feature.geometry.type === "MultiPoint") return feature.geometry.coordinates as Coordinate[];
  return [];
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
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

function shapeFromRings(rings: Coordinate[][], project: (coord: Coordinate) => number[]) {
  const outer = rings[0]?.filter(isCoordinate).map((coord) => project(coord));
  if (!outer || outer.length < 3) return undefined;

  const shape = new THREE.Shape();
  outer.forEach(([x, y], index) => {
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();

  rings.slice(1).forEach((ring) => {
    const holePoints = ring.filter(isCoordinate).map((coord) => project(coord));
    if (holePoints.length < 3) return;
    const hole = new THREE.Path();
    holePoints.forEach(([x, y], index) => {
      if (index === 0) hole.moveTo(x, y);
      else hole.lineTo(x, y);
    });
    hole.closePath();
    shape.holes.push(hole);
  });

  return shape;
}

function polygonStyle(feature: GeoFeature) {
  const className = String(feature.properties?.class ?? "");
  const natural = String(feature.properties?.natural ?? "");
  const landuse = String(feature.properties?.landuse ?? "");
  const leisure = String(feature.properties?.leisure ?? "");
  const tourism = String(feature.properties?.tourism ?? "");
  const building = String(feature.properties?.building ?? "");

  if (natural === "water" || className === "water") return { color: "#1b7775", opacity: 0.48, height: 0.006 };
  if (leisure === "park" || landuse === "grass" || className === "green") return { color: "#245f3d", opacity: 0.32, height: 0.012 };
  if (tourism === "attraction" || className === "poi") return { color: "#38d9ca", opacity: 0.24, height: 0.032 };
  if (building || className === "building") return { color: "#c69a58", opacity: 0.34, height: 0.024 };
  return { color: "#526f66", opacity: 0.18, height: 0.01 };
}

function toneColor(tone: MapPoint["tone"]) {
  if (tone === "danger") return "#ff6b5f";
  if (tone === "warning") return "#f0b84d";
  if (tone === "accent") return "#35d7c7";
  if (tone === "success") return "#7bd66f";
  return "#9fb8b4";
}

function createSceneProjector(features: GeoFeature[]) {
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
    const x = -5.4 + ((lon - min[0]) / Math.max(max[0] - min[0], 0.000001)) * 10.8;
    const y = -3.4 + (1 - (lat - min[1]) / Math.max(max[1] - min[1], 0.000001)) * 6.8;
    return [x, y];
  };
}

function SceneContent({ points, activeLayers, selectedId, onSelect, overlayOnly }: ScenicMapSceneProps) {
  const pulseRef = useRef<THREE.Group>(null);
  const flowRefs = useRef<THREE.Mesh[]>([]);
  const { camera } = useThree();

  const projection = useMemo(() => createSceneProjector(geoJson.features), []);
  const projectedPoints = useMemo(
    () =>
      points.map((point) => {
        const projected = projection([point.lon, point.lat]);
        return { ...point, sx: projected[0], sz: -projected[1] };
      }),
    [points, projection]
  );
  const selected = projectedPoints.find((point) => point.id === selectedId) ?? projectedPoints[0];

  const roads = useMemo(
    () =>
      geoJson.features.filter(isLineFeature).flatMap((feature) =>
        asLineStrings(feature)
          .filter((line) => line.length > 1)
          .map((line) => {
            const points = line.map((coord) => {
              const projected = projection(coord);
              return new THREE.Vector3(projected[0], 0.36, -projected[1]);
            });
            const roadType = String(feature.properties?.highway ?? feature.properties?.class ?? "");
            return { curve: new THREE.CatmullRomCurve3(points), roadType, segments: Math.max(points.length * 2, 4) };
          })
      ),
    [projection]
  );

  const flowRoads = useMemo(
    () =>
      roads
        .filter((road) => {
          const isFootway = road.roadType.includes("footway") || road.roadType.includes("path");
          return !isFootway && road.curve.points.length > 2;
        })
        .slice(0, 22)
        .map((road, index) => ({
          curve: road.curve,
          offset: (index * 0.137) % 1,
          speed: 0.035 + (index % 5) * 0.006,
          color: road.roadType.includes("primary") || road.roadType.includes("secondary") || road.roadType.includes("tertiary") ? "#ffd787" : "#35d7c7"
        })),
    [roads]
  );

  const areaLayers = useMemo(
    () =>
      geoJson.features.flatMap((feature, featureIndex) =>
        asPolygons(feature)
          .map((rings, polygonIndex) => {
            const shape = shapeFromRings(rings, projection);
            if (!shape) return undefined;
            return {
              id: `${featureIndex}-${polygonIndex}`,
              shape,
              style: polygonStyle(feature),
              name: String(feature.properties?.name ?? ""),
              className: String(feature.properties?.class ?? "")
            };
          })
          .filter(isDefined)
      ),
    [projection]
  );

  const osmPois = useMemo(
    () =>
      geoJson.features.flatMap((feature, featureIndex) =>
        asPointCoordinates(feature).map((coord, pointIndex) => {
          const projected = projection(coord);
          return {
            id: `${featureIndex}-${pointIndex}`,
            sx: projected[0],
            sz: -projected[1],
            name: String(feature.properties?.name ?? feature.properties?.tourism ?? feature.properties?.amenity ?? ""),
            kind: String(feature.properties?.tourism ?? feature.properties?.amenity ?? "")
          };
        })
      ),
    [projection]
  );

  useEffect(() => {
    if (!selected) return;
    gsap.to(camera.position, {
      x: selected.sx * 0.18,
      y: 6.7,
      z: selected.sz + 5.2,
      duration: 0.85,
      ease: "power3.out",
      onUpdate: () => camera.lookAt(selected.sx, 0, selected.sz)
    });
  }, [camera, selected]);

  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const scale = 1 + Math.sin(clock.elapsedTime * 2.2) * 0.055;
      pulseRef.current.scale.setScalar(scale);
    }
    flowRoads.forEach((road, index) => {
      const mesh = flowRefs.current[index];
      if (!mesh) return;
      const progress = (road.offset + clock.elapsedTime * road.speed) % 1;
      const point = road.curve.getPointAt(progress);
      mesh.position.set(point.x, point.y + 0.08, point.z);
      mesh.scale.setScalar(0.75 + Math.sin((progress + road.offset) * Math.PI * 2) * 0.18);
    });
  });

  if (overlayOnly) {
    return (
      <>
        <ambientLight intensity={0.8} />
        <directionalLight intensity={1.4} position={[3, 8, 5]} />
      </>
    );
  }

  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight intensity={2.4} position={[3, 8, 5]} />
      <group rotation={[0, 0, 0]}>
        {areaLayers.map((area) => (
          <mesh key={area.id} position={[0, area.style.height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <shapeGeometry args={[area.shape]} />
            <meshStandardMaterial
              color={area.style.color}
              depthWrite={false}
              emissive={area.className === "poi" ? area.style.color : "#000000"}
              emissiveIntensity={area.className === "poi" ? 0.16 : 0}
              metalness={0.02}
              opacity={area.style.opacity}
              roughness={0.85}
              side={THREE.DoubleSide}
              transparent
            />
          </mesh>
        ))}

        {roads.map((road, index) => {
          const isMajor = road.roadType.includes("primary") || road.roadType.includes("tertiary") || road.roadType.includes("secondary");
          const isFootway = road.roadType.includes("footway") || road.roadType.includes("path");
          return (
          <mesh key={`${road.roadType}-${index}`}>
            <tubeGeometry args={[road.curve, road.segments, isFootway ? 0.018 : isMajor ? 0.036 : 0.024, 8, false]} />
            <meshBasicMaterial
              color={isMajor ? "#ffd787" : "#35d7c7"}
              depthTest={false}
              depthWrite={false}
              opacity={isFootway ? 0.42 : isMajor ? 0.72 : 0.5}
              transparent
            />
          </mesh>
        )})}

        {(activeLayers.crowd || activeLayers.broadcast) &&
          flowRoads.map((road, index) => (
            <mesh
              key={`flow-${index}`}
              ref={(node) => {
                if (node) flowRefs.current[index] = node;
              }}
            >
              <sphereGeometry args={[0.045, 16, 10]} />
              <meshBasicMaterial color={road.color} depthTest={false} transparent opacity={0.86} />
            </mesh>
          ))}

        {osmPois.map((poi) => (
          <group key={poi.id} position={[poi.sx, 0.16, poi.sz]}>
            <mesh rotation={[0, Math.PI / 4, 0]}>
              <octahedronGeometry args={[poi.kind === "attraction" ? 0.07 : 0.045, 0]} />
              <meshStandardMaterial color={poi.kind === "attraction" ? "#f0b84d" : "#8df0e5"} emissive={poi.kind === "attraction" ? "#f0b84d" : "#35d7c7"} emissiveIntensity={0.35} roughness={0.4} />
            </mesh>
            {poi.name && poi.kind === "attraction" && (
              <Html center distanceFactor={7.8} position={[0, 0.22, 0]}>
                <span className="hidden whitespace-nowrap rounded-full border border-[#f0b84d]/30 bg-[#1a1711]/80 px-2 py-1 text-[10px] text-[#ffe2a3] shadow-[0_10px_24px_rgba(0,0,0,.24)] backdrop-blur sm:inline-block">
                  {poi.name}
                </span>
              </Html>
            )}
          </group>
        ))}

        <group ref={pulseRef}>
          {projectedPoints.filter((point) => activeLayers[point.layer]).map((point) => {
            const color = toneColor(point.tone);
            const selectedPoint = point.id === selectedId;
            return (
              <group key={point.id} position={[point.sx, 0.12, point.sz]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[selectedPoint ? 0.22 : 0.14, selectedPoint ? 0.42 : 0.31, 48]} />
                  <meshBasicMaterial color={color} transparent opacity={selectedPoint ? 0.5 : 0.28} side={THREE.DoubleSide} />
                </mesh>
                <mesh onClick={() => onSelect(point)}>
                  <sphereGeometry args={[selectedPoint ? 0.105 : 0.085, 24, 16]} />
                  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selectedPoint ? 0.75 : 0.32} roughness={0.35} />
                </mesh>
                {(selectedPoint || point.tone === "danger") && (
                  <Html center distanceFactor={6.6} position={[0, 0.32, 0]}>
                    <button
                      className="hidden min-w-[128px] cursor-pointer rounded-xl border border-white/15 bg-[#0b1c1d]/88 px-3 py-2 text-left text-white shadow-[0_12px_32px_rgba(0,0,0,.28)] backdrop-blur-md transition hover:border-[#35d7c7]/50 active:translate-y-px sm:block"
                      onClick={() => onSelect(point)}
                      type="button"
                    >
                      <strong className="block whitespace-nowrap text-xs">{point.name}</strong>
                      <small className="block whitespace-nowrap text-[10px] text-white/66">{point.summary}</small>
                    </button>
                  </Html>
                )}
              </group>
            );
          })}
        </group>
      </group>
      <OrbitControls enableDamping enablePan={false} maxDistance={10} minDistance={4.5} maxPolarAngle={Math.PI / 2.12} />
    </>
  );
}

export function ScenicMapScene(props: ScenicMapSceneProps) {
  return (
    <Canvas camera={{ position: [0, 6.8, 7.2], fov: 44 }} dpr={[1, 1.6]} gl={{ alpha: true, antialias: true }}>
      <SceneContent {...props} />
    </Canvas>
  );
}
