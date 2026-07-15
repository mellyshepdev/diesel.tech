import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ─────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────
export type EngineId = 'volvo-d13' | 'cummins-x15' | 'paccar-mx13' | 'paccar-mx11';

interface EngineInfo {
  maker: string;
  makerLetter: string;
  model: string;
  tagline: string;
  hp: string;
  torque: string;
  specs: { label: string; value: string }[];
  /** Brand-specific overrides for shared hotspot descriptions */
  hotspotDescs?: Record<string, string>;
}

const ENGINES: Record<EngineId, EngineInfo> = {
  'volvo-d13': {
    maker: 'VOLVO TRUCKS',
    makerLetter: 'V',
    model: 'D13',
    tagline: '12.8L Inline-6 Diesel · EPA 2027 · Interactive 3D Model',
    hp: '500 HP',
    torque: '1850 lb·ft',
    specs: [
      { label: 'Displacement', value: '12.8 L' },
      { label: 'Configuration', value: 'Inline-6' },
      { label: 'Peak Power', value: '500 HP' },
      { label: 'Max Torque', value: '1,850 lb-ft' },
      { label: 'Bore × Stroke', value: '131 × 158 mm' },
      { label: 'Compression', value: '17.3:1' },
      { label: 'Emission Standard', value: 'EPA 2027' },
      { label: 'Fuel System', value: 'Common Rail DI' },
      { label: 'Valvetrain', value: 'OHV, 4 per cyl' },
      { label: 'Cooling', value: 'Liquid Cooled' },
    ],
    hotspotDescs: {
      ecm: 'Volvo EMS engine management module, block-mounted with heat-sink fins. Runs injection timing, I-Shift integration, and OBD diagnostics.',
    },
  },
  'cummins-x15': {
    maker: 'CUMMINS',
    makerLetter: 'C',
    model: 'X15',
    tagline: '15.0L Inline-6 Diesel · EPA 2027 · Interactive 3D Model',
    hp: '565 HP',
    torque: '1850 lb·ft',
    specs: [
      { label: 'Displacement', value: '15.0 L' },
      { label: 'Configuration', value: 'Inline-6' },
      { label: 'Peak Power', value: '565 HP' },
      { label: 'Max Torque', value: '1,850 lb-ft' },
      { label: 'Bore × Stroke', value: '137 × 169 mm' },
      { label: 'Compression', value: '17.3:1' },
      { label: 'Emission Standard', value: 'EPA 2027' },
      { label: 'Fuel System', value: 'XPI Common Rail' },
      { label: 'Valvetrain', value: 'OHV, 4 per cyl' },
      { label: 'Cooling', value: 'Liquid Cooled' },
    ],
    hotspotDescs: {
      filters: 'Fleetguard spin-on oil/fuel filtration in series configuration. Full-flow filtration ensures maximum engine protection and extended service intervals.',
      bellhousing: 'SAE #1 flywheel/bell housing mates with Eaton Cummins Endurant automated transmission. Precision-machined for zero-runout alignment.',
      ecm: 'Cummins CM2350 electronic control module, block-mounted and fuel-cooled. Runs XPI injection, aftertreatment, and OBD diagnostics.',
    },
  },
  'paccar-mx13': {
    maker: 'PACCAR',
    makerLetter: 'P',
    model: 'MX-13',
    tagline: '12.9L Inline-6 Diesel · EPA 2027 · Interactive 3D Model',
    hp: '510 HP',
    torque: '1850 lb·ft',
    specs: [
      { label: 'Displacement', value: '12.9 L' },
      { label: 'Configuration', value: 'Inline-6' },
      { label: 'Peak Power', value: '510 HP' },
      { label: 'Max Torque', value: '1,850 lb-ft' },
      { label: 'Bore × Stroke', value: '130 × 162 mm' },
      { label: 'Compression', value: '18.5:1' },
      { label: 'Emission Standard', value: 'EPA 2027' },
      { label: 'Fuel System', value: 'Common Rail DI' },
      { label: 'Valvetrain', value: 'OHC, 4 per cyl' },
      { label: 'Cooling', value: 'Liquid Cooled' },
    ],
    hotspotDescs: {
      filters: 'PACCAR spin-on oil/fuel filters in series configuration. Full-flow filtration ensures maximum engine protection and extended service intervals.',
      bellhousing: 'SAE #1 flywheel/bell housing for direct mating with the PACCAR TX-12 automated transmission. Precision-machined for zero-runout alignment.',
      ecm: 'PACCAR engine ECU, block-mounted with cooling fins. Runs common-rail injection, aftertreatment, and OBD diagnostics.',
    },
  },
  'paccar-mx11': {
    maker: 'PACCAR',
    makerLetter: 'P',
    model: 'MX-11',
    tagline: '10.8L Inline-6 Diesel · EPA 2027 · Interactive 3D Model',
    hp: '430 HP',
    torque: '1450 lb·ft',
    specs: [
      { label: 'Displacement', value: '10.8 L' },
      { label: 'Configuration', value: 'Inline-6' },
      { label: 'Peak Power', value: '430 HP' },
      { label: 'Max Torque', value: '1,450 lb-ft' },
      { label: 'Bore × Stroke', value: '123 × 152 mm' },
      { label: 'Compression', value: '18.5:1' },
      { label: 'Emission Standard', value: 'EPA 2027' },
      { label: 'Fuel System', value: 'Common Rail DI' },
      { label: 'Valvetrain', value: 'OHC, 4 per cyl' },
      { label: 'Cooling', value: 'Liquid Cooled' },
    ],
    hotspotDescs: {
      filters: 'PACCAR spin-on oil/fuel filters in series configuration. Full-flow filtration ensures maximum engine protection and extended service intervals.',
      bellhousing: 'SAE #1 flywheel/bell housing for direct mating with the PACCAR TX-12 automated transmission. Precision-machined for zero-runout alignment.',
      ecm: 'PACCAR engine ECU, block-mounted with cooling fins. Runs common-rail injection, aftertreatment, and OBD diagnostics.',
    },
  },
};

const ENGINE_ORDER: EngineId[] = ['volvo-d13', 'cummins-x15', 'paccar-mx13', 'paccar-mx11'];

// ─────────────────────────────────────────────────────────
// Service / repairs
// ─────────────────────────────────────────────────────────
interface ServiceAnim {
  obj: THREE.Object3D;
  vy: number;
  spin: number;
  targetY: number;
  onDone?: () => void;
}

interface OilFlow {
  active: boolean;
  t: number;
  duration: number;
  puddleScale: number;
  onDone?: () => void;
}

type RepairId = 'oil-change' | 'pan-gasket';

const REPAIRS: { id: RepairId; icon: string; label: string; desc: string }[] = [
  {
    id: 'oil-change',
    icon: '🛢️',
    label: 'Oil & Filter Change',
    desc: 'Remove the three spin-on filters, then drop the oil pan to drain. Pan bolts need the 10" socket extension + electric runner or hand tools.',
  },
  {
    id: 'pan-gasket',
    icon: '🔩',
    label: 'Oil Pan Gasket Repair',
    desc: 'Break every pan flange bolt loose one at a time, drop the pan, fit the new gasket, re-torque.',
  },
];

const PAN_BOLT_COUNT = 8;
const FILTER_COUNT = 3;

