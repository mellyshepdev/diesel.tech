import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import ToolPanel, { TOOLS, type Tool } from './components/ToolPanel';
import ProcedurePanel, { type ProcStep } from './components/ProcedurePanel';
import ReferencePanel from './components/ReferencePanel';

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
    // Factory figures from the D13 documents in the repo (QRG + 2017 spec sheet)
    specs: [
      { label: 'Displacement', value: '12.8 L (780 ci)' },
      { label: 'Configuration', value: 'Inline-6' },
      { label: 'Peak Power', value: '500 HP' },
      { label: 'Max Torque', value: '1,850 lb-ft' },
      { label: 'Bore × Stroke', value: '131 × 158 mm' },
      { label: 'Compression', value: '17.0:1' },
      { label: 'Firing Order', value: '1-5-3-6-2-4' },
      { label: 'Fuel System', value: 'Common Rail, 35k psi' },
      { label: 'Valvetrain', value: 'SOHC, 4 per cyl' },
      { label: 'Oil Capacity', value: '38 qt (36 L)' },
      { label: 'Dry Weight', value: '2,605 lb' },
    ],
    hotspotDescs: {
      ecm: 'Volvo EMS engine management module, block-mounted with heat-sink fins. Runs injection timing, I-Shift integration, and OBD diagnostics.',
      filters: 'Two full-flow filters plus one bypass, spin-on. The pair of full-flow filters holds 4.0–4.5 L. Install dry, oil the gasket, tighten 3/4–1 turn after contact (25 +5/−0 Nm).',
      oilpan: 'Volvo D13 pan: plastic or steel, sealed by a flange gasket and 22 spring-tension screws torqued 24 ± 4 Nm middle-out. Houses the oil level/temperature sensor, dipstick and filler ports. Drain plug: 60 ± 10 Nm. Front- or rear-sump versions per chassis.',
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
  /** Where the part lands when the removal finishes (tool tray / bench spot).
   *  Without it the part just disappears. */
  place?: { pos: [number, number, number]; parent?: THREE.Object3D };
  onDone?: () => void;
}

interface OilFlow {
  active: boolean;
  t: number;
  duration: number;
  puddleScale: number;
  onDone?: () => void;
}

type RepairId = 'oil-change' | 'pan-gasket' | 'turbo-replace';

const REPAIRS: { id: RepairId; icon: string; label: string; desc: string }[] = [
  {
    id: 'oil-change',
    icon: '🛢️',
    label: 'Oil & Filter Change',
    desc: 'Drain (plug: 60 ± 10 Nm on install), spin off the three filters with the 9998487 filter wrench, then drop the pan. The 22 pan screws need the 10" socket extension + electric runner or hand tools. Refill: VDS-4 10W-30, 25–30 L sump.',
  },
  {
    id: 'pan-gasket',
    icon: '🔩',
    label: 'Oil Pan Gasket Repair',
    desc: 'Break all 22 spring-tension pan screws loose one at a time, drop the pan, fit the new gasket, re-torque 24 ± 4 Nm from the middle outwards.',
  },
  {
    id: 'turbo-replace',
    icon: '🌀',
    label: 'Turbocharger R&R',
    desc: 'Remove & replace the VGT turbo. Select the right tool, then click each fastener in 3D (or use the buttons): harness → V-bands → oil feed → coolant × 2 → oil drain → 4 flange nuts → lift. The turbo shares the engine\'s OIL and COOLANT — reconnect everything and PRIME the oil before starting, or it grenades.',
  },
];

// The real D13 pan is clamped by 22 spring-tension screws (QRG p.14/35):
// 8 along each long side of the flange, 3 across each end.
const PAN_BOLT_POSITIONS: [number, number][] = (() => {
  const p: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    const bx = -0.875 + i * 0.25;
    p.push([bx, 0.33], [bx, -0.33]);
  }
  [-0.2, 0, 0.2].forEach(bz => {
    p.push([1.0, bz], [-1.0, bz]);
  });
  return p;
})();
const PAN_BOLT_COUNT = PAN_BOLT_POSITIONS.length;
const FILTER_COUNT = 3;

// Landing spots for removed parts. Positions are group offsets that put the
// part's own mesh (which carries its absolute offset) onto the tray / bench.
const boltTraySlot = (i: number): [number, number, number] => {
  const [bx, bz] = PAN_BOLT_POSITIONS[i];
  const sx = 0.7175 + (i % 6) * 0.085; // 6-per-row grid in the big tray
  const sz = 0.68 + Math.floor(i / 6) * 0.09;
  return [sx - bx, -0.422, sz - bz];
};
const PLUG_TRAY_POS: [number, number, number] = [0.54, -0.06, 0.73]; // small tray
const filterBenchSlot = (i: number): [number, number, number] =>
  [1.6 - (0.02 + i * 0.19), -0.33, 0.23 + i * 0.2]; // standing in a row
const PAN_FLOOR_POS: [number, number, number] = [-0.6, -0.13, 1.25]; // flat on the floor

// ── Turbocharger (modeled from the 4 reman-turbo reference photos) ──
// Scale basis: compressor scroll diameter D = 0.4 scene units. From the
// photos: turbine scroll ≈ 0.85 D, assembly length ≈ 1.15 D, actuator
// ≈ 0.75 × 0.45 D, inlet bore ≈ 0.38 D, turbine outlet ≈ 0.42 D.
// Mounted on the engine's RIGHT side (+z) with the oil filters and starter,
// hanging off the exhaust manifold — QRG "Engine, Right-Side View" p.121.
// Outboard of the head (head face z = 0.37) so the inlet flange is visible.
const TURBO_CX = 0.5, TURBO_CY = 0.26, TURBO_CZ = 0.52; // assembly center

// 4 flange nuts on the exhaust-manifold mount (top flange in the photos)
const TURBO_NUT_POS: [number, number, number][] = [
  [0.25, 0.475, 0.48], [0.41, 0.475, 0.48], [0.25, 0.475, 0.56], [0.41, 0.475, 0.56],
];

type TurboPartKey = 'harness' | 'charge-clamp' | 'exh-clamp' | 'oil-feed' | 'coolant-a' | 'coolant-b' | 'oil-drain';
/** Each disconnectable turbo part: its primary-mesh anchor in the engine,
 *  where it lands on the bench, the tool it takes, and a label. */
const TURBO_PARTS: Record<TurboPartKey, { anchor: [number, number, number]; bench: [number, number, number]; tool: Tool | null; label: string }> = {
  'harness':      { anchor: [0.55, 0.13, 0.42],  bench: [-1.45, -1.06, 0.42], tool: null,          label: 'Actuator & sensor harness' },
  'charge-clamp': { anchor: [0.60, -0.095, 0.36], bench: [-1.45, -1.06, 0.60], tool: 'socket10',    label: 'Charge pipe V-band' },
  'exh-clamp':    { anchor: [0.22, 0.26, 0.30],  bench: [-1.45, -1.06, 0.78], tool: 'socket10',    label: 'Exhaust V-band' },
  'oil-feed':     { anchor: [0.44, 0.48, 0.20],  bench: [-1.62, -1.06, 0.42], tool: 'lineWrench',  label: 'Oil feed line' },
  'coolant-a':    { anchor: [0.56, 0.44, 0.10],  bench: [-1.62, -1.06, 0.60], tool: 'lineWrench',  label: 'Coolant line (upper)' },
  'coolant-b':    { anchor: [0.58, 0.10, 0.08],  bench: [-1.62, -1.06, 0.78], tool: 'lineWrench',  label: 'Coolant line (lower)' },
  'oil-drain':    { anchor: [0.46, 0.02, 0.28],  bench: [-1.62, -1.06, 0.96], tool: 'screwdriver', label: 'Oil drain tube' },
};
const TURBO_PART_KEYS = Object.keys(TURBO_PARTS) as TurboPartKey[];

const turboPartPlace = (k: TurboPartKey): [number, number, number] => {
  const { anchor, bench } = TURBO_PARTS[k];
  return [bench[0] - anchor[0], bench[1] - anchor[1], bench[2] - anchor[2]];
};
const turboNutTraySlot = (i: number): [number, number, number] => {
  const [nx, , nz] = TURBO_NUT_POS[i];
  return [(-1.21 + (i % 2) * 0.12) - nx, -1.045 - 0.475, (0.85 + Math.floor(i / 2) * 0.1) - nz];
};
// whole assembly, lifted off and set on the floor
const TURBO_BENCH_POS: [number, number, number] = [-2.2 - TURBO_CX + 0.5, -1.16, 0.95 - TURBO_CZ + 0.3];

/** Install steps that MUST be done before starting the engine; missing any
 *  one of them is a catastrophic failure (the turbo shares the engine's oil
 *  AND coolant circuits). */
