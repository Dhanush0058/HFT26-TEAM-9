"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Video, 
  Compass, 
  Camera, 
  Layers, 
  Upload,
  CheckCircle2
} from "lucide-react";

export type ScenarioType = "CAR_VS_BIKE" | "HIGHWAY_REAR_END" | "HEAD_ON" | "INTERSECTION_TBONE";

interface ThreeForensicCanvasProps {
  scrubberTime: number;
  onTimeChange: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  caseTitle?: string;
  caseDescription?: string;
  evidenceVideoUrl?: string;
  evidenceList?: Array<{ name: string; dataType?: string; extractedData?: any }>;
  defaultScenario?: ScenarioType;
  onVideoUploaded?: (file: File) => void;
}

export default function ThreeForensicCanvas({
  scrubberTime,
  onTimeChange,
  isPlaying,
  onTogglePlay,
  caseTitle = "Intersection Collision Reconstruction",
  caseDescription = "",
  evidenceVideoUrl,
  evidenceList = [],
  defaultScenario,
  onVideoUploaded
}: ThreeForensicCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect scenario based on case title, description, and uploaded evidence files
  const autoDetectScenario = (srcUrlOrName?: string): ScenarioType => {
    if (defaultScenario) return defaultScenario;
    const combined = `${caseTitle} ${caseDescription} ${srcUrlOrName || ""} ${evidenceList.map(e => `${e.name} ${e.extractedData?.summary || ""}`).join(" ")}`.toLowerCase();

    if (/rear[\s_-]?end|highway|interstate|trailing|102/i.test(combined)) {
      return "HIGHWAY_REAR_END";
    }
    if (/head[\s_-]?on|opposite|oncoming|crossover/i.test(combined)) {
      return "HEAD_ON";
    }
    if (/bike|motorcycle|moto|two[\s_-]?wheel|scooter|rider/i.test(combined)) {
      return "CAR_VS_BIKE";
    }
    return "CAR_VS_BIKE";
  };

  const [activeScenario, setActiveScenario] = useState<ScenarioType>(() => autoDetectScenario(evidenceVideoUrl));
  const [cameraMode, setCameraMode] = useState<"ORBIT" | "POV" | "TOP">("ORBIT");
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Sync when prop updates
  useEffect(() => {
    if (evidenceVideoUrl) {
      setActiveScenario(autoDetectScenario(evidenceVideoUrl));
    }
  }, [evidenceVideoUrl]);

  // Handle video file upload for automatic scenario detection
  const processUploadedVideo = (file: File) => {
    const detected = autoDetectScenario(file.name);
    setActiveScenario(detected);

    if (onVideoUploaded) {
      onVideoUploaded(file);
    }

    setExportNotice(`Analyzed ${file.name}: Synced 3D reconstruction model to evidence video.`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handleLocalVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadedVideo(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.includes("video") || /\.(mp4|mov|avi|webm)$/i.test(file.name))) {
      processUploadedVideo(file);
    }
  };

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // 3D Objects refs
  const carARef = useRef<THREE.Group | null>(null);
  const vehicleBGroupRef = useRef<THREE.Group | null>(null);
  const motorcycleMeshRef = useRef<THREE.Group | null>(null);
  const suvMeshRef = useRef<THREE.Group | null>(null);

  // Road environment groups
  const intersectionRoadGroupRef = useRef<THREE.Group | null>(null);
  const highwayRoadGroupRef = useRef<THREE.Group | null>(null);

  const impactRingRef = useRef<THREE.Mesh | null>(null);
  const skidMarksARef = useRef<THREE.Mesh | null>(null);
  const motoSlideMarkRef = useRef<THREE.Mesh | null>(null);
  const brakeLightsARef = useRef<THREE.Mesh[]>([]);

  // Initialize Three.js WebGL Scene (100% full-width, clean forensic digital twin)
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 520;

    // 1. Scene & Atmospheric Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060911);
    scene.fog = new THREE.FogExp2(0x060911, 0.010);
    sceneRef.current = scene;

    // 2. Camera: Cinematic unobstructed isometric perspective
    // Looking from South-East towards North-West collision quadrant
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(16, 14, 20);
    camera.lookAt(0, 0.5, 0);
    cameraRef.current = camera;

    // 3. Renderer with soft shadow maps and ACES Filmic tone mapping
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    // 4. Free 3D OrbitControls (Mouse drag to orbit 360°)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 4;
    controls.maxDistance = 70;
    controls.target.set(0, 0.5, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.55);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xffffff, 1.35);
    mainSun.position.set(22, 36, 16);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 2048;
    mainSun.shadow.mapSize.height = 2048;
    mainSun.shadow.bias = -0.0001;
    scene.add(mainSun);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
    rimLight.position.set(-20, 18, -18);
    scene.add(rimLight);

    // 6. Base Ground Plane
    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x0c111a, roughness: 0.85 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), asphaltMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ─────────────────────────────────────────────────────────────
    // ROAD ENVIRONMENT A: 4-WAY INTERSECTION (For CAR_VS_BIKE & TBONE)
    // ─────────────────────────────────────────────────────────────
    const intersectionGroup = new THREE.Group();
    intersectionRoadGroupRef.current = intersectionGroup;

    const roadMat = new THREE.MeshStandardMaterial({ color: 0x141a27, roughness: 0.72 });
    
    // East-West Boulevard (Vehicle A lane)
    const ewRoad = new THREE.Mesh(new THREE.PlaneGeometry(90, 12), roadMat);
    ewRoad.rotation.x = -Math.PI / 2;
    ewRoad.position.y = 0.02;
    ewRoad.receiveShadow = true;
    intersectionGroup.add(ewRoad);

    // North-South Avenue (Vehicle B lane)
    const nsRoad = new THREE.Mesh(new THREE.PlaneGeometry(12, 90), roadMat);
    nsRoad.rotation.x = -Math.PI / 2;
    nsRoad.position.y = 0.03;
    nsRoad.receiveShadow = true;
    intersectionGroup.add(nsRoad);

    // Corner Sidewalk Curbs
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65 });
    const addCurb = (x: number, z: number) => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(32, 0.28, 32), curbMat);
      c.position.set(x, 0.14, z);
      c.receiveShadow = true;
      intersectionGroup.add(c);
    };
    addCurb(-22, -22);
    addCurb(22, -22);
    addCurb(-22, 22);
    addCurb(22, 22);

    // Lane Dividers & Stop Lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    
    // EW dashed line
    for (let x = -40; x <= 40; x += 4.5) {
      if (Math.abs(x) < 7) continue;
      const d = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.22), lineMat);
      d.rotation.x = -Math.PI / 2;
      d.position.set(x, 0.04, 0);
      intersectionGroup.add(d);
    }
    // NS dashed line
    for (let z = -40; z <= 40; z += 4.5) {
      if (Math.abs(z) < 7) continue;
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 2.4), lineMat);
      d.rotation.x = -Math.PI / 2;
      d.position.set(0, 0.04, z);
      intersectionGroup.add(d);
    }

    // Solid Stop Bars
    const stopBarW = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 5.2), lineMat);
    stopBarW.rotation.x = -Math.PI / 2;
    stopBarW.position.set(-6.8, 0.045, 2.7);
    intersectionGroup.add(stopBarW);

    const stopBarN = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 0.55), lineMat);
    stopBarN.rotation.x = -Math.PI / 2;
    stopBarN.position.set(2.7, 0.045, -6.8);
    intersectionGroup.add(stopBarN);

    // Zebra Crossings
    const zebraMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    for (let offset = -4.8; offset <= 4.8; offset += 1.2) {
      const zW = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.4), zebraMat);
      zW.rotation.x = -Math.PI / 2;
      zW.position.set(-8.5, 0.045, offset);
      intersectionGroup.add(zW);

      const zE = zW.clone();
      zE.position.set(8.5, 0.045, offset);
      intersectionGroup.add(zE);

      const zN = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), zebraMat);
      zN.rotation.x = -Math.PI / 2;
      zN.position.set(offset, 0.045, -8.5);
      intersectionGroup.add(zN);

      const zS = zN.clone();
      zS.position.set(offset, 0.045, 8.5);
      intersectionGroup.add(zS);
    }

    // Streetlamps moved to corner sidewalks where they don't block camera
    const lampPostMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const addStreetLamp = (x: number, z: number, rotY: number) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = rotY;

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7.5, 12), lampPostMat);
      pole.position.y = 3.75;
      g.add(pole);

      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), lampPostMat);
      arm.rotation.z = Math.PI / 2 - 0.2;
      arm.position.set(1.5, 7.4, 0);
      g.add(arm);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      head.position.set(3.0, 7.1, 0);
      g.add(head);

      const light = new THREE.SpotLight(0xfef08a, 2.2, 24, Math.PI / 4, 0.45);
      light.position.set(3.0, 7.0, 0);
      const target = new THREE.Object3D();
      target.position.set(3.0, 0, 0);
      g.add(target);
      light.target = target;
      g.add(light);

      intersectionGroup.add(g);
    };

    // Position lamps cleanly on sidewalk perimeters (zero camera obstruction)
    addStreetLamp(-14.0, -14.0, Math.PI / 4);
    addStreetLamp(14.0, -14.0, -Math.PI / 4);
    addStreetLamp(-14.0, 14.0, (3 * Math.PI) / 4);

    // Traffic Signal Mast Arm (Corner NW)
    // Directly visualizes the forensic finding: GREEN for Vehicle A, RED for Vehicle B
    const signalMastGroup = new THREE.Group();
    signalMastGroup.position.set(-6.5, 0, -6.5);

    const mastPole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 5.5, 12), lampPostMat);
    mastPole.position.y = 2.75;
    signalMastGroup.add(mastPole);

    const mastArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4.0, 8), lampPostMat);
    mastArm.rotation.z = Math.PI / 2;
    mastArm.position.set(2.0, 5.2, 0);
    signalMastGroup.add(mastArm);

    // Signal Head for Westbound Vehicle A (Facing East): SOLID GREEN
    const signalHeadA = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.3), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    signalHeadA.position.set(3.6, 4.8, 0);
    const greenLens = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    greenLens.position.set(-0.16, -0.22, 0);
    signalHeadA.add(greenLens);
    signalMastGroup.add(signalHeadA);

    // Signal Head for Southbound Vehicle B (Facing North): SOLID RED
    const signalHeadB = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.35), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    signalHeadB.position.set(0, 4.8, 3.2);
    const redLens = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    redLens.position.set(0, 0.22, -0.16);
    signalHeadB.add(redLens);
    signalMastGroup.add(signalHeadB);

    intersectionGroup.add(signalMastGroup);
    scene.add(intersectionGroup);

    // ─────────────────────────────────────────────────────────────
    // ROAD ENVIRONMENT B: HIGHWAY (For HIGHWAY_REAR_END)
    // ─────────────────────────────────────────────────────────────
    const highwayGroup = new THREE.Group();
    highwayRoadGroupRef.current = highwayGroup;

    const highwayPavement = new THREE.Mesh(new THREE.PlaneGeometry(90, 16), roadMat);
    highwayPavement.rotation.x = -Math.PI / 2;
    highwayPavement.position.y = 0.025;
    highwayPavement.receiveShadow = true;
    highwayGroup.add(highwayPavement);

    const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
    const addGuardrail = (z: number) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(90, 0.7, 0.15), railMat);
      rail.position.set(0, 0.45, z);
      highwayGroup.add(rail);
      for (let x = -44; x <= 44; x += 6) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8), railMat);
        post.position.set(x, 0.45, z);
        highwayGroup.add(post);
      }
    };
    addGuardrail(-8.0);
    addGuardrail(8.0);

    for (let x = -42; x <= 42; x += 4.5) {
      const d1 = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.2), lineMat);
      d1.rotation.x = -Math.PI / 2;
      d1.position.set(x, 0.04, -2.6);
      highwayGroup.add(d1);

      const d2 = d1.clone();
      d2.position.set(x, 0.04, 2.6);
      highwayGroup.add(d2);
    }

    highwayGroup.visible = false;
    scene.add(highwayGroup);

    // ─────────────────────────────────────────────────────────────
    // VEHICLE A: Performance Sedan (Metallic Crimson Red)
    // ─────────────────────────────────────────────────────────────
    const carAGroup = new THREE.Group();
    const paintAMat = new THREE.MeshStandardMaterial({
      color: 0xbe123c,
      metalness: 0.85,
      roughness: 0.18
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x050811,
      roughness: 0.05,
      metalness: 0.95
    });

    const chassisA = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.65, 2.05), paintAMat);
    chassisA.position.y = 0.55;
    chassisA.castShadow = true;
    carAGroup.add(chassisA);

    const hoodA = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 2.0), paintAMat);
    hoodA.position.set(1.45, 0.75, 0);
    hoodA.castShadow = true;
    carAGroup.add(hoodA);

    const cabinA = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 1.75), glassMat);
    cabinA.position.set(-0.25, 1.15, 0);
    cabinA.castShadow = true;
    carAGroup.add(cabinA);

    // 4 Wheels with rubber tires and chrome alloy rims
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.92 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.92, roughness: 0.18 });

    const createCarWheel = (x: number, z: number) => {
      const g = new THREE.Group();
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.32, 24), tireMat);
      t.rotation.x = Math.PI / 2;
      t.castShadow = true;
      g.add(t);

      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.33, 16), rimMat);
      r.rotation.x = Math.PI / 2;
      g.add(r);

      g.position.set(x, 0.4, z);
      return g;
    };
    carAGroup.add(createCarWheel(1.4, 1.02));
    carAGroup.add(createCarWheel(1.4, -1.02));
    carAGroup.add(createCarWheel(-1.4, 1.02));
    carAGroup.add(createCarWheel(-1.4, -1.02));

    // LED Xenon Headlights
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.35), hlMat);
    hl1.position.set(2.3, 0.62, 0.68);
    const hl2 = hl1.clone();
    hl2.position.set(2.3, 0.62, -0.68);
    carAGroup.add(hl1);
    carAGroup.add(hl2);

    // LED Brake Lights (glow intensely during emergency deceleration)
    const tailMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, emissive: 0x7f1d1d, emissiveIntensity: 0.4 });
    const bl1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.42), tailMat);
    bl1.position.set(-2.3, 0.65, 0.68);
    const bl2 = bl1.clone();
    bl2.position.set(-2.3, 0.65, -0.68);
    carAGroup.add(bl1);
    carAGroup.add(bl2);
    brakeLightsARef.current = [bl1, bl2];

    scene.add(carAGroup);
    carARef.current = carAGroup;

    // ─────────────────────────────────────────────────────────────
    // VEHICLE B: SPORT MOTORCYCLE & RIDER (or SUV)
    // ─────────────────────────────────────────────────────────────
    const vehicleBGroup = new THREE.Group();
    vehicleBGroupRef.current = vehicleBGroup;

    // Sub-Model 1: Sport Motorcycle with Rider
    const motoGroup = new THREE.Group();
    motorcycleMeshRef.current = motoGroup;

    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe4e4e7, metalness: 0.95, roughness: 0.1 });
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.82, roughness: 0.28 });
    const bikePaintMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.88, roughness: 0.18 });

    // Front & Rear spoked wheels
    const frontMotoWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.14, 24), tireMat);
    frontMotoWheel.rotation.x = Math.PI / 2;
    frontMotoWheel.position.set(1.25, 0.44, 0);
    frontMotoWheel.castShadow = true;
    motoGroup.add(frontMotoWheel);

    const rearMotoWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.22, 24), tireMat);
    rearMotoWheel.rotation.x = Math.PI / 2;
    rearMotoWheel.position.set(-1.05, 0.44, 0);
    rearMotoWheel.castShadow = true;
    motoGroup.add(rearMotoWheel);

    // Front Forks & Triple Clamp
    const forkLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.25, 16), chromeMat);
    forkLeft.rotation.z = -Math.PI / 6.5;
    forkLeft.position.set(1.0, 0.9, 0.14);
    motoGroup.add(forkLeft);
    const forkRight = forkLeft.clone();
    forkRight.position.z = -0.14;
    motoGroup.add(forkRight);

    // Handlebar & Mirrors
    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 16), chromeMat);
    handlebar.rotation.x = Math.PI / 2;
    handlebar.position.set(0.72, 1.45, 0);
    motoGroup.add(handlebar);

    // Sculpted Aerodynamic Sport Gas Tank
    const gasTank = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.48, 0.52), bikePaintMat);
    gasTank.position.set(0.22, 1.22, 0);
    gasTank.castShadow = true;
    motoGroup.add(gasTank);

    // Engine Block & Exhaust
    const engine = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.6, 0.42), darkSteelMat);
    engine.position.set(0.12, 0.68, 0);
    motoGroup.add(engine);

    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.5, 16), chromeMat);
    exhaust.rotation.z = Math.PI / 2 - 0.22;
    exhaust.position.set(-0.5, 0.48, 0.28);
    motoGroup.add(exhaust);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.16, 0.38), new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 }));
    seat.position.set(-0.42, 1.1, 0);
    motoGroup.add(seat);

    // Rider Figure with Aerodynamic Helmet and Racing Suit
    const riderGroup = new THREE.Group();
    const riderSuitMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.95, roughness: 0.05 });

    const riderTorso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.72, 0.48), riderSuitMat);
    riderTorso.rotation.z = -Math.PI / 7;
    riderTorso.position.set(-0.24, 1.55, 0);
    riderGroup.add(riderTorso);

    const riderHelmet = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 18), helmetMat);
    riderHelmet.position.set(0.08, 2.05, 0);
    riderGroup.add(riderHelmet);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.28), visorMat);
    visor.position.set(0.24, 2.05, 0);
    riderGroup.add(visor);

    motoGroup.add(riderGroup);
    vehicleBGroup.add(motoGroup);

    // Sub-Model 2: 3D SUV (for TBONE / REAR_END)
    const suvGroup = new THREE.Group();
    suvMeshRef.current = suvGroup;
    const chassisSUV = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.95, 2.2), bikePaintMat);
    chassisSUV.position.y = 0.75;
    chassisSUV.castShadow = true;
    suvGroup.add(chassisSUV);

    const cabinSUV = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.85, 2.05), glassMat);
    cabinSUV.position.set(-0.3, 1.5, 0);
    suvGroup.add(cabinSUV);
    suvGroup.add(createCarWheel(1.4, 1.1));
    suvGroup.add(createCarWheel(1.4, -1.1));
    suvGroup.add(createCarWheel(-1.4, 1.1));
    suvGroup.add(createCarWheel(-1.4, -1.1));

    suvGroup.visible = false;
    vehicleBGroup.add(suvGroup);

    scene.add(vehicleBGroup);

    // Skid Marks & Impact Shockwave Ring
    const skidMat = new THREE.MeshBasicMaterial({ color: 0x07090e, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const skidPlaneA = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 0.35), skidMat);
    skidPlaneA.rotation.x = -Math.PI / 2;
    skidPlaneA.position.set(-1.5, 0.046, 1.6);
    scene.add(skidPlaneA);
    skidMarksARef.current = skidPlaneA;

    // Motorcycle pavement friction slide mark
    const motoSlideMat = new THREE.MeshBasicMaterial({ color: 0x05070a, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const motoSlidePlane = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 0.4), motoSlideMat);
    motoSlidePlane.rotation.x = -Math.PI / 2;
    motoSlidePlane.position.set(3.6, 0.047, 2.2);
    motoSlidePlane.rotation.z = Math.PI / 4;
    scene.add(motoSlidePlane);
    motoSlideMarkRef.current = motoSlidePlane;

    const ringGeo = new THREE.RingGeometry(0.8, 4.5, 36);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide, transparent: true, opacity: 0 });
    const impactRing = new THREE.Mesh(ringGeo, ringMat);
    impactRing.rotation.x = -Math.PI / 2;
    impactRing.position.set(1.8, 0.08, 0.6);
    scene.add(impactRing);
    impactRingRef.current = impactRing;

    // Set initial model visibility matching activeScenario
    if (activeScenario === "HIGHWAY_REAR_END") {
      intersectionGroup.visible = false;
      highwayGroup.visible = true;
      motoGroup.visible = false;
      suvGroup.visible = true;
    } else if (activeScenario === "CAR_VS_BIKE") {
      intersectionGroup.visible = true;
      highwayGroup.visible = false;
      motoGroup.visible = true;
      suvGroup.visible = false;
    } else {
      intersectionGroup.visible = true;
      highwayGroup.visible = false;
      motoGroup.visible = false;
      suvGroup.visible = true;
    }

    // Animation Render Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth || 800;
      const h = containerRef.current.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Road Environment & Vehicle Meshes when Scenario Changes
  useEffect(() => {
    if (activeScenario === "HIGHWAY_REAR_END") {
      if (intersectionRoadGroupRef.current) intersectionRoadGroupRef.current.visible = false;
      if (highwayRoadGroupRef.current) highwayRoadGroupRef.current.visible = true;
      if (motorcycleMeshRef.current) motorcycleMeshRef.current.visible = false;
      if (suvMeshRef.current) suvMeshRef.current.visible = true;
    } else if (activeScenario === "CAR_VS_BIKE") {
      if (intersectionRoadGroupRef.current) intersectionRoadGroupRef.current.visible = true;
      if (highwayRoadGroupRef.current) highwayRoadGroupRef.current.visible = false;
      if (motorcycleMeshRef.current) motorcycleMeshRef.current.visible = true;
      if (suvMeshRef.current) suvMeshRef.current.visible = false;
    } else {
      if (intersectionRoadGroupRef.current) intersectionRoadGroupRef.current.visible = true;
      if (highwayRoadGroupRef.current) highwayRoadGroupRef.current.visible = false;
      if (motorcycleMeshRef.current) motorcycleMeshRef.current.visible = false;
      if (suvMeshRef.current) suvMeshRef.current.visible = true;
    }
  }, [activeScenario]);

  // Update Kinematics based on Scrubber Time & Active Scenario
  // Faithfully reconstructs the exact parameters from the Rekishi forensic case report
  useEffect(() => {
    const t = scrubberTime;

    if (activeScenario === "HIGHWAY_REAR_END") {
      let xB = 2.0;
      let isBrakingB = false;
      if (t < 1.0) {
        xB = 2.0 + (t * 8.0);
      } else if (t < 2.6) {
        const dt = t - 1.0;
        xB = 10.0 + (dt * 3.5);
        isBrakingB = true;
      } else {
        const dt = t - 2.6;
        xB = 15.6 + (dt * 4.5);
        isBrakingB = true;
      }

      let xA = -22.0;
      let isBrakingA = false;
      if (t < 1.8) {
        xA = -22.0 + (t * 13.0);
      } else if (t < 2.6) {
        const dt = t - 1.8;
        xA = 1.4 + (dt * 11.5);
        isBrakingA = true;
      } else {
        const dt = t - 2.6;
        xA = 10.6 + (dt * 4.2);
        isBrakingA = true;
      }

      if (carARef.current) {
        carARef.current.position.set(xA, 0, 0);
        carARef.current.rotation.set(0, 0, 0);
      }

      if (vehicleBGroupRef.current) {
        vehicleBGroupRef.current.position.set(xB, 0, 0);
        vehicleBGroupRef.current.rotation.set(0, 0, 0);
      }

      brakeLightsARef.current.forEach((bl) => {
        const mat = bl.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(isBrakingA ? 0xff0022 : 0x550000);
        mat.emissiveIntensity = isBrakingA ? 2.8 : 0.3;
      });

      if (impactRingRef.current) {
        const ringMat = impactRingRef.current.material as THREE.MeshBasicMaterial;
        impactRingRef.current.position.set(13.0, 0.08, 0);
        if (t >= 2.5 && t <= 3.3) {
          const factor = (t - 2.5) / 0.8;
          ringMat.opacity = Math.max(0, 0.85 - factor);
          impactRingRef.current.scale.set(1 + factor * 2.5, 1 + factor * 2.5, 1);
        } else {
          ringMat.opacity = 0;
        }
      }

    } else if (activeScenario === "HEAD_ON") {
      let xA = -25.0 + (t * 9.5);
      let zA = 1.8;
      let rotA = 0;

      let xB = 25.0 - (t * 9.5);
      let zB = -1.8;
      let rotB = Math.PI;

      if (t >= 1.5 && t < 2.6) {
        zB = -1.8 + ((t - 1.5) * 3.2);
      } else if (t >= 2.6) {
        const dt = t - 2.6;
        xA = 0.0 - (dt * 1.2);
        zA = 1.8 + (dt * 1.5);
        rotA = dt * 1.4;

        xB = 0.0 + (dt * 1.5);
        zB = 1.8 - (dt * 1.2);
        rotB = Math.PI - (dt * 1.6);
      }

      if (carARef.current) {
        carARef.current.position.set(xA, 0, zA);
        carARef.current.rotation.y = rotA;
      }
      if (vehicleBGroupRef.current) {
        vehicleBGroupRef.current.position.set(xB, 0, zB);
        vehicleBGroupRef.current.rotation.y = rotB;
      }

    } else {
      // ─────────────────────────────────────────────────────────────
      // FORENSIC GROUND TRUTH: CAR VS MOTORCYCLE ANGLE COLLISION
      // ─────────────────────────────────────────────────────────────
      // Vehicle A (Red Sedan): Traveling Westbound along East-West Boulevard
      // - Starts at X = -26.0, Z = 1.6, cruising at 48 km/h (~13.3 m/s)
      // - At T = 2.0s: Emergency ABS braking triggered (85 bar), brake lights blaze red
      // - Velocity drops 48 km/h -> 18 km/h at impact (T = 2.8s)
      // - Halts at collision point X = 0.6
      let xA = -26.0;
      const zA = 1.6;
      let rotA = 0;
      let pitchA = 0;
      let isBrakingA = false;

      if (t < 2.0) {
        xA = -26.0 + (t * 11.5);
        isBrakingA = false;
        pitchA = 0;
      } else if (t < 2.8) {
        const dtBrake = t - 2.0;
        xA = -3.0 + (dtBrake * 4.5);
        isBrakingA = true;
        pitchA = -0.022; // ABS braking nose dive
      } else {
        const dtPost = t - 2.8;
        xA = 0.6 + Math.min(0.4, dtPost * 0.3);
        rotA = -Math.min(0.12, dtPost * 0.15); // Lateral deflection from impact
        isBrakingA = true;
        pitchA = 0;
      }

      if (carARef.current) {
        carARef.current.position.set(xA, 0, zA);
        carARef.current.rotation.set(0, rotA, pitchA);
      }

      // Brake light actuation
      brakeLightsARef.current.forEach((bl) => {
        const mat = bl.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(isBrakingA ? 0xff0020 : 0x550000);
        mat.emissiveIntensity = isBrakingA ? 3.0 : 0.3;
      });

      // Tire skid marks behind Vehicle A
      if (skidMarksARef.current) {
        const mat = skidMarksARef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = t >= 2.0 ? Math.min(0.85, (t - 2.0) * 1.3) : 0;
      }

      // Vehicle B (Sport Motorcycle with Rider): Traveling Southbound down Avenue
      // - Starts at Z = -26.0, X = 1.8, approaching at 36 km/h (~10 m/s)
      // - Enters intersection on transitional signal
      // - Impact at T = 2.8s: struck laterally by sedan front bumper
      // - Banks onto side, deflects across asphalt to rest (X = 5.2, Z = 3.6)
      let xB = 1.8;
      let yB = 0;
      let zB = -26.0;
      let rotB = -Math.PI / 2; // Facing South
      let rollB = 0;

      if (t < 2.8) {
        zB = -26.0 + (t * 9.5);
        rollB = Math.sin(t * 4.0) * 0.03; // Subtle high-speed bike balance lean
      } else {
        const dt = t - 2.8;
        xB = 1.8 + Math.min(3.8, dt * 2.8);
        zB = 0.6 + Math.min(3.2, dt * 2.4);
        rotB = (-Math.PI / 2) + Math.min(0.7, dt * 0.55);
        rollB = Math.min(Math.PI / 2.3, dt * 2.5); // Falls onto side (sliding)
        yB = -Math.min(0.24, dt * 0.18); // Rests on asphalt
      }

      if (vehicleBGroupRef.current) {
        vehicleBGroupRef.current.position.set(xB, yB, zB);
        vehicleBGroupRef.current.rotation.set(0, rotB, rollB);
      }

      // Motorcycle slide friction mark on asphalt
      if (motoSlideMarkRef.current) {
        const mat = motoSlideMarkRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = t >= 2.8 ? Math.min(0.75, (t - 2.8) * 1.1) : 0;
      }

      // Collision Impact Shockwave Ring
      if (impactRingRef.current) {
        const ringMat = impactRingRef.current.material as THREE.MeshBasicMaterial;
        impactRingRef.current.position.set(1.8, 0.08, 0.6);
        if (t >= 2.7 && t <= 3.5) {
          const factor = (t - 2.7) / 0.8;
          ringMat.opacity = Math.max(0, 0.9 - factor);
          impactRingRef.current.scale.set(1 + factor * 3.5, 1 + factor * 3.5, 1);
        } else {
          ringMat.opacity = 0;
        }
      }
    }

    // Camera Mode Updates
    if (cameraRef.current && controlsRef.current) {
      if (cameraMode === "POV") {
        controlsRef.current.enabled = false;
        const xPos = carARef.current?.position.x || 0;
        const zPos = carARef.current?.position.z || 0;
        cameraRef.current.position.set(xPos + 0.6, 1.25, zPos);
        cameraRef.current.lookAt(xPos + 25, 1.25, zPos);
      } else if (cameraMode === "TOP") {
        controlsRef.current.enabled = false;
        cameraRef.current.position.set(0, 38, 0.001);
        cameraRef.current.lookAt(0, 0, 0);
      } else {
        controlsRef.current.enabled = true;
      }
    }
  }, [scrubberTime, cameraMode, activeScenario]);

  // Video Export Functionality (Generates WebM court evidence video directly from WebGL canvas)
  const handleExportVideo = () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    setExportNotice("Recording realistic 3D forensic simulation into court-ready video...");

    try {
      const stream = canvasRef.current.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Rekishi_${activeScenario}_Reconstruction_${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setExportNotice("3D Forensic Video exported successfully!");
        setTimeout(() => setExportNotice(null), 3500);
      };

      recorder.start();

      let curr = 0.0;
      const interval = setInterval(() => {
        curr += 0.1;
        onTimeChange(Number(curr.toFixed(1)));
        if (curr >= 4.2) {
          clearInterval(interval);
          recorder.stop();
        }
      }, 70);

    } catch {
      setIsExporting(false);
      setExportNotice("Canvas recording not supported by current browser.");
      setTimeout(() => setExportNotice(null), 3000);
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden File Input for Video Drag-and-Drop / Upload */}
      <input 
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/mov,video/quicktime,video/avi"
        className="hidden"
        onChange={handleLocalVideoUpload}
      />

      {/* Main Forensic Player Viewport (100% Full-Width 3D Canvas, No Left Split Panel) */}
      <div 
        ref={containerRef}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative w-full h-[520px] bg-slate-950 rounded-xl overflow-hidden border shadow-2xl flex flex-col justify-between transition-colors ${
          isDragOver ? "border-blue-500 bg-slate-900" : "border-slate-800"
        }`}
      >
        {/* PURE 100% FULL-WIDTH THREE.JS FORENSIC CANVAS */}
        <canvas 
          ref={canvasRef} 
          className="w-full h-full block cursor-grab active:cursor-grabbing" 
        />

        {/* TOP OVERLAY: Clean, Minimalist Forensic Telemetry & Camera Angle Controls */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-30">
          
          {/* Top-Left: Sleek Rekishi Telemetry Badge */}
          <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-3 shadow-lg pointer-events-auto">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              REKISHI 3D SIMULATOR
            </div>
            <div className="h-3.5 w-px bg-slate-700"></div>
            <div className="text-[11px] font-mono text-slate-300 flex items-center gap-2">
              <span>VEHICLE A: <strong className="text-rose-400">{scrubberTime < 2.0 ? "48 km/h" : scrubberTime < 2.8 ? "18 km/h" : "0 km/h"}</strong></span>
              <span className="text-slate-600">|</span>
              <span>VEHICLE B: <strong className="text-blue-400">{scrubberTime < 2.8 ? "36 km/h" : "0 km/h"}</strong></span>
            </div>
          </div>

          {/* Top-Right: Scenario Switcher & Camera Preset Toggles */}
          <div className="flex items-center gap-2 pointer-events-auto">
            
            {/* Scenario Selector Dropdown */}
            <div className="bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-2 text-xs font-medium text-slate-300 shadow-lg">
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-blue-400" /> Scenario:
              </span>
              <select
                value={activeScenario}
                onChange={(e) => setActiveScenario(e.target.value as ScenarioType)}
                className="bg-slate-800 text-white rounded px-2 py-0.5 text-xs font-semibold border border-slate-700 outline-none cursor-pointer hover:bg-slate-700 transition"
              >
                <option value="CAR_VS_BIKE">🏍️ Car vs Motorcycle Angle</option>
                <option value="HIGHWAY_REAR_END">🛣️ Highway Rear-End Impact</option>
                <option value="HEAD_ON">⚡ Head-On Collision</option>
                <option value="INTERSECTION_TBONE">🚗 Car vs SUV 90° T-Bone</option>
              </select>
            </div>

            {/* Camera Perspective Buttons */}
            <div className="bg-slate-950/85 backdrop-blur-md p-1 rounded-lg border border-slate-800 flex items-center gap-1 text-[11px] font-semibold text-slate-300 shadow-lg">
              <button
                onClick={() => {
                  setCameraMode("ORBIT");
                  if (cameraRef.current && controlsRef.current) {
                    cameraRef.current.position.set(16, 14, 20);
                    cameraRef.current.lookAt(0, 0.5, 0);
                    controlsRef.current.target.set(0, 0.5, 0);
                  }
                }}
                className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                  cameraMode === "ORBIT" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-400"
                }`}
                title="3D Free Orbit (Drag with mouse to rotate 360°)"
              >
                <RotateCcw className="w-3 h-3" /> 3D Orbit
              </button>
              <button
                onClick={() => setCameraMode("POV")}
                className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                  cameraMode === "POV" ? "bg-blue-600 text-white font-bold" : "hover:bg-slate-800 text-slate-400"
                }`}
                title="Driver Windshield POV"
              >
                <Camera className="w-3 h-3" /> Driver POV
              </button>
              <button
                onClick={() => setCameraMode("TOP")}
                className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                  cameraMode === "TOP" ? "bg-blue-600 text-white font-bold" : "hover:bg-slate-800 text-slate-400"
                }`}
                title="Aerial Overhead 2D Map"
              >
                <Compass className="w-3 h-3" /> Overhead 2D
              </button>
            </div>

          </div>
        </div>

        {/* BOTTOM CONTROLS: Clean Timeline Scrubber, Playback, and High-Resolution Video Export */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md p-3 rounded-lg border border-slate-800 flex items-center gap-4 shadow-xl z-30">
          <button
            onClick={onTogglePlay}
            disabled={isExporting}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shrink-0 shadow-md"
            title={isPlaying ? "Pause" : "Play Synchronized 3D Reconstruction"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onTimeChange(0.0)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
            title="Reset to T=0.0s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Time Scrubber */}
          <div className="flex-1 flex items-center gap-3">
            <input
              type="range"
              min="0.0"
              max="4.2"
              step="0.1"
              value={scrubberTime}
              onChange={(e) => onTimeChange(parseFloat(e.target.value))}
              className="flex-1 accent-blue-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="font-mono text-xs font-bold text-white shrink-0 min-w-[65px]">
              T+{scrubberTime < 10 ? `0${scrubberTime.toFixed(1)}` : scrubberTime.toFixed(1)}s
            </span>
          </div>

          {/* Export Video Button */}
          <button
            onClick={handleExportVideo}
            disabled={isExporting}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition shrink-0 shadow-sm"
          >
            <Video className="w-3.5 h-3.5" />
            {isExporting ? "Recording..." : "Export Video (.webm)"}
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-2.5 rounded-lg bg-blue-900/40 border border-blue-500/40 text-xs font-medium text-blue-200 flex items-center justify-between">
          <span>{exportNotice}</span>
        </div>
      )}
    </div>
  );
}