const HOTSPOT_DATA = [
  {
    id: 'turbo',
    label: 'Turbocharger',
    icon: '🌀',
    pos3d: [0.55, 0.3, 0.28] as [number, number, number],
    desc: 'Variable geometry turbocharger (VGT) with optimised compressor wheel for EPA 2027 compliant low-NOx operation. Delivers peak boost across wide RPM band.',
    color: '#00d4ff',
  },
  {
    id: 'fan',
    label: 'Viscous Fan',
    icon: '💨',
    pos3d: [-1.38, 0.12, 0] as [number, number, number],
    desc: '27" viscous fan clutch assembly with temperature-controlled engagement. Reduces parasitic loss by up to 20% vs. direct-drive fans.',
    color: '#00ffaa',
  },
  {
    id: 'filters',
    label: 'Triple Oil Filters',
    icon: '🔧',
    pos3d: [0.33, -0.58, 0.38] as [number, number, number],
    desc: 'Spin-on oil filtration: two full-flow filters plus one bypass filter. Full-flow filtration ensures maximum engine protection and extended service intervals.',
    color: '#ff9900',
  },
  {
    id: 'egr',
    label: 'EGR System',
    icon: '♻️',
    pos3d: [-0.15, 0.22, 0.36] as [number, number, number],
    desc: 'High-efficiency Exhaust Gas Recirculation cooler reduces combustion temperatures, lowering NOx emissions to meet EPA 2027 without sacrificing power.',
    color: '#aa44ff',
  },
  {
    id: 'bellhousing',
    label: 'Bell Housing',
    icon: '⚙️',
    pos3d: [-1.2, -0.28, 0] as [number, number, number],
    desc: 'SAE #1 flywheel/bell housing for direct mating with Volvo I-Shift automatic transmission. Precision-machined for zero-runout alignment.',
    color: '#ff4488',
  },
  {
    id: 'ecm',
    label: 'Engine ECM',
    icon: '🧠',
    pos3d: [-0.55, -0.05, -0.48] as [number, number, number],
    desc: 'Block-mounted engine control module with fuel-cooled heat sink fins. Runs injection timing, aftertreatment, and OBD diagnostics.',
    color: '#ffcc00',
  },
];

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────
export default function EngineViewer() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const engineGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());

  const [engineId, setEngineId] = useState<EngineId>('volvo-d13');
  const engine = ENGINES[engineId];
  const hotspots = HOTSPOT_DATA.map(h => ({ ...h, desc: engine.hotspotDescs?.[h.id] ?? h.desc }));
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  // ── Repairs / service mode ──
  const [repairsOpen, setRepairsOpen] = useState(false);
  const [activeRepair, setActiveRepair] = useState<RepairId | null>(null);
  const [socketExt, setSocketExt] = useState<'none' | 'stubby' | 'long'>('none');
  const [driver, setDriver] = useState<'electric' | 'hand' | null>(null);
  const [filtersRemoved, setFiltersRemoved] = useState<boolean[]>(Array(FILTER_COUNT).fill(false));
  const [boltsRemoved, setBoltsRemoved] = useState<boolean[]>(Array(PAN_BOLT_COUNT).fill(false));
  const [panRemoved, setPanRemoved] = useState(false);
  const [plugRemoved, setPlugRemoved] = useState(false);
  const [oilDrained, setOilDrained] = useState(false);
  const [draining, setDraining] = useState(false);
  const [serviceMsg, setServiceMsg] = useState('');

  const SERVICE_PARTS = [
    'service-oil-pan',
    'service-drain-plug',
    ...Array.from({ length: FILTER_COUNT }, (_, i) => `service-oil-filter-${i}`),
    ...Array.from({ length: PAN_BOLT_COUNT }, (_, i) => `service-pan-bolt-${i}`),
  ];

  const startOilFlow = useCallback((duration: number, puddleScale: number, onDone?: () => void) => {
    const eg = engineGroupRef.current;
    if (!eg) return;
    eg.userData.oilFlow = { active: true, t: 0, duration, puddleScale, onDone } satisfies OilFlow;
  }, []);

  /** Kick off a part-removal animation; returns false if the part is gone/missing. */
  const startRemoval = useCallback((name: string, opts: { vy: number; spin?: number; drop?: number }, onDone?: () => void) => {
    const eg = engineGroupRef.current;
    if (!eg) return false;
    const obj = eg.getObjectByName(name);
    if (!obj || !obj.visible) return false;
    const anims: ServiceAnim[] = eg.userData.serviceAnims ?? (eg.userData.serviceAnims = []);
    if (anims.some(a => a.obj === obj)) return false; // already animating
    anims.push({ obj, vy: opts.vy, spin: opts.spin ?? 0.25, targetY: obj.position.y - (opts.drop ?? 0.9), onDone });
    return true;
  }, []);

  const restoreParts = useCallback((names: string[]) => {
    const eg = engineGroupRef.current;
    if (!eg) return;
    names.forEach(n => {
      const obj = eg.getObjectByName(n);
      if (obj) {
        obj.visible = true;
        obj.position.set(0, 0, 0);
        obj.rotation.set(0, 0, 0);
      }
    });
  }, []);

  /** null when the pan-bolt tooling is right; otherwise the reason it isn't. */
  const toolProblem = (): string | null => {
    if (socketExt === 'none') return 'You need a socket extension to reach the pan bolts.';
    if (socketExt === 'stubby') return 'The 3" stubby won\'t reach past the crossmember — grab the 10" extension.';
    if (!driver) return 'Pick a driver: electric runner or hand tools.';
    return null;
  };

  const boltVy = driver === 'electric' ? 0.02 : 0.006;

  const removeDrainPlug = () => {
    if (plugRemoved || panRemoved || draining) return;
    if (startRemoval('service-drain-plug', { vy: 0.006, spin: 0.4, drop: 0.22 }, () => {
      setPlugRemoved(true);
      if (oilDrained) {
        setServiceMsg('Plug out — no spill, the engine is already drained.');
        return;
      }
      setDraining(true);
      setServiceMsg('Plug out — oil is draining, let it run…');
      startOilFlow(4, 1, () => {
        setDraining(false);
        setOilDrained(true);
        setServiceMsg('Oil fully drained ✓');
      });
    })) {
      setServiceMsg('Backing out the drain plug…');
    }
  };

  const removeFilter = (i: number) => {
    if (filtersRemoved[i]) return;
    if (startRemoval(`service-oil-filter-${i}`, { vy: 0.012, spin: 0.35, drop: 0.7 }, () => {
      setFiltersRemoved(prev => prev.map((v, j) => (j === i ? true : v)));
      setServiceMsg(`Filter ${i + 1} spun off ✓`);
    })) {
      setServiceMsg(`Unscrewing filter ${i + 1}…`);
    }
  };

  const removeBolt = (i: number) => {
    if (boltsRemoved[i]) return;
    const problem = toolProblem();
    if (problem) { setServiceMsg(problem); return; }
    if (startRemoval(`service-pan-bolt-${i}`, { vy: boltVy, spin: driver === 'electric' ? 0.6 : 0.2, drop: 0.4 }, () => {
      setBoltsRemoved(prev => prev.map((v, j) => (j === i ? true : v)));
      setServiceMsg(`Bolt ${i + 1}/${PAN_BOLT_COUNT} out ✓`);
    })) {
      setServiceMsg(driver === 'electric' ? `Zipping bolt ${i + 1} out with the runner…` : `Breaking bolt ${i + 1} loose by hand…`);
    }
  };

  const allFiltersOff = filtersRemoved.every(Boolean);
  const allBoltsOff = boltsRemoved.every(Boolean);

  const removePan = () => {
    if (panRemoved) return;
    const problem = toolProblem();
    if (problem) { setServiceMsg(problem); return; }
    if (activeRepair === 'oil-change' && !allFiltersOff) { setServiceMsg('Spin the filters off first.'); return; }
    if (!allBoltsOff) { setServiceMsg('The pan is still bolted up — remove every flange bolt first.'); return; }
    const wasFull = !oilDrained;
    if (startRemoval('service-oil-pan', { vy: driver === 'electric' ? 0.015 : 0.008, spin: 0, drop: 0.8 }, () => {
      setPanRemoved(true);
      if (wasFull) {
        // Dropped a full pan — everything it was holding hits the floor
        setOilDrained(true);
        setServiceMsg('😱 The pan was still full — oil everywhere! Pull the drain plug first next time.');
        startOilFlow(2.5, 2.2);
      } else {
        setServiceMsg(activeRepair === 'pan-gasket'
          ? 'Pan is down — scrape the old gasket and fit the new one.'
          : 'Pan is down, oil drained.');
      }
    })) {
      setServiceMsg('Lowering the oil pan…');
    }
  };

  const resetService = useCallback(() => {
    const eg = engineGroupRef.current;
    if (eg) {
      eg.userData.serviceAnims = [];
      eg.userData.oilFlow = undefined;
      const stream = eg.getObjectByName('oil-stream');
      if (stream) stream.visible = false;
      const puddle = eg.getObjectByName('oil-puddle');
      if (puddle) {
        puddle.visible = false;
        puddle.scale.set(0.01, 0.01, 0.01);
      }
    }
    restoreParts(SERVICE_PARTS);
    setFiltersRemoved(Array(FILTER_COUNT).fill(false));
    setBoltsRemoved(Array(PAN_BOLT_COUNT).fill(false));
    setPanRemoved(false);
    setPlugRemoved(false);
    setOilDrained(false); // reinstalled + refilled — full of fresh oil again
    setDraining(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreParts]);

  const finishRepair = () => {
    resetService();
    setServiceMsg(activeRepair === 'pan-gasket'
      ? 'New gasket fitted, pan re-torqued to spec ✓'
      : 'New filters on, pan re-torqued, filled with fresh oil ✓');
    setActiveRepair(null);
  };

  const openRepair = (id: RepairId) => {
    resetService();
    setServiceMsg('');
    setActiveRepair(id);
  };

  const repairComplete = panRemoved && (activeRepair === 'pan-gasket' || allFiltersOff);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [screenPositions, setScreenPositions] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});
  const [rpm, setRpm] = useState(800);
  const [engineOn, setEngineOn] = useState(false);

  // Simulate RPM when engine "on"
  useEffect(() => {
    if (!engineOn) { setRpm(0); return; }
    const interval = setInterval(() => {
      setRpm(prev => {
        const target = 1200 + Math.random() * 200;
        return Math.round(prev + (target - prev) * 0.1);
      });
    }, 100);
    return () => clearInterval(interval);
  }, [engineOn]);

  const toggleAutoRotate = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    setAutoRotate(prev => {
      controls.autoRotate = !prev;
      return !prev;
    });
  }, []);

  const resetCamera = useCallback(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    camera.position.set(2.8, 1.2, 2.8);
    controls.target.set(0, 0, 0);
    controls.update();
    setAutoRotate(true);
    controls.autoRotate = true;
    setActiveHotspot(null);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const container = canvasRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050810);
    scene.fog = new THREE.FogExp2(0x050810, 0.06);

    // Camera
    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(3.0, 1.4, 3.0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.04;
    controls.minDistance = 1.8;
    controls.maxDistance = 9;
    controls.maxPolarAngle = Math.PI * 0.88;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    // Lighting setup
    const ambient = new THREE.AmbientLight(0x304060, 1.0);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff8f0, 4.0);
    keyLight.position.set(4, 6, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x4060ff, 1.8);
    fillLight.position.set(-5, 2, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x00ffcc, 1.2);
    rimLight.position.set(0, 4, -5);
    scene.add(rimLight);

    const underGlow = new THREE.PointLight(0x0066ff, 1.5, 5);
    underGlow.position.set(0, -1.8, 0);
    scene.add(underGlow);

    const sideGlow = new THREE.PointLight(0x00ffaa, 0.6, 4);
    sideGlow.position.set(2, 0.5, -1);
    scene.add(sideGlow);

    // Engine group
    const engineGroup = new THREE.Group();
    engineGroupRef.current = engineGroup;
    scene.add(engineGroup);

    // Build engine
    buildVolvoD13(engineGroup, setLoadProgress, setIsLoading);

    // Ground
    const groundGeo = new THREE.CircleGeometry(4.5, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a1428,
      metalness: 0.9,
      roughness: 0.15,
      transparent: true,
      opacity: 0.8,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid
    const grid = new THREE.GridHelper(9, 18, 0x0d2a4a, 0x071525);
    grid.position.y = -1.11;
    scene.add(grid);

    // Particles
    const particleCount = 500;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      const c = Math.random();
      particleColors[i * 3] = c * 0.2;
      particleColors[i * 3 + 1] = c * 0.6;
      particleColors[i * 3 + 2] = c;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    const particleMat = new THREE.PointsMaterial({ size: 0.018, vertexColors: true, transparent: true, opacity: 0.5 });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Energy ring
    const ringGeo = new THREE.RingGeometry(1.4, 1.7, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x0088ff, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.09;
    scene.add(ring);

    // Hotspot 3D markers
    const hotspotMeshes: THREE.Mesh[] = [];
    HOTSPOT_DATA.forEach(hs => {
      const geo = new THREE.SphereGeometry(0.045, 16, 16);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(hs.color), transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...hs.pos3d);
      mesh.userData.id = hs.id;
      scene.add(mesh);
      hotspotMeshes.push(mesh);

      // Pulse ring around hotspot
      const pGeo = new THREE.RingGeometry(0.06, 0.09, 20);
      const pMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(hs.color), transparent: true, opacity: 0.4, side: THREE.DoubleSide });
      const pulse = new THREE.Mesh(pGeo, pMat);
      pulse.position.set(...hs.pos3d);
      pulse.userData.isPulse = true;
      pulse.userData.hsColor = hs.color;
      scene.add(pulse);
    });

    // Animate
    const clock = clockRef.current;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Ring pulse
      ring.material.opacity = 0.06 + 0.06 * Math.sin(t * 1.8);
      ring.scale.set(1 + 0.04 * Math.sin(t * 1.2), 1 + 0.04 * Math.sin(t * 1.2), 1);

      // Under glow pulse
      underGlow.intensity = 1.0 + 0.6 * Math.sin(t * 2.2);

      // Particles
      particles.rotation.y = t * 0.025;

      // Fan
      if (engineGroup.userData.fanBladeGroup) {
        engineGroup.userData.fanBladeGroup.rotation.x += 0.018;
      }

      // Service-mode removal animations (parts unscrew + drop, then hide)
      const serviceAnims = engineGroup.userData.serviceAnims as ServiceAnim[] | undefined;
      if (serviceAnims && serviceAnims.length) {
        for (let i = serviceAnims.length - 1; i >= 0; i--) {
          const a = serviceAnims[i];
          a.obj.position.y -= a.vy;
          a.obj.rotation.y += a.spin;
          if (a.obj.position.y <= a.targetY) {
            a.obj.visible = false;
            serviceAnims.splice(i, 1);
            a.onDone?.();
          }
        }
      }

      // Oil draining out of the pan (plug pulled, or a full pan dropped)
      const oilFlow = engineGroup.userData.oilFlow as OilFlow | undefined;
      if (oilFlow?.active) {
        oilFlow.t += 1 / 60;
        const stream = engineGroup.getObjectByName('oil-stream');
        const puddle = engineGroup.getObjectByName('oil-puddle');
        if (stream) stream.visible = oilFlow.t < oilFlow.duration;
        if (puddle) {
          puddle.visible = true;
          const s = Math.min(1, oilFlow.t / oilFlow.duration) * oilFlow.puddleScale;
          puddle.scale.set(s, s, s);
        }
        if (oilFlow.t >= oilFlow.duration) {
          oilFlow.active = false;
          oilFlow.onDone?.();
        }
      }

      // Hotspot pulse rings billboard toward camera
      scene.children.forEach(child => {
        if (child.userData.isPulse) {
          child.lookAt(camera.position);
          const s = 1 + 0.2 * Math.sin(t * 3 + child.position.x);
          child.scale.set(s, s, s);
          (child as THREE.Mesh).material instanceof THREE.MeshBasicMaterial &&
            ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).color;
          ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.3 + 0.3 * Math.sin(t * 3);
        }
      });

      // Hotspot dot billboard
      hotspotMeshes.forEach(mesh => {
        const s = 1 + 0.15 * Math.sin(t * 4 + mesh.position.x);
        mesh.scale.set(s, s, s);
      });

      // Update 2D screen positions for hotspot labels
      const newPositions: Record<string, { x: number; y: number; visible: boolean }> = {};
      HOTSPOT_DATA.forEach(hs => {
        const v = new THREE.Vector3(...hs.pos3d);
        v.project(camera);
        const x = (v.x * 0.5 + 0.5) * container.clientWidth;
        const y = (-v.y * 0.5 + 0.5) * container.clientHeight;
        newPositions[hs.id] = { x, y, visible: v.z < 1 };
      });
      setScreenPositions(newPositions);

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const activeHotspotData = hotspots.find(h => h.id === activeHotspot);

  return (
    <div className="relative w-full h-full select-none" style={{ background: '#050810' }}>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{ background: '#050810' }}>
          <div className="text-center space-y-5">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-cyan-400/50 animate-spin" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-0 flex items-center justify-center text-4xl">⚙️</div>
            </div>
            <div>
              <h2 className="text-white text-2xl font-black tracking-widest uppercase">{engine.maker} {engine.model}</h2>
              <p className="text-cyan-400 text-sm tracking-widest mt-1">3D ENGINE VIEWER</p>
            </div>
            <div className="w-72 mx-auto">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Loading components...</span>
                <span className="text-cyan-400">{Math.round(loadProgress)}%</span>
              </div>
              <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${loadProgress}%`,
                    background: 'linear-gradient(90deg, #00b4ff, #00ffaa)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <div ref={canvasRef} className="w-full h-full" />

      {/* Scan line overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none">
        <div className="flex items-start justify-between px-5 pt-4">
          {/* Left: brand */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-[9px] font-black">{engine.makerLetter}</span>
                </div>
                <span className="text-white font-black text-sm tracking-[0.3em] uppercase">{engine.maker}</span>
              </div>
            </div>
            <h1 className="text-white font-black text-4xl leading-none tracking-tight">
              {engine.model} <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #00d4ff, #00ffaa)' }}>Engine</span>
            </h1>
            <p className="text-gray-400 text-xs mt-1 tracking-widest uppercase">{engine.tagline}</p>
            {/* Engine selector */}
            <div className="flex items-center gap-1.5 mt-3 pointer-events-auto">
              {ENGINE_ORDER.map(id => (
                <button
                  key={id}
                  onClick={() => { setEngineId(id); setActiveHotspot(null); }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-all uppercase tracking-wider ${
                    id === engineId
                      ? 'text-cyan-300 border-cyan-400/60 bg-cyan-400/10'
                      : 'text-gray-500 border-gray-700 hover:text-gray-300 hover:border-gray-500 bg-black/30'
                  }`}
                >
                  {ENGINES[id].maker.split(' ')[0]} {ENGINES[id].model}
                </button>
              ))}
              <button
                onClick={() => { setRepairsOpen(o => !o); setActiveRepair(null); }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-all uppercase tracking-wider ${
                  repairsOpen
                    ? 'text-amber-300 border-amber-400/60 bg-amber-400/10'
                    : 'text-gray-500 border-gray-700 hover:text-amber-300 hover:border-amber-500/50 bg-black/30'
                }`}
              >
                🔧 Repairs
              </button>
            </div>
          </div>

          {/* Right: badges */}
          <div className="hidden md:flex flex-col gap-2 items-end mt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-cyan-400 border border-cyan-400/40 rounded px-2 py-0.5 font-mono">{engine.hp}</span>
              <span className="text-xs text-green-400 border border-green-400/40 rounded px-2 py-0.5 font-mono">{engine.torque}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
              INTERACTIVE 3D
            </div>
          </div>
        </div>
      </div>

      {/* Repairs panel */}
      {repairsOpen && !isLoading && (
        <div className="absolute right-4 top-32 w-80 max-h-[65vh] overflow-y-auto bg-black/75 backdrop-blur-md border border-amber-400/25 rounded-xl p-4 z-30 space-y-3">
          {activeRepair === null ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-amber-300 text-xs font-bold tracking-widest uppercase">Engine Repairs</span>
                <button onClick={() => setRepairsOpen(false)} className="text-gray-500 hover:text-white text-sm">✕</button>
              </div>
              {REPAIRS.map(r => (
                <button
                  key={r.id}
                  onClick={() => openRepair(r.id)}
                  className="w-full text-left p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-amber-400/10 hover:border-amber-400/40 transition"
                >
                  <div className="text-white text-sm font-bold">{r.icon} {r.label}</div>
                  <div className="text-gray-400 text-xs mt-1 leading-relaxed">{r.desc}</div>
                </button>
              ))}
              {serviceMsg && <p className="text-green-300 text-xs">{serviceMsg}</p>}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <button onClick={() => { setActiveRepair(null); setServiceMsg(''); }} className="text-gray-400 hover:text-white text-xs">← Repairs</button>
                <button onClick={() => setRepairsOpen(false)} className="text-gray-500 hover:text-white text-sm">✕</button>
              </div>
              <div className="text-white text-sm font-bold">
                {REPAIRS.find(r => r.id === activeRepair)!.icon} {REPAIRS.find(r => r.id === activeRepair)!.label}
              </div>

              {/* Tools */}
              <div className="space-y-1.5">
                <p className="text-gray-400 text-[11px] uppercase tracking-widest">Socket extension</p>
                <div className="flex gap-1.5">
                  {([['none', 'None'], ['stubby', '3" Stubby'], ['long', '10" Long']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => { setSocketExt(val); setServiceMsg(''); }}
                      className={`px-2 py-1 text-[11px] rounded border font-bold ${
                        socketExt === val ? 'text-cyan-300 border-cyan-400/60 bg-cyan-400/10' : 'text-gray-500 border-gray-700 hover:text-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-gray-400 text-[11px] uppercase tracking-widest mt-2">Driver</p>
                <div className="flex gap-1.5">
                  {([['electric', '⚡ Electric runner'], ['hand', '🔧 Hand tools']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => { setDriver(val); setServiceMsg(''); }}
                      className={`px-2 py-1 text-[11px] rounded border font-bold ${
                        driver === val ? 'text-cyan-300 border-cyan-400/60 bg-cyan-400/10' : 'text-gray-500 border-gray-700 hover:text-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drain the oil */}
              <div className="space-y-1.5">
                <p className="text-gray-400 text-[11px] uppercase tracking-widest">Step 1 — Drain the oil</p>
                <button
                  onClick={removeDrainPlug}
                  disabled={plugRemoved || panRemoved || draining}
                  className={`w-full py-1.5 text-xs font-bold rounded-lg border transition ${
                    oilDrained
                      ? 'text-green-300 border-green-500/40 bg-green-500/10'
                      : draining
                        ? 'text-amber-300 border-amber-400/40 bg-amber-400/10 animate-pulse'
                        : 'text-white border-white/20 bg-white/5 hover:border-cyan-400/50'
                  }`}
                >
                  {draining ? '🛢️ Draining…' : oilDrained ? '✓ Oil drained' : plugRemoved ? '✓ Plug out' : '🔩 Pull drain plug'}
                </button>
              </div>

              {/* Oil change: filters */}
              {activeRepair === 'oil-change' && (
                <div className="space-y-1.5">
                  <p className="text-gray-400 text-[11px] uppercase tracking-widest">Step 2 — Spin off the filters</p>
                  <div className="flex gap-1.5">
                    {filtersRemoved.map((done, i) => (
                      <button
                        key={i}
                        onClick={() => removeFilter(i)}
                        disabled={done}
                        className={`px-2.5 py-1 text-[11px] rounded border font-bold ${
                          done ? 'text-green-300 border-green-500/40 bg-green-500/10' : 'text-white border-white/20 bg-white/5 hover:border-cyan-400/50'
                        }`}
                      >
                        {done ? `✓ F${i + 1}` : `Filter ${i + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pan bolts — every bolt comes out individually */}
              <div className="space-y-1.5">
                <p className="text-gray-400 text-[11px] uppercase tracking-widest">
                  {activeRepair === 'oil-change' ? 'Step 3' : 'Step 2'} — Pan flange bolts ({boltsRemoved.filter(Boolean).length}/{PAN_BOLT_COUNT})
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {boltsRemoved.map((done, i) => (
                    <button
                      key={i}
                      onClick={() => removeBolt(i)}
                      disabled={done}
                      className={`px-1.5 py-1 text-[11px] rounded border font-bold font-mono ${
                        done ? 'text-green-300 border-green-500/40 bg-green-500/10' : 'text-white border-white/20 bg-white/5 hover:border-amber-400/50'
                      }`}
                    >
                      {done ? '✓' : `B${i + 1}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pan */}
              <button
                onClick={removePan}
                disabled={panRemoved}
                className={`w-full py-1.5 text-xs font-bold rounded-lg border transition ${
                  panRemoved
                    ? 'text-green-300 border-green-500/40 bg-green-500/10'
                    : 'text-white border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20'
                }`}
              >
                {panRemoved ? '✓ Oil pan removed' : '⬇ Remove oil pan'}
              </button>

              {repairComplete && (
                <button
                  onClick={finishRepair}
                  className="w-full py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg"
                >
                  {activeRepair === 'pan-gasket' ? '✨ Fit new gasket & reinstall' : '✨ New filters, oil & reinstall'}
                </button>
              )}

              {serviceMsg && <p className="text-amber-200 text-xs leading-relaxed">{serviceMsg}</p>}
              <button onClick={() => { resetService(); setServiceMsg('Parts reinstalled.'); }} className="text-gray-500 hover:text-gray-300 text-[11px] underline">
                Reset / reinstall everything
              </button>
            </>
          )}
        </div>
      )}

      {/* Hotspot 2D labels */}
      {!isLoading && hotspots.map(hs => {
        const pos = screenPositions[hs.id];
        if (!pos?.visible) return null;
        const isActive = activeHotspot === hs.id;
        return (
          <button
            key={hs.id}
            onClick={() => setActiveHotspot(isActive ? null : hs.id)}
            className="absolute pointer-events-auto transition-all duration-200 group"
            style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
          >
            <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 ${isActive ? 'scale-125' : 'hover:scale-110'}`}
              style={{
                borderColor: hs.color,
                background: isActive ? `${hs.color}33` : 'rgba(5,8,16,0.8)',
                boxShadow: isActive ? `0 0 16px ${hs.color}88` : `0 0 8px ${hs.color}44`,
              }}>
              <span className="text-xs">{hs.icon}</span>
            </div>
            <div className={`absolute left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-xs font-semibold px-2 py-0.5 rounded transition-all duration-200 pointer-events-none ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0'}`}
              style={{ color: hs.color, background: 'rgba(5,8,16,0.9)', border: `1px solid ${hs.color}44`, top: '100%' }}>
              {hs.label}
            </div>
          </button>
        );
      })}

      {/* Active hotspot info panel */}
      {activeHotspotData && (
        <div className="absolute top-1/2 right-5 -translate-y-1/2 w-72 pointer-events-auto z-10"
          style={{
            background: 'rgba(5,8,22,0.92)',
            border: `1px solid ${activeHotspotData.color}44`,
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
          }}>
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-lg mb-0.5">{activeHotspotData.icon}</div>
                <h3 className="text-white font-bold text-base">{activeHotspotData.label}</h3>
              </div>
              <button
                onClick={() => setActiveHotspot(null)}
                className="text-gray-600 hover:text-white transition-colors text-xl leading-none ml-3 mt-0.5"
              >×</button>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{activeHotspotData.desc}</p>
            <div className="mt-3 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${activeHotspotData.color}, transparent)` }} />
          </div>
        </div>
      )}

      {/* Specs panel (left) */}
      <div className="absolute top-1/2 left-5 -translate-y-1/2 hidden xl:block pointer-events-none">
        <div className="w-52 rounded-2xl p-4" style={{ background: 'rgba(5,8,22,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-400 text-xs font-bold tracking-widest uppercase">Specifications</span>
          </div>
          <div className="space-y-2.5">
            {engine.specs.map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">{s.label}</span>
                <span className="text-white text-xs font-bold font-mono">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RPM / Engine status (bottom-left) */}
      <div className="absolute bottom-20 left-5 pointer-events-auto hidden md:block">
        <div className="rounded-xl p-3" style={{ background: 'rgba(5,8,22,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${engineOn ? 'bg-green-400 shadow-[0_0_8px_#00ff88]' : 'bg-gray-700'}`} />
            <div>
              <div className="text-white font-mono font-bold text-lg leading-none">
                {engineOn ? rpm.toLocaleString() : '---'}
                <span className="text-gray-500 text-xs ml-1 font-normal">RPM</span>
              </div>
              <div className="text-gray-500 text-xs mt-0.5">{engineOn ? 'Engine Running' : 'Engine Off'}</div>
            </div>
            <button
              onClick={() => setEngineOn(e => !e)}
              className={`ml-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${engineOn ? 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30'}`}
            >
              {engineOn ? 'STOP' : 'START'}
            </button>
          </div>
          {engineOn && (
            <div className="mt-2 flex gap-1.5">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-1 rounded-full transition-all duration-100"
                  style={{
                    height: `${8 + Math.random() * (rpm / 100)}px`,
                    background: i < 14 ? '#00d4ff' : i < 17 ? '#ffaa00' : '#ff4400',
                    opacity: 0.7 + Math.random() * 0.3,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile specs strip */}
      <div className="absolute bottom-20 left-4 right-4 xl:hidden pointer-events-none">
        <div className="rounded-xl p-3 grid grid-cols-4 gap-2" style={{ background: 'rgba(5,8,22,0.88)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {engine.specs.slice(0, 4).map(s => (
            <div key={s.label} className="text-center">
              <div className="text-cyan-400 text-xs font-bold font-mono">{s.value}</div>
              <div className="text-gray-600 text-[10px] mt-0.5 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 pointer-events-auto">
        <button
          onClick={toggleAutoRotate}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
          style={autoRotate
            ? { background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.5)', color: '#00d4ff' }
            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }
          }
        >
          {autoRotate ? '⏸ Pause' : '▶ Rotate'}
        </button>
        <button
          onClick={resetCamera}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
        >
          🎯 Reset
        </button>
        <button
          onClick={() => {
            const controls = controlsRef.current;
            if (!controls) return;
            // Zoom in
            const camera = cameraRef.current;
            if (camera) camera.fov = Math.max(20, camera.fov - 5);
            camera?.updateProjectionMatrix();
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
        >🔍+</button>
        <button
          onClick={() => {
            const camera = cameraRef.current;
            if (camera) camera.fov = Math.min(80, camera.fov + 5);
            camera?.updateProjectionMatrix();
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
        >🔍-</button>
      </div>

      {/* Interaction hint */}
      <div className="absolute bottom-8 right-5 pointer-events-none text-right hidden md:block">
        <p className="text-gray-700 text-xs">🖱 Drag · Scroll · Right-drag</p>
        <p className="text-gray-600 text-xs mt-0.5">Click markers to explore</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Procedural Volvo D13 Engine Builder
// ─────────────────────────────────────────────────────────
function buildVolvoD13(
  group: THREE.Group,
  setProgress: (n: number) => void,
  setLoading: (b: boolean) => void,
) {
  let step = 0;
  const totalSteps = 35;
  const tick = () => { step++; setProgress(Math.min(98, Math.round((step / totalSteps) * 100))); };

  // Materials
  const M = {
    teal: new THREE.MeshStandardMaterial({ color: 0x2e8b72, metalness: 0.42, roughness: 0.48 }),
    darkTeal: new THREE.MeshStandardMaterial({ color: 0x1d6053, metalness: 0.5, roughness: 0.55 }),
    black: new THREE.MeshStandardMaterial({ color: 0x0f0f0f, metalness: 0.25, roughness: 0.65 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.96, roughness: 0.08 }),
    brushedMetal: new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.85, roughness: 0.25 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.82, roughness: 0.32 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x141414, metalness: 0.0, roughness: 0.98 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xf5c400, metalness: 0.2, roughness: 0.5 }),
    red: new THREE.MeshStandardMaterial({ color: 0xcc2200, metalness: 0.2, roughness: 0.55 }),
    white: new THREE.MeshStandardMaterial({ color: 0xeaeaea, metalness: 0.05, roughness: 0.6 }),
    blue: new THREE.MeshStandardMaterial({ color: 0x0033aa, metalness: 0.1, roughness: 0.6 }),
    orange: new THREE.MeshStandardMaterial({ color: 0xff6600, metalness: 0.1, roughness: 0.5 }),
  };

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, opts?: { pos?: [number,number,number]; rot?: [number,number,number]; scale?: [number,number,number]; shadow?: boolean; parent?: THREE.Group }) => {
    const mesh = new THREE.Mesh(geo, mat);
    if (opts?.pos) mesh.position.set(...opts.pos);
    if (opts?.rot) mesh.rotation.set(...opts.rot);
    if (opts?.scale) mesh.scale.set(...opts.scale);
    if (opts?.shadow !== false) { mesh.castShadow = true; mesh.receiveShadow = true; }
    (opts?.parent ?? group).add(mesh);
    return mesh;
  };

  // ══════════════════════════════════════
  // 1. MAIN ENGINE BLOCK
  // ══════════════════════════════════════
  add(new THREE.BoxGeometry(2.1, 0.92, 0.75), M.teal, { pos: [0, -0.12, 0] });
  tick();

  // Cylinder head gasket line
  add(new THREE.BoxGeometry(2.08, 0.02, 0.76), M.darkTeal, { pos: [0, 0.32, 0] });

  // Block ribbing (6 cylinder separators)
  for (let i = 0; i < 5; i++) {
    add(new THREE.BoxGeometry(0.025, 0.9, 0.77), M.darkTeal, { pos: [-0.78 + i * 0.32, -0.12, 0] });
  }
  tick();

  // Oil pan — removable in oil-change service mode
  const oilPan = new THREE.Group();
  oilPan.name = 'service-oil-pan';
  group.add(oilPan);
  add(new THREE.BoxGeometry(2.06, 0.3, 0.68), M.darkTeal, { pos: [0, -0.73, 0], parent: oilPan });
  // Drain plug — pull it to drain the oil before dropping the pan
  const drainPlug = new THREE.Group();
  drainPlug.name = 'service-drain-plug';
  oilPan.add(drainPlug);
  add(new THREE.CylinderGeometry(0.025, 0.025, 0.06, 10), M.chrome, { pos: [0.4, -0.88, 0.12], rot: [Math.PI / 2, 0, 0], parent: drainPlug });
  // Oil stream + puddle, hidden until the plug comes out (or a full pan drops)
  const oilMat = new THREE.MeshStandardMaterial({ color: 0x1a1206, metalness: 0.35, roughness: 0.12 });
  const oilStream = add(new THREE.CylinderGeometry(0.014, 0.026, 0.22, 8), oilMat, { pos: [0.4, -0.99, 0.12], shadow: false });
  oilStream.name = 'oil-stream';
  oilStream.visible = false;
  const oilPuddle = add(new THREE.CircleGeometry(0.5, 24), oilMat, { pos: [0.4, -1.08, 0.12], rot: [-Math.PI / 2, 0, 0], shadow: false });
  oilPuddle.name = 'oil-puddle';
  oilPuddle.visible = false;
  oilPuddle.scale.set(0.01, 0.01, 0.01);
  // Pan flange bolts — individually removable, need the long socket extension
  for (let i = 0; i < 8; i++) {
    const bx = -0.9 + (i % 4) * 0.6;
    const bz = i < 4 ? 0.33 : -0.33;
    const bolt = new THREE.Group();
    bolt.name = `service-pan-bolt-${i}`;
    group.add(bolt);
    add(new THREE.CylinderGeometry(0.018, 0.018, 0.035, 8), M.chrome, { pos: [bx, -0.585, bz], parent: bolt });
  }
  tick();

  // ══════════════════════════════════════
  // 2. CYLINDER HEAD + VALVE COVER
  // ══════════════════════════════════════
  add(new THREE.BoxGeometry(2.06, 0.22, 0.74), M.teal, { pos: [0, 0.44, 0] });
  tick();

  // Valve cover (black)
  add(new THREE.BoxGeometry(2.02, 0.28, 0.70), M.black, { pos: [0, 0.63, 0] });
  // Raised center strip
  add(new THREE.BoxGeometry(1.65, 0.09, 0.42), M.black, { pos: [0, 0.785, 0] });
  tick();

  // VOLVO badge letters (5 bumps)
  for (let i = 0; i < 5; i++) {
    add(new THREE.BoxGeometry(0.1, 0.055, 0.06), M.brushedMetal, { pos: [-0.25 + i * 0.12, 0.84, 0] });
  }

  // Valve cover perimeter bolts (M8 flange bolts — no coils on a diesel)
  for (let i = 0; i < 8; i++) {
    add(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 8), M.brushedMetal, { pos: [-0.85 + i * 0.24, 0.78, 0.3] });
    add(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 8), M.brushedMetal, { pos: [-0.85 + i * 0.24, 0.78, -0.3] });
  }
  // Injector harness pass-through connector on the valve cover
  add(new THREE.BoxGeometry(0.09, 0.05, 0.14), M.black, { pos: [-0.7, 0.79, 0.18] });
  tick();

  // ══════════════════════════════════════
  // 3. TIMING COVER (front / right side)
  // ══════════════════════════════════════
  add(new THREE.BoxGeometry(0.15, 1.05, 0.76), M.teal, { pos: [1.1, -0.12, 0] });
  add(new THREE.BoxGeometry(0.12, 0.4, 0.78), M.darkTeal, { pos: [1.12, 0.22, 0] });
  tick();

  // Crankshaft snout / vibration damper
  add(new THREE.CylinderGeometry(0.155, 0.155, 0.12, 24), M.chrome, { pos: [1.18, -0.06, 0], rot: [0, 0, Math.PI / 2] });
  add(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 18), M.darkMetal, { pos: [1.19, -0.06, 0], rot: [0, 0, Math.PI / 2] });
  // Damper ring
  const damperTorus = new THREE.TorusGeometry(0.12, 0.025, 10, 32);
  add(damperTorus, M.rubber, { pos: [1.19, -0.06, 0], rot: [0, Math.PI / 2, 0] });
  tick();

  // ══════════════════════════════════════
  // 4. BELL HOUSING / FLYWHEEL (rear / left)
  // ══════════════════════════════════════
  add(new THREE.CylinderGeometry(0.55, 0.55, 0.32, 32), M.darkMetal, { pos: [-1.21, -0.28, 0], rot: [0, 0, Math.PI / 2] });
  add(new THREE.CylinderGeometry(0.38, 0.38, 0.34, 32), M.darkMetal, { pos: [-1.21, -0.28, 0], rot: [0, 0, Math.PI / 2] });
  // Flywheel ring gear
  add(new THREE.TorusGeometry(0.52, 0.035, 8, 48), M.darkMetal, { pos: [-1.18, -0.28, 0], rot: [0, Math.PI / 2, 0] });
  tick();

  // ══════════════════════════════════════
  // 5. COOLING FAN
  // ══════════════════════════════════════
  const fanGroup = new THREE.Group();
  fanGroup.position.set(-1.42, 0.14, 0);
  fanGroup.rotation.y = Math.PI / 2;
  group.add(fanGroup);
  group.userData.fanBladeGroup = fanGroup;

  // Fan hub
  const hubMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.13, 24), M.darkMetal);
  hubMesh.rotation.x = Math.PI / 2;
  fanGroup.add(hubMesh);

  // Fan blades (11 blades)
  const bladeCount = 11;
  for (let i = 0; i < bladeCount; i++) {
    const angle = (i / bladeCount) * Math.PI * 2;
    const r = 0.54;
    const bGeo = new THREE.BoxGeometry(0.08, 0.44, 0.04);
    const blade = new THREE.Mesh(bGeo, M.rubber);
    blade.position.set(r * Math.sin(angle), r * Math.cos(angle), 0);
    blade.rotation.z = -angle + 0.35;
    fanGroup.add(blade);
  }

  // Fan rim ring
  const fanRim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.038, 10, 64), M.rubber);
  fanGroup.add(fanRim);
  tick();

  // Fan hub center bolt
  add(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 8), M.chrome, { pos: [-1.45, 0.14, 0], rot: [0, 0, Math.PI / 2] });

  // Viscous coupling body
  add(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 16), M.brushedMetal, { pos: [-1.35, 0.14, 0], rot: [0, 0, Math.PI / 2] });
  tick();

  // ══════════════════════════════════════
  // 6. TURBOCHARGER
  // ══════════════════════════════════════
  const turboG = new THREE.Group();
  turboG.position.set(0.5, 0.26, 0.3);
  group.add(turboG);

  // Compressor housing (large scroll)
  const compScroll = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.17, 28), M.chrome);
  compScroll.rotation.z = Math.PI / 2;
  turboG.add(compScroll);

  // Turbine housing
  const turbScroll = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.058, 14, 28), M.chrome);
  turbScroll.position.x = 0.15;
  turbScroll.rotation.y = Math.PI / 2;
  turboG.add(turbScroll);

  // Center section
  const centerSect = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.25, 16), M.darkMetal);
  centerSect.rotation.z = Math.PI / 2;
  turboG.add(centerSect);

  // Turbo intake cone
  const intakeCone = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.085, 0.14, 14), M.chrome);
  intakeCone.position.set(-0.15, 0.22, 0);
  turboG.add(intakeCone);

  // Turbo outlet
  const tOutPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.2, 0),
    new THREE.Vector3(-0.1, 0.36, 0.08),
    new THREE.Vector3(-0.25, 0.42, 0.18),
  ]);
  turboG.add(new THREE.Mesh(new THREE.TubeGeometry(tOutPath, 10, 0.048, 8, false), M.chrome));
  tick();

  // ══════════════════════════════════════
  // 7. INTAKE MANIFOLD + EGR PIPE
  // ══════════════════════════════════════
  add(new THREE.BoxGeometry(1.8, 0.12, 0.2), M.teal, { pos: [0, 0.42, -0.3] });

  const egr = new THREE.BoxGeometry(0.52, 0.16, 0.2);
  add(egr, M.darkMetal, { pos: [-0.18, 0.22, 0.36] });

  // EGR pipe
  const egrPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, 0.32, 0.36),
    new THREE.Vector3(-0.05, 0.46, 0.32),
    new THREE.Vector3(0.18, 0.48, 0.28),
    new THREE.Vector3(0.42, 0.42, 0.28),
  ]);
  add(new THREE.TubeGeometry(egrPath, 14, 0.032, 8, false), M.chrome, { shadow: false });
  tick();

  // Intercooler pipe (large)
  const icPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.5, 0.55, 0.3),
    new THREE.Vector3(0.2, 0.7, 0.2),
    new THREE.Vector3(-0.2, 0.68, 0.18),
    new THREE.Vector3(-0.5, 0.65, 0.25),
  ]);
  add(new THREE.TubeGeometry(icPath, 18, 0.058, 8, false), M.darkMetal, { shadow: false });

  // Rubber intake boot
  const bootPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.5, 0.44, 0.3),
    new THREE.Vector3(0.5, 0.58, 0.28),
  ]);
  add(new THREE.TubeGeometry(bootPath, 6, 0.065, 8, false), M.rubber, { shadow: false });
  tick();

  // ══════════════════════════════════════
  // 8. EXHAUST MANIFOLD
  // ══════════════════════════════════════
  add(new THREE.BoxGeometry(1.72, 0.09, 0.14), M.darkMetal, { pos: [-0.04, 0.06, -0.44] });
  for (let i = 0; i < 6; i++) {
    add(new THREE.CylinderGeometry(0.042, 0.042, 0.14, 10), M.darkMetal, { pos: [-0.77 + i * 0.31, 0.06, -0.38], rot: [0, 0, Math.PI / 2] });
  }

  // Turbo inlet pipe (exhaust side)
  const exhPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.42, 0.06, -0.44),
    new THREE.Vector3(0.5, 0.1, -0.38),
    new THREE.Vector3(0.5, 0.2, -0.32),
    new THREE.Vector3(0.52, 0.26, -0.28),
    new THREE.Vector3(0.52, 0.26, -0.05),
    new THREE.Vector3(0.5, 0.26, 0.1),
  ]);
  add(new THREE.TubeGeometry(exhPath, 18, 0.062, 8, false), M.chrome, { shadow: false });
  tick();

  // ══════════════════════════════════════
  // 9. OIL FILTERS (2 full-flow + 1 bypass, spin-on)
  // ══════════════════════════════════════
  for (let i = 0; i < 3; i++) {
    const px = 0.02 + i * 0.19;
    // Spin-on cartridge — removable in oil-change service mode
    const filter = new THREE.Group();
    filter.name = `service-oil-filter-${i}`;
    group.add(filter);
    add(new THREE.CylinderGeometry(0.068, 0.068, 0.24, 18), M.white, { pos: [px, -0.65, 0.39], parent: filter });
    add(new THREE.CylinderGeometry(0.072, 0.072, 0.04, 18), M.darkMetal, { pos: [px, -0.52, 0.39], parent: filter });
    add(new THREE.CylinderGeometry(0.07, 0.07, 0.072, 18), M.blue, { pos: [px, -0.635, 0.39], parent: filter });
    // Filter base stays mounted on the block
    add(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 12), M.darkMetal, { pos: [px, -0.78, 0.39] });
  }
  tick();

  // ══════════════════════════════════════
  // 10. ALTERNATOR
  // ══════════════════════════════════════
  add(new THREE.CylinderGeometry(0.105, 0.105, 0.2, 20), M.darkMetal, { pos: [-0.48, -0.17, 0.37], rot: [0, 0, Math.PI / 2] });
  add(new THREE.CylinderGeometry(0.106, 0.106, 0.02, 20), M.chrome, { pos: [-0.37, -0.17, 0.37], rot: [0, 0, Math.PI / 2] });
  add(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12), M.chrome, { pos: [-0.36, -0.17, 0.37], rot: [0, 0, Math.PI / 2] });
  tick();

  // ══════════════════════════════════════
  // 11. PULLEYS & BELT
  // ══════════════════════════════════════
  const pulleyData = [
    { pos: [-0.48, 0.13, 0.38] as [number,number,number], r: 0.075 },
    { pos: [0.55, 0.04, 0.38] as [number,number,number], r: 0.09 },
    { pos: [-0.48, -0.15, 0.38] as [number,number,number], r: 0.055 },
    { pos: [0.12, -0.45, 0.38] as [number,number,number], r: 0.048 },
  ];
  pulleyData.forEach(p => {
    add(new THREE.CylinderGeometry(p.r, p.r, 0.055, 20), M.chrome, { pos: p.pos, rot: [Math.PI / 2, 0, 0] });
    add(new THREE.CylinderGeometry(p.r * 0.45, p.r * 0.45, 0.06, 14), M.darkMetal, { pos: p.pos, rot: [Math.PI / 2, 0, 0] });
  });
  tick();

  // Serpentine belt path
  const beltPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.48, 0.13, 0.385),
    new THREE.Vector3(0.55, 0.08, 0.385),
    new THREE.Vector3(0.55, -0.04, 0.385),
    new THREE.Vector3(0.12, -0.45, 0.385),
    new THREE.Vector3(-0.48, -0.15, 0.385),
    new THREE.Vector3(-0.48, 0.0, 0.385),
  ], true);
  add(new THREE.TubeGeometry(beltPath, 60, 0.018, 6, true), M.rubber, { shadow: false });
  tick();

  // ══════════════════════════════════════
  // 12. FUEL RAIL + INJECTORS
  // ══════════════════════════════════════
  add(new THREE.BoxGeometry(1.65, 0.042, 0.042), M.chrome, { pos: [-0.04, 0.3, 0.22] });
  for (let i = 0; i < 6; i++) {
    add(new THREE.CylinderGeometry(0.018, 0.014, 0.19, 8), M.darkMetal, { pos: [-0.77 + i * 0.31, 0.2, 0.22] });
    // Injector wiring clip
    add(new THREE.BoxGeometry(0.04, 0.024, 0.025), M.yellow, { pos: [-0.77 + i * 0.31, 0.26, 0.235] });
  }
  tick();

  // ══════════════════════════════════════
  // 13. COOLANT HOSES
  // ══════════════════════════════════════
  const hoseMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0, roughness: 0.9 });
  [
    new THREE.CatmullRomCurve3([new THREE.Vector3(0.8, 0.42, -0.1), new THREE.Vector3(0.95, 0.55, -0.2), new THREE.Vector3(1.0, 0.52, -0.3)]),
    new THREE.CatmullRomCurve3([new THREE.Vector3(-0.6, 0.42, -0.1), new THREE.Vector3(-0.75, 0.5, -0.15), new THREE.Vector3(-0.85, 0.45, -0.25)]),
    new THREE.CatmullRomCurve3([new THREE.Vector3(0.5, -0.6, 0.36), new THREE.Vector3(0.65, -0.52, 0.4), new THREE.Vector3(0.78, -0.45, 0.38)]),
  ].forEach(path => {
    add(new THREE.TubeGeometry(path, 12, 0.028, 8, false), hoseMat, { shadow: false });
  });
  tick();

  // ══════════════════════════════════════
  // 14. WIRING HARNESS
  // ══════════════════════════════════════
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0, roughness: 1 });
  [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.78, 0.2, 0.38), new THREE.Vector3(-0.2, 0.26, 0.4),
      new THREE.Vector3(0.4, 0.22, 0.38), new THREE.Vector3(0.9, 0.15, 0.36),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.78, -0.04, 0.38), new THREE.Vector3(-0.3, 0.02, 0.4),
      new THREE.Vector3(0.1, -0.02, 0.39),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.8, 0.14, 0.36), new THREE.Vector3(0.9, 0.1, 0.3),
      new THREE.Vector3(1.0, 0.0, 0.22),
    ]),
  ].forEach(path => {
    add(new THREE.TubeGeometry(path, 14, 0.013, 6, false), wireMat, { shadow: false });
  });
  tick();

  // Yellow zip ties / wiring connectors
  [[-0.5, 0.06, 0.38], [0.1, -0.05, 0.39], [0.6, 0.14, 0.37]].forEach(([x, y, z]) => {
    add(new THREE.BoxGeometry(0.052, 0.075, 0.042), M.yellow, { pos: [x, y, z] });
  });
  tick();

  // ══════════════════════════════════════
  // 15. MISC COMPONENTS
  // ══════════════════════════════════════
  // Red oil cap
  add(new THREE.CylinderGeometry(0.042, 0.042, 0.055, 12), M.red, { pos: [-0.62, 0.3, 0.32] });

  // Dipstick
  const dipPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.3, -0.52, 0.36), new THREE.Vector3(0.34, 0.0, 0.38), new THREE.Vector3(0.32, 0.32, 0.4),
  ]);
  add(new THREE.TubeGeometry(dipPath, 10, 0.008, 6, false), M.yellow, { shadow: false });
  // Dipstick handle loop
  add(new THREE.TorusGeometry(0.018, 0.005, 6, 14), M.yellow, { pos: [0.32, 0.33, 0.4] });

  // Starter motor
  add(new THREE.CylinderGeometry(0.072, 0.072, 0.3, 14), M.darkMetal, { pos: [-0.95, -0.52, -0.22], rot: [0, 0, Math.PI / 2] });
  add(new THREE.CylinderGeometry(0.042, 0.042, 0.15, 10), M.darkMetal, { pos: [-0.88, -0.38, -0.22] });

  // Engine mounts
  [-0.88, -0.5, 0.5, 0.88].forEach(x => {
    add(new THREE.BoxGeometry(0.065, 0.14, 0.32), M.darkTeal, { pos: [x, -0.67, -0.1] });
  });
  tick();

  // Breather tube
  const breatherPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.3, 0.79, 0.15), new THREE.Vector3(-0.35, 0.85, 0.22), new THREE.Vector3(-0.4, 0.88, 0.3),
  ]);
  add(new THREE.TubeGeometry(breatherPath, 8, 0.018, 6, false), M.rubber, { shadow: false });

  // ECM (engine control module) — finned box mounted on the cool side of the block
  add(new THREE.BoxGeometry(0.34, 0.42, 0.06), M.darkMetal, { pos: [-0.55, -0.05, -0.42] });
  for (let i = 0; i < 6; i++) {
    add(new THREE.BoxGeometry(0.3, 0.045, 0.015), M.brushedMetal, { pos: [-0.55, -0.22 + i * 0.07, -0.455] });
  }
  // ECM harness connectors
  add(new THREE.BoxGeometry(0.1, 0.08, 0.05), M.black, { pos: [-0.44, -0.31, -0.43] });
  add(new THREE.BoxGeometry(0.1, 0.08, 0.05), M.black, { pos: [-0.66, -0.31, -0.43] });
  tick();

  // Water pump (front of block, gear-driven) + thermostat housing above it
  add(new THREE.CylinderGeometry(0.09, 0.11, 0.1, 14), M.teal, { pos: [-0.98, 0.02, 0.16], rot: [0, 0, Math.PI / 2] });
  add(new THREE.BoxGeometry(0.1, 0.12, 0.12), M.teal, { pos: [-0.95, 0.3, 0.12] });
  // Thermostat outlet to the upper radiator hose
  add(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 10), M.brushedMetal, { pos: [-1.02, 0.36, 0.12], rot: [0, 0, Math.PI / 2] });
  tick();

  // Brake air compressor — gear-driven off the rear train
  add(new THREE.CylinderGeometry(0.075, 0.075, 0.16, 12), M.darkMetal, { pos: [0.85, -0.35, -0.25], rot: [Math.PI / 2, 0, 0] });
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 10), M.brushedMetal, { pos: [0.85, -0.21, -0.25] });
  tick();

  // Fuel filter / water separator with clear sight bowl
  add(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 16), M.white, { pos: [0.62, -0.6, 0.36] });
  add(
    new THREE.CylinderGeometry(0.058, 0.058, 0.06, 16),
    new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.5, roughness: 0.1 }),
    { pos: [0.62, -0.72, 0.36] },
  );
  add(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12), M.darkMetal, { pos: [0.62, -0.49, 0.36] });
  tick();

  // Coolant temperature sensor
  add(new THREE.CylinderGeometry(0.015, 0.015, 0.06, 8), M.chrome, { pos: [0.6, 0.37, 0.38] });

  // Speed sensor on bell housing
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8), M.darkMetal, { pos: [-1.08, -0.05, 0.28] });

  tick();

  // ══════════════════════════════════════
  // Position & finalize
  // ══════════════════════════════════════
  group.position.y = 0;
  group.rotation.y = Math.PI * 0.08; // slight initial angle

  // Complete loading
  tick(); tick(); tick(); tick(); tick();
  setProgress(100);
  setTimeout(() => setLoading(false), 500);
}