const TURBO_CRITICAL: { key: string; label: string; consequence: string }[] = [
  { key: 'oil-drain',    label: 'Oil drain connected',   consequence: 'oil pumping straight out of the drain port' },
  { key: 'coolant',      label: 'Both coolant lines connected', consequence: 'coolant dumping from the open center-housing ports' },
  { key: 'oil-feed',     label: 'Oil feed connected',    consequence: 'zero oil to the bearings' },
  { key: 'primed',       label: 'Oil system primed',     consequence: 'dry start — bearings seize in seconds' },
  { key: 'charge-clamp', label: 'Charge V-band seated',  consequence: 'boost blowing off the charge pipe' },
  { key: 'exh-clamp',    label: 'Exhaust V-band seated', consequence: 'raw exhaust blasting the engine bay' },
  { key: 'harness',      label: 'Harness plugged in',    consequence: 'VGT actuator dead — uncontrolled overspeed' },
];

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
  {
    id: 'oilpan',
    label: 'Oil Pan',
    icon: '🛢️',
    pos3d: [0.6, -0.85, 0.33] as [number, number, number],
    desc: 'Stamped pan with flange gasket, drain plug and oil level sensor. Sump capacity feeds a gear-type oil pump through a strainer and pickup tube.',
    color: '#66ddff',
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
    'service-turbo',
    ...TURBO_PART_KEYS.map(k => `service-turbo-${k}`),
    ...Array.from({ length: 4 }, (_, i) => `service-turbo-nut-${i}`),
  ];

  const startOilFlow = useCallback((duration: number, puddleScale: number, onDone?: () => void) => {
    const eg = engineGroupRef.current;
    if (!eg) return;
    eg.userData.oilFlow = { active: true, t: 0, duration, puddleScale, onDone } satisfies OilFlow;
  }, []);

  /** Kick off a part-removal animation; returns false if the part is gone/missing.
   *  `place` gives the part a landing spot (tool tray / bench) instead of vanishing. */
  const startRemoval = useCallback((name: string, opts: { vy: number; spin?: number; drop?: number; place?: [number, number, number]; reparent?: boolean }, onDone?: () => void) => {
    const eg = engineGroupRef.current;
    if (!eg) return false;
    const obj = eg.getObjectByName(name);
    if (!obj || !obj.visible) return false;
    const anims: ServiceAnim[] = eg.userData.serviceAnims ?? (eg.userData.serviceAnims = []);
    if (anims.some(a => a.obj === obj)) return false; // already animating
    anims.push({
      obj,
      vy: opts.vy,
      spin: opts.spin ?? 0.25,
      targetY: obj.position.y - (opts.drop ?? 0.9),
      place: opts.place ? { pos: opts.place, parent: opts.reparent ? eg : undefined } : undefined,
      onDone,
    });
    return true;
  }, []);

  const restoreParts = useCallback((names: string[]) => {
    const eg = engineGroupRef.current;
    if (!eg) return;
    // The drain plug lives inside the pan group but gets reparented to the
    // engine group when it lands in the tray — put it back in the pan first.
    const pan = eg.getObjectByName('service-oil-pan');
    const plug = eg.getObjectByName('service-drain-plug');
    if (pan && plug && plug.parent !== pan) pan.add(plug);
    names.forEach(n => {
      const obj = eg.getObjectByName(n);
      if (obj) {
        obj.visible = true;
        obj.position.set(0, 0, 0);
        obj.rotation.set(0, 0, 0);
      }
    });
  }, []);

  // Routed from the canvas raycaster (assigned fresh each render below)
  const partClickRef = useRef<(name: string) => void>(() => {});

  // ── Truck walk-around: real-life pre-service steps, in order ──
  // key in hand → unlock/open the door → climb in → set the parking brake
  // → open the hood → engine exposed → repairs unlock
  const [doorUnlocked, setDoorUnlocked] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [inCab, setInCab] = useState(false);
  const [parkingBrake, setParkingBrake] = useState(false);
  const [trailerAir, setTrailerAir] = useState(false);
  const [hoodOpen, setHoodOpen] = useState(false);

  /** Animate a hinged truck panel (door / hood) toward a target angle. */
  const setHinge = useCallback((name: string, prop: 'y' | 'z', target: number) => {
    const eg = engineGroupRef.current;
    if (!eg) return;
    const obj = eg.getObjectByName(name);
    if (!obj) return;
    const hinges: { obj: THREE.Object3D; prop: 'y' | 'z'; target: number }[] =
      eg.userData.hinges ?? (eg.userData.hinges = []);
    const h = hinges.find(x => x.obj === obj && x.prop === prop);
    if (h) h.target = target;
    else hinges.push({ obj, prop, target });
  }, []);

  const clickDoor = () => {
    if (!doorUnlocked) {
      if (selectedTool === 'key') {
        setDoorUnlocked(true);
        setDoorOpen(true);
        setHinge('truck-door', 'y', -1.25);
        setServiceMsg('Key in, door unlocked and open — climb on up.');
      } else {
        setServiceMsg("The door's locked. Grab the 🔑 Truck Key from the toolbox first.");
      }
      return;
    }
    const next = !doorOpen;
    setDoorOpen(next);
    setHinge('truck-door', 'y', next ? -1.25 : 0);
  };

  const clickHood = () => {
    if (!hoodOpen) {
      if (!parkingBrake) {
        setServiceMsg('⚠️ Set the parking brake before opening the hood — she could roll on you. (Climb in the cab.)');
        return;
      }
      setHoodOpen(true);
      setHinge('truck-hood', 'z', 1.15);
      setServiceMsg('Hood tilted forward — engine exposed. Repairs are on the 🔧 Repairs panel.');
      return;
    }
    setHoodOpen(false);
    setHinge('truck-hood', 'z', 0);
  };

  // Engine hotspot markers only make sense with the hood open
  useEffect(() => {
    const eg = engineGroupRef.current;
    eg?.parent?.traverse(o => {
      if (o.userData.id || o.userData.isPulse) o.visible = hoodOpen;
    });
  }, [hoodOpen]);

  // ── Part inspection: pick up a removed part and turn it over in your hands ──
  const [inspecting, setInspecting] = useState<{ name: string; label: string } | null>(null);
  const inspectPrevRef = useRef<{ obj: THREE.Object3D; parent: THREE.Object3D; pos: THREE.Vector3; rot: THREE.Euler } | null>(null);

  const exitInspect = useCallback(() => {
    const prev = inspectPrevRef.current;
    const eg = engineGroupRef.current;
    if (prev && eg) {
      prev.parent.attach(prev.obj);
      prev.obj.position.copy(prev.pos);
      prev.obj.rotation.copy(prev.rot);
      eg.visible = true;
      eg.parent?.traverse(o => {
        if (o.userData.id || o.userData.isPulse) o.visible = true;
      });
    }
    inspectPrevRef.current = null;
    setInspecting(null);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (camera && controls) {
      camera.position.set(-3.6, 1.6, 3.6);
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, []);

  const inspectPart = useCallback((name: string, label: string) => {
    const eg = engineGroupRef.current;
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    if (!eg || !controls || !camera) return;
    const obj = eg.getObjectByName(name);
    const scene = eg.parent;
    if (!obj || !scene) return;
    inspectPrevRef.current = { obj, parent: obj.parent!, pos: obj.position.clone(), rot: obj.rotation.clone() };
    scene.attach(obj);
    obj.visible = true;
    // center the part at the origin so the camera orbits around it
    const box = new THREE.Box3().setFromObject(obj);
    const c = box.getCenter(new THREE.Vector3());
    obj.position.sub(c);
    eg.visible = false;
    scene.traverse(o => {
      if (o.userData.id || o.userData.isPulse) o.visible = false;
    });
    controls.target.set(0, 0, 0);
    camera.position.set(1.3, 0.7, 1.3);
    controls.autoRotate = true;
    controls.update();
    setInspecting({ name, label });
  }, []);

  // ── Turbo R&R state ──
  const [turboPartsOff, setTurboPartsOff] = useState<Record<string, boolean>>({});
  const [turboNutsOff, setTurboNutsOff] = useState<boolean[]>(Array(4).fill(false));
  const [turboRemoved, setTurboRemoved] = useState(false);
  const [turboInstalled, setTurboInstalled] = useState<Record<string, boolean>>({});
  const [turboFailure, setTurboFailure] = useState<string | null>(null);
  const [turboHealthy, setTurboHealthy] = useState(false);

  const turboTouched =
    turboRemoved || turboNutsOff.some(Boolean) || Object.values(turboPartsOff).some(Boolean) || Object.keys(turboInstalled).length > 0;

  const removeTurboPart = (key: TurboPartKey) => {
    if (activeRepair !== 'turbo-replace') { setServiceMsg('Open the Turbocharger R&R repair first.'); return; }
    if (turboPartsOff[key]) return;
    if (key !== 'harness' && !turboPartsOff['harness']) {
      setServiceMsg('Unplug the actuator & sensor harness first — never wrench on a live VGT.');
      return;
    }
    const need = TURBO_PARTS[key].tool;
    if (need && selectedTool !== need) {
      setServiceMsg(`Wrong tool for the ${TURBO_PARTS[key].label.toLowerCase()} — grab the ${TOOLS[need].name}.`);
      return;
    }
    if (startRemoval(`service-turbo-${key}`, { vy: 0.008, spin: 0.3, drop: 0.5, place: turboPartPlace(key), reparent: false }, () => {
      setTurboPartsOff(prev => ({ ...prev, [key]: true }));
      setServiceMsg(`${TURBO_PARTS[key].label} off — on the bench ✓${key.startsWith('coolant') ? ' (coolant dribbles out)' : ''}`);
    })) {
      setServiceMsg(need ? `${TOOLS[need].name} on the ${TURBO_PARTS[key].label.toLowerCase()}…` : `Unplugging the ${TURBO_PARTS[key].label.toLowerCase()}…`);
    }
  };

  const removeTurboNut = (i: number) => {
    if (activeRepair !== 'turbo-replace') { setServiceMsg('Open the Turbocharger R&R repair first.'); return; }
    if (turboNutsOff[i]) return;
    if (!turboPartsOff['harness']) { setServiceMsg('Unplug the harness first.'); return; }
    if (selectedTool !== 'socket15') { setServiceMsg('Flange nuts take the 15mm Socket — grab it and click the nut.'); return; }
    if (startRemoval(`service-turbo-nut-${i}`, { vy: 0.01, spin: 0.5, drop: 0.35, place: turboNutTraySlot(i) }, () => {
      setTurboNutsOff(prev => prev.map((v, j) => (j === i ? true : v)));
      setServiceMsg(`Flange nut ${i + 1}/4 out — into the turbo tray ✓`);
    })) {
      setServiceMsg(`Backing off flange nut ${i + 1}…`);
    }
  };

  const liftTurbo = () => {
    if (activeRepair !== 'turbo-replace' || turboRemoved) return;
    const partsLeft = TURBO_PART_KEYS.filter(k => !turboPartsOff[k]);
    if (partsLeft.length) { setServiceMsg(`Still connected: ${partsLeft.map(k => TURBO_PARTS[k].label).join(', ')}.`); return; }
    if (!turboNutsOff.every(Boolean)) { setServiceMsg('The flange nuts are still on.'); return; }
    if (startRemoval('service-turbo', { vy: 0.012, spin: 0, drop: 0.5, place: TURBO_BENCH_POS }, () => {
      setTurboRemoved(true);
      setServiceMsg('Turbo is off and on the floor — inspect it, then mount the replacement.');
    })) {
      setServiceMsg('Lifting the turbo off the manifold studs — keeping it level…');
    }
  };

  const installTurboStep = (key: string) => {
    const eg = engineGroupRef.current;
    if (key === 'mount') {
      if (!turboRemoved) return;
      if (eg) {
        const names = ['service-turbo', ...Array.from({ length: 4 }, (_, i) => `service-turbo-nut-${i}`)];
        names.forEach(n => {
          const obj = eg.getObjectByName(n);
          if (obj) { obj.visible = true; obj.position.set(0, 0, 0); obj.rotation.set(0, 0, 0); }
        });
      }
      setTurboRemoved(false);
      setTurboNutsOff(Array(4).fill(false));
      setTurboInstalled(prev => ({ ...prev, mounted: true }));
      setServiceMsg('New turbo on the studs, anti-seize on the threads, 4 nuts torqued ✓');
      return;
    }
    if (!turboInstalled.mounted) { setServiceMsg('Mount the turbo on the manifold first.'); return; }
    if (key === 'primed') {
      if (!turboInstalled['oil-feed']) { setServiceMsg('Connect the oil feed line before priming.'); return; }
      setTurboInstalled(prev => ({ ...prev, primed: true }));
      setServiceMsg('Oil feed pre-filled with clean oil — bearings are wet ✓');
      return;
    }
    if (key === 'coolant') {
      if (eg) ['service-turbo-coolant-a', 'service-turbo-coolant-b'].forEach(n => {
        const obj = eg.getObjectByName(n);
        if (obj) { obj.visible = true; obj.position.set(0, 0, 0); obj.rotation.set(0, 0, 0); }
      });
      setTurboPartsOff(prev => ({ ...prev, 'coolant-a': false, 'coolant-b': false }));
      setTurboInstalled(prev => ({ ...prev, coolant: true }));
      setServiceMsg('Both coolant lines tight ✓');
      return;
    }
    const nameMap: Record<string, string> = {
      'oil-feed': 'service-turbo-oil-feed',
      'oil-drain': 'service-turbo-oil-drain',
      'charge-clamp': 'service-turbo-charge-clamp',
      'exh-clamp': 'service-turbo-exh-clamp',
      'harness': 'service-turbo-harness',
    };
    if (eg && nameMap[key]) {
      const obj = eg.getObjectByName(nameMap[key]);
      if (obj) { obj.visible = true; obj.position.set(0, 0, 0); obj.rotation.set(0, 0, 0); }
    }
    setTurboPartsOff(prev => ({ ...prev, [key]: false }));
    setTurboInstalled(prev => ({ ...prev, [key]: true }));
    setServiceMsg(`${TURBO_PARTS[key as TurboPartKey]?.label ?? key} reconnected ✓`);
  };

  const turboMissing = (): typeof TURBO_CRITICAL =>
    TURBO_CRITICAL.filter(c => !turboInstalled[c.key]);

  const triggerTurboFailure = (missing: typeof TURBO_CRITICAL) => {
    setEngineOn(true);
    setServiceMsg('Cranking… she fires…');
    setTimeout(() => {
      const eg = engineGroupRef.current;
      if (eg) {
        ['turbo-oil-spray', 'turbo-coolant-spray'].forEach(n => {
          const o = eg.getObjectByName(n);
          if (o) o.visible = true;
        });
        eg.userData.turboSpill = { t: 0, duration: 3 };
      }
      setEngineOn(false);
      setTurboHealthy(false);
      setTurboFailure(missing.map(m => `${m.label} — MISSED: ${m.consequence}`).join('\n'));
    }, 1800);
  };

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
    if (startRemoval('service-drain-plug', { vy: 0.006, spin: 0.4, drop: 0.08, place: PLUG_TRAY_POS, reparent: true }, () => {
      setPlugRemoved(true);
      if (oilDrained) {
        setServiceMsg('Plug out and into the small tray — no spill, the engine is already drained.');
        return;
      }
      setDraining(true);
      setServiceMsg('Plug out, into the small tray — oil is draining, let it run…');
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
    if (startRemoval(`service-oil-filter-${i}`, { vy: 0.012, spin: 0.35, drop: 0.7, place: filterBenchSlot(i) }, () => {
      setFiltersRemoved(prev => prev.map((v, j) => (j === i ? true : v)));
      setServiceMsg(`Filter ${i + 1} spun off — standing by the bench ✓`);
    })) {
      setServiceMsg(`Unscrewing filter ${i + 1}…`);
    }
  };

  const removeBolt = (i: number) => {
    if (boltsRemoved[i]) return;
    const problem = toolProblem();
    if (problem) { setServiceMsg(problem); return; }
    if (startRemoval(`service-pan-bolt-${i}`, { vy: boltVy, spin: driver === 'electric' ? 0.6 : 0.2, drop: 0.4, place: boltTraySlot(i) }, () => {
      setBoltsRemoved(prev => prev.map((v, j) => (j === i ? true : v)));
      setServiceMsg(`Bolt ${i + 1}/${PAN_BOLT_COUNT} out — into the tray ✓`);
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
    if (startRemoval('service-oil-pan', { vy: driver === 'electric' ? 0.015 : 0.008, spin: 0, drop: 0.8, place: PAN_FLOOR_POS }, () => {
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
    exitInspect();
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
    if (eg) {
      ['turbo-oil-spray', 'turbo-coolant-spray'].forEach(n => {
        const o = eg.getObjectByName(n);
        if (o) o.visible = false;
      });
      ['turbo-oil-puddle', 'turbo-coolant-puddle'].forEach(n => {
        const o = eg.getObjectByName(n);
        if (o) { o.visible = false; o.scale.set(0.01, 0.01, 0.01); }
      });
      eg.userData.turboSpill = undefined;
    }
    restoreParts(SERVICE_PARTS);
    setFiltersRemoved(Array(FILTER_COUNT).fill(false));
    setBoltsRemoved(Array(PAN_BOLT_COUNT).fill(false));
    setPanRemoved(false);
    setPlugRemoved(false);
    setOilDrained(false); // reinstalled + refilled — full of fresh oil again
    setDraining(false);
    setTurboPartsOff({});
    setTurboNutsOff(Array(4).fill(false));
    setTurboRemoved(false);
    setTurboInstalled({});
    setTurboFailure(null);
    setTurboHealthy(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreParts, exitInspect]);

  const finishRepair = () => {
    resetService();
    setServiceMsg(activeRepair === 'pan-gasket'
      ? 'New gasket fitted; 22 screws torqued 24 ± 4 Nm middle-out, A & B re-checked, drain plug 60 ± 10 Nm ✓'
      : activeRepair === 'turbo-replace'
        ? 'Turbo R&R complete: smooth spool, oil pressure good, coolant stable, boost tracking rpm ✓'
        : 'New filters on (oiled gaskets, 3/4–1 turn), pan torqued 24 ± 4 Nm, filled with VDS-4 10W-30 ✓');
    setActiveRepair(null);
  };

  const openRepair = (id: RepairId) => {
    if (!hoodOpen) {
      setServiceMsg('You can\'t wrench through a closed hood: 🔑 unlock the door, 🅿 set the parking brake in the cab, then open the hood.');
      return;
    }
    resetService();
    setServiceMsg('');
    setActiveRepair(id);
  };

  const repairComplete = activeRepair === 'turbo-replace'
    ? turboHealthy
    : panRemoved && (activeRepair === 'pan-gasket' || allFiltersOff);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [screenPositions, setScreenPositions] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});
  const [rpm, setRpm] = useState(800);
  const [engineOn, setEngineOn] = useState(false);
  const [toolboxOpen, setToolboxOpen] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

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
    camera.position.set(-3.6, 1.6, 3.6);
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
    camera.position.set(-3.6, 1.6, 3.6); // walk-up view: truck nose + driver door
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
      mesh.visible = false; // hidden until the hood opens
      scene.add(mesh);
      hotspotMeshes.push(mesh);

      // Pulse ring around hotspot
      const pGeo = new THREE.RingGeometry(0.06, 0.09, 20);
      const pMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(hs.color), transparent: true, opacity: 0.4, side: THREE.DoubleSide });
      const pulse = new THREE.Mesh(pGeo, pMat);
      pulse.position.set(...hs.pos3d);
      pulse.userData.isPulse = true;
      pulse.userData.hsColor = hs.color;
      pulse.visible = false; // hidden until the hood opens
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

      // Service-mode removal animations (parts unscrew + drop, then land in a
      // tool tray / on the bench if they have a `place`, otherwise hide)
      const serviceAnims = engineGroup.userData.serviceAnims as ServiceAnim[] | undefined;
      if (serviceAnims && serviceAnims.length) {
        for (let i = serviceAnims.length - 1; i >= 0; i--) {
          const a = serviceAnims[i];
          a.obj.position.y -= a.vy;
          a.obj.rotation.y += a.spin;
          if (a.obj.position.y <= a.targetY) {
            if (a.place) {
              if (a.place.parent && a.obj.parent !== a.place.parent) a.place.parent.attach(a.obj);
              a.obj.position.set(...a.place.pos);
              a.obj.rotation.set(0, 0, 0);
            } else {
              a.obj.visible = false;
            }
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

      // Hinged truck panels (door / hood) easing toward their targets
      const hinges = engineGroup.userData.hinges as { obj: THREE.Object3D; prop: 'y' | 'z'; target: number }[] | undefined;
      if (hinges) {
        hinges.forEach(h => {
          h.obj.rotation[h.prop] += (h.target - h.obj.rotation[h.prop]) * 0.07;
        });
      }

      // Turbo failure: oil + coolant puddles spreading under the engine
      const spill = engineGroup.userData.turboSpill as { t: number; duration: number } | undefined;
      if (spill) {
        spill.t += 1 / 60;
        const s = Math.min(1, spill.t / spill.duration) * 1.6;
        ['turbo-oil-puddle', 'turbo-coolant-puddle'].forEach(n => {
          const p = engineGroup.getObjectByName(n);
          if (p) { p.visible = true; p.scale.set(s, s, s); }
        });
        if (spill.t >= spill.duration) engineGroup.userData.turboSpill = undefined;
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

    // Click a service part in 3D with the right tool selected → work starts
    // immediately. A click is a pointer that didn't drag (< 6px travel).
    const raycaster = new THREE.Raycaster();
    const ptrVec = new THREE.Vector2();
    let downAt: [number, number] | null = null;
    const onPointerDown = (e: PointerEvent) => { downAt = [e.clientX, e.clientY]; };
    const onPointerUp = (e: PointerEvent) => {
      if (!downAt) return;
      const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
      downAt = null;
      if (moved > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      ptrVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ptrVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ptrVec, camera);
      const hits = raycaster.intersectObjects(engineGroup.children, true);
      for (const h of hits) {
        let o: THREE.Object3D | null = h.object;
        while (o && !o.name.startsWith('service-') && !o.name.startsWith('truck-')) o = o.parent;
        if (o) { partClickRef.current(o.name); return; }
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

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
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 3D click routing: with the right tool in hand, clicking a fastener in
  // the scene starts the removal immediately (assigned every render so it
  // always sees fresh state; the canvas raycaster calls through the ref).
  partClickRef.current = (name: string) => {
    if (inspecting) return;
    if (name === 'truck-door') { clickDoor(); return; }
    if (name === 'truck-hood') { clickHood(); return; }
    if (name.startsWith('truck-')) return;
    if (!hoodOpen) { setServiceMsg('The hood is closed — unlock the cab, set the parking brake, then open the hood.'); return; }
    if (name.startsWith('service-pan-bolt-')) {
      if (activeRepair === 'oil-change' || activeRepair === 'pan-gasket') removeBolt(Number(name.slice('service-pan-bolt-'.length)));
      return;
    }
    if (name === 'service-drain-plug') {
      if (activeRepair === 'oil-change' || activeRepair === 'pan-gasket') removeDrainPlug();
      return;
    }
    if (name.startsWith('service-oil-filter-')) {
      if (activeRepair === 'oil-change') removeFilter(Number(name.slice('service-oil-filter-'.length)));
      return;
    }
    if (name === 'service-oil-pan') {
      if (activeRepair === 'oil-change' || activeRepair === 'pan-gasket') removePan();
      return;
    }
    if (name.startsWith('service-turbo-nut-')) { removeTurboNut(Number(name.slice('service-turbo-nut-'.length))); return; }
    if (name === 'service-turbo') { if (activeRepair === 'turbo-replace' && !turboRemoved) liftTurbo(); return; }
    if (name.startsWith('service-turbo-')) { removeTurboPart(name.slice('service-turbo-'.length) as TurboPartKey); return; }
  };

  const activeHotspotData = hotspots.find(h => h.id === activeHotspot);

  // Tools the active repair calls for — highlighted in the toolbox as "NEED".
  const requiredTools: Tool[] =
    activeRepair === 'oil-change'
      ? ['filterWrench', 'socket13', 'drainPan', 'funnel']
      : activeRepair === 'pan-gasket'
        ? ['socket15', 'ratchet', 'drainPan', 'towel']
        : activeRepair === 'turbo-replace'
          ? ['socket10', 'socket15', 'lineWrench', 'screwdriver']
          : [];

  // Guided procedure steps, derived from the live physics state.
  const procSteps: ProcStep[] =
    activeRepair === 'oil-change'
      ? [
          { id: 1, label: 'Drain the oil hot (plug reinstalls at 60 ± 10 Nm)', done: oilDrained, active: draining, requiredTool: 'socket13' },
          { id: 2, label: 'Spin off the three oil filters (wrench 9998487)', done: allFiltersOff, requiredTool: 'filterWrench', detail: `${filtersRemoved.filter(Boolean).length}/${FILTER_COUNT}` },
          { id: 3, label: 'Remove the 22 spring-tension pan screws', done: allBoltsOff, requiredTool: 'socket15', detail: `${boltsRemoved.filter(Boolean).length}/${PAN_BOLT_COUNT}` },
          { id: 4, label: 'Drop the oil pan (reinstall 24 ± 4 Nm, middle-out)', done: panRemoved, requiredTool: null },
        ]
      : activeRepair === 'pan-gasket'
        ? [
            { id: 1, label: 'Drain the oil hot (plug reinstalls at 60 ± 10 Nm)', done: oilDrained, active: draining, requiredTool: 'socket13' },
            { id: 2, label: 'Remove the 22 spring-tension pan screws', done: allBoltsOff, requiredTool: 'socket15', detail: `${boltsRemoved.filter(Boolean).length}/${PAN_BOLT_COUNT}` },
            { id: 3, label: 'Drop the pan & fit new gasket (24 ± 4 Nm middle-out)', done: panRemoved, requiredTool: 'ratchet' },
          ]
        : activeRepair === 'turbo-replace'
          ? [
              { id: 1, label: 'Unplug actuator & sensor harness', done: !!turboPartsOff['harness'] || !!turboInstalled.mounted, requiredTool: null },
              { id: 2, label: 'Pop the charge & exhaust V-bands', done: (!!turboPartsOff['charge-clamp'] && !!turboPartsOff['exh-clamp']) || !!turboInstalled.mounted, requiredTool: 'socket10' },
              { id: 3, label: 'Disconnect oil feed, coolant × 2, oil drain', done: (['oil-feed', 'coolant-a', 'coolant-b', 'oil-drain'] as TurboPartKey[]).every(k => turboPartsOff[k]) || !!turboInstalled.mounted, requiredTool: 'lineWrench' },
              { id: 4, label: 'Remove the 4 flange nuts', done: turboNutsOff.every(Boolean) || !!turboInstalled.mounted, requiredTool: 'socket15', detail: `${turboNutsOff.filter(Boolean).length}/4` },
              { id: 5, label: 'Lift the turbo off the studs', done: turboRemoved || !!turboInstalled.mounted, requiredTool: null },
              { id: 6, label: 'Mount new turbo, anti-seize + torque nuts', done: !!turboInstalled.mounted, requiredTool: 'socket15' },
              { id: 7, label: 'Reconnect ALL lines & clamps, prime the oil', done: turboMissing().length === 0 && !!turboInstalled.mounted, requiredTool: 'lineWrench', detail: `${TURBO_CRITICAL.length - turboMissing().length}/${TURBO_CRITICAL.length}` },
              { id: 8, label: 'Start engine & verify readings', done: turboHealthy, requiredTool: null },
            ]
          : [];

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
              <button
                onClick={() => setToolboxOpen(o => !o)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-all uppercase tracking-wider ${
                  toolboxOpen
                    ? 'text-cyan-300 border-cyan-400/60 bg-cyan-400/10'
                    : 'text-gray-500 border-gray-700 hover:text-cyan-300 hover:border-cyan-500/50 bg-black/30'
                }`}
              >
                🧰 Toolbox
              </button>
              <button
                onClick={() => setReferenceOpen(o => !o)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-all uppercase tracking-wider ${
                  referenceOpen
                    ? 'text-cyan-300 border-cyan-400/60 bg-cyan-400/10'
                    : 'text-gray-500 border-gray-700 hover:text-cyan-300 hover:border-cyan-500/50 bg-black/30'
                }`}
              >
                📖 Reference
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

      {/* Toolbox panel */}
      {toolboxOpen && !isLoading && (
        <ToolPanel
          selectedTool={selectedTool}
          onSelect={(t) => setSelectedTool(prev => (prev === t ? null : t))}
          requiredTools={requiredTools}
          onClose={() => setToolboxOpen(false)}
        />
      )}

      {/* Factory reference panel */}
      {referenceOpen && !isLoading && (
        <ReferencePanel onClose={() => setReferenceOpen(false)} />
      )}

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

              <ProcedurePanel title={REPAIRS.find(r => r.id === activeRepair)!.label} steps={procSteps} />

              {activeRepair === 'turbo-replace' && (
                <>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    Grab the right tool in the 🧰 Toolbox, then <span className="text-cyan-300">click the fastener on the engine</span> — the wrench starts turning immediately. Buttons below work too.
                  </p>
                  {!turboInstalled.mounted && !turboRemoved && (
                    <>
                      <p className="text-gray-400 text-[11px] uppercase tracking-widest">Disconnect (tool shown)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {TURBO_PART_KEYS.map(k => (
                          <button
                            key={k}
                            onClick={() => removeTurboPart(k)}
                            disabled={!!turboPartsOff[k]}
                            className={`px-2 py-1 text-[11px] rounded border font-bold ${
                              turboPartsOff[k] ? 'text-green-300 border-green-500/40 bg-green-500/10' : 'text-white border-white/20 bg-white/5 hover:border-cyan-400/50'
                            }`}
                          >
                            {turboPartsOff[k] ? '✓ ' : ''}{TURBO_PARTS[k].label}{TURBO_PARTS[k].tool ? ` (${TOOLS[TURBO_PARTS[k].tool!].icon})` : ' (✋)'}
                          </button>
                        ))}
                      </div>
                      <p className="text-gray-400 text-[11px] uppercase tracking-widest">Flange nuts — 15mm ({turboNutsOff.filter(Boolean).length}/4)</p>
                      <div className="flex gap-1.5">
                        {turboNutsOff.map((done, i) => (
                          <button
                            key={i}
                            onClick={() => removeTurboNut(i)}
                            disabled={done}
                            className={`px-2.5 py-1 text-[11px] rounded border font-bold font-mono ${
                              done ? 'text-green-300 border-green-500/40 bg-green-500/10' : 'text-white border-white/20 bg-white/5 hover:border-amber-400/50'
                            }`}
                          >
                            {done ? '✓' : `N${i + 1}`}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={liftTurbo}
                        className="w-full py-1.5 text-xs font-bold rounded-lg border text-white border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20"
                      >
                        ⬆ Lift the turbo off
                      </button>
                    </>
                  )}
                  {turboRemoved && !turboInstalled.mounted && (
                    <>
                      <button
                        onClick={() => inspectPart('service-turbo', 'VGT Turbocharger')}
                        className="w-full py-1.5 text-xs font-bold rounded-lg border text-cyan-300 border-cyan-400/40 bg-cyan-400/5 hover:bg-cyan-400/15"
                      >
                        🔍 Inspect the old turbo
                      </button>
                      <button
                        onClick={() => installTurboStep('mount')}
                        className="w-full py-1.5 text-xs font-bold rounded-lg border text-white border-green-400/40 bg-green-400/10 hover:bg-green-400/20"
                      >
                        🌀 Mount new turbo + torque 4 nuts
                      </button>
                    </>
                  )}
                  {turboInstalled.mounted && !turboHealthy && (
                    <>
                      <p className="text-gray-400 text-[11px] uppercase tracking-widest">Hook everything back up — skip nothing</p>
                      <div className="flex flex-wrap gap-1.5">
                        {TURBO_CRITICAL.map(c => (
                          <button
                            key={c.key}
                            onClick={() => installTurboStep(c.key)}
                            disabled={!!turboInstalled[c.key]}
                            className={`px-2 py-1 text-[11px] rounded border font-bold ${
                              turboInstalled[c.key] ? 'text-green-300 border-green-500/40 bg-green-500/10' : 'text-white border-white/20 bg-white/5 hover:border-cyan-400/50'
                            }`}
                          >
                            {turboInstalled[c.key] ? '✓ ' : ''}{c.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-amber-300/80 text-[11px] leading-relaxed">
                        ⚠️ You can hit START on the engine at any time. If anything above isn't done, you'll find out the expensive way.
                      </p>
                    </>
                  )}
                </>
              )}

              {activeRepair !== 'turbo-replace' && (<>
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
                <div className="grid grid-cols-6 gap-1.5">
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

              {/* Inspect removed parts — pick them up and turn them over */}
              {(panRemoved || filtersRemoved.some(Boolean)) && (
                <div className="space-y-1.5">
                  <p className="text-gray-400 text-[11px] uppercase tracking-widest">Inspect removed parts</p>
                  <div className="flex flex-wrap gap-1.5">
                    {panRemoved && (
                      <button
                        onClick={() => inspectPart('service-oil-pan', 'Oil Pan')}
                        className="px-2.5 py-1 text-[11px] rounded border font-bold text-cyan-300 border-cyan-400/40 bg-cyan-400/5 hover:bg-cyan-400/15"
                      >
                        🔍 Oil pan
                      </button>
                    )}
                    {filtersRemoved.map((off, i) => off && (
                      <button
                        key={i}
                        onClick={() => inspectPart(`service-oil-filter-${i}`, `Oil Filter ${i + 1}`)}
                        className="px-2.5 py-1 text-[11px] rounded border font-bold text-cyan-300 border-cyan-400/40 bg-cyan-400/5 hover:bg-cyan-400/15"
                      >
                        🔍 Filter {i + 1}
                      </button>
                    ))}
                    {plugRemoved && (
                      <button
                        onClick={() => inspectPart('service-drain-plug', 'Drain Plug')}
                        className="px-2.5 py-1 text-[11px] rounded border font-bold text-cyan-300 border-cyan-400/40 bg-cyan-400/5 hover:bg-cyan-400/15"
                      >
                        🔍 Drain plug
                      </button>
                    )}
                  </div>
                </div>
              )}
              </>)}

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

      {/* Pre-trip checklist — the real-life steps before any wrenching */}
      {!isLoading && !hoodOpen && !inspecting && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 flex items-center gap-4 text-[11px] pointer-events-none">
          <span className={doorUnlocked ? 'text-green-300' : 'text-white font-bold'}>{doorUnlocked ? '✓' : '1.'} 🔑 Unlock the door (key in hand, click the door)</span>
          <span className={parkingBrake ? 'text-green-300' : doorUnlocked ? 'text-white font-bold' : 'text-gray-500'}>{parkingBrake ? '✓' : '2.'} 🅿 Set the parking brake (in the cab)</span>
          <span className={hoodOpen ? 'text-green-300' : parkingBrake ? 'text-white font-bold' : 'text-gray-500'}>3. Open the hood (click it)</span>
        </div>
      )}

      {/* Climb into the cab */}
      {!isLoading && doorOpen && !inCab && !inspecting && (
        <button
          onClick={() => setInCab(true)}
          className="absolute bottom-24 right-6 z-20 px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg pointer-events-auto"
        >
          🪜 Climb into the cab
        </button>
      )}

      {/* In-cab view — dash controls modeled from the VNL 860 interior photos */}
      {inCab && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-[30rem] max-w-[94vw] rounded-2xl border border-white/15 bg-[#16171b] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white text-sm font-bold tracking-widest uppercase">🚛 In the cab — 2027 VNL 860</span>
              <button onClick={() => setInCab(false)} className="text-gray-500 hover:text-white text-sm">✕</button>
            </div>

            {/* Digital instrument cluster (per the dash photos) */}
            <div className="rounded-xl bg-black border border-white/10 p-4 mb-4 relative">
              {parkingBrake && (
                <span className="absolute top-2 right-3 text-red-500 font-black text-lg animate-pulse">(P)</span>
              )}
              <div className="text-center">
                <span className="text-white font-mono text-4xl font-bold">0</span>
                <span className="text-gray-500 text-xs ml-1">mph</span>
              </div>
              <div className="flex justify-between mt-3 text-[11px] font-mono">
                <span className="text-green-300">AIR 138 / 138 psi</span>
                <span className="text-amber-300">DIESEL ▮▮▮▯▯</span>
                <span className="text-cyan-300">8°F</span>
                <span className="text-gray-400">N</span>
              </div>
            </div>

            {/* Red + yellow air knobs (per the center-dash photo) */}
            <div className="flex gap-3 justify-center mb-3">
              <button
                onClick={() => setTrailerAir(t => !t)}
                className={`w-32 rounded-lg border-2 p-2 text-center transition ${trailerAir ? 'border-red-400 bg-red-600/80' : 'border-red-500 bg-red-600'} hover:brightness-110`}
              >
                <span className="block w-10 h-10 mx-auto rounded-full bg-red-500 border-4 border-red-300 shadow-inner" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }} />
                <span className="text-white text-[9px] font-bold block mt-1 leading-tight">TRAILER<br />AIR SUPPLY</span>
                <span className="text-red-200 text-[8px]">{trailerAir ? 'PUSHED IN — SUPPLYING' : 'PULLED — EXHAUSTED'}</span>
              </button>
              <button
                onClick={() => {
                  setParkingBrake(p => {
                    const next = !p;
                    setServiceMsg(next ? '🅿 Parking brake SET — air dumped, spring brakes locked. Safe to work.' : '⚠️ Parking brake released.');
                    return next;
                  });
                }}
                className={`w-32 rounded-lg border-2 p-2 text-center transition ${parkingBrake ? 'border-yellow-300 bg-yellow-500' : 'border-yellow-500 bg-yellow-500/90'} hover:brightness-110`}
              >
                <span className="block w-10 h-10 mx-auto bg-yellow-400 border-4 border-yellow-200 shadow-inner rotate-45" />
                <span className="text-black text-[9px] font-bold block mt-1 leading-tight">PARKING<br />BRAKE</span>
                <span className="text-yellow-900 text-[8px]">{parkingBrake ? 'PULLED — APPLIED ✓' : 'PULL TO APPLY'}</span>
              </button>
            </div>

            <p className="text-gray-500 text-[11px] text-center leading-relaxed">
              Pull the yellow diamond to set the spring brakes before you leave the cab.
            </p>
            <button
              onClick={() => setInCab(false)}
              className="mt-3 w-full py-2 rounded-lg text-xs font-bold border border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              🪜 Climb out
            </button>
          </div>
        </div>
      )}

      {/* Catastrophic turbo failure overlay */}
      {turboFailure && (
        <div className="absolute inset-0 z-40 pointer-events-none">
          <div className="absolute inset-0 animate-pulse" style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(255,30,30,0.16) 0%, transparent 65%)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[26rem] max-w-[92vw] pointer-events-auto rounded-2xl border border-red-500/60 bg-black/90 backdrop-blur-md p-5">
            <p className="text-red-400 text-lg font-black tracking-widest uppercase">💥 Catastrophic failure</p>
            <p className="text-gray-300 text-xs mt-2 leading-relaxed">
              The turbo let go seconds after start-up. Oil and coolant are pouring out under the engine — both systems share the turbo's center housing.
            </p>
            <pre className="text-red-300 text-[11px] mt-3 whitespace-pre-wrap font-mono leading-relaxed">{turboFailure}</pre>
            <button
              onClick={() => { resetService(); setActiveRepair('turbo-replace'); setServiceMsg('Fresh reman turbo on the bench — do it right this time.'); }}
              className="mt-4 w-full py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-red-500 to-orange-600 text-white hover:shadow-lg"
            >
              ↺ Scrap it — start the job over with a new turbo
            </button>
          </div>
        </div>
      )}

      {/* Part inspection overlay */}
      {inspecting && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-auto">
          <div className="px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-cyan-400/40 text-center">
            <p className="text-cyan-300 text-sm font-bold">🔍 Inspecting: {inspecting.label}</p>
            <p className="text-gray-400 text-[11px] mt-0.5">drag to flip &amp; rotate · scroll to zoom · right-drag to move it around</p>
          </div>
          <button
            onClick={exitInspect}
            className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg"
          >
            ✓ Done — put it down
          </button>
        </div>
      )}

      {/* Hotspot 2D labels */}
      {!isLoading && !inspecting && hoodOpen && hotspots.map(hs => {
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
              onClick={() => {
                if (engineOn) { setEngineOn(false); return; }
                if (!doorUnlocked) { setServiceMsg('You\'re locked out — 🔑 key first, then the cab.'); return; }
                if (!parkingBrake) { setServiceMsg('Set the 🅿 parking brake before starting the engine.'); return; }
                if (turboTouched) {
                  if (turboRemoved || !turboInstalled.mounted) {
                    setServiceMsg("There's a hole where the turbo goes — mount it before you start her.");
                    return;
                  }
                  const missing = turboMissing();
                  if (missing.length) { triggerTurboFailure(missing); return; }
                  setTurboHealthy(true);
                  setServiceMsg('Smooth spool-up — oil pressure good, coolant stable, boost tracking rpm ✓');
                }
                setEngineOn(true);
              }}
              className={`ml-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${engineOn ? 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30'}`}
            >
              {engineOn ? 'STOP' : 'START'}
            </button>
          </div>
          {(engineOn || turboFailure) && (
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'BOOST', value: turboFailure ? '0 psi' : `${Math.round((rpm / 1900) * 32)} psi`, bad: !!turboFailure },
                { label: 'OIL', value: turboFailure ? '4 psi' : '45 psi', bad: !!turboFailure },
                { label: 'COOLANT', value: turboFailure ? '248°F' : '190°F', bad: !!turboFailure },
              ].map(g => (
                <div key={g.label}>
                  <div className={`font-mono text-xs font-bold ${g.bad ? 'text-red-400 animate-pulse' : 'text-cyan-300'}`}>{g.value}</div>
                  <div className="text-gray-600 text-[9px]">{g.label}</div>
                </div>
              ))}
            </div>
          )}
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

  // Oil pan — removable in oil-change service mode. Modeled after the used
  // D13 pan reference photos in public/images/ref/: a shallow channel under
  // most of the block stepping down into a deep box sump at the front, with
  // the level/temp sensor + flanged port on the sump wall, three round
  // bosses + recessed hex drain plug on the sump bottom, lengthwise
  // stiffening ribs, and a full-perimeter bolt flange — all Volvo green.
  const oilPan = new THREE.Group();
  oilPan.name = 'service-oil-pan';
  group.add(oilPan);
  // Flange lip mating the block (bolt line sits on this)
  add(new THREE.BoxGeometry(2.06, 0.03, 0.72), M.teal, { pos: [0, -0.595, 0], parent: oilPan });
  // Shallow channel section (rear ~60% of length, narrower than the flange)
  add(new THREE.BoxGeometry(1.2, 0.13, 0.42), M.teal, { pos: [-0.43, -0.675, 0], parent: oilPan });
  // Step / transition from channel down into the sump
  add(new THREE.BoxGeometry(0.24, 0.3, 0.56), M.teal, { pos: [0.2, -0.73, 0], rot: [0, 0, 0.35], parent: oilPan });
  // Deep sump box (front end, full width)
  add(new THREE.BoxGeometry(0.87, 0.36, 0.62), M.teal, { pos: [0.6, -0.79, 0], parent: oilPan });
  // Lengthwise stiffening ribs on the sump bottom
  [-0.15, 0, 0.15].forEach(rz => {
    add(new THREE.BoxGeometry(0.8, 0.012, 0.022), M.darkTeal, { pos: [0.6, -0.968, rz], parent: oilPan });
  });
  // Ribs under the shallow channel
  [-0.1, 0.1].forEach(rz => {
    add(new THREE.BoxGeometry(1.1, 0.01, 0.02), M.darkTeal, { pos: [-0.43, -0.742, rz], parent: oilPan });
  });
  // Three round bosses clustered on the sump bottom (as in the photos)
  [[0.5, 0.02], [0.56, -0.06], [0.62, 0.02]].forEach(([bx, bz]) => {
    add(new THREE.CylinderGeometry(0.034, 0.034, 0.02, 14), M.darkTeal, { pos: [bx, -0.972, bz], parent: oilPan });
  });
  // Corner screw bosses on the sump underside
  [[0.22, 0.24], [0.22, -0.24], [0.98, 0.24], [0.98, -0.24]].forEach(([bx, bz]) => {
    add(new THREE.CylinderGeometry(0.02, 0.02, 0.015, 10), M.darkTeal, { pos: [bx, -0.972, bz], parent: oilPan });
  });
  // Recessed drain plug ring on the sump bottom
  add(new THREE.CylinderGeometry(0.052, 0.052, 0.012, 18), M.darkTeal, { pos: [0.78, -0.972, 0.12], parent: oilPan });
  // Sump wall hardware (+z side, like the photos): oil level/temperature
  // sensor on a triangular plate, a second small round sensor, and the
  // flanged port with two screws
  add(new THREE.BoxGeometry(0.11, 0.1, 0.016), M.darkTeal, { pos: [0.42, -0.78, 0.312], parent: oilPan });
  add(new THREE.CylinderGeometry(0.026, 0.026, 0.05, 12), M.black, { pos: [0.42, -0.78, 0.33], rot: [Math.PI / 2, 0, 0], parent: oilPan });
  add(new THREE.CylinderGeometry(0.018, 0.018, 0.04, 12), M.blue, { pos: [0.56, -0.8, 0.325], rot: [Math.PI / 2, 0, 0], parent: oilPan });
  add(new THREE.BoxGeometry(0.1, 0.08, 0.014), M.darkTeal, { pos: [0.76, -0.77, 0.312], parent: oilPan });
  add(new THREE.CylinderGeometry(0.026, 0.026, 0.02, 12), M.black, { pos: [0.76, -0.77, 0.322], rot: [Math.PI / 2, 0, 0], parent: oilPan });
  // Drain plug — hex head in the recessed ring; pull it to drain the oil
  const drainPlug = new THREE.Group();
  drainPlug.name = 'service-drain-plug';
  oilPan.add(drainPlug);
  add(new THREE.CylinderGeometry(0.028, 0.028, 0.05, 6), M.chrome, { pos: [0.78, -0.985, 0.12], parent: drainPlug });
  // Oil stream + puddle, hidden until the plug comes out (or a full pan drops)
  const oilMat = new THREE.MeshStandardMaterial({ color: 0x1a1206, metalness: 0.35, roughness: 0.12 });
  const oilStream = add(new THREE.CylinderGeometry(0.014, 0.026, 0.12, 8), oilMat, { pos: [0.78, -1.035, 0.12], shadow: false });
  oilStream.name = 'oil-stream';
  oilStream.visible = false;
  const oilPuddle = add(new THREE.CircleGeometry(0.5, 24), oilMat, { pos: [0.78, -1.095, 0.12], rot: [-Math.PI / 2, 0, 0], shadow: false });
  oilPuddle.name = 'oil-puddle';
  oilPuddle.visible = false;
  oilPuddle.scale.set(0.01, 0.01, 0.01);
  // Pan flange bolts — 22 spring-tension screws around the full flange, like
  // the real D13 pan (layout shared with the tray-slot math up top). Hex
  // heads protrude below the flange lip so every bolt is visible.
  PAN_BOLT_POSITIONS.forEach(([bx, bz], i) => {
    const bolt = new THREE.Group();
    bolt.name = `service-pan-bolt-${i}`;
    group.add(bolt);
    add(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 6), M.chrome, { pos: [bx, -0.628, bz], parent: bolt });
    add(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8), M.brushedMetal, { pos: [bx, -0.6, bz], parent: bolt });
  });

  // Tool trays on the shop floor: a big tray for the 22 pan screws and a
  // small one for the drain plug. Removed hardware lands in them.
  const trayMat = new THREE.MeshStandardMaterial({ color: 0x8a1111, metalness: 0.6, roughness: 0.4 });
  const mkTray = (cx: number, cz: number, w: number, d: number) => {
    add(new THREE.BoxGeometry(w, 0.02, d), trayMat, { pos: [cx, -1.08, cz] });
    add(new THREE.BoxGeometry(w, 0.05, 0.015), trayMat, { pos: [cx, -1.065, cz - d / 2] });
    add(new THREE.BoxGeometry(w, 0.05, 0.015), trayMat, { pos: [cx, -1.065, cz + d / 2] });
    add(new THREE.BoxGeometry(0.015, 0.05, d), trayMat, { pos: [cx - w / 2, -1.065, cz] });
    add(new THREE.BoxGeometry(0.015, 0.05, d), trayMat, { pos: [cx + w / 2, -1.065, cz] });
  };
  mkTray(0.93, 0.815, 0.56, 0.42); // pan screws, 6 per row
  mkTray(1.32, 0.85, 0.2, 0.18);   // drain plug
  mkTray(-1.15, 0.9, 0.32, 0.24);  // turbo flange nuts
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
  // 6. TURBOCHARGER — modeled from the four reman-turbo reference photos
  // (compressor face / front quarter / turbine face / center housing).
  // Scale basis: compressor scroll Ø D = 0.4 scene units; turbine ≈ 0.85 D,
  // assembly length ≈ 1.15 D, actuator ≈ 0.75 × 0.45 D — all cross-checked
  // between at least two views.
  // ══════════════════════════════════════
  const castAlu = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: 0.75, roughness: 0.42 });
  const castIron = new THREE.MeshStandardMaterial({ color: 0x6f7276, metalness: 0.7, roughness: 0.55 });
  const bayonetGreen = new THREE.MeshStandardMaterial({ color: 0x2e8b3a, metalness: 0.3, roughness: 0.5 });
  const coolantMat = new THREE.MeshStandardMaterial({ color: 0x35d07a, metalness: 0.1, roughness: 0.15 });

  const turbo = new THREE.Group();
  turbo.name = 'service-turbo';
  group.add(turbo);
  const T = { x: TURBO_CX, y: TURBO_CY, z: TURBO_CZ };

  // Compressor housing + scroll (cast aluminium; photos 1–2)
  add(new THREE.CylinderGeometry(0.2, 0.2, 0.11, 28), castAlu, { pos: [T.x + 0.14, T.y, T.z], rot: [0, 0, Math.PI / 2], parent: turbo });
  add(new THREE.TorusGeometry(0.155, 0.048, 14, 28), castAlu, { pos: [T.x + 0.14, T.y, T.z], rot: [0, Math.PI / 2, 0], parent: turbo });
  // Inlet bore with the compressor wheel visible (photo 1)
  add(new THREE.CylinderGeometry(0.076, 0.076, 0.07, 20), castAlu, { pos: [T.x + 0.215, T.y, T.z], rot: [0, 0, Math.PI / 2], parent: turbo });
  add(new THREE.ConeGeometry(0.05, 0.06, 7), M.chrome, { pos: [T.x + 0.23, T.y, T.z], rot: [0, 0, -Math.PI / 2], parent: turbo });
  // Compressor outlet elbow dropping to the charge-pipe flange (photos 1–2)
  const elbowPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(T.x + 0.14, T.y - 0.16, T.z),
    new THREE.Vector3(T.x + 0.12, T.y - 0.26, T.z + 0.04),
    new THREE.Vector3(T.x + 0.10, T.y - 0.32, T.z + 0.06),
  ]);
  add(new THREE.TubeGeometry(elbowPath, 10, 0.055, 12, false), castAlu, { parent: turbo });
  add(new THREE.CylinderGeometry(0.068, 0.068, 0.025, 18), castAlu, { pos: [0.6, -0.08, 0.36], parent: turbo });
  // Blue reman ID tag (photos 1–2)
  add(new THREE.BoxGeometry(0.06, 0.03, 0.006), M.blue, { pos: [T.x + 0.16, T.y - 0.12, T.z + 0.1], parent: turbo });

  // Center bearing housing between twin V-band clamps (photo 4)
  add(new THREE.CylinderGeometry(0.09, 0.09, 0.13, 20), castIron, { pos: [T.x - 0.03, T.y, T.z], rot: [0, 0, Math.PI / 2], parent: turbo });
  add(new THREE.TorusGeometry(0.115, 0.017, 10, 24), M.chrome, { pos: [T.x + 0.045, T.y, T.z], rot: [0, Math.PI / 2, 0], parent: turbo });
  add(new THREE.TorusGeometry(0.115, 0.017, 10, 24), M.chrome, { pos: [T.x - 0.105, T.y, T.z], rot: [0, Math.PI / 2, 0], parent: turbo });
  // Speed sensor with green bayonet ring on the housing top (photos 1/4)
  add(new THREE.CylinderGeometry(0.016, 0.016, 0.05, 10), M.black, { pos: [T.x - 0.03, T.y + 0.11, T.z], parent: turbo });
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.015, 10), bayonetGreen, { pos: [T.x - 0.03, T.y + 0.085, T.z], parent: turbo });

  // Turbine housing + scroll (darker cast iron; photos 3–4)
  add(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 28), castIron, { pos: [T.x - 0.17, T.y, T.z], rot: [0, 0, Math.PI / 2], parent: turbo });
  add(new THREE.TorusGeometry(0.13, 0.042, 14, 28), castIron, { pos: [T.x - 0.17, T.y, T.z], rot: [0, Math.PI / 2, 0], parent: turbo });
  // Turbine outlet bore + wheel (photo 3)
  add(new THREE.CylinderGeometry(0.084, 0.084, 0.06, 20), castIron, { pos: [T.x - 0.25, T.y, T.z], rot: [0, 0, Math.PI / 2], parent: turbo });
  add(new THREE.ConeGeometry(0.06, 0.05, 11), M.darkMetal, { pos: [T.x - 0.26, T.y, T.z], rot: [0, 0, Math.PI / 2], parent: turbo });
  // Exhaust inlet riser + flange on top of the turbine housing (photos 2–4)
  add(new THREE.BoxGeometry(0.14, 0.12, 0.09), castIron, { pos: [T.x - 0.17, T.y + 0.12, T.z], parent: turbo });
  add(new THREE.BoxGeometry(0.2, 0.05, 0.12), castIron, { pos: [T.x - 0.17, T.y + 0.2, T.z], parent: turbo });

  // VGT actuator: white finned box, round cap, bracket (photos 1–2)
  add(new THREE.BoxGeometry(0.16, 0.28, 0.07), M.white, { pos: [T.x + 0.12, T.y + 0.06, T.z + 0.16], parent: turbo });
  for (let i = 0; i < 5; i++) {
    add(new THREE.BoxGeometry(0.13, 0.03, 0.012), M.brushedMetal, { pos: [T.x + 0.12, T.y - 0.04 + i * 0.05, T.z + 0.2], parent: turbo });
  }
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 18), M.white, { pos: [T.x + 0.12, T.y + 0.16, T.z + 0.2], rot: [Math.PI / 2, 0, 0], parent: turbo });
  add(new THREE.BoxGeometry(0.04, 0.03, 0.1), M.darkMetal, { pos: [T.x + 0.12, T.y, T.z + 0.08], parent: turbo });

  // ── Disconnectable turbo parts (siblings so they stay put when the
  //    assembly is lifted; positions match TURBO_PARTS anchors) ──
  const mkPart = (key: string) => {
    const g = new THREE.Group();
    g.name = `service-turbo-${key}`;
    group.add(g);
    return g;
  };
  // Harness with green connector (photos 1/4)
  const harness = mkPart('harness');
  const harnessPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.62, 0.14, 0.44),
    new THREE.Vector3(0.58, 0.10, 0.44),
    new THREE.Vector3(0.55, 0.13, 0.42),
    new THREE.Vector3(0.50, 0.15, 0.36),
  ]);
  add(new THREE.TubeGeometry(harnessPath, 12, 0.012, 8, false), M.rubber, { parent: harness, shadow: false });
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 12), bayonetGreen, { pos: [0.5, 0.155, 0.35], parent: harness });
  // Charge pipe V-band (vertical-axis flange under the elbow)
  add(new THREE.TorusGeometry(0.072, 0.014, 10, 22), M.chrome, { pos: TURBO_PARTS['charge-clamp'].anchor, rot: [Math.PI / 2, 0, 0], parent: mkPart('charge-clamp') });
  // Exhaust V-band at the turbine outlet
  add(new THREE.TorusGeometry(0.096, 0.015, 10, 22), M.chrome, { pos: TURBO_PARTS['exh-clamp'].anchor, rot: [0, Math.PI / 2, 0], parent: mkPart('exh-clamp') });
  // Oil feed line up to the block gallery
  const oilFeed = mkPart('oil-feed');
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.47, 0.36, 0.28), new THREE.Vector3(0.44, 0.48, 0.20), new THREE.Vector3(0.40, 0.52, 0.10),
  ]), 10, 0.012, 8, false), M.chrome, { parent: oilFeed, shadow: false });
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 10), M.brushedMetal, { pos: [0.47, 0.355, 0.28], parent: oilFeed });
  // Two coolant lines (the center housing is water cooled)
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.52, 0.32, 0.22), new THREE.Vector3(0.56, 0.44, 0.10), new THREE.Vector3(0.60, 0.50, -0.02),
  ]), 10, 0.013, 8, false), M.rubber, { parent: mkPart('coolant-a'), shadow: false });
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.52, 0.18, 0.22), new THREE.Vector3(0.58, 0.10, 0.08), new THREE.Vector3(0.62, 0.04, -0.05),
  ]), 10, 0.013, 8, false), M.rubber, { parent: mkPart('coolant-b'), shadow: false });
  // Oil drain tube back to the block
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.47, 0.16, 0.30), new THREE.Vector3(0.46, 0.02, 0.28), new THREE.Vector3(0.44, -0.09, 0.25),
  ]), 10, 0.02, 8, false), M.rubber, { parent: mkPart('oil-drain'), shadow: false });
  // 4 flange nuts on the manifold studs
  TURBO_NUT_POS.forEach((p, i) => {
    const nut = new THREE.Group();
    nut.name = `service-turbo-nut-${i}`;
    group.add(nut);
    add(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 6), M.chrome, { pos: p, parent: nut });
  });

  // Failure sprays: oil + coolant blasting out of the center housing,
  // hidden until an incorrect install lets go
  const turboOilSpray = add(new THREE.CylinderGeometry(0.012, 0.035, 0.9, 8), oilMat, { pos: [0.62, -0.55, 0.5], rot: [0.35, 0, -0.25], shadow: false });
  turboOilSpray.name = 'turbo-oil-spray';
  turboOilSpray.visible = false;
  const turboOilPuddle = add(new THREE.CircleGeometry(0.4, 20), oilMat, { pos: [0.85, -1.09, 0.7], rot: [-Math.PI / 2, 0, 0], shadow: false });
  turboOilPuddle.name = 'turbo-oil-puddle';
  turboOilPuddle.visible = false;
  turboOilPuddle.scale.set(0.01, 0.01, 0.01);
  const turboCoolSpray = add(new THREE.CylinderGeometry(0.012, 0.035, 0.85, 8), coolantMat, { pos: [0.35, -0.5, 0.45], rot: [0.3, 0, 0.3], shadow: false });
  turboCoolSpray.name = 'turbo-coolant-spray';
  turboCoolSpray.visible = false;
  const turboCoolPuddle = add(new THREE.CircleGeometry(0.4, 20), coolantMat, { pos: [0.25, -1.09, 0.78], rot: [-Math.PI / 2, 0, 0], shadow: false });
  turboCoolPuddle.name = 'turbo-coolant-puddle';
  turboCoolPuddle.visible = false;
  turboCoolPuddle.scale.set(0.01, 0.01, 0.01);
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
  // 16. TRUCK BODY — 2027 Volvo VNL 860 (white, per the listing photos).
  // Interior controls (parking brake / cluster) are modeled in the cab
  // overlay from the dash photos; exterior is a recognizable VNL shape.
  // ══════════════════════════════════════
  const paint = new THREE.MeshStandardMaterial({ color: 0xf2f4f6, metalness: 0.5, roughness: 0.32 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x1a2836, metalness: 0.4, roughness: 0.1, transparent: true, opacity: 0.55 });
  const grilleDark = new THREE.MeshStandardMaterial({ color: 0x14161a, metalness: 0.5, roughness: 0.5 });

  const truckBody = new THREE.Group();
  truckBody.name = 'truck-cab';
  group.add(truckBody);

  // Frame rails + crossmembers
  [-0.42, 0.42].forEach(rz => {
    add(new THREE.BoxGeometry(6.2, 0.12, 0.1), M.darkMetal, { pos: [0.45, -0.62, rz], parent: truckBody });
  });
  [-2.2, 0, 2.2].forEach(rx => {
    add(new THREE.BoxGeometry(0.08, 0.1, 0.86), M.darkMetal, { pos: [rx, -0.62, 0], parent: truckBody });
  });
  // Wheels (front steer + rear duals) with chrome hubs
  const wheelAt = (wx: number, wz: number) => {
    add(new THREE.CylinderGeometry(0.5, 0.5, 0.28, 24), M.rubber, { pos: [wx, -0.6, wz], rot: [Math.PI / 2, 0, 0], parent: truckBody });
    add(new THREE.CylinderGeometry(0.22, 0.22, 0.29, 16), M.chrome, { pos: [wx, -0.6, wz], rot: [Math.PI / 2, 0, 0], parent: truckBody });
  };
  [[-1.5, 0.75], [-1.5, -0.75], [2.4, 0.78], [2.4, -0.78], [3.3, 0.78], [3.3, -0.78]].forEach(([wx, wz]) => wheelAt(wx, wz));
  // Cab shell + sleeper (VNL 860 tall roof)
  add(new THREE.BoxGeometry(2.2, 1.9, 1.7), paint, { pos: [2.55, 0.55, 0], parent: truckBody });
  add(new THREE.BoxGeometry(2.0, 0.85, 1.6), paint, { pos: [2.65, 1.85, 0], rot: [0, 0, 0.06], parent: truckBody });
  // Windshield + side glass
  add(new THREE.BoxGeometry(0.06, 0.75, 1.5), glass, { pos: [1.48, 1.05, 0], rot: [0, 0, -0.12], parent: truckBody });
  add(new THREE.BoxGeometry(0.7, 0.45, 0.04), glass, { pos: [2.9, 1.05, 0.86], parent: truckBody });
  add(new THREE.BoxGeometry(0.7, 0.45, 0.04), glass, { pos: [2.9, 1.05, -0.86], parent: truckBody });
  // Mirrors, steps, fuel tank, exhaust stack
  add(new THREE.BoxGeometry(0.05, 0.4, 0.18), M.darkMetal, { pos: [1.55, 1.35, 1.0], parent: truckBody });
  add(new THREE.BoxGeometry(0.05, 0.4, 0.18), M.darkMetal, { pos: [1.55, 1.35, -1.0], parent: truckBody });
  add(new THREE.BoxGeometry(0.5, 0.05, 0.3), M.brushedMetal, { pos: [2.0, -0.55, 0.95], parent: truckBody });
  add(new THREE.BoxGeometry(0.5, 0.05, 0.3), M.brushedMetal, { pos: [2.0, -0.9, 0.95], parent: truckBody });
  add(new THREE.CylinderGeometry(0.26, 0.26, 1.1, 18), M.chrome, { pos: [2.75, -0.75, 0.85], rot: [0, 0, Math.PI / 2], parent: truckBody });
  add(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 12), M.chrome, { pos: [3.68, 1.1, 0.8], parent: truckBody });

  // Driver door (hinged at its front edge; needs the key)
  const door = new THREE.Group();
  door.name = 'truck-door';
  door.position.set(1.68, 0.35, 0.86);
  truckBody.add(door);
  add(new THREE.BoxGeometry(0.85, 1.45, 0.06), paint, { pos: [0.45, 0.15, 0], parent: door });
  add(new THREE.BoxGeometry(0.7, 0.5, 0.04), glass, { pos: [0.45, 0.75, 0.01], parent: door });
  add(new THREE.BoxGeometry(0.14, 0.035, 0.05), grilleDark, { pos: [0.75, 0.05, 0.05], parent: door });

  // Hood — tilts FORWARD like the real VNL, pivot at the front bumper
  const hood = new THREE.Group();
  hood.name = 'truck-hood';
  hood.position.set(-2.3, -0.45, 0);
  truckBody.add(hood);
  // top panel (sloped down toward the nose) + side panels + fender arches
  add(new THREE.BoxGeometry(3.75, 0.07, 1.5), paint, { pos: [1.85, 1.42, 0], rot: [0, 0, 0.09], parent: hood });
  add(new THREE.BoxGeometry(3.75, 0.95, 0.06), paint, { pos: [1.85, 0.85, 0.74], rot: [0, 0.0, 0.02], parent: hood });
  add(new THREE.BoxGeometry(3.75, 0.95, 0.06), paint, { pos: [1.85, 0.85, -0.74], rot: [0, 0, 0.02], parent: hood });
  add(new THREE.BoxGeometry(1.3, 0.12, 0.34), paint, { pos: [0.85, 0.42, 0.78], parent: hood });
  add(new THREE.BoxGeometry(1.3, 0.12, 0.34), paint, { pos: [0.85, 0.42, -0.78], parent: hood });
  // nose: grille frame, slats, Volvo diagonal slash, headlights, bumper
  add(new THREE.BoxGeometry(0.12, 1.15, 1.46), paint, { pos: [0.1, 0.85, 0], parent: hood });
  for (let i = 0; i < 5; i++) {
    add(new THREE.BoxGeometry(0.03, 0.1, 1.2), grilleDark, { pos: [0.045, 0.5 + i * 0.16, 0], parent: hood });
  }
  add(new THREE.BoxGeometry(0.03, 1.05, 0.1), M.brushedMetal, { pos: [0.03, 0.85, 0], rot: [0.5, 0, 0], parent: hood });
  add(new THREE.BoxGeometry(0.06, 0.14, 0.32), M.white, { pos: [0.05, 0.32, 0.55], parent: hood });
  add(new THREE.BoxGeometry(0.06, 0.14, 0.32), M.white, { pos: [0.05, 0.32, -0.55], parent: hood });
  add(new THREE.BoxGeometry(0.25, 0.22, 1.7), grilleDark, { pos: [0.1, 0.05, 0], parent: hood });
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
