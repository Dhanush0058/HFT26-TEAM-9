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
  SplitSquareHorizontal, 
  Upload,
  Eye,
  CheckCircle2
} from "lucide-react";

export type ScenarioType = "CAR_VS_BIKE" | "HIGHWAY_REAR_END" | "HEAD_ON" | "INTERSECTION_TBONE";
export type VisualLayoutMode = "3D_ONLY" | "SPLIT_VIEW" | "PIP_VIEW";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect scenario based on case title, description, and uploaded evidence files
  const autoDetectScenario = (srcUrl?: string): ScenarioType => {
    if (defaultScenario) return defaultScenario;
    const combined = `${caseTitle} ${caseDescription} ${srcUrl || ""} ${evidenceList.map(e => `${e.name} ${e.extractedData?.summary || ""}`).join(" ")}`.toLowerCase();

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
  const [layoutMode, setLayoutMode] = useState<VisualLayoutMode>(evidenceVideoUrl ? "SPLIT_VIEW" : "3D_ONLY");
  const [cameraMode, setCameraMode] = useState<"ORBIT" | "POV" | "TOP">("ORBIT");
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string | null>(evidenceVideoUrl || null);
  const [videoLoadedName, setVideoLoadedName] = useState<string | null>(evidenceVideoUrl ? "Evidence Video Source" : null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Sync when props change
  useEffect(() => {
    if (evidenceVideoUrl && evidenceVideoUrl !== currentVideoSrc) {
      setCurrentVideoSrc(evidenceVideoUrl);
      setVideoLoadedName("Uploaded Evidence Video");
      setLayoutMode("SPLIT_VIEW");
      setActiveScenario(autoDetectScenario(evidenceVideoUrl));
    }
  }, [evidenceVideoUrl]);

  // Handle local video file upload directly on canvas
  const handleLocalVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const blobUrl = URL.createObjectURL(file);
    setCurrentVideoSrc(blobUrl);
    setVideoLoadedName(file.name);
    setLayoutMode("SPLIT_VIEW");

    // Auto-detect scenario from uploaded video filename
    const detected = autoDetectScenario(file.name);
    setActiveScenario(detected);

    if (onVideoUploaded) {
      onVideoUploaded(file);
    }

    setExportNotice(`Loaded video: ${file.name}. Synchronizing 3D kinematics to video stream.`);
    setTimeout(() => setExportNotice(null), 3500);
  };

  // Sync HTML5 Video playback with scrubberTime & isPlaying
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    // Check drift between video currentTime and scrubberTime
    const diff = Math.abs(video.currentTime - scrubberTime);
    if (diff > 0.25) {
      video.currentTime = Math.min(video.duration, scrubberTime);
    }
  }, [scrubberTime]);

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
  const skidMarksBRef = useRef<THREE.Mesh | null>(null);
  const brakeLightsARef = useRef<THREE.Mesh[]>([]);

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = canvasRef.current.parentElement?.clientWidth || 800;
    const height = canvasRef.current.parentElement?.clientHeight || 470;

    // 1. Scene & Atmospheric Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060911);
    scene.fog = new THREE.FogExp2(0x060911, 0.011);
    sceneRef.current = scene;

    // 2. Camera: Angled 3D Isometric View by Default
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(22, 14, 24);
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
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // 4. Free 3D OrbitControls (Mouse drag to orbit 360°)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 4;
    controls.maxDistance = 65;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.45);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xffffff, 1.25);
    mainSun.position.set(20, 35, 18);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 2048;
    mainSun.shadow.mapSize.height = 2048;
    mainSun.shadow.bias = -0.0001;
    scene.add(mainSun);

    const blueRim = new THREE.DirectionalLight(0x38bdf8, 0.45);
    blueRim.position.set(-20, 15, -18);
    scene.add(blueRim);

    // 6. Base Ground Plane
    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x0f1522, roughness: 0.82 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), asphaltMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ─────────────────────────────────────────────────────────────
    // ROAD LAYOUT A: 4-WAY INTERSECTION (For CAR_VS_BIKE & TBONE)
    // ─────────────────────────────────────────────────────────────
    const intersectionGroup = new THREE.Group();
    intersectionRoadGroupRef.current = intersectionGroup;

    const roadMat = new THREE.MeshStandardMaterial({ color: 0x161d2d, roughness: 0.72 });
    const ewRoad = new THREE.Mesh(new THREE.PlaneGeometry(84, 11), roadMat);
    ewRoad.rotation.x = -Math.PI / 2;
    ewRoad.position.y = 0.02;
    ewRoad.receiveShadow = true;
    intersectionGroup.add(ewRoad);

    const nsRoad = new THREE.Mesh(new THREE.PlaneGeometry(11, 84), roadMat);
    nsRoad.rotation.x = -Math.PI / 2;
    nsRoad.position.y = 0.03;
    nsRoad.receiveShadow = true;
    intersectionGroup.add(nsRoad);

    // Curbs on 4 quadrants
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65 });
    const addCurb = (x: number, z: number) => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(28, 0.3, 28), curbMat);
      c.position.set(x, 0.15, z);
      c.receiveShadow = true;
      intersectionGroup.add(c);
    };
    addCurb(-20, -20);
    addCurb(20, -20);
    addCurb(-20, 20);
    addCurb(20, 20);

    // Lane Dividers & Zebra Crossings
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    for (let x = -38; x <= 38; x += 4.5) {
      if (Math.abs(x) < 6) continue;
      const d = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.22), lineMat);
      d.rotation.x = -Math.PI / 2;
      d.position.set(x, 0.04, 0);
      intersectionGroup.add(d);
    }
    for (let z = -38; z <= 38; z += 4.5) {
      if (Math.abs(z) < 6) continue;
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 2.4), lineMat);
      d.rotation.x = -Math.PI / 2;
      d.position.set(0, 0.04, z);
      intersectionGroup.add(d);
    }

    const zebraMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    for (let offset = -4.5; offset <= 4.5; offset += 1.2) {
      const zW = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 2.6), zebraMat);
      zW.rotation.x = -Math.PI / 2;
      zW.position.set(-7.5, 0.045, offset);
      intersectionGroup.add(zW);

      const zE = zW.clone();
      zE.position.set(7.5, 0.045, offset);
      intersectionGroup.add(zE);

      const zN = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.55), zebraMat);
      zN.rotation.x = -Math.PI / 2;
      zN.position.set(offset, 0.045, -7.5);
      intersectionGroup.add(zN);

      const zS = zN.clone();
      zS.position.set(offset, 0.045, 7.5);
      intersectionGroup.add(zS);
    }

    // Streetlamp Posts with Light Cones
    const lampPostMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const addStreetLamp = (x: number, z: number, rotY: number) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = rotY;

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7.5, 12), lampPostMat);
      pole.position.y = 3.75;
      g.add(pole);

      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.0, 8), lampPostMat);
      arm.rotation.z = Math.PI / 2 - 0.2;
      arm.position.set(1.4, 7.4, 0);
      g.add(arm);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      head.position.set(2.8, 7.1, 0);
      g.add(head);

      const light = new THREE.SpotLight(0xfef08a, 2.4, 22, Math.PI / 4, 0.4);
      light.position.set(2.8, 7.0, 0);
      const target = new THREE.Object3D();
      target.position.set(2.8, 0, 0);
      g.add(target);
      light.target = target;
      g.add(light);

      intersectionGroup.add(g);
    };
    addStreetLamp(-7.0, -7.0, Math.PI / 4);
    addStreetLamp(7.0, -7.0, -Math.PI / 4);
    addStreetLamp(-7.0, 7.0, (3 * Math.PI) / 4);
    addStreetLamp(7.0, 7.0, -(3 * Math.PI) / 4);

    scene.add(intersectionGroup);

    // ─────────────────────────────────────────────────────────────
    // ROAD LAYOUT B: MULTI-LANE HIGHWAY (For HIGHWAY_REAR_END)
    // ─────────────────────────────────────────────────────────────
    const highwayGroup = new THREE.Group();
    highwayRoadGroupRef.current = highwayGroup;

    const highwayPavement = new THREE.Mesh(new THREE.PlaneGeometry(90, 16), roadMat);
    highwayPavement.rotation.x = -Math.PI / 2;
    highwayPavement.position.y = 0.025;
    highwayPavement.receiveShadow = true;
    highwayGroup.add(highwayPavement);

    // Guardrails
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

    // 3-Lane Highway Dashed Lines
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

    // 4 Wheels
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

    // LED Brake Lights
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

    const forkLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.25, 16), chromeMat);
    forkLeft.rotation.z = -Math.PI / 6.5;
    forkLeft.position.set(1.0, 0.9, 0.14);
    motoGroup.add(forkLeft);
    const forkRight = forkLeft.clone();
    forkRight.position.z = -0.14;
    motoGroup.add(forkRight);

    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 16), chromeMat);
    handlebar.rotation.x = Math.PI / 2;
    handlebar.position.set(0.72, 1.45, 0);
    motoGroup.add(handlebar);

    const gasTank = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.48, 0.52), bikePaintMat);
    gasTank.position.set(0.22, 1.22, 0);
    gasTank.castShadow = true;
    motoGroup.add(gasTank);

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

    // Rider Figure
    const riderGroup = new THREE.Group();
    const riderSuitMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });

    const riderTorso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.72, 0.48), riderSuitMat);
    riderTorso.rotation.z = -Math.PI / 7;
    riderTorso.position.set(-0.24, 1.55, 0);
    riderGroup.add(riderTorso);

    const riderHelmet = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 18), helmetMat);
    riderHelmet.position.set(0.08, 2.05, 0);
    riderGroup.add(riderHelmet);

    motoGroup.add(riderGroup);
    vehicleBGroup.add(motoGroup);

    // Sub-Model 2: 3D SUV
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

    // Skid Marks & Shockwave Ring
    const skidMat = new THREE.MeshBasicMaterial({ color: 0x07090e, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const skidPlaneA = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 0.3), skidMat);
    skidPlaneA.rotation.x = -Math.PI / 2;
    skidPlaneA.position.set(-0.5, 0.046, 0.85);
    scene.add(skidPlaneA);
    skidMarksARef.current = skidPlaneA;

    const ringGeo = new THREE.RingGeometry(0.8, 4.5, 36);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide, transparent: true, opacity: 0 });
    const impactRing = new THREE.Mesh(ringGeo, ringMat);
    impactRing.rotation.x = -Math.PI / 2;
    impactRing.position.set(1.5, 0.08, 1.5);
    scene.add(impactRing);
    impactRingRef.current = impactRing;

    // Animation Loop
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
      if (!canvasRef.current || !renderer || !camera) return;
      const w = canvasRef.current.parentElement?.clientWidth || 800;
      const h = canvasRef.current.parentElement?.clientHeight || 470;
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
  }, [layoutMode]);

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
      // CAR_VS_BIKE or TBONE
      let xA = -25.0;
      let zA = 1.75;
      let rotA = 0;
      let isBrakingA = false;

      if (t < 2.0) {
        xA = -25.0 + (t * 11.5);
        isBrakingA = false;
      } else if (t < 2.8) {
        xA = -2.0 + ((t - 2.0) * 4.375);
        isBrakingA = true;
      } else {
        const dt = t - 2.8;
        xA = 1.5 + (dt * 1.5);
        zA = 1.75 + (dt * 0.7);
        rotA = -dt * 0.35;
        isBrakingA = true;
      }

      if (carARef.current) {
        carARef.current.position.set(xA, 0, zA);
        carARef.current.rotation.y = rotA;
      }

      brakeLightsARef.current.forEach((bl) => {
        const mat = bl.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(isBrakingA ? 0xff0022 : 0x550000);
        mat.emissiveIntensity = isBrakingA ? 2.8 : 0.3;
      });

      if (skidMarksARef.current) {
        const mat = skidMarksARef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = t >= 2.0 ? Math.min(0.85, (t - 2.0) * 1.2) : 0;
      }

      let xB = 1.75;
      let zB = -25.0;
      let rotB = Math.PI / 2;
      let bankRoll = 0;

      if (t < 2.8) {
        zB = -25.0 + (t * 9.1);
        bankRoll = Math.sin(t * 3.5) * 0.04;
      } else {
        const dt = t - 2.8;
        xB = 1.75 + (dt * 1.8);
        zB = 0.5 + (dt * 2.1);
        rotB = (Math.PI / 2) + (dt * 0.45);
        bankRoll = Math.min(Math.PI / 2.2, dt * 1.3);
      }

      if (vehicleBGroupRef.current) {
        vehicleBGroupRef.current.position.set(xB, 0, zB);
        vehicleBGroupRef.current.rotation.y = rotB;
        vehicleBGroupRef.current.rotation.z = bankRoll;
      }

      if (impactRingRef.current) {
        const ringMat = impactRingRef.current.material as THREE.MeshBasicMaterial;
        impactRingRef.current.position.set(1.5, 0.08, 1.5);
        if (t >= 2.6 && t <= 3.5) {
          const factor = (t - 2.6) / 0.9;
          ringMat.opacity = Math.max(0, 0.9 - factor);
          impactRingRef.current.scale.set(1 + factor * 3.2, 1 + factor * 3.2, 1);
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

  // Video Export Functionality
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
        setExportNotice("3D Video exported successfully!");
        setTimeout(() => setExportNotice(null), 3000);
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
    <div className="space-y-4">
      {/* Hidden File Input for Direct Video Upload */}
      <input 
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/mov,video/quicktime,video/avi"
        className="hidden"
        onChange={handleLocalVideoUpload}
      />

      {/* Main Forensic Player Viewport */}
      <div 
        ref={containerRef}
        className="relative w-full h-[510px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between"
      >
        {/* VIEWPORT BODY: Split Screen or 3D Only */}
        <div className="relative w-full h-full flex flex-1 overflow-hidden">
          
          {/* LEFT PANE: Actual Uploaded Video (Ground Truth with YOLO Bounding Boxes) */}
          {(layoutMode === "SPLIT_VIEW" || layoutMode === "PIP_VIEW") && currentVideoSrc && (
            <div 
              className={`relative bg-black border-r border-slate-800 transition-all flex flex-col justify-between ${
                layoutMode === "SPLIT_VIEW" 
                  ? "w-1/2 h-full z-10" 
                  : "absolute bottom-16 left-3 w-64 h-36 rounded-lg overflow-hidden border border-blue-500 shadow-2xl z-20"
              }`}
            >
              {/* Actual Video Tag playing the User's Video */}
              <video
                ref={videoRef}
                src={currentVideoSrc}
                playsInline
                muted
                className="w-full h-full object-contain"
              />

              {/* YOLO Real-time AI Tracking Overlay */}
              <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono bg-blue-600/90 text-white px-2 py-0.5 rounded font-bold shadow flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    GROUND TRUTH OPTICAL STREAM
                  </span>
                  <span className="text-[10px] font-mono bg-slate-900/90 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    YOLOv8 DETECTIONS ACTIVE
                  </span>
                </div>

                {/* Dynamic Bounding Box Overlay for Vehicles */}
                <div className="relative w-full h-24 pointer-events-none">
                  {/* Vehicle A (Car) Bounding Box */}
                  <div 
                    className="absolute border-2 border-emerald-400 bg-emerald-500/10 rounded px-1 text-[9px] font-mono font-bold text-emerald-300 transition-all duration-100"
                    style={{
                      left: `${Math.min(70, 20 + scrubberTime * 12)}%`,
                      top: "20%",
                      width: "90px",
                      height: "55px"
                    }}
                  >
                    🚗 car: 98.4%
                  </div>

                  {/* Vehicle B (Motorcycle / SUV) Bounding Box */}
                  <div 
                    className="absolute border-2 border-blue-400 bg-blue-500/10 rounded px-1 text-[9px] font-mono font-bold text-blue-300 transition-all duration-100"
                    style={{
                      left: `${Math.max(15, 65 - scrubberTime * 11)}%`,
                      top: "35%",
                      width: activeScenario === "CAR_VS_BIKE" ? "60px" : "95px",
                      height: activeScenario === "CAR_VS_BIKE" ? "50px" : "60px"
                    }}
                  >
                    {activeScenario === "CAR_VS_BIKE" ? "🏍️ motorcycle: 96.2%" : "🚗 car: 92.5%"}
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800 truncate">
                  Source: {videoLoadedName || "User Uploaded Dashcam Stream"}
                </div>
              </div>
            </div>
          )}

          {/* RIGHT PANE: Synchronized 3D Reconstruction Canvas */}
          <div className={`relative h-full ${layoutMode === "SPLIT_VIEW" && currentVideoSrc ? "w-1/2" : "w-full"}`}>
            <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
          </div>
        </div>

        {/* TOP CONTROLS: Clean, Minimal, Uncluttered Floating Glass Bar */}
        <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-auto z-30">
          
          {/* Quick Video Upload / Change Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow-lg transition flex items-center gap-1.5"
            title="Upload any accident video to dynamically run YOLO detection & synchronize 3D reconstruction"
          >
            <Upload className="w-3 h-3" />
            <span>{currentVideoSrc ? "Change Video" : "Upload Video Source"}</span>
          </button>

          {/* View Layout Mode (Split vs 3D) */}
          {currentVideoSrc && (
            <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 flex items-center gap-1 text-[11px] font-semibold text-slate-300 shadow-lg">
              <button
                onClick={() => setLayoutMode("SPLIT_VIEW")}
                className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                  layoutMode === "SPLIT_VIEW" ? "bg-blue-600 text-white font-bold" : "hover:bg-slate-800 text-slate-400"
                }`}
                title="Synchronized Split View: Uploaded Video + 3D Simulation"
              >
                <SplitSquareHorizontal className="w-3 h-3" /> Video + 3D
              </button>
              <button
                onClick={() => setLayoutMode("3D_ONLY")}
                className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                  layoutMode === "3D_ONLY" ? "bg-blue-600 text-white font-bold" : "hover:bg-slate-800 text-slate-400"
                }`}
                title="Full 3D Reconstruction"
              >
                <Layers className="w-3 h-3" /> 3D Only
              </button>
            </div>
          )}

          {/* Dynamic Scenario Switcher */}
          <div className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-2 text-xs font-medium text-slate-300 shadow-lg">
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

          {/* Perspective Toggles */}
          <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 flex items-center gap-1 text-[11px] font-semibold text-slate-300 shadow-lg">
            <button
              onClick={() => {
                setCameraMode("ORBIT");
                if (cameraRef.current && controlsRef.current) {
                  cameraRef.current.position.set(22, 14, 24);
                  cameraRef.current.lookAt(0, 0.5, 0);
                  controlsRef.current.target.set(0, 0.5, 0);
                }
              }}
              className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                cameraMode === "ORBIT" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800 text-slate-400"
              }`}
              title="3D Free Orbit (Drag to rotate 360°)"
            >
              <RotateCcw className="w-3 h-3" /> 3D
            </button>
            <button
              onClick={() => setCameraMode("POV")}
              className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                cameraMode === "POV" ? "bg-blue-600 text-white font-bold" : "hover:bg-slate-800 text-slate-400"
              }`}
              title="Driver Windshield POV"
            >
              <Camera className="w-3 h-3" /> POV
            </button>
            <button
              onClick={() => setCameraMode("TOP")}
              className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                cameraMode === "TOP" ? "bg-blue-600 text-white font-bold" : "hover:bg-slate-800 text-slate-400"
              }`}
              title="Aerial 2D Map"
            >
              <Compass className="w-3 h-3" /> 2D Map
            </button>
          </div>
        </div>

        {/* BOTTOM CONTROLS: Clean Scrubber, Playback, and Export */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur-md p-3 rounded-lg border border-slate-800 flex items-center gap-4 shadow-xl z-30">
          <button
            onClick={onTogglePlay}
            disabled={isExporting}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shrink-0 shadow-md"
            title={isPlaying ? "Pause" : "Play Synchronized Reconstruction"}
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
        <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-800 flex items-center justify-between">
          <span>{exportNotice}</span>
        </div>
      )}
    </div>
  );
}
