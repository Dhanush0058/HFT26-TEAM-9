import osmGachibowliSnapshot from "./osmGachibowliSnapshot.json";
import * as THREE from "three";

export interface BuildingFootprint {
  id: string;
  points: Array<{ x: number; z: number }>;
  height: number;
  color?: number;
}

export interface TreeFeature {
  id: string;
  x: number;
  z: number;
  scale: number;
}

export interface OsmEnvironmentData {
  centerLat: number;
  centerLon: number;
  source: "OVERPASS_LIVE" | "OPENSTREETMAP_RECONSTRUCTION" | "PROCEDURAL_SYNTHESIS";
  buildingsCount: number;
  treesCount: number;
  buildings: BuildingFootprint[];
  trees: TreeFeature[];
}

/**
 * Projects GPS lat/lon to local Cartesian meters centered at (centerLat, centerLon)
 */
export function gpsToLocalMeters(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number
): { x: number; z: number } {
  const latRad = (centerLat * Math.PI) / 180;
  // 1 degree latitude ~= 110,540 meters
  // 1 degree longitude ~= 111,320 * cos(latitude) meters
  const x = (lon - centerLon) * (111320 * Math.cos(latRad));
  const z = -(lat - centerLat) * 110540;
  return { x, z };
}

/**
 * Generates deterministic fallback procedural surroundings if Overpass API is unavailable
 */
export function generateProceduralOsmData(centerLat: number, centerLon: number): OsmEnvironmentData {
  const buildings: BuildingFootprint[] = [];
  const trees: TreeFeature[] = [];

  // Corner Blocks surrounding intersection (North-West, North-East, South-West, South-East)
  const blocks = [
    { xMin: -45, xMax: -14, zMin: -50, zMax: -14 }, // NW
    { xMin: 14, xMax: 45, zMin: -50, zMax: -14 },  // NE
    { xMin: -45, xMax: -14, zMin: 14, zMax: 50 },  // SW
    { xMin: 14, xMax: 45, zMin: 14, zMax: 50 },   // SE
  ];

  const colors = [0xdcd6cb, 0xd5cfc3, 0xded9cd, 0xdfdacf];

  blocks.forEach((block, bIdx) => {
    // 2-3 buildings per quadrant block
    const width = (block.xMax - block.xMin) * 0.42;
    const depth = (block.zMax - block.zMin) * 0.42;

    const b1Points = [
      { x: block.xMin, z: block.zMin },
      { x: block.xMin + width, z: block.zMin },
      { x: block.xMin + width, z: block.zMin + depth },
      { x: block.xMin, z: block.zMin + depth },
    ];
    buildings.push({
      id: `proc-bld-${bIdx}-1`,
      points: b1Points,
      height: 9 + ((bIdx * 3 + 2) % 11),
      color: colors[bIdx % colors.length]
    });

    const b2Points = [
      { x: block.xMin + width + 4, z: block.zMin + 2 },
      { x: block.xMax, z: block.zMin + 2 },
      { x: block.xMax, z: block.zMax - 4 },
      { x: block.xMin + width + 4, z: block.zMax - 4 },
    ];
    buildings.push({
      id: `proc-bld-${bIdx}-2`,
      points: b2Points,
      height: 7 + ((bIdx * 4 + 5) % 9),
      color: colors[(bIdx + 1) % colors.length]
    });
  });

  // Trees lining the roadway curbs and corner sidewalks
  const treeOffsets = [
    // Westbound sidewalk row
    { x: -35, z: -11 }, { x: -25, z: -11 }, { x: -16, z: -11 },
    { x: -35, z: 11 }, { x: -25, z: 11 }, { x: -16, z: 11 },
    // Eastbound sidewalk row
    { x: 16, z: -11 }, { x: 26, z: -11 }, { x: 36, z: -11 },
    { x: 16, z: 11 }, { x: 26, z: 11 }, { x: 36, z: 11 },
    // North/South avenue sidewalks
    { x: -11, z: -35 }, { x: -11, z: -25 }, { x: -11, z: -16 },
    { x: 11, z: -35 }, { x: 11, z: -25 }, { x: 11, z: -16 },
    { x: -11, z: 16 }, { x: -11, z: 26 }, { x: -11, z: 36 },
    { x: 11, z: 16 }, { x: 11, z: 26 }, { x: 11, z: 36 },
  ];

  treeOffsets.forEach((pos, idx) => {
    trees.push({
      id: `proc-tree-${idx}`,
      x: pos.x,
      z: pos.z,
      scale: 0.85 + ((idx % 4) * 0.12)
    });
  });

  return {
    centerLat,
    centerLon,
    source: "PROCEDURAL_SYNTHESIS",
    buildingsCount: buildings.length,
    treesCount: trees.length,
    buildings,
    trees
  };
}

