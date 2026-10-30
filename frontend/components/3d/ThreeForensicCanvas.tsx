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
  const [cameraMode, setCameraMode] = useState<"TOP" | "POV" | "ORBIT">("TOP");
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
  const brakeLightALeftRef = useRef<THREE.Mesh | null>(null);
  const brakeLightARightRef = useRef<THREE.Mesh | null>(null);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d); // Dark forensic slate
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 32, 0.001); // Default Top-Down
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true // Required for canvas.captureStream / export
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 5. Ground Asphalt Plane
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x111625, roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // 6. Roads (4-way intersection)
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x181f33, roughness: 0.6 });
    
    // East-West Road
    const ewRoadGeo = new THREE.PlaneGeometry(60, 10);
    const ewRoad = new THREE.Mesh(ewRoadGeo, roadMat);
    ewRoad.rotation.x = -Math.PI / 2;
    ewRoad.position.y = 0.02;
    scene.add(ewRoad);

    // North-South Road
    const nsRoadGeo = new THREE.PlaneGeometry(10, 60);
    const nsRoad = new THREE.Mesh(nsRoadGeo, roadMat);
    nsRoad.rotation.x = -Math.PI / 2;
    nsRoad.position.y = 0.03;
    scene.add(nsRoad);

    // Lane Markings (Dashed White Lines)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    for (let x = -28; x <= 28; x += 4) {
      if (Math.abs(x) < 5) continue; // Skip intersection center
      const dashGeo = new THREE.PlaneGeometry(2, 0.2);
      const dash = new THREE.Mesh(dashGeo, lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.04, 0);
      scene.add(dash);
    }

    for (let z = -28; z <= 28; z += 4) {
      if (Math.abs(z) < 5) continue;
      const dashGeo = new THREE.PlaneGeometry(0.2, 2);
      const dash = new THREE.Mesh(dashGeo, lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.04, z);
      scene.add(dash);
    }

    // Yellow Center Divider Box Lines
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const boxMarker = new THREE.Box3Helper(new THREE.Box3(new THREE.Vector3(-5, 0, -5), new THREE.Vector3(5, 0.1, 5)), 0x334155);
    scene.add(boxMarker);

    // 7. Vehicle A (Red Sedan)
    const carAGroup = new THREE.Group();
    // Body
    const bodyAGeo = new THREE.BoxGeometry(4.2, 1.2, 2.0);
    const bodyAMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, metalness: 0.6, roughness: 0.3 }); // Red
    const bodyA = new THREE.Mesh(bodyAGeo, bodyAMat);
    bodyA.position.y = 0.8;
    carAGroup.add(bodyA);

    // Cabin
    const cabinAGeo = new THREE.BoxGeometry(2.2, 0.9, 1.8);
    const cabinAMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
    const cabinA = new THREE.Mesh(cabinAGeo, cabinAMat);
    cabinA.position.set(-0.2, 1.6, 0);
    carAGroup.add(cabinA);

    // Headlights (Front is +X)
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.4), hlMat);
    hl1.position.set(2.1, 0.8, 0.7);
    const hl2 = hl1.clone();
    hl2.position.set(2.1, 0.8, -0.7);
    carAGroup.add(hl1);
    carAGroup.add(hl2);

    // Brake Lights (Rear is -X)
    const blMat = new THREE.MeshBasicMaterial({ color: 0x7f1d1d });
    const bl1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.4), blMat);
    bl1.position.set(-2.1, 0.8, 0.7);
    const bl2 = bl1.clone();
    bl2.position.set(-2.1, 0.8, -0.7);
    carAGroup.add(bl1);
    carAGroup.add(bl2);
    brakeLightALeftRef.current = bl1;
    brakeLightARightRef.current = bl2;

    scene.add(carAGroup);
    carARef.current = carAGroup;

    // 8. Vehicle B (Blue SUV)
    const carBGroup = new THREE.Group();
    const bodyBGeo = new THREE.BoxGeometry(4.6, 1.6, 2.2);
    const bodyBMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.5, roughness: 0.4 }); // Blue
    const bodyB = new THREE.Mesh(bodyBGeo, bodyBMat);
    bodyB.position.y = 1.0;
    carBGroup.add(bodyB);

    const cabinBGeo = new THREE.BoxGeometry(3.0, 1.0, 2.0);
    const cabinBMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
    const cabinB = new THREE.Mesh(cabinBGeo, cabinBMat);
    cabinB.position.set(-0.2, 2.1, 0);
    carBGroup.add(cabinB);

    scene.add(carBGroup);
    carBRef.current = carBGroup;

    // 9. Traffic Signal Light Sphere (Near Corner)
    const signalGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const signalMat = new THREE.MeshBasicMaterial({ color: 0x10b981 }); // Green default
    const signalLight = new THREE.Mesh(signalGeo, signalMat);
    signalLight.position.set(-6, 5, -6);
    scene.add(signalLight);
    trafficLightARef.current = signalLight;

    // Pole for signal
    const poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 5);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(-6, 2.5, -6);
    scene.add(pole);

    // 10. Impact Shockwave Ring (Hidden until impact)
    const ringGeo = new THREE.RingGeometry(0.5, 4.0, 32);
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

  // Update Positions based on scrubberTime and Camera Mode
  useEffect(() => {
    const t = scrubberTime;

    // Vehicle A Kinematics (Red Sedan - Traveling West to East along X axis)
    // Starts at X = -25m, brakes at t = 2.0s, impact at t = 2.8s
    let xA = -25.0;
    let zA = 1.75;
    let rotA = 0; // heading east
    let isBrakingA = false;

    if (t < 2.0) {
      xA = -25.0 + (t * 11.5);
      isBrakingA = false;
    } else if (t < 2.8) {
      xA = -2.0 + ((t - 2.0) * 4.375);
      isBrakingA = true;
    } else {
      // Post-impact rotation & deflection
      const dt = t - 2.8;
      xA = 1.5 + (dt * 1.5);
      zA = 1.75 + (dt * 0.7);
      rotA = -dt * 0.35; // rotate clockwise
      isBrakingA = true;
    }

    if (carARef.current) {
      carARef.current.position.set(xA, 0, zA);
      carARef.current.rotation.y = rotA;
    }

    // Brake lights illumination on Vehicle A
    if (brakeLightALeftRef.current && brakeLightARightRef.current) {
      const activeColor = new THREE.Color(isBrakingA ? 0xff0033 : 0x440000);
      (brakeLightALeftRef.current.material as THREE.MeshBasicMaterial).color = activeColor;
      (brakeLightARightRef.current.material as THREE.MeshBasicMaterial).color = activeColor;
    }

    // Vehicle B Kinematics (Blue SUV - Traveling North to South along Z axis)
    // Starts at Z = -25m, reaches intersection at t = 2.8s
    let xB = 1.75;
    let zB = -25.0;
    let rotB = Math.PI / 2; // heading south

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

    // Traffic Signal State
    if (trafficLightARef.current) {
      const mat = trafficLightARef.current.material as THREE.MeshBasicMaterial;
      if (t < 1.4) {
        mat.color.setHex(0x10b981); // Green
      } else if (t < 2.1) {
        mat.color.setHex(0xf59e0b); // Amber
      } else {
        mat.color.setHex(0xf43f5e); // Red
      }
    }

    // Impact Shockwave Ring
    if (impactRingRef.current) {
      const ringMat = impactRingRef.current.material as THREE.MeshBasicMaterial;
      if (t >= 2.6 && t <= 3.4) {
        const factor = (t - 2.6) / 0.8;
        ringMat.opacity = Math.max(0, 0.9 - factor);
        impactRingRef.current.scale.set(1 + factor * 2.5, 1 + factor * 2.5, 1);
      } else {
        ringMat.opacity = 0;
      }
    }

    // Camera Mode Update
    if (cameraRef.current) {
      if (cameraMode === "TOP") {
        cameraRef.current.position.set(0, 32, 0.001);
        cameraRef.current.lookAt(0, 0, 0);
      } else if (cameraMode === "POV") {
        // Mounted on Vehicle A windshield looking forward (+X)
        cameraRef.current.position.set(xA + 1.2, 2.0, zA);
        cameraRef.current.lookAt(xA + 20, 2.0, zA);
      } else if (cameraMode === "ORBIT") {
        // High 3D forensic isometric view
        cameraRef.current.position.set(16, 18, 20);
        cameraRef.current.lookAt(0, 1, 0);
      }
    }

    // Render frame
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [scrubberTime, cameraMode]);

  // Video Export Functionality (Native MediaRecorder)
  const handleExportVideo = () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    setExportNotice("Recording 3D simulation frames into court-ready MP4/WebM video...");

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
        a.download = `Rekishi_3D_Reconstruction_${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setExportNotice("3D Video exported successfully!");
        setTimeout(() => setExportNotice(null), 3000);
      };

      recorder.start();

      // Play through simulation
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
      {/* 3D WebGL Canvas Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-[420px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Top Floating HUD: Telemetry & Camera Switcher */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 pointer-events-auto flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-blue-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              REKISHI 3D WEBGL
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">
              VEHICLE A: <strong className="text-rose-400">{scrubberTime >= 2.8 ? "18 km/h" : `${Math.round(48 - scrubberTime * 5)} km/h`}</strong>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">
              SIGNAL: <strong className={scrubberTime < 1.4 ? "text-emerald-400" : scrubberTime < 2.1 ? "text-amber-400" : "text-rose-400"}>
                {scrubberTime < 1.4 ? "GREEN (GO)" : scrubberTime < 2.1 ? "AMBER (SLOW)" : "RED (STOP)"}
              </strong>
            </span>
          </div>

          {/* Camera Perspective Selector */}
          <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 pointer-events-auto flex items-center gap-1 text-[11px] font-semibold text-slate-300">
            <button
              onClick={() => setCameraMode("TOP")}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                cameraMode === "TOP" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400"
              }`}
            >
              <Compass className="w-3 h-3" /> Bird&apos;s-Eye (Top)
            </button>
            <button
              onClick={() => setCameraMode("POV")}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                cameraMode === "POV" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400"
              }`}
            >
              <Camera className="w-3 h-3" /> Driver POV
            </button>
            <button
              onClick={() => setCameraMode("ORBIT")}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                cameraMode === "ORBIT" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400"
              }`}
            >
              <RotateCcw className="w-3 h-3" /> 3D Orbit
            </button>
          </div>
        </div>

        {/* Impact Overlay Banner */}
        {scrubberTime >= 2.7 && scrubberTime <= 3.0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="px-4 py-2 rounded-lg bg-rose-600/90 text-white font-mono font-bold text-xs tracking-wider shadow-2xl border border-rose-400 animate-bounce">
              ⚡ T-BONE IMPACT REGISTERED (T+02.8s)
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

          {/* Time Scrubber Slider */}
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
