"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Play, Pause, RotateCcw, Video, Compass, Camera } from "lucide-react";

interface ThreeForensicCanvasProps {
  scrubberTime: number;
  onTimeChange: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  caseTitle?: string;
}

export default function ThreeForensicCanvas({
  scrubberTime,
  onTimeChange,
  isPlaying,
  onTogglePlay,
  caseTitle = "Intersection Collision Reconstruction"
}: ThreeForensicCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Default to 3D Orbit perspective so it looks instantly 3D and realistic
  const [cameraMode, setCameraMode] = useState<"ORBIT" | "POV" | "TOP">("ORBIT");
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // 3D Objects refs
  const carARef = useRef<THREE.Group | null>(null);
  const carBRef = useRef<THREE.Group | null>(null);
  const impactRingRef = useRef<THREE.Mesh | null>(null);
  const trafficLightARef = useRef<THREE.Mesh | null>(null);
  const brakeLightsARef = useRef<THREE.Mesh[]>([]);
  const headlightSpotARef = useRef<THREE.SpotLight | null>(null);

  // Initialize Realistic Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14); // Ultra-deep forensic night tone
    scene.fog = new THREE.FogExp2(0x070b14, 0.015);
    sceneRef.current = scene;

    // 2. Camera with Angled 3D Isometric View by Default
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(18, 16, 24);
    camera.lookAt(0, 0.5, 0);
    cameraRef.current = camera;

    // 3. Renderer with High-End Lighting & Shadow Mapping
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
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.4);
    scene.add(ambientLight);

    // Street Overhead Sun/Moon Light
    const mainLight = new THREE.DirectionalLight(0xf1f5f9, 1.4);
    mainLight.position.set(25, 45, 20);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 10;
    mainLight.shadow.camera.far = 100;
    mainLight.shadow.camera.left = -25;
    mainLight.shadow.camera.right = 25;
    mainLight.shadow.camera.top = 25;
    mainLight.shadow.camera.bottom = -25;
    scene.add(mainLight);

    // Secondary Rim Light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    rimLight.position.set(-25, 20, -20);
    scene.add(rimLight);

    // 5. Realistic Ground Asphalt Plane
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0c121e,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 6. Realistic 4-Way Intersection Roads with Curbs
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x141b2b,
      roughness: 0.75,
      metalness: 0.15
    });

    // East-West Road
    const ewRoad = new THREE.Mesh(new THREE.PlaneGeometry(70, 11), asphaltMat);
    ewRoad.rotation.x = -Math.PI / 2;
    ewRoad.position.y = 0.02;
    ewRoad.receiveShadow = true;
    scene.add(ewRoad);

    // North-South Road
    const nsRoad = new THREE.Mesh(new THREE.PlaneGeometry(11, 70), asphaltMat);
    nsRoad.rotation.x = -Math.PI / 2;
    nsRoad.position.y = 0.03;
    nsRoad.receiveShadow = true;
    scene.add(nsRoad);

    // Sidewalk Curbs
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const createCurb = (x: number, z: number) => {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(24, 0.25, 24), curbMat);
      curb.position.set(x, 0.12, z);
      curb.receiveShadow = true;
      scene.add(curb);
    };
    createCurb(-18, -18);
    createCurb(18, -18);
    createCurb(-18, 18);
    createCurb(18, 18);

    // Lane Markings (Crisp White Dashed Lines)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    for (let x = -32; x <= 32; x += 4.5) {
      if (Math.abs(x) < 6) continue;
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.25), lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.04, 0);
      scene.add(dash);
    }

    for (let z = -32; z <= 32; z += 4.5) {
      if (Math.abs(z) < 6) continue;
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 2.5), lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.04, z);
      scene.add(dash);
    }

    // Pedestrian Zebra Crosswalk Stripes
    const zebraMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    for (let offset = -4.5; offset <= 4.5; offset += 1.2) {
      // West crosswalk
      const z1 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 2.8), zebraMat);
      z1.rotation.x = -Math.PI / 2;
      z1.position.set(-6.5, 0.045, offset);
      scene.add(z1);

      // East crosswalk
      const z2 = z1.clone();
      z2.position.set(6.5, 0.045, offset);
      scene.add(z2);

      // North crosswalk
      const z3 = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.6), zebraMat);
      z3.rotation.x = -Math.PI / 2;
      z3.position.set(offset, 0.045, -6.5);
      scene.add(z3);

      // South crosswalk
      const z4 = z3.clone();
      z4.position.set(offset, 0.045, 6.5);
      scene.add(z4);
    }

    // 7. REALISTIC VEHICLE A BUILDER (Red Performance Sedan)
    const carAGroup = new THREE.Group();
    
    // Glossy Metallic Crimson Paint
    const paintAMat = new THREE.MeshStandardMaterial({
      color: 0xbe123c, // Deep Metallic Crimson
      metalness: 0.85,
      roughness: 0.18
    });

    // Lower Chassis
    const chassisA = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.7, 2.0), paintAMat);
    chassisA.position.y = 0.55;
    chassisA.castShadow = true;
    carAGroup.add(chassisA);

    // Aerodynamic Hood & Trunk Tapers
    const hoodA = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 1.95), paintAMat);
    hoodA.position.set(1.4, 0.75, 0);
    hoodA.castShadow = true;
    carAGroup.add(hoodA);

    // Tinted Glass Cabin
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.05,
      metalness: 0.95
    });
    const cabinA = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.65, 1.7), glassMat);
    cabinA.position.set(-0.25, 1.15, 0);
    cabinA.castShadow = true;
    carAGroup.add(cabinA);

    // 4 Cylindrical Wheels with Rims
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.85 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });

    const createWheel = (x: number, z: number) => {
      const wheelGroup = new THREE.Group();
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.32, 24), tireMat);
      tire.rotation.x = Math.PI / 2;
      tire.castShadow = true;
      wheelGroup.add(tire);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.33, 16), rimMat);
      rim.rotation.x = Math.PI / 2;
      wheelGroup.add(rim);

      wheelGroup.position.set(x, 0.38, z);
      return wheelGroup;
    };

    carAGroup.add(createWheel(1.3, 1.0));
    carAGroup.add(createWheel(1.3, -1.0));
    carAGroup.add(createWheel(-1.3, 1.0));
    carAGroup.add(createWheel(-1.3, -1.0));

    // LED Xenon Headlights + Projector Beam
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.35), headlightMat);
    hl1.position.set(2.2, 0.6, 0.65);
    const hl2 = hl1.clone();
    hl2.position.set(2.2, 0.6, -0.65);
    carAGroup.add(hl1);
    carAGroup.add(hl2);

    // Realistic Spotlight casting forward onto the road
    const spotA = new THREE.SpotLight(0xfffbeb, 3.5, 24, Math.PI / 5, 0.4);
    spotA.position.set(2.2, 0.7, 0);
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(12, 0, 0);
    carAGroup.add(spotTarget);
    spotA.target = spotTarget;
    carAGroup.add(spotA);
    headlightSpotARef.current = spotA;

    // Glowing LED Tail/Brake Lights
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.5
    });
    const bl1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.4), tailMat);
    bl1.position.set(-2.2, 0.65, 0.65);
    const bl2 = bl1.clone();
    bl2.position.set(-2.2, 0.65, -0.65);
    carAGroup.add(bl1);
    carAGroup.add(bl2);
    brakeLightsARef.current = [bl1, bl2];

    scene.add(carAGroup);
    carARef.current = carAGroup;

    // 8. REALISTIC VEHICLE B BUILDER (Navy Blue Modern SUV)
    const carBGroup = new THREE.Group();
    const paintBMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Metallic Navy Blue
      metalness: 0.75,
      roughness: 0.22
    });

    // Tall SUV Chassis
    const chassisB = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.95, 2.2), paintBMat);
    chassisB.position.y = 0.75;
    chassisB.castShadow = true;
    carBGroup.add(chassisB);

    // Upper Cabin
    const cabinB = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.85, 2.05), glassMat);
    cabinB.position.set(-0.3, 1.5, 0);
    cabinB.castShadow = true;
    carBGroup.add(cabinB);

    // Roof Rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 });
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), railMat);
    rail1.position.set(-0.3, 1.95, 0.8);
    const rail2 = rail1.clone();
    rail2.position.set(-0.3, 1.95, -0.8);
    carBGroup.add(rail1);
    carBGroup.add(rail2);

    // SUV Large Wheels
    carBGroup.add(createWheel(1.4, 1.1));
    carBGroup.add(createWheel(1.4, -1.1));
    carBGroup.add(createWheel(-1.4, 1.1));
    carBGroup.add(createWheel(-1.4, -1.1));

    // Vehicle B Headlights
    const hlB1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.4), headlightMat);
    hlB1.position.set(2.35, 0.8, 0.75);
    const hlB2 = hlB1.clone();
    hlB2.position.set(2.35, 0.8, -0.75);
    carBGroup.add(hlB1);
    carBGroup.add(hlB2);

    scene.add(carBGroup);
    carBRef.current = carBGroup;

    // 9. Modern Traffic Light Gantry Mast
    const mastGroup = new THREE.Group();
    mastGroup.position.set(-7.5, 0, -7.5);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 6.5, 16), curbMat);
    pole.position.y = 3.25;
    mastGroup.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.2, 0.2), curbMat);
    arm.position.set(2.5, 6.2, 0);
    mastGroup.add(arm);

    // Traffic Signal Housing
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.5), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    housing.position.set(4.5, 5.8, 0);
    mastGroup.add(housing);

    const signalSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.8 })
    );
    signalSphere.position.set(4.5, 5.8, 0.26);
    mastGroup.add(signalSphere);
    trafficLightARef.current = signalSphere;

    scene.add(mastGroup);

    // 10. Glowing Impact Ground Ring
    const ringGeo = new THREE.RingGeometry(0.8, 4.5, 36);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide, transparent: true, opacity: 0 });
    const impactRing = new THREE.Mesh(ringGeo, ringMat);
    impactRing.rotation.x = -Math.PI / 2;
    impactRing.position.set(1.5, 0.08, 1.5);
    scene.add(impactRing);
    impactRingRef.current = impactRing;

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Positions & Dynamic Kinematics
  useEffect(() => {
    const t = scrubberTime;

    // Vehicle A (Red Sedan - Traveling West to East along X)
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

    // Dynamic High-Intensity Brake Light Glow
    brakeLightsARef.current.forEach((bl) => {
      const mat = bl.material as THREE.MeshStandardMaterial;
      if (isBrakingA) {
        mat.emissive.setHex(0xff0022);
        mat.emissiveIntensity = 2.4;
      } else {
        mat.emissive.setHex(0x550000);
        mat.emissiveIntensity = 0.3;
      }
    });

    // Vehicle B (Blue SUV - Traveling North to South along Z)
    let xB = 1.75;
    let zB = -25.0;
    let rotB = Math.PI / 2;

    if (t < 2.8) {
      zB = -25.0 + (t * 9.1);
    } else {
      const dt = t - 2.8;
      xB = 1.75 + (dt * 1.8);
      zB = 0.5 + (dt * 2.1);
      rotB = (Math.PI / 2) + (dt * 0.4);
    }

    if (carBRef.current) {
      carBRef.current.position.set(xB, 0, zB);
      carBRef.current.rotation.y = rotB;
    }

    // Dynamic Traffic Light Signal Phasing
    if (trafficLightARef.current) {
      const mat = trafficLightARef.current.material as THREE.MeshStandardMaterial;
      if (t < 1.4) {
        mat.color.setHex(0x10b981);
        mat.emissive.setHex(0x10b981);
        mat.emissiveIntensity = 2.0;
      } else if (t < 2.1) {
        mat.color.setHex(0xf59e0b);
        mat.emissive.setHex(0xf59e0b);
        mat.emissiveIntensity = 2.0;
      } else {
        mat.color.setHex(0xf43f5e);
        mat.emissive.setHex(0xf43f5e);
        mat.emissiveIntensity = 2.2;
      }
    }

    // Impact Particle Ring Pulse
    if (impactRingRef.current) {
      const ringMat = impactRingRef.current.material as THREE.MeshBasicMaterial;
      if (t >= 2.6 && t <= 3.4) {
        const factor = (t - 2.6) / 0.8;
        ringMat.opacity = Math.max(0, 0.85 - factor);
        impactRingRef.current.scale.set(1 + factor * 3.0, 1 + factor * 3.0, 1);
      } else {
        ringMat.opacity = 0;
      }
    }

    // Dynamic Camera Modes
    if (cameraRef.current) {
      if (cameraMode === "ORBIT") {
        // High-fidelity 3D angled forensic perspective
        cameraRef.current.position.set(18, 15, 22);
        cameraRef.current.lookAt(0, 0.5, 0);
      } else if (cameraMode === "POV") {
        // Mounted inside Vehicle A looking forward through windshield
        cameraRef.current.position.set(xA + 0.6, 1.25, zA);
        cameraRef.current.lookAt(xA + 25, 1.25, zA);
      } else if (cameraMode === "TOP") {
        // Overhead orthographic inspection
        cameraRef.current.position.set(0, 36, 0.001);
        cameraRef.current.lookAt(0, 0, 0);
      }
    }

    // Render frame
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [scrubberTime, cameraMode]);

  // Video Export (Native MediaRecorder)
  const handleExportVideo = () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    setExportNotice("Recording realistic 3D simulation frames into court-ready MP4/WebM video...");

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
        a.download = `Rekishi_Realistic_3D_Reconstruction_${Date.now()}.webm`;
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
      {/* 3D Realistic WebGL Canvas */}
      <div 
        ref={containerRef}
        className="relative w-full h-[450px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Top Floating HUD */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 pointer-events-auto flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-blue-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              REKISHI 3D FORENSIC STUDIO
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">
              VEHICLE A: <strong className="text-rose-400">{scrubberTime >= 2.8 ? "18 km/h" : `${Math.round(48 - scrubberTime * 5)} km/h`}</strong>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">
              SIGNAL: <strong className={scrubberTime < 1.4 ? "text-emerald-400" : scrubberTime < 2.1 ? "text-amber-400" : "text-rose-400"}>
                {scrubberTime < 1.4 ? "GREEN" : scrubberTime < 2.1 ? "AMBER" : "RED (STOP)"}
              </strong>
            </span>
          </div>

          {/* Perspective Selector */}
          <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 pointer-events-auto flex items-center gap-1 text-[11px] font-semibold text-slate-300">
            <button
              onClick={() => setCameraMode("ORBIT")}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                cameraMode === "ORBIT" ? "bg-blue-600 text-white font-bold" : "hover:bg-slate-800 text-slate-400"
              }`}
            >
              <RotateCcw className="w-3 h-3" /> Realistic 3D Angle
            </button>
            <button
              onClick={() => setCameraMode("POV")}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                cameraMode === "POV" ? "bg-blue-600 text-white font-bold" : "hover:bg-slate-800 text-slate-400"
              }`}
            >
              <Camera className="w-3 h-3" /> Driver Windshield POV
            </button>
            <button
              onClick={() => setCameraMode("TOP")}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                cameraMode === "TOP" ? "bg-blue-600 text-white font-bold" : "hover:bg-slate-800 text-slate-400"
              }`}
            >
              <Compass className="w-3 h-3" /> Overhead Map
            </button>
          </div>
        </div>

        {/* Impact Registered Alert */}
        {scrubberTime >= 2.7 && scrubberTime <= 3.0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="px-4 py-2 rounded-lg bg-rose-600/95 text-white font-mono font-bold text-xs tracking-wider shadow-2xl border border-rose-400 animate-bounce">
              ⚡ T-BONE IMPACT POINT (T+02.8s)
            </div>
          </div>
        )}

        {/* Bottom Floating Control Bar */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur-md p-3 rounded-lg border border-slate-800 flex items-center gap-4">
          <button
            onClick={onTogglePlay}
            disabled={isExporting}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shrink-0 shadow-md"
            title={isPlaying ? "Pause" : "Play 3D Video"}
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
            <span className="font-mono text-xs font-bold text-white shrink-0 min-w-[70px]">
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