/**
 * Queries OSM Overpass API for building footprints and tree vectors, with reliable fallback
 */
export async function fetchOsmSurroundings(
  centerLat: number,
  centerLon: number
): Promise<OsmEnvironmentData> {
  // Directly load real OpenStreetMap geometry for Gachibowli ORR junction corridor
  const isGachibowli = Math.abs(centerLat - 17.440598) < 0.08 && Math.abs(centerLon - 78.360779) < 0.08;
  if (isGachibowli && osmGachibowliSnapshot) {
    return {
      ...(osmGachibowliSnapshot as unknown as OsmEnvironmentData),
      centerLat,
      centerLon,
      source: "OPENSTREETMAP_RECONSTRUCTION"
    };
  }
  const delta = 0.0012; // ~130 meter radius bounding box
  const bbox = `${centerLat - delta},${centerLon - delta},${centerLat + delta},${centerLon + delta}`;
  const overpassQuery = `[out:json][timeout:4];(way["building"](${bbox});node["natural"="tree"](${bbox}););out body;>;out skel qt;`;
  
  // Fast French Overpass API mirror (https://openstreetmap.fr) with resilient fallbacks
  const endpoints = [
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter"
  ];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        },
        body: `data=${encodeURIComponent(overpassQuery)}`
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;
      const data = await res.json();
      const elements = data.elements || [];

      // Node lookup map
      const nodeMap = new Map<number, { lat: number; lon: number }>();
      elements.forEach((el: { id: number; type: string; lat?: number; lon?: number }) => {
        if (el.type === "node" && typeof el.lat === "number" && typeof el.lon === "number") {
          nodeMap.set(el.id, { lat: el.lat, lon: el.lon });
        }
      });

      const buildings: BuildingFootprint[] = [];
      const trees: TreeFeature[] = [];

      elements.forEach((el: { id: number; type: string; tags?: Record<string, string>; nodes?: number[]; lat?: number; lon?: number }) => {
        if (el.type === "way" && el.tags?.building && el.nodes && el.nodes.length >= 3) {
          const points: Array<{ x: number; z: number }> = [];
          el.nodes.forEach((nId) => {
            const coords = nodeMap.get(nId);
            if (coords) {
              const local = gpsToLocalMeters(coords.lat, coords.lon, centerLat, centerLon);
              // Filter to within 75m of the intersection
              if (Math.abs(local.x) < 75 && Math.abs(local.z) < 75) {
                points.push(local);
              }
            }
          });

          if (points.length >= 3) {
            let height = 8;
            if (el.tags["building:levels"]) {
              height = Math.max(4, parseFloat(el.tags["building:levels"]) * 3.2);
            } else if (el.tags.height) {
              height = Math.max(4, parseFloat(el.tags.height));
            }
            buildings.push({
              id: `osm-bld-${el.id}`,
              points,
              height
            });
          }
        } else if (el.type === "node" && el.tags?.natural === "tree" && typeof el.lat === "number" && typeof el.lon === "number") {
          const local = gpsToLocalMeters(el.lat, el.lon, centerLat, centerLon);
          if (Math.abs(local.x) < 70 && Math.abs(local.z) < 70) {
            trees.push({
              id: `osm-tree-${el.id}`,
              x: local.x,
              z: local.z,
              scale: 1.0
            });
          }
        }
      });

      if (buildings.length > 0 || trees.length > 0) {
        return {
          centerLat,
          centerLon,
          source: "OVERPASS_LIVE",
          buildingsCount: buildings.length,
          treesCount: trees.length,
          buildings,
          trees
        };
      }
    } catch {
      // try next endpoint or fallback
    }
  }

  // Fallback to high-fidelity procedural generation if Overpass is unreachable
  return generateProceduralOsmData(centerLat, centerLon);
}

