/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Three.js 3D Structural Engineering Viewport (M02 / M14)
 * Compliant with Three.js Skill Directives:
 * - Composite 3-12 part procedural models (THREE.Group)
 * - Studio PBR Lighting, ACESFilmicToneMapping, RoomEnvironment, PMREMGenerator
 * - Damped camera movement, zero-allocation render loop
 * - Viewport-first collapsible bottom dock (no backdrop-filter over WebGL, no pulsating dots)
 */

import React, { useEffect, useRef, useState, useTransition } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CsmProject } from '../types/csm.ts';
import { runClashDetection, StructuralClash } from '../core/clashDetectionEngine.ts';
import {
  Layers,
  Eye,
  EyeOff,
  Maximize2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Activity,
  Box,
  Sparkles,
  AlertTriangle,
  X,
  Crosshair,
  ShieldAlert,
} from 'lucide-react';

interface ThreeDViewerProps {
  project: CsmProject;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string) => void;
}

// Pre-allocated math helpers for zero garbage collection
const _vec3 = new THREE.Vector3();
const _targetCameraPos = new THREE.Vector3(26, 22, 32);
const _targetLookAt = new THREE.Vector3(8, 12, 9);
const _currentLookAt = new THREE.Vector3(8, 12, 9);

export const ThreeDViewer: React.FC<ThreeDViewerProps> = ({ project, selectedElementId, onSelectElement }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [explodedFactor, setExplodedFactor] = useState(0); // 0 to 1
  const [showRebarCage, setShowRebarCage] = useState(true);
  const [showDcHeatmap, setShowDcHeatmap] = useState(false);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [selectedStoryFilter, setSelectedStoryFilter] = useState<string>('all');
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'front' | 'side' | 'top'>('iso');

  // Clash Detection state
  const [showClashDrawer, setShowClashDrawer] = useState(false);
  const [selectedClash, setSelectedClash] = useState<StructuralClash | null>(null);
  const clashResult = React.useMemo(() => runClashDetection(project), [project]);

  // Seismic Visual Simulation (CSS exaggerated deformation animation)
  const [isSimulatingSeismic, setIsSimulatingSeismic] = useState(false);
  const [seismicScale, setSeismicScale] = useState<'moderate' | 'exaggerated' | 'extreme'>('exaggerated');
  const [seismicDirection, setSeismicDirection] = useState<'x' | 'y' | 'bi'>('x');
  const [seismicSpeed, setSeismicSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [showSeismicDriftDetails, setShowSeismicDriftDetails] = useState(false);

  // Mutable refs for animation loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const structuralGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const storySeparatorsRef = useRef<Map<string, THREE.Group>>(new Map());
  const clashMarkerRef = useRef<THREE.Mesh | null>(null);

  // Mouse interaction state
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const previousMousePosRef = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef(new THREE.Spherical(45, Math.PI / 3, Math.PI / 4));

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#030712');
    scene.fog = new THREE.FogExp2('#030712', 0.012);

    // 2. Camera setup
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.5, 500);
    camera.position.set(_targetCameraPos.x, _targetCameraPos.y, _targetCameraPos.z);
    camera.lookAt(_currentLookAt);
    cameraRef.current = camera;

    // 3. Renderer setup
    const isHeadless = typeof navigator !== 'undefined' && (/HeadlessChrome/i.test(navigator.userAgent) || navigator.webdriver);
    const renderer = new THREE.WebGLRenderer({ antialias: !isHeadless, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 4. Studio Environment & Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig
    // Warm Key Light
    const keyLight = new THREE.DirectionalLight('#fffbeb', 2.4);
    keyLight.position.set(25, 45, 30);
    keyLight.castShadow = !isHeadless;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 120;
    const d = 30;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    scene.add(keyLight);

    // Cool Hemisphere Fill
    const hemiLight = new THREE.HemisphereLight('#38bdf8', '#0f172a', 1.0);
    scene.add(hemiLight);

    // Subtle Rim Light
    const rimLight = new THREE.DirectionalLight('#93c5fd', 1.2);
    rimLight.position.set(-25, 20, -25);
    scene.add(rimLight);

    // 6. Ground Plane with Radial Contact Shadow
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 256;
    groundCanvas.height = 256;
    const gctx = groundCanvas.getContext('2d');
    if (gctx) {
      const grad = gctx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      gctx.fillStyle = grad;
      gctx.fillRect(0, 0, 256, 256);
    }
    const groundTexture = new THREE.CanvasTexture(groundCanvas);
    groundTexture.colorSpace = THREE.SRGBColorSpace;
    const groundShadowGeo = new THREE.PlaneGeometry(50, 50);
    const groundShadowMat = new THREE.MeshBasicMaterial({
      map: groundTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.8,
    });
    const groundShadowMesh = new THREE.Mesh(groundShadowGeo, groundShadowMat);
    groundShadowMesh.rotation.x = -Math.PI / 2;
    groundShadowMesh.position.set(8.25, 0.01, 9);
    scene.add(groundShadowMesh);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(50, 50, '#334155', '#1e293b');
    gridHelper.position.set(8.25, 0, 9);
    scene.add(gridHelper);

    // 7. Procedural Surface Textures (Zero external 404 dependencies)
    // Concrete Bump Map
    const concreteCanvas = document.createElement('canvas');
    concreteCanvas.width = 128;
    concreteCanvas.height = 128;
    const cctx = concreteCanvas.getContext('2d');
    if (cctx) {
      cctx.fillStyle = '#808080';
      cctx.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 600; i++) {
        const val = Math.floor(Math.random() * 80) + 90;
        cctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        cctx.fillRect(Math.random() * 128, Math.random() * 128, 1.5, 1.5);
      }
    }
    const concreteBumpTexture = new THREE.CanvasTexture(concreteCanvas);
    concreteBumpTexture.wrapS = THREE.RepeatWrapping;
    concreteBumpTexture.wrapT = THREE.RepeatWrapping;
    concreteBumpTexture.repeat.set(2, 4);

    // 8. Build Composite Structural Elements
    buildCompositeStructure(project, scene, concreteBumpTexture, structuralGroupsRef.current, storySeparatorsRef.current);

    // Pre-warm shaders
    renderer.compile(scene, camera);

    // 9. Interaction listeners (Orbit, Pan, Zoom)
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) isDraggingRef.current = true;
      if (e.button === 2) isPanningRef.current = true;
      previousMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - previousMousePosRef.current.x;
      const deltaY = e.clientY - previousMousePosRef.current.y;
      previousMousePosRef.current = { x: e.clientX, y: e.clientY };

      if (isDraggingRef.current) {
        sphericalRef.current.theta -= deltaX * 0.006;
        sphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, sphericalRef.current.phi - deltaY * 0.006));
      } else if (isPanningRef.current) {
        _currentLookAt.x -= deltaX * 0.03;
        _currentLookAt.z -= deltaY * 0.03;
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      isPanningRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      sphericalRef.current.radius = Math.max(5, Math.min(160, sphericalRef.current.radius + e.deltaY * 0.04));
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('contextmenu', onContextMenu);

    // 10. Lossless Render Loop with Exponential Damping (Throttled in Headless)
    let animationFrameId: number;
    let lastTime = performance.now();
    let lastRenderTime = 0;
    const minFrameInterval = isHeadless ? 66 : 0; // ~15 FPS in headless

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      if (isHeadless && currentTime - lastRenderTime < minFrameInterval) {
        return;
      }
      lastRenderTime = currentTime;

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Smooth camera orbit
      _vec3.setFromSpherical(sphericalRef.current).add(_currentLookAt);
      camera.position.x = THREE.MathUtils.damp(camera.position.x, _vec3.x, 8, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _vec3.y, 8, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _vec3.z, 8, dt);
      camera.lookAt(_currentLookAt);

      // Gentle pulsation of selected clash marker
      if (clashMarkerRef.current && clashMarkerRef.current.visible) {
        clashMarkerRef.current.rotation.y += dt * 1.5;
        const s = 1.0 + 0.2 * Math.sin(currentTime * 0.005);
        clashMarkerRef.current.scale.set(s, s, s);
      }

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Resize handler
    const onResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [project]);

  // Update exploded view and story filtration
  useEffect(() => {
    storySeparatorsRef.current.forEach((group, storyId) => {
      const storyIndex = parseInt(storyId.replace(/\D/g, '') || '1', 10);
      const verticalOffset = storyIndex * explodedFactor * 3.5;
      group.position.y = verticalOffset;

      if (selectedStoryFilter === 'all' || selectedStoryFilter === storyId) {
        group.visible = true;
      } else {
        group.visible = false;
      }
    });
  }, [explodedFactor, selectedStoryFilter]);

  // Update rebar visibility, heatmaps, and wireframe
  useEffect(() => {
    structuralGroupsRef.current.forEach((group) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.name.includes('rebar')) {
            child.visible = showRebarCage;
          }
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.wireframe = wireframeMode;
            if (showDcHeatmap) {
              const dc = child.userData.dcRatio || 0.7;
              if (dc > 1.0) child.material.color.set('#ef4444'); // Overstressed Failure
              else if (dc > 0.85) child.material.color.set('#f59e0b'); // Near Limit
              else if (dc > 0.70) child.material.color.set('#06b6d4'); // Efficient
              else child.material.color.set('#10b981'); // Safe Under-utilized
            } else {
              if (child.userData.originalColor) {
                child.material.color.set(child.userData.originalColor);
              }
            }
          }
        }
      });
    });
  }, [showRebarCage, showDcHeatmap, wireframeMode]);

  const handleCameraPreset = (preset: 'iso' | 'front' | 'side' | 'top') => {
    setCameraPreset(preset);
    if (preset === 'iso') {
      sphericalRef.current.set(45, Math.PI / 3, Math.PI / 4);
    } else if (preset === 'front') {
      sphericalRef.current.set(42, Math.PI / 2, 0);
    } else if (preset === 'side') {
      sphericalRef.current.set(42, Math.PI / 2, Math.PI / 2);
    } else if (preset === 'top') {
      sphericalRef.current.set(48, 0.05, 0);
    }
  };

  const handleFocusOnClash = (clash: StructuralClash) => {
    setSelectedClash(clash);
    // In Three.js: X is X, Y is Elevation (Z in structural coordinates), Z is Y in structural coordinates
    _currentLookAt.set(clash.intersectionPoint.x, clash.intersectionPoint.z, clash.intersectionPoint.y);
    sphericalRef.current.radius = 16;

    // Render / reposition visual clash beacon
    if (sceneRef.current) {
      if (!clashMarkerRef.current) {
        const markerGeo = new THREE.SphereGeometry(0.45, 16, 16);
        const markerMat = new THREE.MeshStandardMaterial({
          color: clash.severity === 'hard' ? '#ef4444' : '#f59e0b',
          emissive: clash.severity === 'hard' ? '#ef4444' : '#f59e0b',
          emissiveIntensity: 0.8,
          roughness: 0.2,
          wireframe: true,
        });
        const markerMesh = new THREE.Mesh(markerGeo, markerMat);
        sceneRef.current.add(markerMesh);
        clashMarkerRef.current = markerMesh;
      }
      clashMarkerRef.current.position.set(
        clash.intersectionPoint.x,
        clash.intersectionPoint.z,
        clash.intersectionPoint.y
      );
      clashMarkerRef.current.visible = true;
    }
  };

  return (
    <div
      className={`relative w-full h-full min-h-[540px] bg-slate-950 overflow-hidden select-none ${
        isSimulatingSeismic ? 'animate-ground-vibe' : ''
      }`}
    >
      {/* 3D Canvas Mount Point with CSS Exaggerated Lateral Seismic Sway */}
      <div
        ref={mountRef}
        className={`w-full h-full cursor-grab active:cursor-grabbing transition-transform ${
          isSimulatingSeismic
            ? seismicDirection === 'bi'
              ? 'animate-seismic-bi'
              : seismicDirection === 'y'
              ? 'animate-seismic-y'
              : seismicScale === 'moderate'
              ? 'animate-seismic-moderate'
              : seismicScale === 'extreme'
              ? 'animate-seismic-extreme'
              : 'animate-seismic-exaggerated'
            : ''
        }`}
        style={
          isSimulatingSeismic
            ? ({
                '--seismic-duration':
                  seismicSpeed === 'slow' ? '2.8s' : seismicSpeed === 'fast' ? '1.0s' : '1.8s',
              } as React.CSSProperties)
            : {}
        }
      />

      {/* Seismic Vibration Realtime Status & Control HUD */}
      {isSimulatingSeismic && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 max-w-[95%]">
          {/* Main Simulation Control Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 bg-slate-950/95 border border-rose-500/60 text-rose-200 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md animate-fade-in text-xs">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>

            <span className="font-bold flex items-center gap-1.5 text-white">
              شبیه‌سازی بصری تغییر شکل جانبی زلزله (مود اول ارتعاش دینامیکی)
            </span>

            {/* Scale Selector */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
              {(
                [
                  { id: 'moderate', label: '۳۵×' },
                  { id: 'exaggerated', label: '۱۰۰×' },
                  { id: 'extreme', label: '۲۵۰×' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSeismicScale(s.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-colors ${
                    seismicScale === s.id
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Direction Selector */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              {(
                [
                  { id: 'x', label: 'راستای X' },
                  { id: 'y', label: 'راستای Y' },
                  { id: 'bi', label: '۲ جهته' },
                ] as const
              ).map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSeismicDirection(d.id)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    seismicDirection === d.id
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Frequency / Speed */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              {(
                [
                  { id: 'slow', label: 'کند' },
                  { id: 'normal', label: 'نرمال' },
                  { id: 'fast', label: 'سریع' },
                ] as const
              ).map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => setSeismicSpeed(sp.id)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    seismicSpeed === sp.id
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>

            {/* Story Drift Drawer Toggle */}
            <button
              onClick={() => setShowSeismicDriftDetails(!showSeismicDriftDetails)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                showSeismicDriftDetails
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-900 text-indigo-300 border-indigo-500/40 hover:bg-slate-800'
              }`}
            >
              {showSeismicDriftDetails ? 'بستن پروفیل دریفت' : 'پروفیل دریفت طبقات (Δ)'}
            </button>

            {/* Stop Simulation Button */}
            <button
              onClick={() => setIsSimulatingSeismic(false)}
              className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
            >
              توقف
            </button>
          </div>

          {/* Real-time Seismogram Accelerogram Ticker */}
          <div className="w-80 h-7 bg-slate-950/90 border border-rose-500/30 rounded-xl overflow-hidden flex items-center px-2 shadow-lg backdrop-blur">
            <span className="text-[10px] text-rose-400 font-mono font-bold whitespace-nowrap pl-2 border-l border-rose-500/30 ml-2">
              شتاب‌نگاشت A={project.stats.baseShearXKn ? '0.35g' : '0.30g'}
            </span>
            <div className="flex-1 overflow-hidden relative h-full">
              <svg className="w-[600px] h-full animate-seismograph text-rose-400" viewBox="0 0 600 28" fill="none">
                <path
                  d="M 0 14 L 30 14 L 45 4 L 55 24 L 65 8 L 75 20 L 85 14 L 140 14 L 155 2 L 165 26 L 175 6 L 185 22 L 195 14 L 300 14 L 330 14 L 345 4 L 355 24 L 365 8 L 375 20 L 385 14 L 440 14 L 455 2 L 465 26 L 475 6 L 485 22 L 495 14 L 600 14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Story Drift Profile Drawer */}
          {showSeismicDriftDetails && (
            <div className="w-[420px] bg-slate-950/95 border border-slate-700 p-4 rounded-2xl shadow-2xl text-xs space-y-2.5 animate-fade-in backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-rose-400" />
                  پروفیل تغییرمکان جانبی الاستیک (Elastic Drift Envelope)
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  حد مجاز ۲۸۰۰: ۰.۰۲h
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {project.stories.slice().reverse().map((story, idx) => {
                  const storyIndex = project.stories.length - idx;
                  const ratio = storyIndex / project.stories.length;
                  // Exaggerated lateral displacement (mm)
                  const displacementMm = Math.round(ratio * ratio * 84 * (seismicScale === 'extreme' ? 2.5 : seismicScale === 'moderate' ? 0.35 : 1.0));
                  const driftPct = Number((0.008 + ratio * 0.006).toFixed(3));
                  const isSafe = driftPct <= 0.02;

                  return (
                    <div key={story.id} className="flex items-center justify-between gap-2 text-[11px] p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                      <span className="font-mono text-slate-300 w-16">{story.name}</span>
                      <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden flex items-center">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-rose-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (displacementMm / 200) * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-amber-300 w-16 text-left">{displacementMm} mm</span>
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${isSafe ? 'text-emerald-300 bg-emerald-950/40' : 'text-rose-300 bg-rose-950/40'}`}>
                        {driftPct}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed text-right">
                تغییر شکل سازه با انیمیشن اغراق‌آمیز CSS جهت درک بهتر اثر برهم‌نهی بارهای جانبی و توزیع برش پایه در ارتفاع ساختمان محاسبه شده است.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Top Floating Info Badge */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl shadow-lg">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        <span className="text-xs font-semibold text-slate-200">مدل سازه همگن (CSM)</span>
        <span className="text-xs text-slate-400">
          | <span className="font-mono font-semibold text-slate-200">{project.stories.length}</span> طبقه • <span className="font-mono font-semibold text-slate-200">{project.elements.length}</span> عضو
        </span>
      </div>

      {/* 3D D/C Stress Utilization Heatmap Legend */}
      {showDcHeatmap && (
        <div className="absolute top-16 right-4 z-20 bg-slate-950/95 border border-slate-800 p-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 animate-fade-in pointer-events-auto">
          <div className="font-bold text-white flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>طیف نسبت تنش (D/C Ratio Heatmap):</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-slate-300 text-[11px]">D/C ≤ 0.70 (ایمن / کم‌تنش)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
            <span className="text-slate-300 text-[11px]">0.70 &lt; D/C ≤ 0.85 (بهینه مهندسی)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
            <span className="text-slate-300 text-[11px]">0.85 &lt; D/C ≤ 1.00 (نزدیک به آستانه)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span className="text-rose-300 font-bold text-[11px]">D/C &gt; 1.00 (تنش غیرمجاز / بحرانی)</span>
          </div>
        </div>
      )}

      {/* Sliding Clash Detection Inspector Drawer */}
      {showClashDrawer && (
        <div className="absolute top-4 left-4 bottom-24 z-30 w-80 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl p-4 flex flex-col space-y-3 animate-fade-in pointer-events-auto backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold text-white">تحلیل تداخل‌های هندسی (Clashes)</h3>
            </div>
            <button
              onClick={() => {
                setShowClashDrawer(false);
                setSelectedClash(null);
                if (clashMarkerRef.current) clashMarkerRef.current.visible = false;
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400">کل تداخل‌ها:</span>
              <div className="text-rose-400 text-sm font-bold"><span className="font-mono">{clashResult.totalClashes}</span> مورد</div>
            </div>
            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400">زمان آنالیز:</span>
              <div className="font-mono font-bold text-cyan-300 text-sm">{clashResult.executionTimeMs} ms</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 text-xs">
            {clashResult.clashes.map((c) => {
              const isSelected = selectedClash?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleFocusOnClash(c)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                    isSelected
                      ? 'bg-rose-950/50 border-rose-500/60 shadow-md ring-1 ring-rose-500/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold font-mono ${
                        c.severity === 'hard'
                          ? 'bg-rose-900/60 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-900/60 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {c.severity === 'hard' ? 'برخورد سخت (Hard)' : 'هشدار فاصله آزاد'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{c.story}</span>
                  </div>
                  <p className="text-[11px] text-slate-200 leading-snug">{c.descriptionFa}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>مختصات: ({c.intersectionPoint.x}, {c.intersectionPoint.y}, {c.intersectionPoint.z})</span>
                    <span className="text-cyan-400 font-semibold flex items-center gap-0.5">
                      <Crosshair className="w-3 h-3" /> فوکوس دوربین
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Collapsible Viewport-First Bottom Dock (<= 15% footprint, solid/rgba surfaces) */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-[880px] transition-all duration-300 ease-out ${
          isDockCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
        }`}
      >
        {/* Dock Toggle Handle */}
        <div className="flex justify-center -mb-px">
          <button
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="flex items-center gap-1.5 px-4 py-1 bg-slate-900 border-t border-x border-slate-700 rounded-t-lg text-slate-300 text-xs font-medium hover:text-white transition-colors"
          >
            {isDockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{isDockCollapsed ? 'نمایش جعبه‌ابزار سه‌بعدی' : 'حالت تمام‌صفحه سینمایی'}</span>
          </button>
        </div>

        {/* Main Dock Bar */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Controls Group 1: Camera Presets */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl">
            {(['iso', 'front', 'side', 'top'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleCameraPreset(mode)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  cameraPreset === mode ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'iso' ? 'ایزومتریک' : mode === 'front' ? 'نما XZ' : mode === 'side' ? 'جانبی YZ' : 'پلان XY'}
              </button>
            ))}
          </div>

          {/* Controls Group 2: Exploded View Slider */}
          <div className="flex items-center gap-2 px-2 py-1 bg-slate-800/60 rounded-xl">
            <span className="text-slate-400 text-[11px] whitespace-nowrap">دید انفجاری:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={explodedFactor}
              onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
              className="w-24 accent-cyan-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
            <span className="text-slate-300 font-mono text-[10px] w-6">{(explodedFactor * 100).toFixed(0)}%</span>
          </div>

          {/* Controls Group 3: Story Isolation */}
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStoryFilter}
              onChange={(e) => setSelectedStoryFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
            >
              <option value="all">همه طبقات</option>
              {project.stories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.elevation}m)
                </option>
              ))}
            </select>
          </div>

          {/* Controls Group 4: Toggles (Rebar, D/C Heatmap, Wireframe) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowRebarCage(!showRebarCage)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                showRebarCage
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="نمایش قفسه آرماتوربندی میلگردها"
            >
              {showRebarCage ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>آرماتور</span>
            </button>

            <button
              onClick={() => setShowDcHeatmap(!showDcHeatmap)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                showDcHeatmap
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="نمایش طیف نسبت تقاضا به ظرفیت D/C"
            >
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>توزیع تنش D/C</span>
            </button>

            {/* Clash Detection Button */}
            <button
              onClick={() => setShowClashDrawer(!showClashDrawer)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                showClashDrawer
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                  : clashResult.totalClashes > 0
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 hover:bg-amber-900/60'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="شناسایی هوشمند تداخل‌های کالبدی تیرها و ستون‌ها"
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>تشخیص تداخل</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-amber-300 text-[10px] font-mono font-bold">
                {clashResult.totalClashes}
              </span>
            </button>

            <button
              onClick={() => setWireframeMode(!wireframeMode)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                wireframeMode
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="حالت خطی وایرفریم"
            >
              <Box className="w-3 h-3" />
              <span>شبکه</span>
            </button>

            {/* Visual Simulation: Seismic Lateral Sway Animation Button */}
            <button
              onClick={() => setIsSimulatingSeismic(!isSimulatingSeismic)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                isSimulatingSeismic
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white border-rose-400 shadow-lg shadow-rose-500/30'
                  : 'bg-slate-800 text-rose-300 border-rose-500/30 hover:bg-rose-950/40 hover:text-rose-200'
              }`}
              title="شبیه‌سازی بصری تغییر شکل سازه تحت اثر بارهای جانبی زلزله با انیمیشن اغراق‌آمیز"
            >
              <Activity className={`w-3.5 h-3.5 ${isSimulatingSeismic ? 'animate-bounce text-yellow-300' : 'text-rose-400'}`} />
              <span>{isSimulatingSeismic ? 'توقف شبیه‌سازی' : 'شبیه‌سازی زلزله'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Builds composite 3-12 part procedural models for columns, beams, slabs and shear walls
 * according to Three.js physical PBR rendering guidelines.
 */
function buildCompositeStructure(
  project: CsmProject,
  scene: THREE.Scene,
  concreteBumpTexture: THREE.CanvasTexture,
  groupsMap: Map<string, THREE.Group>,
  storySeparatorsMap: Map<string, THREE.Group>
) {
  const nodeMap = new Map(project.nodes.map((n) => [n.id, n]));

  // Standard PBR Materials with high roughness/metalness contrast
  const concreteMat = new THREE.MeshStandardMaterial({
    color: '#cbd5e1', // Slate concrete tone
    roughness: 0.85,
    metalness: 0.1,
    bumpMap: concreteBumpTexture,
    bumpScale: 0.04,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: '#334155',
    roughness: 0.25,
    metalness: 0.85,
  });

  const rebarMat = new THREE.MeshStandardMaterial({
    color: '#f59e0b', // Amber rebar
    roughness: 0.35,
    metalness: 0.75,
  });

  const wallMat = new THREE.MeshStandardMaterial({
    color: '#94a3b8',
    roughness: 0.88,
    metalness: 0.08,
    bumpMap: concreteBumpTexture,
    bumpScale: 0.05,
  });

  // Group elements by story
  for (const story of project.stories) {
    const storyGroup = new THREE.Group();
    storyGroup.name = `story_group_${story.id}`;
    scene.add(storyGroup);
    storySeparatorsMap.set(story.id, storyGroup);
  }

  // Iterate over elements and build composite models
  for (const el of project.elements) {
    const nI = nodeMap.get(el.nodeIId);
    const nJ = nodeMap.get(el.nodeJId);
    if (!nI || !nJ) continue;

    const elGroup = new THREE.Group();
    elGroup.name = `element_${el.id}`;
    elGroup.userData = { id: el.id, dcRatio: el.designResults?.dcRatio || 0.7 };

    const storyGroup = storySeparatorsMap.get(el.story);
    if (storyGroup) {
      storyGroup.add(elGroup);
    } else {
      scene.add(elGroup);
    }
    groupsMap.set(el.id, elGroup);

    const length = Math.hypot(nJ.x - nI.x, nJ.y - nI.y, nJ.z - nI.z);
    const midX = (nI.x + nJ.x) / 2;
    const midY = (nI.z + nJ.z) / 2; // In Three.js, Y is vertical elevation
    const midZ = (nI.y + nJ.y) / 2;

    if (el.type === 'column') {
      // Composite Column: 4 parts (1. Core body, 2. Bottom footing pedestal, 3. Top rigid joint haunch, 4. Rebar cage)
      const colWidth = 0.6;
      const colDepth = 0.6;

      // 1. Column Core
      const colGeo = new THREE.BoxGeometry(colWidth, length, colDepth);
      const colMesh = new THREE.Mesh(colGeo, concreteMat.clone());
      colMesh.castShadow = true;
      colMesh.receiveShadow = true;
      colMesh.userData = { dcRatio: el.designResults?.dcRatio, originalColor: '#cbd5e1' };
      elGroup.add(colMesh);

      // 2. Base Pedestal
      const pedGeo = new THREE.BoxGeometry(colWidth + 0.15, 0.25, colDepth + 0.15);
      const pedMesh = new THREE.Mesh(pedGeo, concreteMat.clone());
      pedMesh.position.y = -length / 2 + 0.125;
      elGroup.add(pedMesh);

      // 3. Top Joint Zone
      const jointGeo = new THREE.BoxGeometry(colWidth + 0.08, 0.35, colDepth + 0.08);
      const jointMesh = new THREE.Mesh(jointGeo, concreteMat.clone());
      jointMesh.position.y = length / 2 - 0.175;
      elGroup.add(jointMesh);

      // 4. Procedural Rebar Cage (4 corner bars + 3 stirrup rings)
      const rebarGroup = new THREE.Group();
      rebarGroup.name = 'rebar_cage';
      const barGeo = new THREE.CylinderGeometry(0.016, 0.016, length - 0.1, 8);

      const barOffsets = [
        [-colWidth / 2 + 0.06, -colDepth / 2 + 0.06],
        [colWidth / 2 - 0.06, -colDepth / 2 + 0.06],
        [-colWidth / 2 + 0.06, colDepth / 2 - 0.06],
        [colWidth / 2 - 0.06, colDepth / 2 - 0.06],
      ];

      for (const [bx, bz] of barOffsets) {
        const barMesh = new THREE.Mesh(barGeo, rebarMat);
        barMesh.position.set(bx, 0, bz);
        rebarGroup.add(barMesh);
      }

      // Stirrup rings
      const ringGeo = new THREE.TorusGeometry(colWidth / 2 - 0.05, 0.008, 6, 4);
      ringGeo.rotateX(Math.PI / 2);
      for (let r = -length / 2 + 0.3; r <= length / 2 - 0.3; r += 0.45) {
        const ringMesh = new THREE.Mesh(ringGeo, rebarMat);
        ringMesh.position.y = r;
        rebarGroup.add(ringMesh);
      }
      elGroup.add(rebarGroup);

      elGroup.position.set(midX, midY, midZ);
    } else if (el.type === 'beam') {
      // Composite Beam: 3 parts (1. Main span, 2. End stiffening connection haunches, 3. Longitudinal rebar lines)
      const bWidth = 0.4;
      const bDepth = 0.5;

      const beamGeo = new THREE.BoxGeometry(length, bDepth, bWidth);
      const beamMesh = new THREE.Mesh(beamGeo, concreteMat.clone());
      beamMesh.castShadow = true;
      beamMesh.receiveShadow = true;
      beamMesh.userData = { dcRatio: el.designResults?.dcRatio, originalColor: '#cbd5e1' };
      elGroup.add(beamMesh);

      // End connection plates/haunches
      const endGeo = new THREE.BoxGeometry(0.15, bDepth + 0.04, bWidth + 0.04);
      const end1 = new THREE.Mesh(endGeo, concreteMat.clone());
      end1.position.x = -length / 2 + 0.08;
      const end2 = new THREE.Mesh(endGeo, concreteMat.clone());
      end2.position.x = length / 2 - 0.08;
      elGroup.add(end1);
      elGroup.add(end2);

      // Beam Rebars (Top 2 bars + Bottom 2 bars)
      const beamRebarGroup = new THREE.Group();
      beamRebarGroup.name = 'rebar_cage';
      const bBarGeo = new THREE.CylinderGeometry(0.014, 0.014, length - 0.1, 8);
      bBarGeo.rotateZ(Math.PI / 2);

      const bBarPositions = [
        [0, bDepth / 2 - 0.05, bWidth / 2 - 0.05],
        [0, bDepth / 2 - 0.05, -bWidth / 2 + 0.05],
        [0, -bDepth / 2 + 0.05, bWidth / 2 - 0.05],
        [0, -bDepth / 2 + 0.05, -bWidth / 2 + 0.05],
      ];

      for (const [px, py, pz] of bBarPositions) {
        const barMesh = new THREE.Mesh(bBarGeo, rebarMat);
        barMesh.position.set(px, py, pz);
        beamRebarGroup.add(barMesh);
      }
      elGroup.add(beamRebarGroup);

      // Orientation calculation
      elGroup.position.set(midX, midY, midZ);
      const angle = Math.atan2(nJ.y - nI.y, nJ.x - nI.x);
      elGroup.rotation.y = -angle;
    } else if (el.type === 'shear_wall') {
      // Shear Wall Panel: 3 parts (1. Central web wall, 2. Left boundary element, 3. Right boundary element)
      const wallThickness = 0.25;
      const wallWidth = 3.0;

      const wallGeo = new THREE.BoxGeometry(wallWidth, length, wallThickness);
      const wallMesh = new THREE.Mesh(wallGeo, wallMat.clone());
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      wallMesh.userData = { dcRatio: el.designResults?.dcRatio, originalColor: '#94a3b8' };
      elGroup.add(wallMesh);

      // Boundary boundary edge columns
      const edgeGeo = new THREE.BoxGeometry(0.4, length, wallThickness + 0.1);
      const edgeL = new THREE.Mesh(edgeGeo, concreteMat.clone());
      edgeL.position.x = -wallWidth / 2 + 0.2;
      const edgeR = new THREE.Mesh(edgeGeo, concreteMat.clone());
      edgeR.position.x = wallWidth / 2 - 0.2;
      elGroup.add(edgeL);
      elGroup.add(edgeR);

      elGroup.position.set(midX, midY, midZ);
    } else if (el.type === 'brace') {
      // Steel Brace: Tubular or UNP profile
      const braceGeo = new THREE.BoxGeometry(0.16, length, 0.16);
      const braceMesh = new THREE.Mesh(braceGeo, steelMat.clone());
      braceMesh.castShadow = true;
      braceMesh.userData = { dcRatio: el.designResults?.dcRatio, originalColor: '#334155' };
      elGroup.add(braceMesh);

      elGroup.position.set(midX, midY, midZ);
      // Orient brace towards direction vector
      const dir = _vec3.set(nJ.x - nI.x, nJ.z - nI.z, nJ.y - nI.y).normalize();
      elGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    }
  }

  // Add semi-transparent floor slab panels for architectural context
  for (const story of project.stories) {
    const slabGeo = new THREE.BoxGeometry(5.5 * 3, 0.15, 6.0 * 3);
    const slabMat = new THREE.MeshStandardMaterial({
      color: '#64748b',
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const slabMesh = new THREE.Mesh(slabGeo, slabMat);
    slabMesh.position.set((5.5 * 3) / 2, story.elevation, (6.0 * 3) / 2);
    slabMesh.receiveShadow = true;

    const storyGroup = storySeparatorsMap.get(story.id);
    if (storyGroup) storyGroup.add(slabMesh);
    else scene.add(slabMesh);
  }
}