/**
 * Builds 3D Meshes from OSM Environment Data using Three.js ExtrudeGeometry and Low-Poly Primitives
 */
export function createProceduralEnvironmentGroup(data: OsmEnvironmentData): THREE.Group {
  const group = new THREE.Group();
  group.name = "OSM_ENVIRONMENT_GROUP";

  // Warm architectural limestone / beige palette matching reference schematic
  const defaultBldMat = new THREE.MeshStandardMaterial({
    color: 0xdcd6cb,
    roughness: 0.85,
    metalness: 0.04
  });

  const roofCapMat = new THREE.MeshStandardMaterial({
    color: 0xede8df,
    roughness: 0.9,
    metalness: 0.02
  });

  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x374151,
    roughness: 0.7
  });

  // Pure rectangular architectural trees (tall box canopy + box trunk)
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x5c3c26,
    roughness: 0.92
  });

  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    roughness: 0.55
  });

  // 1. Extrude Buildings with architectural roof parapet caps and door cutouts
  data.buildings.forEach((bld) => {
    if (bld.points.length < 3) return;

    try {
      const shape = new THREE.Shape();
      shape.moveTo(bld.points[0].x, -bld.points[0].z);
      for (let i = 1; i < bld.points.length; i++) {
        shape.lineTo(bld.points[i].x, -bld.points[i].z);
      }
      shape.closePath();

      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: bld.height,
        bevelEnabled: true,
        bevelThickness: 0.15,
        bevelSize: 0.15,
        bevelSegments: 1
      };

      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geom.rotateX(-Math.PI / 2);

      const mat = bld.color
        ? new THREE.MeshStandardMaterial({ color: bld.color, roughness: 0.85, metalness: 0.04 })
        : defaultBldMat;

      const mesh = new THREE.Mesh(geom, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      // Inset roof top cap
      const roofSettings: THREE.ExtrudeGeometryOptions = {
        depth: 0.25,
        bevelEnabled: false
      };
      const roofGeom = new THREE.ExtrudeGeometry(shape, roofSettings);
      roofGeom.rotateX(-Math.PI / 2);
      roofGeom.translate(0, bld.height, 0);
      const roofMesh = new THREE.Mesh(roofGeom, roofCapMat);
      roofMesh.castShadow = true;
      roofMesh.receiveShadow = true;
      group.add(roofMesh);

      // Recessed doorway accent for procedural buildings facing the road
      if (bld.points.length >= 2) {
        const p1 = bld.points[0];
        const p2 = bld.points[1];
        const midX = (p1.x + p2.x) / 2;
        const midZ = (p1.z + p2.z) / 2;
        const door = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.2), doorMat);
        door.position.set(midX, 1.1, midZ);
        door.castShadow = true;
        group.add(door);
      }
    } catch {
      // Skip degenerate polygon gracefully
    }
  });

  // 2. Spawn 100% Pure Rectangular Architectural Trees (Box Trunk + Box Canopy)
  const trunkGeom = new THREE.BoxGeometry(0.32, 1.4, 0.32);
  trunkGeom.translate(0, 0.7, 0);

  const foliageGeom = new THREE.BoxGeometry(1.15, 2.6, 1.15);
  foliageGeom.translate(0, 2.7, 0);

  data.trees.forEach((t) => {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(t.x, 0, t.z);
    treeGroup.scale.set(t.scale, t.scale, t.scale);

    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    const foliage = new THREE.Mesh(foliageGeom, foliageMat);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    treeGroup.add(foliage);

    group.add(treeGroup);
  });

  return group;
}

/**
 * CatmullRomCurve3 Spline Trajectory Tracks for Vehicles
 */
export interface VehicleSplineTracks {
  splineA: THREE.CatmullRomCurve3;
  splineB: THREE.CatmullRomCurve3;
  speedAAt: (t: number) => number;
  speedBAt: (t: number) => number;
  brakeAAt: (t: number) => boolean;
}

export function buildScenarioSplineTracks(scenario: string): VehicleSplineTracks {
  if (scenario === "CAR_VS_LORRY") {
    // Car moves westbound along highway; Lorry crosses from north side-junction
    const splineA = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-28.0, 0, 1.6),
      new THREE.Vector3(-14.0, 0, 1.6),
      new THREE.Vector3(0.0, 0, 1.6),   // Braking zone
      new THREE.Vector3(1.6, 0, 1.6),   // Impact Apex
      new THREE.Vector3(4.8, 0, 2.4),   // Post-collision deflection
    ]);

    const splineB = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.6, 0, -28.0),
      new THREE.Vector3(1.6, 0, -14.0),
      new THREE.Vector3(1.6, 0, 0.0),
      new THREE.Vector3(1.6, 0, 1.6),   // Impact Apex
      new THREE.Vector3(1.8, 0, 4.2),   // Post-collision slide
    ]);

    return {
      splineA,
      splineB,
      speedAAt: (t) => (t < 2.0 ? 48 : t < 2.7 ? 18 : 0),
      speedBAt: (t) => (t < 2.7 ? 32 : 0),
      brakeAAt: (t) => t >= 1.9 && t <= 2.7
    };
  } else if (scenario === "HIGHWAY_REAR_END") {
    // Both vehicles travelling in tandem along same lane; rear vehicle impacts lead vehicle
    const splineA = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-25.0, 0, 0),
      new THREE.Vector3(-10.0, 0, 0),
      new THREE.Vector3(4.0, 0, 0),
      new THREE.Vector3(11.0, 0, 0),    // Rear-end collision point
      new THREE.Vector3(16.5, 0, 0),
    ]);

    const splineB = new THREE.CatmullRomCurve3([
      new THREE.Vector3(2.0, 0, 0),
      new THREE.Vector3(8.0, 0, 0),
      new THREE.Vector3(10.5, 0, 0),
      new THREE.Vector3(11.0, 0, 0),    // Lead car impacted
      new THREE.Vector3(18.0, 0, 0),
    ]);

    return {
      splineA,
      splineB,
      speedAAt: (t) => (t < 1.8 ? 54 : t < 2.6 ? 26 : 0),
      speedBAt: (t) => (t < 1.2 ? 38 : t < 2.6 ? 12 : 0),
      brakeAAt: (t) => t >= 1.8
    };
  } else {
    // CAR_VS_BIKE / INTERSECTION_TBONE (Angle crossing)
    const splineA = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-26.0, 0, 1.6),
      new THREE.Vector3(-12.0, 0, 1.6),
      new THREE.Vector3(0.0, 0, 1.6),
      new THREE.Vector3(1.6, 0, 1.6),   // Impact
      new THREE.Vector3(5.2, 0, 2.2),
    ]);

    const splineB = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.6, 0, -25.0),
      new THREE.Vector3(1.6, 0, -10.0),
      new THREE.Vector3(1.6, 0, 0.5),
      new THREE.Vector3(1.6, 0, 1.6),   // Impact
      new THREE.Vector3(3.6, 0, 5.0),
    ]);

    return {
      splineA,
      splineB,
      speedAAt: (t) => (t < 2.0 ? 46 : t < 2.7 ? 16 : 0),
      speedBAt: (t) => (t < 2.7 ? 36 : 0),
      brakeAAt: (t) => t >= 1.9 && t <= 2.7
    };
  }
}

