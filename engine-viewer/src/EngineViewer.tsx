import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import ToolPanel, { TOOLS, TOOL_PRICES, TOOL_MIN_LEVEL, type Tool, type DrawerKey } from './components/ToolPanel';
import HandHUD from './components/HandHUD';
import ProcedurePanel, { type ProcStep } from './components/ProcedurePanel';
import ReferencePanel from './components/ReferencePanel';
import { kcLogin, kcLogout, kcHandleRedirect, kcIsLoggedIn, kcCurrentUser, kcApiFetch } from './keycloakAuth';

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
// Vehicles — picked from the dropdown BEFORE anything loads.
// 'vnl860' is the class-8 truck + D13 shop experience; 'sonata2017'
// is the light-duty car, modeled from the photos in
// docs/reference/sonata/ (front 3/4, rear, engine bay).
// ─────────────────────────────────────────────────────────
type VehicleId = 'vnl860' | 'sonata2017';

const VEHICLES: Record<VehicleId, { label: string; blurb: string }> = {
  vnl860: { label: 'Volvo VNL 860 — Class 8 Truck', blurb: 'Heavy-duty diesel: D13 engine, I-Shift, full shop with toolbox & repairs' },
  sonata2017: { label: '2017 Hyundai Sonata — Sedan', blurb: 'Light-duty gas: 2.4L GDi inline-4, walk-around & engine bay' },
};

/** Info-panel identity for the Sonata (the diesel ENGINES entries stay
 *  truck-only). Factory figures for the 2.4L Theta II GDi. */
const SONATA_ENGINE: EngineInfo = {
  maker: 'HYUNDAI',
  makerLetter: 'H',
  model: 'Sonata',
  tagline: '2.4L GDi Inline-4 · 2017 · Interactive 3D Model',
  hp: '185 HP',
  torque: '178 lb·ft',
  specs: [
    { label: 'Displacement', value: '2.4 L (144 ci)' },
    { label: 'Configuration', value: 'Inline-4, transverse' },
    { label: 'Peak Power', value: '185 HP @ 6,000' },
    { label: 'Max Torque', value: '178 lb-ft @ 4,000' },
    { label: 'Bore × Stroke', value: '88 × 97 mm' },
    { label: 'Compression', value: '11.3:1' },
    { label: 'Fuel System', value: 'Gasoline Direct Injection' },
    { label: 'Valvetrain', value: 'DOHC, D-CVVT, 16v' },
    { label: 'Transmission', value: '6-speed automatic' },
    { label: 'Oil Capacity', value: '5.1 qt (4.8 L)' },
  ],
};

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

type RepairId = 'fluid-check' | 'annual-inspection' | 'oil-change' | 'hood-cable' | 'pan-gasket' | 'overhead-adjust' | 'turbo-replace';

// Tools a repair actually can't be started without — the two specialty
// tools its procSteps checks for (`requiredTool`). Every specialty tool is
// priced now (see TOOL_PRICES in ToolPanel.tsx), but only these two are
// load-bearing enough to block openRepair; the rest are worth owning
// without gating anything specific yet. Checked alongside the level gate.
const REPAIR_REQUIRED_TOOL: Partial<Record<RepairId, Tool>> = {
  'oil-change': 'filterWrench',
  'turbo-replace': 'lineWrench',
};

// Mechanic career ladder: each repair sits at a tier, pays coins on
// completion, and stays locked until the player's level (derived from total
// coins earned, see `levelForCoins`) reaches `unlockLevel`. PM Service and
// Annual Inspection are the deliberate floor — the only two jobs a level-1
// Lube Tech can take, both tool-free, no specialty purchase required — with
// each tier up adding more steps/systems (and, for oil-change/turbo-replace,
// a specialty tool that has to be bought first) and a bigger payout, so
// "better diesel tech" reads as "handles harder jobs," not just a number
// going up.
const REPAIRS: { id: RepairId; icon: string; label: string; desc: string; tier: number; unlockLevel: number; coinReward: number }[] = [
  {
    id: 'fluid-check',
    icon: '💧',
    label: 'PM Service',
    desc: 'No teardown — check and top off engine oil (dipstick), coolant surge tank, windshield washer, and DEF from the shop\'s jugs, then grease every zerk fitting on the chassis. One of the two jobs every tech starts on.',
    tier: 1,
    unlockLevel: 1,
    coinReward: 60,
  },
  {
    id: 'annual-inspection',
    icon: '📋',
    label: 'Annual Inspection',
    desc: 'DOT annual: torque-check the rear axle housing bolts and the differential carrier bolts against spec, flag anything loose. The other job every tech starts on — no teardown, no specialty tool.',
    tier: 1,
    unlockLevel: 1,
    coinReward: 75,
  },
  {
    id: 'oil-change',
    icon: '🛢️',
    label: 'Oil & Filter Change',
    desc: 'Drain (plug: 60 ± 10 Nm on install), spin off the three filters with the 9998487 filter wrench, then drop the pan. The 22 pan screws need the 10" socket extension + electric runner or hand tools. Refill: VDS-4 10W-30, 25–30 L sump.',
    tier: 2,
    unlockLevel: 2,
    coinReward: 100,
  },
  {
    id: 'hood-cable',
    icon: '🪝',
    label: 'Hood Release Cable Repair',
    desc: 'Per Volvo TSB (hood cable binding/broken, VNL/VNR/VNM/VNX/VAH/VHD): strip the dash/kick/steering-column trim, free the old cable through the firewall, route + secure the new one, swap the latch/L-bracket if needed, reinstall trim, then test the release lever.',
    tier: 3,
    unlockLevel: 3,
    coinReward: 150,
  },
  {
    id: 'pan-gasket',
    icon: '🔩',
    label: 'Oil Pan Gasket Repair',
    desc: 'Break all 22 spring-tension pan screws loose one at a time, drop the pan, fit the new gasket, re-torque 24 ± 4 Nm from the middle outwards.',
    tier: 4,
    unlockLevel: 4,
    coinReward: 175,
  },
  {
    id: 'overhead-adjust',
    icon: '🔧',
    label: 'Valve Lash Adjustment',
    desc: 'Pull the 16 valve cover perimeter bolts (13mm) one at a time, then lift the cover off to expose the rockers. Check/adjust lash at TDC compression per cylinder, then reinstall with a fresh gasket, bolts snugged in a criss-cross pattern.',
    tier: 5,
    unlockLevel: 5,
    coinReward: 225,
  },
  {
    id: 'turbo-replace',
    icon: '🌀',
    label: 'Turbocharger R&R',
    desc: 'Remove & replace the VGT turbo. Select the right tool, then click each fastener in 3D (or use the buttons): harness → V-bands → oil feed → coolant × 2 → oil drain → 4 flange nuts → lift. The turbo shares the engine\'s OIL and COOLANT — reconnect everything and PRIME the oil before starting, or it grenades.',
    tier: 6,
    unlockLevel: 6,
    coinReward: 300,
  },
];

// Career levels — title reflects the *kind* of job that level's mechanic can
// take on, not just a number. Coin thresholds are sized so hitting the next
// level takes a small mix of jobs at the current tier, not one grind.
const LEVELS: { level: number; title: string; coinsRequired: number }[] = [
  { level: 1, title: 'Lube Tech', coinsRequired: 0 },
  { level: 2, title: 'Shop Mechanic', coinsRequired: 150 },
  { level: 3, title: 'Journeyman Tech', coinsRequired: 450 },
  { level: 4, title: 'Senior Tech', coinsRequired: 900 },
  { level: 5, title: 'Lead Tech', coinsRequired: 1500 },
  { level: 6, title: 'Master Diesel Tech', coinsRequired: 2300 },
];
const levelForCoins = (coins: number) => [...LEVELS].reverse().find(l => coins >= l.coinsRequired) ?? LEVELS[0];
const nextLevel = (level: number) => LEVELS.find(l => l.level === level + 1);

// Toolbox sections: the physical Snap-on "MR. BIG" wall (see the toolbox
// build section, ~line 4300+) is never deleted or rebuilt smaller — a new
// tech just doesn't own most of it yet. Starting kit is 5 drawers (both
// socket drawers, both wrench drawers, general); the specialty Volvo-tool
// drawer and the wall's decorative facade/lockers are bought section by
// section as the two purchasable upgrades. Unowned sections are hidden via
// `.visible` on their existing group (`toolbox-drawer-specialty` /
// `toolbox-facade`), not deleted — same "never delete, only reveal" spirit
// as the rest of this project's geometry rules.
type ToolboxSectionId = 'specialty-drawer' | 'facade-upgrade';
const TOOLBOX_SECTIONS: { id: ToolboxSectionId; label: string; desc: string; price: number; minLevel: number }[] = [
  {
    id: 'specialty-drawer',
    label: 'Specialty Drawer',
    desc: 'Unlocks the Volvo service-tools drawer (filter wrench, line wrench, torque wrench, feeler gauges, dial indicator, barring tool) — still bought individually once the drawer itself is open.',
    price: 150,
    minLevel: 2,
  },
  {
    id: 'facade-upgrade',
    label: 'Full Wall Upgrade',
    desc: 'The rest of the Snap-on "MR. BIG" wall: side lockers, chrome trim, every decorative drawer face. Cosmetic — no new functional drawers — but this is what turns the starter 5-drawer chest into the whole dealer setup.',
    price: 500,
    minLevel: 4,
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

// Valve cover perimeter bolts: 8 per side, matching the geometry loop in
// buildVolvoD13's cylinder-head section (x = -0.85 + i·0.24, z = ±0.3).
const VALVE_COVER_BOLT_POSITIONS: [number, number][] = (() => {
  const p: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    const bx = -0.85 + i * 0.24;
    p.push([bx, 0.3], [bx, -0.3]);
  }
  return p;
})();
const VALVE_COVER_BOLT_COUNT = VALVE_COVER_BOLT_POSITIONS.length;
const valveCoverBoltTraySlot = (i: number): [number, number, number] => {
  const [bx, bz] = VALVE_COVER_BOLT_POSITIONS[i];
  const sx = -1.15 + (i % 8) * 0.06; // 8-per-row grid in the valve-cover tray
  const sz = 1.3 + Math.floor(i / 8) * 0.1;
  // Bolts sit at y=0.78 on the head; -1.83 drops them onto the ~-1.05
  // tray surface, same height the pan-bolt tray uses.
  return [sx - bx, -1.83, sz - bz];
};

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
  'harness':      { anchor: [0.55, 0.13, 0.64],  bench: [-1.45, -1.06, 0.42], tool: null,          label: 'Actuator & sensor harness' },
  'charge-clamp': { anchor: [0.60, -0.095, 0.58], bench: [-1.45, -1.06, 0.60], tool: 'socket10',    label: 'Charge pipe V-band' },
  'exh-clamp':    { anchor: [0.22, 0.26, 0.52],  bench: [-1.45, -1.06, 0.78], tool: 'socket10',    label: 'Exhaust V-band' },
  'oil-feed':     { anchor: [0.44, 0.48, 0.42],  bench: [-1.62, -1.06, 0.42], tool: 'lineWrench',  label: 'Oil feed line' },
  'coolant-a':    { anchor: [0.56, 0.44, 0.32],  bench: [-1.62, -1.06, 0.60], tool: 'lineWrench',  label: 'Coolant line (upper)' },
  'coolant-b':    { anchor: [0.58, 0.10, 0.30],  bench: [-1.62, -1.06, 0.78], tool: 'lineWrench',  label: 'Coolant line (lower)' },
  'oil-drain':    { anchor: [0.46, 0.02, 0.50],  bench: [-1.62, -1.06, 0.96], tool: 'screwdriver', label: 'Oil drain tube' },
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
    pos3d: [0.55, 0.3, 0.52] as [number, number, number],
    desc: 'Variable geometry turbocharger (VGT) with optimised compressor wheel for EPA 2027 compliant low-NOx operation. Delivers peak boost across wide RPM band.',
    color: '#00d4ff',
  },
  {
    id: 'exhaust',
    label: 'Exhaust Manifold',
    icon: '🔥',
    pos3d: [-0.4, 0.62, 0.52] as [number, number, number],
    desc: 'One-piece cast-iron manifold on the right side of the head. Feeds the VGT turbo directly through its inlet flange — no crossover piping.',
    color: '#ff6633',
  },
  {
    id: 'fan',
    label: 'Viscous Fan',
    icon: '💨',
    pos3d: [1.6, 0.14, 0] as [number, number, number],
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
    pos3d: [-0.3, 0.76, 0.5] as [number, number, number],
    desc: 'High-efficiency Exhaust Gas Recirculation cooler above the exhaust manifold. Cooled exhaust crosses over the head through the venturi flow-measurement tube into the intake.',
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
// X-RAY FLOW MODE — ghost the metal to ~12% opacity and stream additive
// particles along the REAL routes, anchored to the same coordinates the
// parts are modeled at: air (blue) in through the cleaner → turbo
// compressor → charge pipe → intake manifold, pale air snaking down
// through all six cylinders, hot exhaust (orange) out the log → turbine
// → downpipe; coolant (teal) pump → block → head → thermostat →
// radiator loop; oil (gold) pickup → filters → gallery → rockers →
// drain-back, plus crank-splash droplets hopping in the pan; fuel
// (yellow) filters → rail → injector.
// ─────────────────────────────────────────────────────────
type FlowSystem = {
  points: THREE.Points;
  path?: THREE.CurvePath<THREE.Vector3>;
  count: number;
  speed: number;
  splash?: { x0: number; x1: number; z0: number; z1: number; floor: number; height: number };
  seeds: Float32Array;
};

const flowPath = (pts: [number, number, number][]) => {
  const path = new THREE.CurvePath<THREE.Vector3>();
  path.add(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))));
  return path;
};

const makeFlow = (
  parent: THREE.Group, color: number, count: number, size: number, speed: number,
  path?: THREE.CurvePath<THREE.Vector3>, splash?: FlowSystem['splash'],
): FlowSystem => {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  const mat = new THREE.PointsMaterial({
    color, size, transparent: true, opacity: 0.9, depthWrite: false,
    blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.name = 'flow-points';
  points.frustumCulled = false;
  parent.add(points);
  const seeds = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) seeds[i] = Math.random();
  return { points, path, count, speed, splash, seeds };
};

const buildFlowSystems = (): { flowGroup: THREE.Group; systems: FlowSystem[] } => {
  const flowGroup = new THREE.Group();
  flowGroup.name = 'flow-systems';
  flowGroup.visible = false;
  const systems: FlowSystem[] = [];

  // Cool intake air: cleaner duct → compressor → charge pipe → intake manifold
  systems.push(makeFlow(flowGroup, 0x7fd0ff, 130, 0.05, 0.055, flowPath([
    [1.25, 0.15, 0.75],
    [0.85, 0.24, 0.62],
    [0.73, 0.26, 0.52],
    [0.6, -0.06, 0.58],
    [0.98, -0.02, 0.2],
    [0.98, 0.34, -0.22],
    [0.85, 0.42, -0.3],
    [-0.85, 0.42, -0.3],
  ])));

  // Air working through the six cylinders: intake port → bore → exhaust port
  const cyl: [number, number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const rx = -0.78 + i * 0.31;
    cyl.push([rx, 0.40, -0.24], [rx, -0.15, 0], [rx, 0.44, 0.36], [rx, 0.60, 0.52]);
  }
  systems.push(makeFlow(flowGroup, 0xb9c7d2, 120, 0.045, 0.05, flowPath(cyl)));

  // Hot exhaust: log → turbine flange → through the turbo → downpipe out back
  systems.push(makeFlow(flowGroup, 0xff9a55, 90, 0.055, 0.06, flowPath([
    [-0.78, 0.60, 0.52],
    [0.33, 0.60, 0.52],
    [0.33, 0.50, 0.52],
    [0.47, 0.26, 0.52],
    [0.42, -0.1, 0.72],
    [0.9, -0.55, 0.9],
    [1.7, -0.6, 0.95],
  ])));

  // Coolant loop: pump → block gallery → head → thermostat → radiator → pump
  systems.push(makeFlow(flowGroup, 0x35e0c8, 110, 0.045, 0.045, flowPath([
    [-0.98, 0.02, 0.16],
    [-0.5, 0.05, 0.22],
    [0.4, 0.1, 0.22],
    [0.85, 0.2, 0.1],
    [0.8, 0.45, 0.0],
    [-0.5, 0.48, 0.05],
    [-0.95, 0.36, 0.12],
    [-1.35, 0.4, 0.1],
    [-1.55, 0.05, 0.05],
    [-1.35, -0.3, 0.1],
    [-0.98, 0.02, 0.16],
  ])));

  // Oil circulation: pan pickup → spin-on filters → main gallery → rockers → drain-back
  systems.push(makeFlow(flowGroup, 0xffb340, 90, 0.05, 0.04, flowPath([
    [0.2, -0.72, 0.05],
    [0.2, -0.7, 0.39],
    [0.02, -0.65, 0.39],
    [0.4, -0.3, 0.3],
    [0.4, 0.0, 0.28],
    [-0.3, 0.3, 0.2],
    [-0.3, 0.55, 0.0],
    [-0.1, 0.1, -0.1],
    [0.0, -0.55, 0.0],
  ])));

  // Oil splash: crank-thrown droplets hopping around inside the pan
  systems.push(makeFlow(flowGroup, 0xffa726, 80, 0.04, 1.4, undefined,
    { x0: -0.95, x1: 0.95, z0: -0.27, z1: 0.27, floor: -0.72, height: 0.35 }));

  // Fuel: left-side filters → around the head → rail run → injector → cylinder
  systems.push(makeFlow(flowGroup, 0xffe14d, 60, 0.04, 0.05, flowPath([
    [-0.35, -0.45, -0.42],
    [-0.5, 0.0, -0.35],
    [-0.75, 0.3, 0.1],
    [-0.77, 0.3, 0.22],
    [0.78, 0.3, 0.22],
    [0.79, 0.2, 0.22],
    [0.79, 0.05, 0.1],
  ])));

  return { flowGroup, systems };
};

const updateFlows = (systems: FlowSystem[], t: number) => {
  const v = new THREE.Vector3();
  systems.forEach(sys => {
    const pos = sys.points.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < sys.count; i++) {
      if (sys.path) {
        const u = (sys.seeds[i * 3] + t * sys.speed) % 1;
        sys.path.getPoint(u, v);
        // slight scatter so streams read as moving volume, not a bead chain
        pos.setXYZ(i,
          v.x + (sys.seeds[i * 3 + 1] - 0.5) * 0.035,
          v.y + (sys.seeds[i * 3 + 2] - 0.5) * 0.035,
          v.z + (sys.seeds[i * 3] - 0.5) * 0.035);
      } else if (sys.splash) {
        const s = sys.splash;
        const p = sys.seeds[i * 3] * Math.PI * 2;
        const hop = Math.abs(Math.sin(t * sys.speed + p * 3));
        pos.setXYZ(i,
          s.x0 + sys.seeds[i * 3 + 1] * (s.x1 - s.x0) + Math.sin(t * 0.9 + p) * 0.05,
          s.floor + hop * s.height * (0.3 + sys.seeds[i * 3 + 2] * 0.7),
          s.z0 + sys.seeds[i * 3 + 2] * (s.z1 - s.z0) + Math.cos(t * 1.1 + p) * 0.04);
      }
    }
    pos.needsUpdate = true;
  });
};
// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────
export default function EngineViewer() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  // Keyboard nav: arrow keys walk the rig (position), WASD turns the view
  // (look direction) — read once per frame in animate() rather than acted on
  // in the key handlers themselves, so holding a key moves smoothly at frame
  // rate instead of jumping once per OS key-repeat event.
  const keysHeldRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const isTypingTarget = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.tagName === 'SELECT' || el.tagName === 'INPUT' || el.isContentEditable);
    const down = (e: KeyboardEvent) => { if (!isTypingTarget(e.target)) keysHeldRef.current.add(e.key.toLowerCase()); };
    const up = (e: KeyboardEvent) => keysHeldRef.current.delete(e.key.toLowerCase());
    const blur = () => keysHeldRef.current.clear(); // don't leave a key "stuck held" if focus/visibility changes mid-press
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);
  const engineGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());
  // Mirrors of engineOn/rpm state for the animate() rAF loop, which doesn't
  // re-run per render — see mechanism-kinematics skill (belt/pulley/fan
  // speed must track real engine state, not free-run on its own timer).
  const engineOnRef = useRef(false);
  const rpmRef = useRef(0);

  const [engineId, setEngineId] = useState<EngineId>('volvo-d13');
  // Which vehicle the user picked from the dropdown — nothing builds (no
  // truck, no scene) until this is set.
  const [vehicle, setVehicle] = useState<VehicleId | null>(null);
  // The dropdown's pending choice before START is pressed.
  const [vehicleChoice, setVehicleChoice] = useState<VehicleId>('vnl860');
  const engine = vehicle === 'sonata2017' ? SONATA_ENGINE : ENGINES[engineId];
  const hotspots = HOTSPOT_DATA.map(h => ({ ...h, desc: engine.hotspotDescs?.[h.id] ?? h.desc }));
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  // ── Repairs / service mode ──
  const [repairsOpen, setRepairsOpen] = useState(false);
  const [activeRepair, setActiveRepair] = useState<RepairId | null>(null);
  // Career progression: coins earned per finished repair (see REPAIRS'
  // coinReward), persisted across reloads so the career ladder isn't wiped
  // out by a refresh. Level is *derived* from total coins (levelForCoins),
  // not stored separately, so it can never drift out of sync with the total.
  const [coins, setCoins] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const saved = Number(window.localStorage.getItem('diesel-tech-coins'));
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  });
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem('diesel-tech-coins', String(coins));
  }, [coins]);
  const mechanicLevel = levelForCoins(coins);
  const [levelUpMsg, setLevelUpMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!levelUpMsg) return;
    const t = setTimeout(() => setLevelUpMsg(null), 4000);
    return () => clearTimeout(t);
  }, [levelUpMsg]);
  // Tool Shop: specialty tools bought with coins (see TOOL_PRICES in
  // ToolPanel.tsx) unlock in the drawer they already live in — no separate
  // shop screen, since the drawer IS the shop once a tool's priced. Persisted
  // like coins so a bought tool stays bought across reloads.
  const [ownedTools, setOwnedTools] = useState<Set<Tool>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = JSON.parse(window.localStorage.getItem('diesel-tech-owned-tools') ?? '[]');
      return new Set(Array.isArray(saved) ? saved : []);
    } catch { return new Set(); }
  });
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem('diesel-tech-owned-tools', JSON.stringify([...ownedTools]));
  }, [ownedTools]);
  const buyTool = (tool: Tool) => {
    const price = TOOL_PRICES[tool];
    if (price === undefined || ownedTools.has(tool)) return;
    const minLevel = TOOL_MIN_LEVEL[tool];
    if (minLevel !== undefined && mechanicLevel.level < minLevel) {
      setServiceMsg(`🔒 The ${TOOLS[tool].name} needs Level ${minLevel} (${LEVELS.find(l => l.level === minLevel)!.title}) — you're Level ${mechanicLevel.level}.`);
      return;
    }
    if (coins < price) {
      setServiceMsg(`Not enough coins for the ${TOOLS[tool].name} — need 🪙 ${price}, you have 🪙 ${coins}.`);
      return;
    }
    setCoins(c => c - price);
    setOwnedTools(prev => new Set(prev).add(tool));
    setServiceMsg(`🧰 Bought the ${TOOLS[tool].name} for 🪙 ${price} — it's in the drawer now.`);
  };
  // Toolbox sections owned (see TOOLBOX_SECTIONS) — persisted like ownedTools.
  const [ownedSections, setOwnedSections] = useState<Set<ToolboxSectionId>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = JSON.parse(window.localStorage.getItem('diesel-tech-owned-sections') ?? '[]');
      return new Set(Array.isArray(saved) ? saved : []);
    } catch { return new Set(); }
  });
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem('diesel-tech-owned-sections', JSON.stringify([...ownedSections]));
  }, [ownedSections]);
  // Reveal/hide the actual 3D geometry to match — the specialty drawer group
  // and the whole decorative facade group already exist in the scene
  // (buildVolvoD13), this just toggles .visible, same pattern as the
  // hood-open/hotspot-markers effect above.
  useEffect(() => {
    const eg = engineGroupRef.current;
    if (!eg) return;
    const specialtyDrawer = eg.getObjectByName('toolbox-drawer-specialty');
    if (specialtyDrawer) specialtyDrawer.visible = ownedSections.has('specialty-drawer');
    const facade = eg.getObjectByName('toolbox-facade');
    if (facade) facade.visible = ownedSections.has('facade-upgrade');
  }, [ownedSections, isLoading]);
  const [sectionsPanelOpen, setSectionsPanelOpen] = useState(false);
  const buySection = (id: ToolboxSectionId) => {
    if (ownedSections.has(id)) return;
    const section = TOOLBOX_SECTIONS.find(s => s.id === id)!;
    if (mechanicLevel.level < section.minLevel) {
      setServiceMsg(`🔒 ${section.label} needs Level ${section.minLevel} (${LEVELS.find(l => l.level === section.minLevel)!.title}) — you're Level ${mechanicLevel.level}.`);
      return;
    }
    if (coins < section.price) {
      setServiceMsg(`Not enough coins for the ${section.label} — need 🪙 ${section.price}, you have 🪙 ${coins}.`);
      return;
    }
    setCoins(c => c - section.price);
    setOwnedSections(prev => new Set(prev).add(id));
    setServiceMsg(`🧰 Bought the ${section.label} for 🪙 ${section.price}!`);
  };
  // Account login (Keycloak, blacksheep realm): makes coins/ownedTools follow
  // the player instead of just this browser's localStorage. `progressLoaded`
  // gates the save effect below so it can't fire (and overwrite the server
  // with stale/lower local numbers) before the post-login merge completes.
  const [loggedIn, setLoggedIn] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [progressLoaded, setProgressLoaded] = useState(false);
  useEffect(() => {
    (async () => {
      const justLoggedIn = await kcHandleRedirect();
      if (!justLoggedIn && !kcIsLoggedIn()) return;
      setLoggedIn(true);
      setPlayerName(kcCurrentUser()?.name ?? null);
      try {
        const res = await kcApiFetch('/progress');
        if (res.ok) {
          const server: { coins: number; ownedTools: Tool[] } = await res.json();
          // Take the higher coin total and the union of owned tools rather
          // than trusting the server blindly — a guest who played on this
          // browser before signing in shouldn't lose that progress, and a
          // returning player on a fresh device shouldn't lose theirs either.
          setCoins(local => Math.max(local, server.coins || 0));
          setOwnedTools(local => new Set([...local, ...(server.ownedTools || [])]));
        }
      } catch { /* backend unreachable — carry on in localStorage-only mode */ }
      setProgressLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!loggedIn || !progressLoaded) return;
    kcApiFetch('/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coins, ownedTools: [...ownedTools] }),
    }).catch(() => { /* next change will retry the sync */ });
  }, [coins, ownedTools, loggedIn, progressLoaded]);
  // PM Service checkpoints (no 3D fasteners — this job is deliberately
  // teardown-free, so it's a button checklist like the turbo repair's
  // button fallback, not raycast clicks on new geometry). `grease` covers
  // every zerk fitting on the chassis as one checkpoint, not one per
  // fitting — there are dozens on a real chassis and clicking each
  // individually wouldn't teach anything a single "grease the chassis"
  // step doesn't already cover.
  const [fluidsChecked, setFluidsChecked] = useState({ oil: false, coolant: false, washer: false, def: false, grease: false });
  const allFluidsChecked = Object.values(fluidsChecked).every(Boolean);
  // Annual (DOT) Inspection: the five checkpoints a real annual undercarriage/
  // running-gear inspection covers — reuses the tandem/fifth-wheel geometry
  // built into truck-cab earlier (AXLE1_X/AXLE2_X, truck-fifthwheel — see
  // part-manifest.md's tandem-suspension row) as the real thing being
  // inspected, even though this job is a button checklist like PM Service
  // rather than raycast clicks on those (unnamed) meshes.
  const [axleChecked, setAxleChecked] = useState({ rearAxle: false, diff: false, fifthWheel: false, tires: false, brakes: false });
  const allAxleChecked = Object.values(axleChecked).every(Boolean);
  // Hood Release Cable Repair: linear step-through per the Volvo TSB (trim
  // off → old cable released → new cable routed & bracket swapped → trim
  // back on & torqued → release lever tested), distilled from the source
  // TSB's 58 steps into repair-panel-sized checkpoints.
  const [hoodCableStep, setHoodCableStep] = useState(0);
  const HOOD_CABLE_STEPS = [
    'Strip the interior trim: A-pillar grab handle, passenger dash panel, driver kick panel, steering column covers.',
    'Release the old cable at the latch, cut cable ties, draw it back out through the firewall.',
    'Route the new cable through the firewall to the right of the steering shaft; if the old latch has a black lever, swap in the new latch (silver lever) and remove the now-unneeded L-bracket — otherwise add the L-bracket, torque M8 36 Nm.',
    'Reinstall all trim panels, torque M4 panel screws 1.5 ± 0.5 Nm, and the release-cable adjustment nut 6 ± 2 Nm.',
    'Lower the hood, confirm it latches, then pull the release lever and verify the hood pops free with no binding.',
  ];
  const [socketExt, setSocketExt] = useState<'none' | 'stubby' | 'long'>('none');
  const [snapOnExt, setSnapOnExt] = useState<'none' | 'three' | 'six'>('none');
  const [driver, setDriver] = useState<'electric' | 'hand' | null>(null);
  const [filtersRemoved, setFiltersRemoved] = useState<boolean[]>(Array(FILTER_COUNT).fill(false));
  const [boltsRemoved, setBoltsRemoved] = useState<boolean[]>(Array(PAN_BOLT_COUNT).fill(false));
  const [valveCoverBoltsRemoved, setValveCoverBoltsRemoved] = useState<boolean[]>(Array(VALVE_COVER_BOLT_COUNT).fill(false));
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
    ...Array.from({ length: VALVE_COVER_BOLT_COUNT }, (_, i) => `service-valvecover-bolt-${i}`),
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
  // Real VNLs release the primary hood latch from a lever inside the cab —
  // clicking the hood shell itself doesn't open it. Pulled inside the cab,
  // consumed by climbing back out and clicking the hood; re-latches (goes
  // back to false) whenever the hood is closed again.
  const [hoodLeverPulled, setHoodLeverPulled] = useState(false);

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

  /** Animate a toolbox drawer's position toward a target along one local axis. */
  const setSlide = useCallback((name: string, axis: 'x' | 'y' | 'z', target: number) => {
    const eg = engineGroupRef.current;
    if (!eg) return;
    const obj = eg.getObjectByName(name);
    if (!obj) return;
    const slides: { obj: THREE.Object3D; axis: 'x' | 'y' | 'z'; target: number }[] =
      eg.userData.slides ?? (eg.userData.slides = []);
    const s = slides.find(x => x.obj === obj && x.axis === axis);
    if (s) s.target = target;
    else slides.push({ obj, axis, target });
  }, []);

  /** Fly the camera to the shop's back-wall toolbox chest (position (-0.35, -1.1, -7.5)
   *  in buildVolvoD13) and hold it there — matches the hard-cut pattern used by
   *  resetCamera/inspectPart rather than an animated tween. */
  const focusToolbox = useCallback(() => {
    const eg = engineGroupRef.current;
    if (!eg || !controlsRef.current) return;
    // Eased via the same userData.cameraMove queue as focusDrawer, instead
    // of the old instant camera.position.set() — the toolbox↔vehicle view
    // switch used to jump-cut, which read as jarring next to focusDrawer's
    // smooth zoom.
    eg.userData.cameraMove = {
      pos: new THREE.Vector3(1.5, 0.9, -2.7),
      look: new THREE.Vector3(-0.35, -0.1, -7.5),
    };
    controlsRef.current.autoRotate = false;
    setAutoRotate(false);
  }, []);

  /** Zoom the camera in on one specific drawer, full-frame, instead of the
   *  wide whole-toolbox shot focusToolbox() gives. Top-down, not straight-on:
   *  a drawer's tools (see buildDrawer's socket rows / wrench fans) sit ON
   *  its tray floor, so a face-on shot only ever showed the closed drawer
   *  front, never the contents — this looks nearly straight down INTO the
   *  open drawer instead, the way you'd actually look at a real one. Kept a
   *  slight forward tilt (not perfectly vertical) so the view direction
   *  never lines up with camera.up, which would hit OrbitControls' pole
   *  singularity. Distance scales off the drawer's own stored w/h
   *  (userData, set in buildDrawer) so a small sockets drawer and the big
   *  "MR. BIG" general drawer both roughly fill the 42°-FOV frame. Actually
   *  moves the camera by queuing engineGroup.userData.cameraMove, eased once
   *  per frame in animate() — same lerp-toward-target pattern as
   *  userData.hinges/slides, just for the camera instead of a mesh. */
  const focusDrawer = useCallback((key: DrawerKey) => {
    const eg = engineGroupRef.current;
    const obj = eg?.getObjectByName(`toolbox-drawer-${key}`);
    if (!eg || !obj) return;
    const worldPos = new THREE.Vector3();
    obj.getWorldPosition(worldPos);
    const w = (obj.userData.w as number | undefined) ?? 0.25;
    const h = (obj.userData.h as number | undefined) ?? 0.15;
    const dist = Math.min(1.1, Math.max(0.4, Math.max(w, h) * 1.1));
    eg.userData.cameraMove = {
      pos: new THREE.Vector3(worldPos.x, worldPos.y + dist * 0.94, worldPos.z + dist * 0.3),
      look: worldPos.clone(),
    };
    if (controlsRef.current) controlsRef.current.autoRotate = false;
    setAutoRotate(false);
  }, []);

  /** Open/close one toolbox drawer, closing whichever was previously open. */
  const toggleDrawer = useCallback((key: DrawerKey) => {
    if (key === 'specialty' && !ownedSections.has('specialty-drawer')) {
      setServiceMsg(`🔒 That drawer isn't yours yet — buy the Specialty Drawer section (🪙 ${TOOLBOX_SECTIONS.find(s => s.id === 'specialty-drawer')!.price}) in 🔓 Toolbox Upgrades first.`);
      return;
    }
    setSectionsPanelOpen(false);
    const eg = engineGroupRef.current;
    const slideDrawer = (k: DrawerKey, open: boolean) => {
      const obj = eg?.getObjectByName(`toolbox-drawer-${k}`);
      if (!obj) return;
      setSlide(obj.name, 'z', open ? obj.userData.openZ : obj.userData.closedZ);
    };
    setOpenDrawer(prev => {
      if (prev === key) { slideDrawer(key, false); focusToolbox(); return null; }
      if (prev) slideDrawer(prev, false);
      slideDrawer(key, true);
      focusDrawer(key);
      return key;
    });
  }, [setSlide, focusToolbox, focusDrawer, ownedSections]);

  const clickDoor = () => {
    if (!doorUnlocked) {
      // The Sonata has its own key fob — no shop toolbox in the car scene
      if (selectedTool === 'key' || vehicle === 'sonata2017') {
        setDoorUnlocked(true);
        setDoorOpen(true);
        setHinge('truck-door', 'y', -1.25);
        setServiceMsg(vehicle === 'sonata2017' ? 'Fob click — door unlocked and open. Hop in.' : 'Key in, door unlocked and open — climb on up.');
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
      // VNL only: the hood shell itself won't budge until the in-cab release
      // lever has been pulled, and you can't pull it and lift the hood in
      // the same breath — you're sitting down. The Sonata has no such
      // interior-latch step, so it skips straight to the parking-brake gate.
      if (vehicle !== 'sonata2017' && !hoodLeverPulled) {
        setServiceMsg("🔒 Hood's still latched — pull the hood-release lever in the cab first, then climb out.");
        return;
      }
      if (vehicle !== 'sonata2017' && inCab) {
        setServiceMsg("You can't reach the hood from the driver's seat — climb out first.");
        return;
      }
      setHoodOpen(true);
      // VNL hood tilts FORWARD over the bumper; the Sonata hood is
      // rear-hinged at the cowl and lifts the other way.
      setHinge('truck-hood', 'z', vehicle === 'sonata2017' ? -1.0 : 1.15);
      setServiceMsg(vehicle === 'sonata2017'
        ? 'Hood up — 2.4 GDi engine bay exposed.'
        : 'Hood tilted forward — engine exposed. Repairs are on the 🔧 Repairs panel.');
      return;
    }
    setHoodOpen(false);
    setHinge('truck-hood', 'z', 0);
    // Latch re-engages on close — the lever has to be pulled again next time.
    if (vehicle !== 'sonata2017') setHoodLeverPulled(false);
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
      camera.position.set(3.6, 1.6, -3.6);
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

  const removeValveCoverBolt = (i: number) => {
    if (activeRepair !== 'overhead-adjust') { setServiceMsg('Open the Valve Lash Adjustment repair first.'); return; }
    if (valveCoverBoltsRemoved[i]) return;
    if (selectedTool !== 'socket13') { setServiceMsg('Valve cover bolts take the 13mm Socket — grab it and click the bolt.'); return; }
    if (startRemoval(`service-valvecover-bolt-${i}`, { vy: 0.01, spin: 0.5, drop: 0.3, place: valveCoverBoltTraySlot(i) }, () => {
      setValveCoverBoltsRemoved(prev => prev.map((v, j) => (j === i ? true : v)));
      setServiceMsg(`Valve cover bolt ${i + 1}/${VALVE_COVER_BOLT_COUNT} out — into the tray ✓`);
    })) {
      setServiceMsg(`Backing off valve cover bolt ${i + 1}…`);
    }
  };

  const allFiltersOff = filtersRemoved.every(Boolean);
  const allBoltsOff = boltsRemoved.every(Boolean);
  const allValveCoverBoltsOff = valveCoverBoltsRemoved.every(Boolean);

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
    setValveCoverBoltsRemoved(Array(VALVE_COVER_BOLT_COUNT).fill(false));
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
    setFluidsChecked({ oil: false, coolant: false, washer: false, def: false, grease: false });
    setAxleChecked({ rearAxle: false, diff: false, fifthWheel: false, tires: false, brakes: false });
    setHoodCableStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreParts, exitInspect]);

  const finishRepair = () => {
    const repair = REPAIRS.find(r => r.id === activeRepair);
    resetService();
    setServiceMsg((activeRepair === 'pan-gasket'
      ? 'New gasket fitted; 22 screws torqued 24 ± 4 Nm middle-out, A & B re-checked, drain plug 60 ± 10 Nm ✓'
      : activeRepair === 'turbo-replace'
        ? 'Turbo R&R complete: smooth spool, oil pressure good, coolant stable, boost tracking rpm ✓'
        : activeRepair === 'overhead-adjust'
          ? 'Valve lash checked/adjusted at TDC per cylinder; all 16 cover bolts back in, snugged criss-cross ✓'
          : activeRepair === 'fluid-check'
            ? 'Oil, coolant, washer fluid, and DEF all checked and topped off, every zerk fitting greased ✓'
            : activeRepair === 'annual-inspection'
              ? 'Rear axle housing and differential carrier bolts torque-checked to spec, nothing loose ✓'
              : activeRepair === 'hood-cable'
                ? 'New hood release cable routed & secured, trim reinstalled, latch tested — pops free clean, no binding ✓'
                : 'New filters on (oiled gaskets, 3/4–1 turn), pan torqued 24 ± 4 Nm, filled with VDS-4 10W-30 ✓')
      + (repair ? ` — 🪙 +${repair.coinReward} coins` : ''));
    // Award coins and check for a level-up against the level *before* this
    // job's payout, so a job that crosses a threshold announces the new
    // level exactly once instead of every render after.
    if (repair) {
      const before = mechanicLevel;
      const after = levelForCoins(coins + repair.coinReward);
      setCoins(c => c + repair.coinReward);
      if (after.level > before.level) {
        setLevelUpMsg(`🎉 LEVEL UP — you're now a ${after.title} (Level ${after.level})`);
      }
    }
    setActiveRepair(null);
  };

  const openRepair = (id: RepairId) => {
    const repair = REPAIRS.find(r => r.id === id)!;
    if (mechanicLevel.level < repair.unlockLevel) {
      setServiceMsg(`🔒 Locked — reach Level ${repair.unlockLevel} (${LEVELS.find(l => l.level === repair.unlockLevel)!.title}) to take this job.`);
      return;
    }
    const neededTool = REPAIR_REQUIRED_TOOL[id];
    if (neededTool && !ownedTools.has(neededTool)) {
      setServiceMsg(`🔒 You need the ${TOOLS[neededTool].name} for this job — buy it in the 🧰 Toolbox's Specialty drawer (🪙 ${TOOL_PRICES[neededTool]}).`);
      return;
    }
    // PM Service and Annual Inspection need no hood/cab walk-around — the
    // two jobs a brand new tech can do without unlocking anything first
    // (fluid checks/greasing at the front, axle/diff torque checks at the
    // back — neither is under the hood).
    if (id !== 'fluid-check' && id !== 'annual-inspection' && !hoodOpen) {
      setServiceMsg('You can\'t wrench through a closed hood: 🔑 unlock the door, 🅿 set the parking brake in the cab, then open the hood.');
      return;
    }
    resetService();
    setServiceMsg('');
    setActiveRepair(id);
  };

  const repairComplete = activeRepair === 'turbo-replace'
    ? turboHealthy
    : activeRepair === 'overhead-adjust'
      ? allValveCoverBoltsOff
      : activeRepair === 'fluid-check'
        ? allFluidsChecked
        : activeRepair === 'annual-inspection'
          ? allAxleChecked
          : activeRepair === 'hood-cable'
            ? hoodCableStep >= HOOD_CABLE_STEPS.length
            : panRemoved && (activeRepair === 'pan-gasket' || allFiltersOff);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [screenPositions, setScreenPositions] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});
  const [rpm, setRpm] = useState(800);
  const [engineOn, setEngineOn] = useState(false);
  const [xrayOn, setXrayOn] = useState(false);

  /** Toggle X-ray flow mode: ghost the block/head/cover materials to ~12%
   *  opacity and show the oil/coolant/air-exhaust particle streams. */
  const toggleXray = useCallback(() => {
    const eg = engineGroupRef.current;
    if (!eg) return;
    const next = !eg.userData.xrayOn;
    eg.userData.xrayOn = next;
    const mats = eg.userData.xrayMaterials as THREE.MeshStandardMaterial[] | undefined;
    mats?.forEach(m => {
      m.transparent = true;
      m.opacity = next ? 0.12 : 1;
      m.depthWrite = !next;
    });
    const flowGroup = eg.getObjectByName('flow-systems');
    if (flowGroup) flowGroup.visible = next;
    setXrayOn(next);
  }, []);
  // Which physical drawer on the 3D toolbox is currently slid open.
  const [openDrawer, setOpenDrawer] = useState<DrawerKey | null>(null);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  // Tools the mechanic has pulled from the chest drawers into the tray.
  // A tool must be in the tray before it can go in your hand.
  const [tray, setTray] = useState<Tool[]>([]);

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
  useEffect(() => { engineOnRef.current = engineOn; }, [engineOn]);
  useEffect(() => { rpmRef.current = rpm; }, [rpm]);

  // Starter pinion: one-shot engage-and-spin-then-disengage on every
  // false→true engineOn transition (real DC starters crank briefly, then
  // the overrunning clutch kicks the pinion out once the engine catches —
  // see mechanism-kinematics skill, "gear-driven one-shot" category).
  useEffect(() => {
    if (!engineOn) return;
    const eg = engineGroupRef.current;
    if (!eg) return;
    setSlide('engine-starter-pinion', 'x', -1.19); // extend to mesh the flywheel ring gear
    eg.userData.starterCranking = true;
    const retract = setTimeout(() => {
      setSlide('engine-starter-pinion', 'x', -1.1); // back to rest, flush with the flange
      eg.userData.starterCranking = false;
    }, 450);
    return () => clearTimeout(retract);
  }, [engineOn, setSlide]);

  const toggleAutoRotate = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    setAutoRotate(prev => {
      controls.autoRotate = !prev;
      return !prev;
    });
  }, []);

  const resetCamera = useCallback(() => {
    const eg = engineGroupRef.current;
    if (!eg || !controlsRef.current) return;
    controlsRef.current.autoRotate = false; // don't fight the ease — re-armed in onDone once it actually arrives
    eg.userData.cameraMove = {
      pos: new THREE.Vector3(3.6, 1.6, -3.6),
      look: new THREE.Vector3(0, 0, 0),
      onDone: () => { setAutoRotate(true); if (controlsRef.current) controlsRef.current.autoRotate = true; },
    };
    setActiveHotspot(null);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !vehicle) return; // wait for the vehicle dropdown
    const container = canvasRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050810);
    scene.fog = new THREE.FogExp2(0x050810, 0.03); // light enough that the 20-unit max zoom stays readable

    // Camera
    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(3.6, 1.6, -3.6); // walk-up view: truck nose + driver door
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

    // Soft studio environment so chrome + the toolbox's clearcoat black
    // actually reflect something (kept faint to not wash the shop lighting)
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.25;
    pmrem.dispose();

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.04;
    controls.minDistance = 1.8;
    controls.maxDistance = 20; // far enough to take in the whole shop incl. the back-wall toolbox
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
    // Widen the default ±5 ortho frustum so the toolbox at z=-7.5 still gets shadows
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
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

    // Build the selected vehicle
    if (vehicle === 'sonata2017') buildSonata2017(engineGroup, setLoadProgress, setIsLoading);
    else buildVolvoD13(engineGroup, setLoadProgress, setIsLoading);

    // Ground
    const groundGeo = new THREE.CircleGeometry(9, 64); // reaches the toolbox at z=-7.5
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

    // Hotspot 3D markers (positions are D13-specific — truck only)
    const hotspotMeshes: THREE.Mesh[] = [];
    if (vehicle === 'vnl860') HOTSPOT_DATA.forEach(hs => {
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

      // Fan + crank-driven accessories — only turn while the engine is
      // actually running, at a rate that tracks rpm, per mechanism-kinematics
      // (these must stay consistent with the real drive relationship, not
      // spin on their own arbitrary timer).
      const running = engineOnRef.current;
      const revFactor = running ? 0.4 + rpmRef.current / 1400 : 0; // ≈0.97 at 800rpm idle, scales up
      if (engineGroup.userData.fanBladeGroup) {
        engineGroup.userData.fanBladeGroup.rotation.x += 0.018 * revFactor;
      }
      // Front accessory drive: belt-driven pulleys (upper idler, A/C
      // compressor, tensioner, lower idler) all turn together off the crank.
      const accessoryPulleys = engineGroup.userData.accessoryPulleys as THREE.Object3D[] | undefined;
      accessoryPulleys?.forEach(p => { p.rotation.x += 0.14 * revFactor; });
      // Alternator: pad-mounted, its own belt path, spins faster than crank
      // (typical pulley ratio ~2.5–3:1) — see mechanism-kinematics.
      const alternatorPulley = engineGroup.userData.alternatorPulley as THREE.Object3D | undefined;
      if (alternatorPulley) alternatorPulley.rotation.x += 0.36 * revFactor;
      // WABCO air compressor: gear-driven off the timing train (not belted),
      // so its drive flange/coupling turns 1:1 with the crank whenever the
      // engine runs, independent of the accessory belt above.
      const compressorCoupling = engineGroup.userData.compressorCoupling as THREE.Object3D | undefined;
      if (compressorCoupling) compressorCoupling.rotation.x += 0.14 * revFactor;
      // Starter pinion: one-shot spin only during the brief crank window
      // triggered on engineOn (see the setSlide('engine-starter-pinion', …)
      // effect above) — not tied to revFactor since it disengages before
      // the engine is actually turning under its own power.
      if (engineGroup.userData.starterCranking) {
        const pinion = engineGroup.getObjectByName('engine-starter-pinion');
        if (pinion) pinion.rotation.x += 0.9;
      }

      // X-ray flow streams (oil/coolant/air-exhaust), only while toggled on
      if (engineGroup.userData.xrayOn && engineGroup.userData.flowSystems) {
        updateFlows(engineGroup.userData.flowSystems as FlowSystem[], t);
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

      // Sliding toolbox drawers easing toward open/closed
      const slides = engineGroup.userData.slides as { obj: THREE.Object3D; axis: 'x' | 'y' | 'z'; target: number }[] | undefined;
      if (slides) {
        slides.forEach(s => {
          s.obj.position[s.axis] += (s.target - s.obj.position[s.axis]) * 0.12;
        });
      }

      // Camera easing toward a queued shot — focusDrawer's close-up,
      // focusToolbox's wide shot, or resetCamera's walk-up view all go
      // through this same queue now instead of jump-cutting. One-shot:
      // cleared (and onDone fired, e.g. resetCamera re-arming autoRotate
      // only once the ease actually finishes, not immediately) once close
      // enough that OrbitControls can hand full control back to the user
      // instead of the lerp fighting their next drag.
      const camMove = engineGroup.userData.cameraMove as { pos: THREE.Vector3; look: THREE.Vector3; onDone?: () => void } | undefined;
      if (camMove) {
        camera.position.lerp(camMove.pos, 0.12);
        controls.target.lerp(camMove.look, 0.12);
        controls.update();
        if (camera.position.distanceTo(camMove.pos) < 0.01 && controls.target.distanceTo(camMove.look) < 0.01) {
          engineGroup.userData.cameraMove = undefined;
          camMove.onDone?.();
        }
      }

      // Keyboard nav: arrows walk the rig (camera + target move together,
      // same offset preserved — equivalent to OrbitControls' own panning),
      // WASD turns the view (only the target orbits the fixed camera
      // position, like turning your head) — kept as two separate schemes
      // per how the player asked for them, not the more common "WASD moves"
      // convention.
      const keys = keysHeldRef.current;
      if (keys.size) {
        controls.autoRotate = false;
        setAutoRotate(false);
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        if (forward.lengthSq() > 0) forward.normalize();
        const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
        const move = new THREE.Vector3();
        if (keys.has('arrowup')) move.add(forward);
        if (keys.has('arrowdown')) move.sub(forward);
        if (keys.has('arrowright')) move.add(right);
        if (keys.has('arrowleft')) move.sub(right);
        if (move.lengthSq() > 0) {
          move.normalize().multiplyScalar(0.06);
          camera.position.add(move);
          controls.target.add(move);
        }
        if (keys.has('a') || keys.has('d') || keys.has('w') || keys.has('s')) {
          const lookSpeed = 0.022;
          const offset = new THREE.Vector3().subVectors(controls.target, camera.position);
          if (keys.has('a')) offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), lookSpeed);
          if (keys.has('d')) offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -lookSpeed);
          if (keys.has('w') || keys.has('s')) {
            const pitchAxis = new THREE.Vector3().crossVectors(offset, camera.up).normalize();
            const pitched = offset.clone().applyAxisAngle(pitchAxis, keys.has('w') ? lookSpeed : -lookSpeed);
            // Clamp so looking up/down can't flip past straight overhead/underfoot.
            const horiz = Math.sqrt(pitched.x * pitched.x + pitched.z * pitched.z);
            if (Math.abs(Math.atan2(pitched.y, horiz)) < Math.PI * 0.47) offset.copy(pitched);
          }
          controls.target.copy(camera.position).add(offset);
        }
        controls.update();
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
        while (o && !o.name.startsWith('service-') && !o.name.startsWith('truck-') && !o.name.startsWith('toolbox-')) o = o.parent;
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
  }, [vehicle]);

  // 3D click routing: with the right tool in hand, clicking a fastener in
  // the scene starts the removal immediately (assigned every render so it
  // always sees fresh state; the canvas raycaster calls through the ref).
  partClickRef.current = (name: string) => {
    if (inspecting) return;
    if (name === 'truck-door') { clickDoor(); return; }
    if (name === 'truck-hood') { clickHood(); return; }
    if (name.startsWith('truck-')) return;
    if (name.startsWith('toolbox-drawer-')) {
      toggleDrawer(name.slice('toolbox-drawer-'.length) as DrawerKey);
      return;
    }
    if (name.startsWith('toolbox-')) { focusToolbox(); return; }
    if (!hoodOpen) { setServiceMsg('The hood is closed — unlock the cab, set the parking brake, then open the hood.'); return; }
    if (name.startsWith('service-pan-bolt-')) {
      if (activeRepair === 'oil-change' || activeRepair === 'pan-gasket') removeBolt(Number(name.slice('service-pan-bolt-'.length)));
      return;
    }
    if (name.startsWith('service-valvecover-bolt-')) {
      removeValveCoverBolt(Number(name.slice('service-valvecover-bolt-'.length)));
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
          : activeRepair === 'overhead-adjust'
            ? ['socket13', 'ratchet']
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
          : activeRepair === 'overhead-adjust'
            ? [
                { id: 1, label: 'Remove the 16 valve cover perimeter bolts', done: allValveCoverBoltsOff, requiredTool: 'socket13', detail: `${valveCoverBoltsRemoved.filter(Boolean).length}/${VALVE_COVER_BOLT_COUNT}` },
                { id: 2, label: 'Check/adjust valve lash at TDC, reinstall bolts criss-cross', done: allValveCoverBoltsOff, requiredTool: 'ratchet' },
              ]
            : activeRepair === 'fluid-check'
              ? [
                  { id: 1, label: 'Check/top off engine oil (dipstick)', done: fluidsChecked.oil, requiredTool: null },
                  { id: 2, label: 'Check/top off coolant surge tank', done: fluidsChecked.coolant, requiredTool: null },
                  { id: 3, label: 'Check/top off windshield washer fluid', done: fluidsChecked.washer, requiredTool: null },
                  { id: 4, label: 'Check/top off DEF', done: fluidsChecked.def, requiredTool: null },
                  { id: 5, label: 'Grease every zerk fitting on the chassis', done: fluidsChecked.grease, requiredTool: null },
                ]
              : activeRepair === 'annual-inspection'
                ? [
                    { id: 1, label: 'Torque-check the rear axle housing bolts', done: axleChecked.rearAxle, requiredTool: null },
                    { id: 2, label: 'Torque-check the differential carrier bolts', done: axleChecked.diff, requiredTool: null },
                  ]
                : activeRepair === 'hood-cable'
                  ? HOOD_CABLE_STEPS.map((label, i) => ({ id: i + 1, label, done: hoodCableStep > i, requiredTool: null }))
                  : [];

  /** Switch to a vehicle (or back to the dropdown with null): reset every
   *  walk-around / service state so the freshly built scene starts clean. */
  const startVehicle = (id: VehicleId | null) => {
    if (inspecting) exitInspect();
    setDoorUnlocked(false); setDoorOpen(false); setInCab(false);
    setParkingBrake(false); setTrailerAir(false); setHoodOpen(false); setHoodLeverPulled(false);
    setOpenDrawer(null); setSelectedTool(null); setTray([]);
    setRepairsOpen(false); setActiveRepair(null); setServiceMsg('');
    setEngineOn(false); setActiveHotspot(null);
    setXrayOn(false);
    setVehicle(id);
    if (id) { setIsLoading(true); setLoadProgress(0); }
  };

  return (
    <div className="relative w-full h-full select-none" style={{ background: '#050810' }}>

      {/* Vehicle selection — shown before anything loads; the truck (or
          car) only shows up after START */}
      {!vehicle && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{ background: '#050810' }}>
          <div className="w-[26rem] max-w-[90vw] rounded-2xl border border-cyan-400/25 bg-black/60 p-8 text-center space-y-6">
            <div>
              <div className="text-4xl mb-3">🔧</div>
              <h2 className="text-white text-2xl font-black tracking-widest uppercase">diesel.tech</h2>
              <p className="text-cyan-400 text-xs tracking-widest mt-1 uppercase">Interactive shop — pick your vehicle</p>
            </div>
            <div className="text-left space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400" htmlFor="vehicle-select">Vehicle</label>
              <select
                id="vehicle-select"
                value={vehicleChoice}
                onChange={e => setVehicleChoice(e.target.value as VehicleId)}
                className="w-full rounded-lg border border-cyan-400/30 bg-[#0a1428] px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-cyan-400"
              >
                {(Object.keys(VEHICLES) as VehicleId[]).map(id => (
                  <option key={id} value={id}>{VEHICLES[id].label}</option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 leading-snug">{VEHICLES[vehicleChoice].blurb}</p>
            </div>
            {vehicleChoice !== 'sonata2017' && (
              <div className="text-left space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400" htmlFor="engine-select">Engine</label>
                <select
                  id="engine-select"
                  value={engineId}
                  onChange={e => setEngineId(e.target.value as EngineId)}
                  className="w-full rounded-lg border border-cyan-400/30 bg-[#0a1428] px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-cyan-400"
                >
                  {ENGINE_ORDER.map(id => (
                    <option key={id} value={id}>{ENGINES[id].maker} {ENGINES[id].model}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={() => startVehicle(vehicleChoice)}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-sm font-black uppercase tracking-widest text-white hover:brightness-110"
            >
              Start ▸
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {vehicle && isLoading && (
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

      {/* First-person hand: whatever tool is selected, held in view like an FPS */}
      {!isLoading && (
        <HandHUD tool={selectedTool} socketExt={socketExt} snapOnExt={snapOnExt} onSnapOnExtChange={setSnapOnExt} />
      )}

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
            {vehicle !== 'sonata2017' && (
              <div className="mt-1.5 flex flex-wrap items-center gap-2 pointer-events-none">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 border border-amber-400/30 text-amber-300">
                  ⭐ Lv.{mechanicLevel.level} {mechanicLevel.title}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 font-mono">
                  🪙 {coins}
                </span>
                {loggedIn ? (
                  <button
                    onClick={kcLogout}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/15 text-gray-300 hover:text-white hover:border-white/30 pointer-events-auto"
                    title="Sign out"
                  >
                    👤 {playerName ?? 'signed in'} · sign out
                  </button>
                ) : (
                  <button
                    onClick={kcLogin}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20 pointer-events-auto"
                    title="Sign in to save your level/coins to your account, not just this browser"
                  >
                    🔑 Sign in to save progress
                  </button>
                )}
              </div>
            )}
            {/* Engine selector */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pointer-events-auto">
              <button
                onClick={() => startVehicle(null)}
                className="px-2.5 py-1 text-[11px] font-bold rounded border transition-all uppercase tracking-wider text-gray-500 border-gray-700 hover:text-cyan-300 hover:border-cyan-500/50 bg-black/30"
                title="Back to vehicle selection"
              >
                🚗 Vehicle
              </button>
              {/* Engine choice moved to the vehicle-selection screen (see
                  #engine-select above) — this used to also render live here,
                  which meant every other engine option (and effectively every
                  other vehicle's engine bay) stayed one click away without
                  ever going "back". Now the only way to change it is to
                  return to vehicle selection. */}
              {vehicle !== 'sonata2017' && (<>
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
                onClick={() => toggleDrawer(openDrawer ?? 'general')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-all uppercase tracking-wider ${
                  openDrawer
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
              {TOOLBOX_SECTIONS.some(s => !ownedSections.has(s.id)) && (
                <button
                  onClick={() => { if (openDrawer) toggleDrawer(openDrawer); setSectionsPanelOpen(o => !o); }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-all uppercase tracking-wider ${
                    sectionsPanelOpen
                      ? 'text-amber-300 border-amber-400/60 bg-amber-400/10'
                      : 'text-gray-500 border-gray-700 hover:text-amber-300 hover:border-amber-500/50 bg-black/30'
                  }`}
                  title="Buy more of the toolbox — it starts as a 5-drawer chest and grows section by section"
                >
                  🔓 Toolbox Upgrades
                </button>
              )}
              </>)}
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

      {/* Tool chest panel — shows whichever physical drawer is slid open */}
      {openDrawer && !isLoading && (
        <ToolPanel
          drawerKey={openDrawer}
          selectedTool={selectedTool}
          tray={tray}
          onGrab={(t) => {
            setTray(prev => {
              if (prev.includes(t)) {
                if (selectedTool === t) setSelectedTool(null);
                return prev.filter(x => x !== t);
              }
              return [...prev, t];
            });
          }}
          onSelect={(t) => setSelectedTool(prev => (prev === t ? null : t))}
          requiredTools={requiredTools}
          ownedTools={ownedTools}
          coins={coins}
          mechanicLevel={mechanicLevel.level}
          onBuyTool={buyTool}
          onClose={() => toggleDrawer(openDrawer)}
        />
      )}

      {/* Factory reference panel */}
      {referenceOpen && !isLoading && (
        <ReferencePanel onClose={() => setReferenceOpen(false)} />
      )}

      {/* Toolbox Upgrades — buying the toolbox itself, section by section, as
          distinct from buying individual tools inside it (ToolPanel/TOOL_PRICES). */}
      {sectionsPanelOpen && !isLoading && (
        <div className="absolute left-4 top-32 w-72 max-h-[70vh] overflow-y-auto bg-black/75 backdrop-blur-md border border-amber-400/25 rounded-xl p-3 z-30 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-amber-300 text-xs font-bold tracking-widest uppercase">🔓 Toolbox Upgrades</span>
            <button onClick={() => setSectionsPanelOpen(false)} className="text-gray-500 hover:text-white text-sm">✕</button>
          </div>
          <p className="text-gray-500 text-[11px] px-1 leading-relaxed">
            You start with a 5-drawer chest. The rest of the wall is real — you just haven't earned it yet.
          </p>
          {TOOLBOX_SECTIONS.map(s => {
            const owned = ownedSections.has(s.id);
            const levelLocked = !owned && mechanicLevel.level < s.minLevel;
            return (
              <div
                key={s.id}
                className={`p-2.5 rounded-lg border ${owned ? 'border-green-500/40 bg-green-500/10' : 'border-white/10 bg-white/5'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-bold">{owned ? '✅' : '🔒'} {s.label}</span>
                  {!owned && <span className="text-yellow-300 text-xs font-bold font-mono shrink-0 ml-2">🪙 {s.price}</span>}
                </div>
                <p className="text-gray-400 text-[11px] mt-1 leading-relaxed">{s.desc}</p>
                {!owned && (
                  <button
                    onClick={() => buySection(s.id)}
                    disabled={levelLocked}
                    className={`mt-2 w-full py-1.5 text-xs font-bold rounded-lg ${
                      levelLocked
                        ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:shadow-lg'
                    }`}
                  >
                    {levelLocked ? `Reach Level ${s.minLevel} to buy` : `Buy for 🪙 ${s.price}`}
                  </button>
                )}
              </div>
            );
          })}
          {serviceMsg && <p className="text-green-300 text-xs px-1">{serviceMsg}</p>}
        </div>
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
              <div className="flex items-center justify-between px-1 -mt-1 mb-1">
                <span className="text-white text-xs font-bold">⭐ Lv.{mechanicLevel.level} — {mechanicLevel.title}</span>
                <span className="text-yellow-300 text-xs font-bold font-mono">🪙 {coins}</span>
              </div>
              {nextLevel(mechanicLevel.level) && (
                <div className="h-1 rounded-full bg-white/10 overflow-hidden -mt-1 mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-300"
                    style={{
                      width: `${Math.min(100, Math.round(
                        ((coins - mechanicLevel.coinsRequired) / (nextLevel(mechanicLevel.level)!.coinsRequired - mechanicLevel.coinsRequired)) * 100
                      ))}%`,
                    }}
                  />
                </div>
              )}
              {REPAIRS.map(r => {
                const locked = mechanicLevel.level < r.unlockLevel;
                const neededTool = REPAIR_REQUIRED_TOOL[r.id];
                const toolLocked = !locked && !!neededTool && !ownedTools.has(neededTool);
                return (
                  <button
                    key={r.id}
                    onClick={() => openRepair(r.id)}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      locked || toolLocked
                        ? 'border-white/5 bg-white/[0.02] opacity-60 cursor-not-allowed hover:bg-white/[0.02]'
                        : 'border-white/10 bg-white/5 hover:bg-amber-400/10 hover:border-amber-400/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-white text-sm font-bold">{locked || toolLocked ? '🔒' : r.icon} {r.label}</div>
                      <div className="text-yellow-300 text-xs font-bold font-mono shrink-0 ml-2">🪙 {r.coinReward}</div>
                    </div>
                    {locked ? (
                      <div className="text-gray-500 text-xs mt-1 leading-relaxed">
                        Unlocks at Level {r.unlockLevel} — {LEVELS.find(l => l.level === r.unlockLevel)!.title}
                      </div>
                    ) : toolLocked ? (
                      <div className="text-gray-500 text-xs mt-1 leading-relaxed">
                        Needs the {TOOLS[neededTool!].name} — buy it in the 🧰 Toolbox Specialty drawer (🪙 {TOOL_PRICES[neededTool!]})
                      </div>
                    ) : (
                      <div className="text-gray-400 text-xs mt-1 leading-relaxed">{r.desc}</div>
                    )}
                  </button>
                );
              })}
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

              {activeRepair === 'overhead-adjust' && (
                <div className="space-y-1.5">
                  <p className="text-gray-400 text-[11px] uppercase tracking-widest">
                    Valve cover bolts (13mm socket) ({valveCoverBoltsRemoved.filter(Boolean).length}/{VALVE_COVER_BOLT_COUNT})
                  </p>
                  <div className="grid grid-cols-8 gap-1.5">
                    {valveCoverBoltsRemoved.map((done, i) => (
                      <button
                        key={i}
                        onClick={() => removeValveCoverBolt(i)}
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
              )}

              {activeRepair === 'fluid-check' && (
                <div className="space-y-1.5">
                  {([
                    { key: 'oil' as const, icon: '🛢️', label: 'Engine oil (dipstick)' },
                    { key: 'coolant' as const, icon: '🧊', label: 'Coolant surge tank' },
                    { key: 'washer' as const, icon: '🚿', label: 'Windshield washer' },
                    { key: 'def' as const, icon: '💧', label: 'DEF' },
                    { key: 'grease' as const, icon: '🧴', label: 'Grease all zerk fittings' },
                  ]).map(f => (
                    <button
                      key={f.key}
                      onClick={() => setFluidsChecked(prev => ({ ...prev, [f.key]: !prev[f.key] }))}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition ${
                        fluidsChecked[f.key] ? 'border-green-500/40 bg-green-500/10' : 'border-white/10 bg-white/5 hover:border-amber-400/40'
                      }`}
                    >
                      <span>{fluidsChecked[f.key] ? '✅' : f.icon}</span>
                      <span className="text-xs text-white flex-1">{f.label}</span>
                      <span className="text-[11px] text-gray-400">{fluidsChecked[f.key] ? (f.key === 'grease' ? 'Greased' : 'Topped off') : (f.key === 'grease' ? 'Grease it' : 'Check it')}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeRepair === 'annual-inspection' && (
                <div className="space-y-1.5">
                  {([
                    { key: 'rearAxle' as const, icon: '⚙️', label: 'Rear axle housing bolts' },
                    { key: 'diff' as const, icon: '🔩', label: 'Differential carrier bolts' },
                  ]).map(f => (
                    <button
                      key={f.key}
                      onClick={() => setAxleChecked(prev => ({ ...prev, [f.key]: !prev[f.key] }))}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition ${
                        axleChecked[f.key] ? 'border-green-500/40 bg-green-500/10' : 'border-white/10 bg-white/5 hover:border-amber-400/40'
                      }`}
                    >
                      <span>{axleChecked[f.key] ? '✅' : f.icon}</span>
                      <span className="text-xs text-white flex-1">{f.label}</span>
                      <span className="text-[11px] text-gray-400">{axleChecked[f.key] ? 'Torqued to spec' : 'Torque-check it'}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeRepair === 'hood-cable' && (
                <div className="space-y-1.5">
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    Distilled from the Volvo TSB (hood cable binding/broken — VNL/VNR/VNM/VNX/VAH/VHD). Work through it top to bottom.
                  </p>
                  {hoodCableStep < HOOD_CABLE_STEPS.length ? (
                    <button
                      onClick={() => setHoodCableStep(s => s + 1)}
                      className="w-full text-left p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 transition"
                    >
                      <div className="text-amber-200 text-[11px] font-bold uppercase tracking-widest mb-1">
                        Step {hoodCableStep + 1}/{HOOD_CABLE_STEPS.length}
                      </div>
                      <div className="text-white text-xs leading-relaxed">{HOOD_CABLE_STEPS[hoodCableStep]}</div>
                    </button>
                  ) : (
                    <p className="text-green-300 text-xs">All steps done — release cable tests clean.</p>
                  )}
                </div>
              )}

              {(activeRepair === 'oil-change' || activeRepair === 'pan-gasket') && (<>
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
                  {activeRepair === 'pan-gasket'
                    ? '✨ Fit new gasket & reinstall'
                    : activeRepair === 'overhead-adjust'
                      ? '✨ Lash checked, bolts torqued'
                      : '✨ New filters, oil & reinstall'}
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

      {/* Level-up toast — fires from finishRepair when a job's coin payout
          crosses the next LEVELS threshold; auto-dismisses after 4s. */}
      {levelUpMsg && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl border border-amber-400/60 bg-gradient-to-r from-amber-500/20 to-yellow-400/20 backdrop-blur-md text-center pointer-events-none animate-pulse">
          <p className="text-amber-200 text-sm font-black tracking-wide">{levelUpMsg}</p>
        </div>
      )}

      {/* Pre-trip checklist — the real-life steps before any wrenching */}
      {!isLoading && !hoodOpen && !inspecting && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 flex items-center gap-4 text-[11px] pointer-events-none">
          <span className={doorUnlocked ? 'text-green-300' : 'text-white font-bold'}>{doorUnlocked ? '✓' : '1.'} 🔑 Unlock the door (key in hand, click the door)</span>
          <span className={parkingBrake ? 'text-green-300' : doorUnlocked ? 'text-white font-bold' : 'text-gray-500'}>{parkingBrake ? '✓' : '2.'} 🅿 Set the parking brake (in the cab)</span>
          {vehicle !== 'sonata2017' && (
            <span className={hoodLeverPulled ? 'text-green-300' : parkingBrake ? 'text-white font-bold' : 'text-gray-500'}>{hoodLeverPulled ? '✓' : '3.'} 🔓 Pull the hood release (in the cab)</span>
          )}
          <span className={hoodOpen ? 'text-green-300' : (vehicle === 'sonata2017' ? parkingBrake : hoodLeverPulled) ? 'text-white font-bold' : 'text-gray-500'}>{vehicle === 'sonata2017' ? '3.' : '4.'} Open the hood (click it — outside the cab)</span>
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
              {vehicle !== 'sonata2017' && (
                <button
                  onClick={() => {
                    if (hoodLeverPulled) return;
                    setHoodLeverPulled(true);
                    setServiceMsg('🔓 Hood latch released — climb out, then click the hood to lift it.');
                  }}
                  className={`w-32 rounded-lg border-2 p-2 text-center transition ${hoodLeverPulled ? 'border-neutral-500 bg-neutral-700/70' : 'border-neutral-400 bg-neutral-600 hover:brightness-110'}`}
                >
                  <span className={`block w-3 h-10 mx-auto rounded-full shadow-inner ${hoodLeverPulled ? 'bg-neutral-500' : 'bg-neutral-300'}`} />
                  <span className="text-white text-[9px] font-bold block mt-1 leading-tight">HOOD<br />RELEASE</span>
                  <span className="text-neutral-300 text-[8px]">{hoodLeverPulled ? 'RELEASED ✓' : 'PULL TO UNLATCH'}</span>
                </button>
              )}
            </div>

            <p className="text-gray-500 text-[11px] text-center leading-relaxed">
              {vehicle !== 'sonata2017'
                ? 'Pull the yellow diamond to set the spring brakes, and the hood release if you\'re popping the hood, before you leave the cab.'
                : 'Pull the yellow diamond to set the spring brakes before you leave the cab.'}
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
      {!isLoading && !inspecting && hoodOpen && vehicle === 'vnl860' && hotspots.map(hs => {
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

      {/* RPM / Engine status (bottom-left). Gated on height as well as width —
          `md:` alone triggers on a short "widescreen" mobile-landscape phone
          (width ≥768px but height only ~375-430px), where this panel and the
          "Mobile specs strip" below used to render on top of each other
          because both only checked width. Only one of the two now shows. */}
      <div className="absolute bottom-20 left-5 pointer-events-auto hidden [@media(min-width:768px)_and_(min-height:520px)]:block">
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

      {/* Mobile specs strip — the fallback for when there isn't room for the
          desktop RPM panel above. Was `xl:hidden` (width-only), which made it
          render at the same time as that panel between 768-1280px width on a
          short viewport; now the two conditions mirror each other exactly. */}
      <div className="absolute bottom-20 left-4 right-4 pointer-events-none [@media(min-width:768px)_and_(min-height:520px)]:hidden">
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
        {vehicle === 'vnl860' && (
          <button
            onClick={toggleXray}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
            style={xrayOn
              ? { background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.5)', color: '#00d4ff' }
              : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }
            }
          >
            {xrayOn ? '🩻 X-Ray: On' : '🩻 X-Ray'}
          </button>
        )}
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

      {/* Interaction hint — hidden below 520px height for the same reason as
          the RPM panel above, and also hidden while a tool is in hand since
          it sits right where the HandHUD graphic renders bottom-right. */}
      {!selectedTool && (
        <div className="absolute bottom-8 right-5 pointer-events-none text-right hidden [@media(min-width:768px)_and_(min-height:520px)]:block">
          <p className="text-gray-700 text-xs">🖱 Drag · Scroll · Right-drag</p>
          <p className="text-gray-600 text-xs mt-0.5">Click markers to explore</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Procedural Volvo D13 Engine Builder
// ─────────────────────────────────────────────────────────
export function buildVolvoD13(
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
  mkTray(-0.94, 1.35, 0.5, 0.24);  // valve cover bolts, 8 per row × 2
  tick();

  // ══════════════════════════════════════
  // 2. CYLINDER HEAD + VALVE COVER
  // ══════════════════════════════════════
  add(new THREE.BoxGeometry(2.06, 0.22, 0.74), M.teal, { pos: [0, 0.44, 0] });
  tick();

  // Valve cover — cast aluminium, not black, per the D13 studio render
  // (docs/reference/engine/d13-glamour-render.webp): the cover reads as
  // bare metal with the VOLVO badge in blue on the side rail.
  add(new THREE.BoxGeometry(2.02, 0.28, 0.70), M.brushedMetal, { pos: [0, 0.63, 0] });
  // Raised center strip
  add(new THREE.BoxGeometry(1.65, 0.09, 0.42), M.brushedMetal, { pos: [0, 0.785, 0] });
  tick();

  // VOLVO badge letters (5 bumps, blue on the silver cover per the render)
  for (let i = 0; i < 5; i++) {
    add(new THREE.BoxGeometry(0.1, 0.055, 0.06), M.blue, { pos: [-0.25 + i * 0.12, 0.84, 0] });
  }

  // Valve cover perimeter bolts (M8 flange bolts — no coils on a diesel).
  // Each is its own named, removable group (13mm socket, "Valve Lash
  // Adjustment" repair) so it can come off individually like the pan bolts.
  VALVE_COVER_BOLT_POSITIONS.forEach(([bx, bz], i) => {
    const vcBolt = new THREE.Group();
    vcBolt.name = `service-valvecover-bolt-${i}`;
    group.add(vcBolt);
    add(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 8), M.brushedMetal, { pos: [bx, 0.78, bz], parent: vcBolt });
  });
  // Injector harness pass-through connector on the valve cover
  add(new THREE.BoxGeometry(0.09, 0.05, 0.14), M.black, { pos: [-0.7, 0.79, 0.18] });
  tick();

  // ══════════════════════════════════════
  // 3. TIMING COVER (front end, +x)
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
  // 4. BELL HOUSING / FLYWHEEL (rear end, −x)
  // ══════════════════════════════════════
  add(new THREE.CylinderGeometry(0.55, 0.55, 0.32, 32), M.darkMetal, { pos: [-1.21, -0.28, 0], rot: [0, 0, Math.PI / 2] });
  add(new THREE.CylinderGeometry(0.38, 0.38, 0.34, 32), M.darkMetal, { pos: [-1.21, -0.28, 0], rot: [0, 0, Math.PI / 2] });
  // Flywheel ring gear
  add(new THREE.TorusGeometry(0.52, 0.035, 8, 48), M.darkMetal, { pos: [-1.18, -0.28, 0], rot: [0, Math.PI / 2, 0] });
  tick();

  // ── VOLVO I-SHIFT TRANSMISSION bolted to the bell housing — modeled
  // from the studio render docs/reference/transmission/ishift-render.webp:
  // silver ribbed clutch-housing cone, royal-blue main case whose open
  // X-webbing shows the grey gear housing behind it, silver TECU/shift
  // unit on top with connector stubs, clutch-air canister hanging on the
  // right, plate oil cooler on the left, finned rear housing ending in
  // the output-shaft yoke.
  // Measured off the render with the clutch flange OD as anchor A ≈ 1.0:
  //   overall ≈ 1.7 A · clutch cone ≈ 0.5 A long, Ø 1.0 A → 0.62 A ·
  //   blue case ≈ 0.62 A long × 0.6 A tall · rear housing ≈ 0.3 A ·
  //   TECU ≈ 0.5 A × 0.13 A · output yoke Ø ≈ 0.18 A.
  // Scene: A = 0.96 units (flange r 0.48 blends into the existing
  // r 0.55 bell housing).
  const trans = new THREE.Group();
  trans.name = 'transmission-ishift';
  group.add(trans);
  // Mating flange ring against the bell housing
  add(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 32), M.brushedMetal, { pos: [-1.40, -0.28, 0], rot: [0, 0, Math.PI / 2], parent: trans });
  // Clutch housing cone, big end at the flange
  add(new THREE.CylinderGeometry(0.30, 0.48, 0.5, 32), M.brushedMetal, { pos: [-1.67, -0.28, 0], rot: [0, 0, Math.PI / 2], parent: trans });
  // Radial cast ribs along the cone (render shows them running lengthwise)
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    add(new THREE.BoxGeometry(0.44, 0.04, 0.025), M.brushedMetal,
      { pos: [-1.67, -0.28 + 0.37 * Math.cos(a), 0.37 * Math.sin(a)], rot: [a, 0, 0.19], shadow: false, parent: trans });
  }
  // Main case: grey gear housing core behind a royal-blue outer frame
  add(new THREE.BoxGeometry(0.62, 0.58, 0.5), M.brushedMetal, { pos: [-2.23, -0.28, 0], parent: trans });
  add(new THREE.BoxGeometry(0.62, 0.1, 0.54), M.blue, { pos: [-2.23, -0.02, 0], parent: trans });
  add(new THREE.BoxGeometry(0.62, 0.1, 0.54), M.blue, { pos: [-2.23, -0.54, 0], parent: trans });
  add(new THREE.BoxGeometry(0.08, 0.62, 0.54), M.blue, { pos: [-1.95, -0.28, 0], parent: trans });
  add(new THREE.BoxGeometry(0.08, 0.62, 0.54), M.blue, { pos: [-2.51, -0.28, 0], parent: trans });
  // X-webs across both side faces of the blue frame
  [-1, 1].forEach(s => {
    [1, -1].forEach(d => {
      add(new THREE.BoxGeometry(0.60, 0.05, 0.03), M.blue,
        { pos: [-2.23, -0.28, s * 0.265], rot: [0, 0, d * 0.62], shadow: false, parent: trans });
    });
  });
  tick();
  // TECU / gear-shift control unit on top: silver body, dark heat-sink
  // lid, three connector stubs on the front face, selector tower below
  add(new THREE.CylinderGeometry(0.09, 0.11, 0.1, 16), M.brushedMetal, { pos: [-2.23, 0.015, 0], parent: trans });
  add(new THREE.BoxGeometry(0.5, 0.13, 0.38), M.brushedMetal, { pos: [-2.23, 0.10, 0], parent: trans });
  add(new THREE.BoxGeometry(0.34, 0.05, 0.3), M.darkMetal, { pos: [-2.23, 0.19, 0], parent: trans });
  [0.10, -0.02, -0.14].forEach(z => {
    add(new THREE.BoxGeometry(0.06, 0.06, 0.09), M.black, { pos: [-1.96, 0.10, z], shadow: false, parent: trans });
  });
  // Clutch-air canister on the right of the case (render: vertical silver
  // cylinder with a dark cap)
  add(new THREE.CylinderGeometry(0.085, 0.085, 0.3, 18), M.brushedMetal, { pos: [-2.10, -0.34, 0.32], parent: trans });
  add(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 12), M.darkMetal, { pos: [-2.10, -0.16, 0.32], parent: trans });
  // Plate oil cooler on the left face
  add(new THREE.BoxGeometry(0.4, 0.22, 0.07), M.brushedMetal, { pos: [-2.25, -0.36, -0.30], parent: trans });
  for (let i = 0; i < 5; i++) {
    add(new THREE.BoxGeometry(0.4, 0.02, 0.08), M.darkMetal, { pos: [-2.25, -0.45 + i * 0.045, -0.305], shadow: false, parent: trans });
  }
  // Rear housing cone, speedo/output area, output shaft + yoke flange
  add(new THREE.CylinderGeometry(0.20, 0.27, 0.28, 28), M.brushedMetal, { pos: [-2.69, -0.28, 0], rot: [0, 0, Math.PI / 2], parent: trans });
  add(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16), M.darkMetal, { pos: [-2.86, -0.28, 0], rot: [0, 0, Math.PI / 2], parent: trans });
  add(new THREE.CylinderGeometry(0.045, 0.045, 0.14, 12), M.chrome, { pos: [-2.95, -0.28, 0], rot: [0, 0, Math.PI / 2], parent: trans });
  add(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16), M.darkMetal, { pos: [-3.02, -0.28, 0], rot: [0, 0, Math.PI / 2], parent: trans });
  tick();

  // ══════════════════════════════════════
  // 5. COOLING FAN — on the FRONT end with the damper (it was hanging
  // off the flywheel end before; a fan behind the bell housing cools
  // nothing but the transmission)
  // ══════════════════════════════════════
  const fanGroup = new THREE.Group();
  fanGroup.position.set(1.55, 0.14, 0);
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
  add(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 8), M.chrome, { pos: [1.63, 0.14, 0], rot: [0, 0, Math.PI / 2] });

  // Viscous coupling body (between damper and fan)
  add(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 16), M.brushedMetal, { pos: [1.44, 0.14, 0], rot: [0, 0, Math.PI / 2] });
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
  add(new THREE.CylinderGeometry(0.068, 0.068, 0.025, 18), castAlu, { pos: [0.6, -0.08, 0.58], parent: turbo });
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
    new THREE.Vector3(0.62, 0.14, 0.66),
    new THREE.Vector3(0.58, 0.10, 0.66),
    new THREE.Vector3(0.55, 0.13, 0.64),
    new THREE.Vector3(0.50, 0.15, 0.58),
  ]);
  add(new THREE.TubeGeometry(harnessPath, 12, 0.012, 8, false), M.rubber, { parent: harness, shadow: false });
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 12), bayonetGreen, { pos: [0.5, 0.155, 0.57], parent: harness });
  // Charge pipe V-band (vertical-axis flange under the elbow)
  add(new THREE.TorusGeometry(0.072, 0.014, 10, 22), M.chrome, { pos: TURBO_PARTS['charge-clamp'].anchor, rot: [Math.PI / 2, 0, 0], parent: mkPart('charge-clamp') });
  // Exhaust V-band at the turbine outlet
  add(new THREE.TorusGeometry(0.096, 0.015, 10, 22), M.chrome, { pos: TURBO_PARTS['exh-clamp'].anchor, rot: [0, Math.PI / 2, 0], parent: mkPart('exh-clamp') });
  // Oil feed line up to the block gallery
  const oilFeed = mkPart('oil-feed');
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.47, 0.36, 0.50), new THREE.Vector3(0.44, 0.48, 0.42), new THREE.Vector3(0.40, 0.52, 0.10),
  ]), 10, 0.012, 8, false), M.chrome, { parent: oilFeed, shadow: false });
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 10), M.brushedMetal, { pos: [0.47, 0.355, 0.50], parent: oilFeed });
  // Two coolant lines (the center housing is water cooled)
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.52, 0.32, 0.44), new THREE.Vector3(0.56, 0.44, 0.32), new THREE.Vector3(0.60, 0.50, -0.02),
  ]), 10, 0.013, 8, false), M.rubber, { parent: mkPart('coolant-a'), shadow: false });
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.52, 0.18, 0.44), new THREE.Vector3(0.58, 0.10, 0.30), new THREE.Vector3(0.62, 0.04, -0.05),
  ]), 10, 0.013, 8, false), M.rubber, { parent: mkPart('coolant-b'), shadow: false });
  // Oil drain tube back to the block
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.47, 0.16, 0.52), new THREE.Vector3(0.46, 0.02, 0.50), new THREE.Vector3(0.44, -0.09, 0.40),
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
  // 7. INTAKE MANIFOLD (left side, −z) + EGR COOLER + CHARGE PIPE
  // Layout per the QRG side views and the factory photos: intake on the
  // LEFT; EGR cooler along the RIGHT above the exhaust manifold, with
  // one crossover pipe over the head to the intake — that crossover is
  // the only pipe that legitimately crosses sides.
  // ══════════════════════════════════════
  add(new THREE.BoxGeometry(1.8, 0.12, 0.2), M.teal, { pos: [0, 0.42, -0.3] });

  // EGR cooler — docs/reference/egr/01 + 02: Volvo-green CAST housing
  // (not bare aluminium) lying along the right side above the exhaust
  // manifold. Recognition features from the photos: rounded cast body
  // with vertical rib lines, TWO bright steel band clamps around the
  // shell, a stainless bellows at the front end, and a rust-red
  // silicone coupler joining the hot pipe at the rear.
  const egrCooler = new THREE.Group();
  egrCooler.name = 'egr-cooler';
  group.add(egrCooler);
  const EGR_Y = 0.74, EGR_Z = 0.50;
  // Rounded cast shell: box core + half-round crown along the top
  add(new THREE.BoxGeometry(0.74, 0.13, 0.16), M.teal, { pos: [-0.30, EGR_Y, EGR_Z], parent: egrCooler });
  add(new THREE.CylinderGeometry(0.08, 0.08, 0.74, 16, 1, false, 0, Math.PI), M.teal,
    { pos: [-0.30, EGR_Y + 0.055, EGR_Z], rot: [0, 0, Math.PI / 2], parent: egrCooler });
  // Cast rib lines around the shell (photo 01)
  for (let i = 0; i < 6; i++) {
    add(new THREE.BoxGeometry(0.012, 0.145, 0.175), M.darkTeal,
      { pos: [-0.60 + i * 0.12, EGR_Y, EGR_Z], parent: egrCooler, shadow: false });
  }
  // Two bright band clamps with a small tensioner block on top
  for (const bx of [-0.46, -0.13]) {
    add(new THREE.CylinderGeometry(0.098, 0.098, 0.024, 18, 1, true), M.chrome,
      { pos: [bx, EGR_Y + 0.01, EGR_Z], rot: [0, 0, Math.PI / 2], parent: egrCooler, shadow: false });
    add(new THREE.BoxGeometry(0.03, 0.025, 0.02), M.brushedMetal,
      { pos: [bx, EGR_Y + 0.105, EGR_Z], parent: egrCooler, shadow: false });
  }
  // Cooled-gas outlet at the FRONT end: short stainless bellows section,
  // then a cast pipe diving down-forward to meet the EGR valve's down-
  // facing elbow mouth from below (photo 02 shows the valve's elbow
  // pointing down into a clamped coupler like this)
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.07, EGR_Y - 0.02, EGR_Z),
    new THREE.Vector3(0.078, 0.63, EGR_Z + 0.005),
    new THREE.Vector3(0.105, 0.545, EGR_Z),
  ]), 12, 0.038, 10, false), castIron, { parent: egrCooler, shadow: false });
  for (let i = 0; i < 3; i++) {
    add(new THREE.TorusGeometry(0.045, 0.010, 8, 18), M.brushedMetal,
      { pos: [0.071 + i * 0.004, 0.70 - i * 0.026, EGR_Z], rot: [Math.PI / 2, 0, 0], parent: egrCooler, shadow: false });
  }
  // Rust-red silicone coupler + clamps at the REAR, joining the hot pipe
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.09, 14), M.red,
    { pos: [-0.71, EGR_Y, EGR_Z], rot: [0, 0, Math.PI / 2], parent: egrCooler, shadow: false });
  for (const cx of [-0.745, -0.675]) {
    add(new THREE.CylinderGeometry(0.056, 0.056, 0.012, 14, 1, true), M.chrome,
      { pos: [cx, EGR_Y, EGR_Z], rot: [0, 0, Math.PI / 2], parent: egrCooler, shadow: false });
  }
  // Hot-side feed: exhaust manifold rear up into the cooler rear coupler
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.80, 0.60, 0.52),
    new THREE.Vector3(-0.80, 0.70, 0.51),
    new THREE.Vector3(-0.76, EGR_Y, EGR_Z),
  ]), 8, 0.042, 10, false), castIron, { parent: egrCooler, shadow: false });
  tick();

  // EGR VALVE / coolant-transfer-tube assembly — docs/reference/egr/04,
  // all three views in that screenshot (main eBay photo lying on its
  // side, YouTube inset standing next to the black venturi, bench inset).
  // Measured off the main photo with the green barrel OD as anchor A:
  //   overall length ≈ 5.7 A · ribbed black 90° elbow tube OD ≈ 1.1 A,
  //   mouth flare ≈ 1.3 A · steel band clamp ≈ 0.5 A wide at the
  //   elbow↔casting joint · actuator box ≈ 1.6 A × 0.8 A on top with a
  //   round cap and a connector on its end face · last ≈ 1.5 A of the
  //   barrel heat-stained · outlet snout flares 0.75 A → 1.15 A, open
  //   flanged mouth angled slightly up.
  // Scene scale: A = 0.10 units (engine block 2.1 units ≈ 1366 mm).
  const egrValve = new THREE.Group();
  egrValve.name = 'service-egr-valve';
  group.add(egrValve);
  // Green cast barrel, spans x 0.235–0.555 (3.2 A), slight taper
  add(new THREE.CylinderGeometry(0.048, 0.050, 0.32, 14), M.teal,
    { pos: [0.395, EGR_Y, EGR_Z], rot: [0, 0, Math.PI / 2], parent: egrValve });
  // Cast step rings (photo: two visible diameter steps along the body)
  add(new THREE.CylinderGeometry(0.057, 0.057, 0.028, 14), M.darkTeal,
    { pos: [0.28, EGR_Y, EGR_Z], rot: [0, 0, Math.PI / 2], parent: egrValve, shadow: false });
  add(new THREE.CylinderGeometry(0.054, 0.054, 0.022, 14), M.darkTeal,
    { pos: [0.47, EGR_Y, EGR_Z], rot: [0, 0, Math.PI / 2], parent: egrValve, shadow: false });
  // Casting webs under the body (bench inset shows chunky webs)
  add(new THREE.BoxGeometry(0.10, 0.05, 0.016), M.teal,
    { pos: [0.33, EGR_Y - 0.035, EGR_Z], parent: egrValve, shadow: false });
  add(new THREE.BoxGeometry(0.08, 0.04, 0.016), M.teal,
    { pos: [0.46, EGR_Y - 0.03, EGR_Z], parent: egrValve, shadow: false });
  // Green inlet stub + wide bright band clamp at the elbow↔casting joint
  add(new THREE.CylinderGeometry(0.048, 0.048, 0.055, 14), M.teal,
    { pos: [0.2075, EGR_Y, EGR_Z], rot: [0, 0, Math.PI / 2], parent: egrValve });
  add(new THREE.CylinderGeometry(0.0565, 0.0565, 0.045, 18, 1, true), M.chrome,
    { pos: [0.213, EGR_Y, EGR_Z], rot: [0, 0, Math.PI / 2], parent: egrValve, shadow: false });
  add(new THREE.BoxGeometry(0.03, 0.028, 0.022), M.brushedMetal,
    { pos: [0.213, EGR_Y + 0.062, EGR_Z], parent: egrValve, shadow: false });
  // Ribbed BLACK 90° elbow: quarter-bend off the barrel axis, mouth
  // facing straight down (photo 04 main + photo 02 installed)
  add(new THREE.TorusGeometry(0.075, 0.050, 10, 14, Math.PI / 2), M.black,
    { pos: [0.18, 0.665, EGR_Z], rot: [0, 0, Math.PI / 2], parent: egrValve });
  add(new THREE.CylinderGeometry(0.050, 0.050, 0.065, 14), M.black,
    { pos: [0.105, 0.6325, EGR_Z], parent: egrValve });
  // Raised rings that make the elbow read as ribbed
  for (let i = 0; i < 3; i++) {
    add(new THREE.TorusGeometry(0.052, 0.010, 8, 16), M.black,
      { pos: [0.105, 0.655 - i * 0.022, EGR_Z], rot: [Math.PI / 2, 0, 0], parent: egrValve, shadow: false });
  }
  // Flared mouth ring at the bottom of the elbow
  add(new THREE.CylinderGeometry(0.056, 0.056, 0.014, 14), M.black,
    { pos: [0.105, 0.598, EGR_Z], parent: egrValve, shadow: false });
  // Actuator/motor housing on a cast pedestal: 1.6 A × 0.8 A box with a
  // darker lid, round cap boss, and connector on the +x end face
  add(new THREE.BoxGeometry(0.10, 0.05, 0.06), M.teal,
    { pos: [0.34, EGR_Y + 0.035, EGR_Z], parent: egrValve });
  add(new THREE.BoxGeometry(0.16, 0.075, 0.09), M.teal,
    { pos: [0.34, EGR_Y + 0.088, EGR_Z], parent: egrValve });
  add(new THREE.BoxGeometry(0.15, 0.012, 0.082), M.darkTeal,
    { pos: [0.34, EGR_Y + 0.130, EGR_Z], parent: egrValve, shadow: false });
  add(new THREE.CylinderGeometry(0.020, 0.020, 0.012, 12), M.darkTeal,
    { pos: [0.30, EGR_Y + 0.140, EGR_Z], parent: egrValve, shadow: false });
  // Mounting bosses under the heat-stained end (bolts are separate,
  // removable service parts added below)
  for (const bx of [0.36, 0.52]) {
    add(new THREE.CylinderGeometry(0.014, 0.014, 0.035, 8), M.darkTeal,
      { pos: [bx, EGR_Y - 0.055, EGR_Z], parent: egrValve, shadow: false });
  }
  // Heat-stained sleeve over the outlet end of the barrel
  add(new THREE.CylinderGeometry(0.0505, 0.0505, 0.06, 14), castIron,
    { pos: [0.525, EGR_Y, EGR_Z], rot: [0, 0, Math.PI / 2], parent: egrValve, shadow: false });
  // Flared outlet snout, open flanged mouth, angled slightly up
  add(new THREE.CylinderGeometry(0.058, 0.036, 0.11, 14), M.darkMetal,
    { pos: [0.605, EGR_Y + 0.012, EGR_Z], rot: [0, 0, Math.PI / 2 - 0.12], parent: egrValve });
  add(new THREE.CylinderGeometry(0.062, 0.062, 0.012, 14), M.darkMetal,
    { pos: [0.652, EGR_Y + 0.018, EGR_Z], rot: [0, 0, Math.PI / 2 - 0.12], parent: egrValve, shadow: false });
  tick();

  // Detachable EGR valve service parts (stay behind / come off separately
  // when the valve is removed — same pattern as the turbo parts)
  // Harness connector on the actuator end face, with a short cable
  const egrHarness = new THREE.Group();
  egrHarness.name = 'service-egr-harness';
  group.add(egrHarness);
  add(new THREE.BoxGeometry(0.035, 0.03, 0.035), M.black,
    { pos: [0.435, EGR_Y + 0.088, EGR_Z], parent: egrHarness, shadow: false });
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.45, EGR_Y + 0.088, EGR_Z),
    new THREE.Vector3(0.52, EGR_Y + 0.11, EGR_Z + 0.03),
    new THREE.Vector3(0.60, EGR_Y + 0.10, EGR_Z + 0.06),
  ]), 8, 0.008, 6, false), M.rubber, { parent: egrHarness, shadow: false });
  // Rust-red silicone coupler + two worm clamps joining the elbow mouth
  // to the cooler outlet pipe below it
  const egrCoupler = new THREE.Group();
  egrCoupler.name = 'service-egr-coupler';
  group.add(egrCoupler);
  add(new THREE.CylinderGeometry(0.052, 0.052, 0.048, 14), M.red,
    { pos: [0.105, 0.568, EGR_Z], parent: egrCoupler, shadow: false });
  for (const cy of [0.586, 0.550]) {
    add(new THREE.CylinderGeometry(0.057, 0.057, 0.011, 14, 1, true), M.chrome,
      { pos: [0.105, cy, EGR_Z], parent: egrCoupler, shadow: false });
  }
  // V-band clamp holding the crossover pipe onto the snout mouth
  add(new THREE.CylinderGeometry(0.066, 0.066, 0.016, 16, 1, true), M.chrome,
    { pos: [0.660, EGR_Y + 0.019, EGR_Z], rot: [0, 0, Math.PI / 2 - 0.12], shadow: false }).name = 'service-egr-vband';
  // Two mounting bolts under the bosses
  [0.36, 0.52].forEach((bx, i) => {
    add(new THREE.CylinderGeometry(0.011, 0.011, 0.03, 6), M.darkMetal,
      { pos: [bx, EGR_Y - 0.078, EGR_Z], shadow: false }).name = `service-egr-bolt-${i}`;
  });
  tick();

  // EGR crossover: valve snout up and over the valve cover to the
  // venturi on the intake side (the one legitimate side-crossing pipe)
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.665, EGR_Y + 0.02, EGR_Z),
    new THREE.Vector3(0.30, 0.90, 0.20),
    new THREE.Vector3(0.19, 0.90, -0.10),
    new THREE.Vector3(0.15, 0.73, -0.26),
    new THREE.Vector3(0.15, 0.668, -0.285),
  ]), 20, 0.030, 10, false), M.darkMetal, { shadow: false });

  // VENTURI pipe — docs/reference/egr/04, YouTube inset "EGR Venturi
  // Pipe (Volvo/Freightliner)": the separate BLACK tube standing next to
  // the green valve. Measured off that inset with the tube OD as anchor:
  //   height ≈ 4 × OD · near-STRAIGHT outside (the venturi profile is
  //   internal — no external hourglass) with one cast step ring at ≈ 40%
  //   height · oval bottom flange ≈ 1.6 × OD · round two-bolt sensor pad
  //   facing sideways mid-body · slight collar at the top where the
  //   crossover clamps on. Delta-P taps per exploded diagram 03 (#16).
  const egrVenturi = new THREE.Group();
  egrVenturi.name = 'service-egr-venturi';
  group.add(egrVenturi);
  const VX = 0.15, VZ = -0.285;
  // Lower tube, step ring, upper tube — straight silhouette per photo
  add(new THREE.CylinderGeometry(0.028, 0.028, 0.075, 16), M.black,
    { pos: [VX, 0.514, VZ], parent: egrVenturi });
  add(new THREE.CylinderGeometry(0.033, 0.033, 0.020, 16), M.black,
    { pos: [VX, 0.560, VZ], parent: egrVenturi, shadow: false });
  add(new THREE.CylinderGeometry(0.0255, 0.0255, 0.085, 16), M.black,
    { pos: [VX, 0.6125, VZ], parent: egrVenturi });
  // Oval bottom flange (bolts are separate, removable service parts)
  const vFlange = add(new THREE.CylinderGeometry(0.045, 0.045, 0.016, 14), M.black,
    { pos: [VX, 0.468, VZ], parent: egrVenturi });
  vFlange.scale.x = 1.6;
  // Round two-bolt delta-P sensor pad facing outward mid-body
  add(new THREE.CylinderGeometry(0.019, 0.019, 0.014, 12), M.darkMetal,
    { pos: [VX, 0.585, VZ - 0.030], rot: [Math.PI / 2, 0, 0], parent: egrVenturi, shadow: false });
  for (const nx of [VX - 0.011, VX + 0.011]) {
    add(new THREE.CylinderGeometry(0.006, 0.006, 0.018, 6), M.darkMetal,
      { pos: [nx, 0.585, VZ - 0.038], rot: [Math.PI / 2, 0, 0], parent: egrVenturi, shadow: false });
  }
  // Delta-P pressure taps: inlet-side and throat-side nipples
  add(new THREE.CylinderGeometry(0.009, 0.009, 0.03, 8), M.darkMetal,
    { pos: [VX + 0.038, 0.628, VZ], rot: [0, 0, Math.PI / 2], parent: egrVenturi, shadow: false });
  add(new THREE.CylinderGeometry(0.009, 0.009, 0.03, 8), M.darkMetal,
    { pos: [VX + 0.040, 0.535, VZ], rot: [0, 0, Math.PI / 2], parent: egrVenturi, shadow: false });
  tick();

  // Detachable venturi service parts
  // Sensor line joining the two taps into the delta-P sensor block
  const venturiLine = new THREE.Group();
  venturiLine.name = 'service-venturi-line';
  group.add(venturiLine);
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(VX + 0.053, 0.628, VZ),
    new THREE.Vector3(VX + 0.09, 0.582, VZ + 0.01),
    new THREE.Vector3(VX + 0.055, 0.535, VZ),
  ]), 8, 0.004, 6, false), M.black, { parent: venturiLine, shadow: false });
  add(new THREE.BoxGeometry(0.035, 0.025, 0.02), M.darkMetal,
    { pos: [VX + 0.095, 0.582, VZ + 0.015], parent: venturiLine, shadow: false });
  // Clamp collar holding the crossover onto the venturi top
  add(new THREE.CylinderGeometry(0.031, 0.031, 0.016, 16, 1, true), M.chrome,
    { pos: [VX, 0.660, VZ], shadow: false }).name = 'service-venturi-clamp';
  // Two flange bolts through the oval foot
  [VX - 0.058, VX + 0.058].forEach((fx, i) => {
    add(new THREE.CylinderGeometry(0.010, 0.010, 0.028, 6), M.darkMetal,
      { pos: [fx, 0.478, VZ], shadow: false }).name = `service-venturi-bolt-${i}`;
  });
  tick();

  // Charge pipe: compressor outlet flange forward over the front-top of
  // the engine to the intake side (CAC round-trip simplified)
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.60, -0.08, 0.58),
    new THREE.Vector3(0.95, 0.10, 0.60),
    new THREE.Vector3(1.20, 0.50, 0.35),
    new THREE.Vector3(1.25, 0.62, 0.0),
    new THREE.Vector3(1.20, 0.52, -0.32),
    new THREE.Vector3(0.92, 0.44, -0.32),
  ]), 24, 0.055, 10, false), M.darkMetal, { shadow: false });
  // Rubber boot + clamp where it meets the intake manifold
  add(new THREE.CylinderGeometry(0.062, 0.062, 0.1, 12), M.rubber, { pos: [0.90, 0.435, -0.315], rot: [0, 0, Math.PI / 2], shadow: false });
  tick();

  // ══════════════════════════════════════
  // 8. EXHAUST MANIFOLD — one-piece cast-iron log HIGH on the right
  // side of the head (engine_right/top photos), 6 runners into the
  // ports, outlet elbow dropping straight onto the turbo inlet flange.
  // No crossover pipe: the turbo bolts to this manifold.
  // ══════════════════════════════════════
  const EXH_Y = 0.60, EXH_Z = 0.52;
  add(new THREE.CylinderGeometry(0.065, 0.065, 1.70, 14), castIron, { pos: [-0.03, EXH_Y, EXH_Z], rot: [0, 0, Math.PI / 2] });
  // 6 runners from the exhaust ports (head face z = 0.37) out to the log
  for (let i = 0; i < 6; i++) {
    const rx = -0.78 + i * 0.31;
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(rx, 0.44, 0.36),
      new THREE.Vector3(rx, 0.52, 0.46),
      new THREE.Vector3(rx, EXH_Y, EXH_Z),
    ]), 8, 0.038, 10, false), castIron);
    // Port flange pads on the head
    add(new THREE.BoxGeometry(0.12, 0.11, 0.02), castIron, { pos: [rx, 0.44, 0.365] });
  }
  // Outlet elbow: down from the log onto the turbo inlet flange
  // (flange top y ≈ 0.485, centered x 0.33, z 0.52 — nuts sit on it)
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.33, EXH_Y + 0.02, EXH_Z),
    new THREE.Vector3(0.33, 0.55, EXH_Z),
    new THREE.Vector3(0.33, 0.50, EXH_Z),
  ]), 8, 0.055, 10, false), castIron);
  tick();

  // ══════════════════════════════════════
  // 9. OIL FILTERS (2 full-flow + 1 bypass, spin-on)
  // RIGHT side (+z) with the turbo & starter — QRG right-side view p.121
  // items 11/12. Fuel filters are the ones on the LEFT (p.123 #7/#7A).
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
  // 10. ALTERNATOR — pad-mount on the LEFT side (QRG left-side view #8;
  // it was sitting on the turbo side before)
  // ══════════════════════════════════════
  add(new THREE.CylinderGeometry(0.105, 0.105, 0.2, 20), M.darkMetal, { pos: [-0.48, -0.17, -0.37], rot: [0, 0, Math.PI / 2] });
  // Pulley face + boss nut spin with their own belt path — kept as a group
  // so rotation.x on the group turns just these two, not the stationary
  // case behind them (mechanism-kinematics: alternator spins faster than
  // the crank, typical pulley ratio ~2.5–3:1, applied in the animate loop).
  const alternatorPulley = new THREE.Group();
  alternatorPulley.position.set(-0.37, -0.17, -0.37);
  group.add(alternatorPulley);
  add(new THREE.CylinderGeometry(0.106, 0.106, 0.02, 20), M.chrome, { pos: [0, 0, 0], rot: [0, 0, Math.PI / 2], parent: alternatorPulley });
  add(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12), M.chrome, { pos: [0.01, 0, 0], rot: [0, 0, Math.PI / 2], parent: alternatorPulley });
  group.userData.alternatorPulley = alternatorPulley;
  tick();

  // ══════════════════════════════════════
  // 11. FRONT ACCESSORY DRIVE — pulleys and serpentine belt live on the
  // FRONT FACE of the engine, wrapping the crank damper (they were
  // pasted flat on the right-side wall before)
  // ══════════════════════════════════════
  const FED_X = 1.26; // just in front of the timing cover / damper face
  const pulleyData = [
    { pos: [FED_X, 0.34, 0.16] as [number,number,number], r: 0.075 },  // upper idler
    { pos: [FED_X, 0.30, -0.22] as [number,number,number], r: 0.09 },  // refrigerant compressor
    { pos: [FED_X, -0.02, -0.34] as [number,number,number], r: 0.055 }, // belt tensioner
    { pos: [FED_X, -0.40, -0.10] as [number,number,number], r: 0.065 }, // lower idler
  ];
  // Each pulley is its own group (chrome face + darkMetal hub as children at
  // local origin) so rotation.x on the group spins the pulley about its own
  // axle — collected on the engine group's userData for the animate loop
  // (mechanism-kinematics: these all turn together, driven off the crank).
  const accessoryPulleys: THREE.Group[] = [];
  pulleyData.forEach(p => {
    const pg = new THREE.Group();
    pg.position.set(...p.pos);
    group.add(pg);
    add(new THREE.CylinderGeometry(p.r, p.r, 0.055, 20), M.chrome, { pos: [0, 0, 0], rot: [0, 0, Math.PI / 2], parent: pg });
    add(new THREE.CylinderGeometry(p.r * 0.45, p.r * 0.45, 0.06, 14), M.darkMetal, { pos: [0, 0, 0], rot: [0, 0, Math.PI / 2], parent: pg });
    accessoryPulleys.push(pg);
  });
  group.userData.accessoryPulleys = accessoryPulleys;
  tick();

  // Serpentine belt: a loop in the y–z plane around the pulleys and the
  // crank damper (damper center y −0.06, z 0, r ≈ 0.155)
  const beltPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(FED_X, 0.415, 0.16),   // over upper idler
    new THREE.Vector3(FED_X, 0.39, -0.22),   // over compressor
    new THREE.Vector3(FED_X, -0.02, -0.40),  // around tensioner
    new THREE.Vector3(FED_X, -0.465, -0.10), // under lower idler
    new THREE.Vector3(FED_X, -0.215, 0.05),  // under crank damper
    new THREE.Vector3(FED_X, -0.03, 0.155),  // up the damper's right side
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

  // Starter motor — Delco-Remy/Bosch-style heavy-duty DC starter with a
  // separate solenoid, low on the block near the alternator. Modeled from
  // the standalone D13 crate-engine photos docs/reference/
  // d13-engine-stock-crate-front.png, -crate-front-2.png and -busride.png,
  // which all show the same recognizable silhouette: a cylindrical motor
  // body, a smaller parallel solenoid can offset above/forward of it, and
  // a wider mounting flange/nose where it bolts to the bell housing. No
  // dedicated close-up of just the starter exists yet, so the body/solenoid
  // length-diameter ratios below carry over from the prior block-out
  // rather than a fresh anchor measurement — medium confidence; a close-up
  // photo would let this go through a full render-reference-diff pass.
  // Bell housing is at the engine's rear (−x, per the fan/damper-end (+x)
  // note above), so the mounting flange sits at the body's −x tip.
  const starter = new THREE.Group();
  starter.name = 'engine-starter';
  group.add(starter);
  // Mounting flange (drive-end nose that bolts to the bell housing)
  add(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16), M.brushedMetal, { pos: [-1.08, -0.52, -0.22], rot: [0, 0, Math.PI / 2], parent: starter });
  // Main DC motor body (commutator end, cast housing)
  add(new THREE.CylinderGeometry(0.072, 0.076, 0.3, 14), M.black, { pos: [-0.95, -0.52, -0.22], rot: [0, 0, Math.PI / 2], parent: starter });
  // Solenoid can, mounted parallel above/forward of the motor body
  add(new THREE.CylinderGeometry(0.042, 0.042, 0.15, 10), M.black, { pos: [-0.88, -0.38, -0.22], parent: starter });
  // Shift-fork linkage bridging the solenoid plunger to the motor body
  add(new THREE.BoxGeometry(0.03, 0.05, 0.03), M.darkMetal, { pos: [-0.915, -0.45, -0.22], parent: starter });
  // Battery-cable terminal stud on the solenoid's outer end
  add(new THREE.CylinderGeometry(0.012, 0.012, 0.04, 8), M.chrome, { pos: [-0.88, -0.32, -0.15], rot: [Math.PI / 2, 0, 0], parent: starter });
  // Pinion gear — rest position flush just past the flange; slides further
  // −x (toward the flywheel ring gear inside the bell housing) and spins
  // briefly on every start, then retracts once the engine catches (see the
  // setSlide('engine-starter-pinion', …) effect + starterCranking handling
  // in the animate loop — mechanism-kinematics one-shot gear-driven category).
  const pinion = add(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 12), M.darkMetal, { pos: [-1.1, -0.52, -0.22], rot: [0, 0, Math.PI / 2], parent: starter });
  pinion.name = 'engine-starter-pinion';

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

  /** WABCO twin-cylinder brake air compressor — modeled from the part
   *  photo docs/reference/air-compressor/wabco-photo.webp and the exploded
   *  blueprint docs/reference/air-compressor/wabco-exploded.jpg.
   *  Recognition features from the photo: Volvo-green rounded crankcase
   *  lobes, flat side cover plates on the cylinder block band, green head
   *  with the inlet elbow / chrome unloader fitting / lifting eye, and a
   *  machined rear flange carrying the black helical drive gear + hex nut.
   *  Local frame: crank axis along X, drive gear at −X, cylinders up.
   *  ~0.33 units tall ≈ 215 mm real. Reused for the engine-mounted unit
   *  and the replacement unit at the toolbox.
   *  Returns the drive-gear hub/teeth/nut as their own sub-group (`driveGear`)
   *  separate from the rest of the casing, so the engine-mounted instance can
   *  spin just that assembly (gear-driven off the timing train, 1:1 with the
   *  crank — mechanism-kinematics) without rotating the stationary housing. */
  const buildWabcoCompressor = (): { group: THREE.Group; driveGear: THREE.Group } => {
    const c = new THREE.Group();
    // Rounded crankcase: two merged lobes (photo shows the waisted casting)
    add(new THREE.CylinderGeometry(0.062, 0.062, 0.17, 18), M.teal, { pos: [0, 0, 0], rot: [0, 0, Math.PI / 2], parent: c });
    add(new THREE.CylinderGeometry(0.055, 0.055, 0.16, 18), M.teal, { pos: [0.01, 0.03, 0], rot: [0, 0, Math.PI / 2], parent: c });
    // Twin cylinder barrels rising off the case
    add(new THREE.BoxGeometry(0.17, 0.09, 0.12), M.teal, { pos: [0.005, 0.09, 0], parent: c });
    // Cylinder block band with flat side cover plates
    add(new THREE.BoxGeometry(0.18, 0.055, 0.13), M.darkTeal, { pos: [0.005, 0.16, 0], parent: c });
    add(new THREE.BoxGeometry(0.10, 0.04, 0.006), M.teal, { pos: [0.005, 0.16, 0.069], shadow: false, parent: c });
    add(new THREE.BoxGeometry(0.10, 0.04, 0.006), M.teal, { pos: [0.005, 0.16, -0.069], shadow: false, parent: c });
    // Head: green casting with a stepped darker top plate
    add(new THREE.BoxGeometry(0.19, 0.05, 0.14), M.teal, { pos: [0.005, 0.21, 0], parent: c });
    add(new THREE.BoxGeometry(0.16, 0.03, 0.12), M.darkTeal, { pos: [0.005, 0.245, 0], parent: c });
    // Head hardware per the photo: inlet elbow, chrome unloader fitting,
    // lifting eye, coolant port stub
    add(new THREE.CylinderGeometry(0.018, 0.018, 0.06, 10), M.darkMetal, { pos: [0.08, 0.25, 0.03], rot: [Math.PI / 2, 0, 0], shadow: false, parent: c });
    add(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 10), M.chrome, { pos: [-0.07, 0.26, -0.02], shadow: false, parent: c });
    add(new THREE.TorusGeometry(0.022, 0.007, 8, 16), M.teal, { pos: [0, 0.275, 0], shadow: false, parent: c });
    add(new THREE.CylinderGeometry(0.014, 0.014, 0.05, 8), M.brushedMetal, { pos: [-0.04, 0.24, 0.055], rot: [Math.PI / 2, 0, 0], shadow: false, parent: c });
    // Machined rear mounting flange — bolted to the timing cover, stationary.
    add(new THREE.CylinderGeometry(0.08, 0.08, 0.025, 24), M.brushedMetal, { pos: [-0.095, 0, 0], rot: [0, 0, Math.PI / 2], parent: c });
    // Black helical drive gear + hex nut — this is the part that actually
    // spins with the timing train; grouped so it can rotate independently
    // of the flange/casing above.
    const driveGear = new THREE.Group();
    driveGear.position.set(-0.125, 0, 0);
    c.add(driveGear);
    add(new THREE.CylinderGeometry(0.068, 0.068, 0.03, 24), M.darkMetal, { pos: [0, 0, 0], rot: [0, 0, Math.PI / 2], parent: driveGear });
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      add(new THREE.BoxGeometry(0.02, 0.014, 0.03), M.darkMetal,
        { pos: [0, 0.072 * Math.cos(a), 0.072 * Math.sin(a)], rot: [a, 0.2, 0], shadow: false, parent: driveGear });
    }
    add(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 6), M.black, { pos: [-0.023, 0, 0], rot: [0, 0, Math.PI / 2], parent: driveGear });
    // Front end cover
    add(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 18), M.teal, { pos: [0.095, 0, 0], rot: [0, 0, Math.PI / 2], parent: c });
    return { group: c, driveGear };
  };

  // Brake air compressor — WABCO twin-cylinder on the LEFT side at the
  // flywheel end, drive gear facing the rear gear train (it used to be two
  // bare cylinders floating at the front).
  const { group: engineCompressor, driveGear: compressorDriveGear } = buildWabcoCompressor();
  engineCompressor.name = 'air-compressor';
  engineCompressor.position.set(-0.90, -0.02, -0.46);
  group.add(engineCompressor);
  group.userData.compressorCoupling = compressorDriveGear;
  tick();

  // Fuel filters — on the LEFT side of the engine per QRG left-side view
  // p.123 (#7 secondary 20972293, #7A primary 20879806), with the air
  // compressor / alternator / ECM. They hang off a shared fuel filter
  // housing; the oil filters stay on the RIGHT side with the turbo (p.121).
  // (The old model had one fuel filter pasted on the oil-filter side.)
  const FUEL_Z = -0.43;
  // Fuel filter housing on the block face, with head ports
  add(new THREE.BoxGeometry(0.4, 0.16, 0.1), M.brushedMetal, { pos: [0.42, -0.16, -0.39] });
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8), M.darkMetal, { pos: [0.42, -0.08, -0.4], rot: [Math.PI / 2, 0, 0] });
  // Secondary fuel filter (smaller spin-on)
  add(new THREE.CylinderGeometry(0.054, 0.054, 0.18, 16), M.white, { pos: [0.3, -0.34, FUEL_Z] });
  add(new THREE.CylinderGeometry(0.058, 0.058, 0.035, 16), M.darkMetal, { pos: [0.3, -0.245, FUEL_Z] });
  // Primary fuel filter / water separator with clear sight bowl + drain
  add(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 16), M.white, { pos: [0.56, -0.36, FUEL_Z] });
  add(new THREE.CylinderGeometry(0.064, 0.064, 0.035, 16), M.darkMetal, { pos: [0.56, -0.255, FUEL_Z] });
  add(
    new THREE.CylinderGeometry(0.058, 0.058, 0.06, 16),
    new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.5, roughness: 0.1 }),
    { pos: [0.56, -0.49, FUEL_Z] },
  );
  add(new THREE.CylinderGeometry(0.014, 0.014, 0.04, 10), M.darkMetal, { pos: [0.56, -0.54, FUEL_Z] });
  // Fuel lines from the housing over to the low-pressure pump area
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.62, -0.16, -0.4),
    new THREE.Vector3(0.75, -0.2, -0.34),
    new THREE.Vector3(0.85, -0.26, -0.3),
  ]), 10, 0.012, 6, false), M.darkMetal, { shadow: false });
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
  // Gloss-black lower body/rocker plastic — the two-tone split clearly
  // visible in docs/reference/truck/04-exterior-side-profile-driver.png
  // (white cab above the beltline, glossy black rocker/skirt fairing below
  // it, running the full length from the front wheel back past the fuel
  // tank). Distinct from grilleDark (matte, used for vents/recesses).
  const lowerBody = new THREE.MeshStandardMaterial({ color: 0x0d0d10, metalness: 0.35, roughness: 0.4 });

  const truckBody = new THREE.Group();
  truckBody.name = 'truck-cab';
  // The truck is turned 180° around the engine so the engine sits in it the
  // right way: fan/damper end (+x) under the nose, bell housing toward the
  // cab. That puts the turbo/exhaust/oil-filter side (+z, engine RIGHT) on
  // the passenger side and the fuel-filter/ECM/alternator side (−z, engine
  // LEFT) at the driver door — matching a real VNL. Rotating the truck
  // instead of the engine keeps every engine/hotspot/tray coordinate valid.
  truckBody.rotation.y = Math.PI;
  group.add(truckBody);
  // Dev flag: ?bare=1 hides the truck so the engine can be inspected /
  // screenshot directly (used by the reference-photo verification script)
  if (typeof window !== 'undefined' && window.location.search.includes('bare')) truckBody.visible = false;

  // Frame rails + crossmembers
  [-0.42, 0.42].forEach(rz => {
    add(new THREE.BoxGeometry(6.2, 0.12, 0.1), M.darkMetal, { pos: [0.45, -0.62, rz], parent: truckBody });
  });
  [-2.2, 0, 2.2].forEach(rx => {
    add(new THREE.BoxGeometry(0.08, 0.1, 0.86), M.darkMetal, { pos: [rx, -0.62, 0], parent: truckBody });
  });
  // Wheels (front steer + rear duals) with chrome hubs. The "duals" half of
  // that comment was aspirational until now — docs/reference/truck/
  // 08-rear-tandem-axle-top.png and 09-rear-tandem-fifthwheel-2.png both
  // show two tires per hub on the drive axles; the front steer axle stays
  // single, as on the real truck.
  const wheelAt = (wx: number, wz: number) => {
    add(new THREE.CylinderGeometry(0.5, 0.5, 0.28, 24), M.rubber, { pos: [wx, -0.6, wz], rot: [Math.PI / 2, 0, 0], parent: truckBody });
    add(new THREE.CylinderGeometry(0.22, 0.22, 0.29, 16), M.chrome, { pos: [wx, -0.6, wz], rot: [Math.PI / 2, 0, 0], parent: truckBody });
  };
  // Outer tire sits 0.30 further out than the inner (tire width 0.28 + a
  // ~0.02 gap, same tire-width anchor as the single-wheel geometry above).
  const dualWheelAt = (wx: number, wz: number) => {
    const outward = wz > 0 ? 1 : -1;
    wheelAt(wx, wz);
    wheelAt(wx, wz + outward * 0.30);
  };
  [[-1.5, 0.75], [-1.5, -0.75]].forEach(([wx, wz]) => wheelAt(wx, wz));
  [[2.4, 0.78], [2.4, -0.78], [3.3, 0.78], [3.3, -0.78]].forEach(([wx, wz]) => dualWheelAt(wx, wz));

  // Tandem rear suspension + interaxle driveline, per docs/reference/truck/
  // 08-rear-tandem-axle-top.png and 09-rear-tandem-fifthwheel-2.png: two
  // driven axles linked by a short interaxle shaft off the forward axle's
  // differential, walking-beam arms tying each axle to the frame, and air
  // springs riding on the beams above each hub. (No shaft running further
  // forward to the transmission — that would have to cross from truckBody's
  // rotated local frame into the engine's own top-level `group` frame, which
  // isn't worth the coordinate risk for a driveline part that's mostly
  // hidden behind the wheels anyway.)
  const AXLE1_X = 2.4, AXLE2_X = 3.3;
  [AXLE1_X, AXLE2_X].forEach(ax => {
    add(new THREE.CylinderGeometry(0.045, 0.045, 1.62, 12), M.darkMetal, { pos: [ax, -0.64, 0], rot: [Math.PI / 2, 0, 0], parent: truckBody });
    add(new THREE.SphereGeometry(0.11, 14, 12), M.darkMetal, { pos: [ax, -0.64, 0], parent: truckBody });
  });
  add(new THREE.CylinderGeometry(0.035, 0.035, AXLE2_X - AXLE1_X - 0.22, 10), M.brushedMetal,
    { pos: [(AXLE1_X + AXLE2_X) / 2, -0.64, 0], rot: [0, 0, Math.PI / 2], parent: truckBody });
  [0.78, -0.78].forEach(z => {
    add(new THREE.BoxGeometry(AXLE2_X - AXLE1_X + 0.3, 0.06, 0.05), M.black, { pos: [(AXLE1_X + AXLE2_X) / 2, -0.7, z], parent: truckBody });
    [AXLE1_X, AXLE2_X].forEach(ax => {
      add(new THREE.CylinderGeometry(0.09, 0.1, 0.22, 14), M.black, { pos: [ax, -0.52, z], parent: truckBody });
    });
  });

  // Fifth wheel — bolted to a support frame above the rails, just ahead of
  // the forward tandem axle (fixed-mount; real sliders can move but this rig
  // doesn't need that). Photo 06/09 anchor: greasy worn-steel casting, plate
  // diameter roughly matching the frame rail spacing (rails at z ±0.42
  // above), kingpin throat opening toward the cab (−x, per this file's
  // truck-is-rotated-180° convention).
  const fifthWheel = new THREE.Group();
  fifthWheel.name = 'truck-fifthwheel';
  fifthWheel.position.set(2.1, -0.42, 0);
  truckBody.add(fifthWheel);
  add(new THREE.CylinderGeometry(0.46, 0.46, 0.06, 20), M.darkMetal, { pos: [0, 0, 0], rot: [Math.PI / 2, 0, 0], parent: fifthWheel });
  add(new THREE.BoxGeometry(0.16, 0.05, 0.3), M.darkMetal, { pos: [-0.4, 0, 0], parent: fifthWheel });
  add(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 10), M.brushedMetal, { pos: [-0.05, 0.05, 0], parent: fifthWheel });
  [0.42, -0.42].forEach(z => {
    add(new THREE.BoxGeometry(0.06, 0.24, 0.06), M.darkMetal, { pos: [2.05, -0.5, z], rot: [0.5, 0, 0], parent: truckBody });
  });

  // Rear crossmember, mud flaps, and marker-light bar — the very back of the
  // frame, per docs/reference/truck/05-exterior-rear.png (three-light bar
  // centered above the flaps: red-white-red; black flaps with a chrome trim
  // strip; a grab handle on the cab's back wall above the fifth wheel).
  add(new THREE.BoxGeometry(0.1, 0.08, 1.8), M.darkMetal, { pos: [3.5, -0.62, 0], parent: truckBody });
  [0.5, 0, -0.5].forEach((z, i) => {
    add(new THREE.BoxGeometry(0.03, 0.05, 0.16), i === 1 ? M.white : M.red, { pos: [3.56, -0.62, z], shadow: false, parent: truckBody });
  });
  [0.78, -0.78].forEach(z => {
    add(new THREE.BoxGeometry(0.02, 0.34, 0.26), M.black, { pos: [3.48, -0.86, z], parent: truckBody });
    add(new THREE.BoxGeometry(0.03, 0.04, 0.26), M.chrome, { pos: [3.48, -0.7, z], shadow: false, parent: truckBody });
  });
  add(new THREE.TorusGeometry(0.02, 0.008, 6, 12, Math.PI), M.chrome, { pos: [3.66, -0.1, 0], rot: [0, 0, Math.PI / 2], shadow: false, parent: truckBody });
  tick();
  // Cab shell + sleeper (VNL 860 tall roof). Cab floor stops at y 0.28 —
  // above the I-Shift (tops out ~0.22) so the transmission hangs visibly
  // under the cab like the real truck instead of being engulfed by it.
  add(new THREE.BoxGeometry(2.2, 1.22, 1.7), paint, { pos: [2.55, 0.89, 0], parent: truckBody });
  add(new THREE.BoxGeometry(2.0, 0.85, 1.6), paint, { pos: [2.65, 1.85, 0], rot: [0, 0, 0.06], parent: truckBody });
  // Windshield + side glass
  add(new THREE.BoxGeometry(0.06, 0.75, 1.5), glass, { pos: [1.48, 1.05, 0], rot: [0, 0, -0.12], parent: truckBody });
  add(new THREE.BoxGeometry(0.7, 0.45, 0.04), glass, { pos: [2.9, 1.05, 0.86], parent: truckBody });
  add(new THREE.BoxGeometry(0.7, 0.45, 0.04), glass, { pos: [2.9, 1.05, -0.86], parent: truckBody });
  // Two-tone lower body: gloss-black rocker/skirt fairing under the cab,
  // running back past the fuel tank (docs/reference/truck/
  // 04-exterior-side-profile-driver.png — split sits right at the door
  // sill). Thin skin panels flush with the cab's side faces (z ±0.85 —
  // see the cab BoxGeometry(2.2,1.22,1.7) above), not a solid underbody.
  [0.86, -0.86].forEach(z => {
    add(new THREE.BoxGeometry(2.3, 0.42, 0.04), lowerBody, { pos: [2.5, -0.33, z], parent: truckBody });
  });

  // ── Cab interior — dash, wheel, seats, and the full sleeper. Previously
  // this was exterior-only ("interior controls modeled in the cab overlay
  // from the dash photos; exterior is a recognizable VNL shape" — the 2D
  // cab-overlay screen has no 3D counterpart behind the glass). Built from
  // docs/reference/truck/15,20,21 (dash/wheel/seats — the overlay's air/
  // parking-brake knob layout already matches these, so the same photos
  // anchor the 3D dash) and 16-19 (sleeper: bunk, nightstand, overhead bins,
  // folding ladder, fridge, climate panel).
  const cabinTan = new THREE.MeshStandardMaterial({ color: 0xcabca6, metalness: 0, roughness: 0.85 }); // headliner/door-card beige, photos 16-20
  const dashDark = new THREE.MeshStandardMaterial({ color: 0x232427, metalness: 0.1, roughness: 0.6 }); // dash/console charcoal plastic, photo 15/21
  const seatFabric = new THREE.MeshStandardMaterial({ color: 0x5f584f, metalness: 0, roughness: 0.95 }); // gray-brown tweed, photo 15/20

  // Dash — swept panel behind the windshield (x 1.48), full cab width
  add(new THREE.BoxGeometry(0.22, 0.34, 1.66), dashDark, { pos: [1.58, 0.48, 0], parent: truckBody });
  add(new THREE.BoxGeometry(0.3, 0.05, 1.66), dashDark, { pos: [1.52, 0.66, 0], rot: [0, 0, -0.08], parent: truckBody }); // sloped top shelf toward the glass
  add(new THREE.BoxGeometry(0.16, 0.16, 0.5), dashDark, { pos: [1.66, 0.5, -0.1], parent: truckBody }); // center stack (radio/climate, photo 21)
  // Steering column + wheel, driver side (+z, matches the door above)
  add(new THREE.CylinderGeometry(0.025, 0.03, 0.35, 10), dashDark, { pos: [1.62, 0.58, 0.5], rot: [0, 0, Math.PI / 2.6], parent: truckBody });
  add(new THREE.TorusGeometry(0.16, 0.02, 10, 20), M.black, { pos: [1.5, 0.72, 0.5], rot: [1.15, 0, 0], parent: truckBody });
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 12), M.chrome, { pos: [1.5, 0.72, 0.5], rot: [1.15, 0, 0], shadow: false, parent: truckBody });
  // Two pedestal seats (photo 15/20: driver +z, passenger −z)
  [0.5, -0.5].forEach(z => {
    add(new THREE.CylinderGeometry(0.09, 0.12, 0.22, 12), dashDark, { pos: [1.95, 0.4, z], parent: truckBody }); // pedestal
    add(new THREE.BoxGeometry(0.44, 0.08, 0.42), seatFabric, { pos: [1.95, 0.52, z], parent: truckBody }); // cushion
    add(new THREE.BoxGeometry(0.4, 0.5, 0.4), seatFabric, { pos: [1.78, 0.78, z], rot: [0, 0, 0.1], parent: truckBody }); // seatback
    add(new THREE.BoxGeometry(0.32, 0.12, 0.3), seatFabric, { pos: [1.68, 1.06, z], rot: [0, 0, 0.1], parent: truckBody }); // headrest
  });
  add(new THREE.BoxGeometry(0.2, 0.28, 0.22), dashDark, { pos: [1.82, 0.5, 0], parent: truckBody }); // center console between seats

  // Sleeper compartment (x 2.35–3.55, under the raised high-roof section)
  add(new THREE.BoxGeometry(0.65, 0.28, 1.5), cabinTan, { pos: [3.2, 0.42, 0], parent: truckBody }); // bunk base/storage
  add(new THREE.BoxGeometry(0.65, 0.06, 1.5), M.white, { pos: [3.2, 0.59, 0], parent: truckBody }); // mattress
  // Rounded nightstand/side console at the head of the bunk, driver side (photo 16)
  add(new THREE.CylinderGeometry(0.16, 0.18, 0.5, 16), cabinTan, { pos: [2.7, 0.53, 0.62], parent: truckBody });
  add(new THREE.BoxGeometry(0.02, 0.1, 0.14), dashDark, { pos: [2.62, 0.6, 0.62], shadow: false, parent: truckBody }); // drawer face
  // Overhead storage bins, both sides, under the high-roof section (photo 17/19)
  [0.7, -0.7].forEach(z => {
    add(new THREE.BoxGeometry(0.9, 0.28, 0.32), cabinTan, { pos: [2.95, 1.72, z], parent: truckBody });
    add(new THREE.BoxGeometry(0.9, 0.03, 0.32), dashDark, { pos: [2.95, 1.58, z], shadow: false, parent: truckBody }); // fold-down door lip
  });
  // Folding ladder, stowed flat against the ceiling (photo 17/19)
  add(new THREE.BoxGeometry(0.55, 0.03, 0.32), M.brushedMetal, { pos: [2.9, 1.9, -0.28], parent: truckBody });
  for (let i = 0; i < 5; i++) {
    add(new THREE.BoxGeometry(0.02, 0.032, 0.32), M.darkMetal, { pos: [2.68 + i * 0.11, 1.9, -0.28], shadow: false, parent: truckBody }); // rungs
  }
  // Mini-fridge at the foot of the bunk, passenger side (photo 18)
  add(new THREE.BoxGeometry(0.34, 0.42, 0.34), M.white, { pos: [3.35, 0.48, -0.62], parent: truckBody });
  add(new THREE.BoxGeometry(0.34, 0.04, 0.34), M.black, { pos: [3.35, 0.7, -0.62], shadow: false, parent: truckBody }); // lid trim
  // Climate control panel on the driver-side wall (photo 18)
  add(new THREE.BoxGeometry(0.03, 0.16, 0.22), dashDark, { pos: [3.63, 0.9, 0.6], shadow: false, parent: truckBody });
  [0.05, -0.05].forEach(dz => {
    add(new THREE.CylinderGeometry(0.025, 0.025, 0.015, 12), M.black, { pos: [3.645, 0.9, 0.6 + dz], rot: [0, 0, Math.PI / 2], shadow: false, parent: truckBody });
  });

  // Mirrors, steps, fuel tank, exhaust stack
  // Aero mirror assemblies (photo 01/04: body-color housing on a dark arm,
  // roughly 0.4x the door-glass height per photo 01) — arm off the A-pillar,
  // body-color housing with a dark glass insert facing the door, plus the
  // small round convex spotter mirror mounted underneath.
  [1, -1].forEach(s => {
    const arm = new THREE.Group();
    arm.position.set(1.55, 1.28, s * 0.86);
    truckBody.add(arm);
    add(new THREE.BoxGeometry(0.05, 0.06, 0.22), M.darkMetal, { pos: [0, 0, s * 0.11], parent: arm });
    add(new THREE.BoxGeometry(0.1, 0.32, 0.2), paint, { pos: [0, -0.16, s * 0.24], parent: arm });
    add(new THREE.BoxGeometry(0.06, 0.24, 0.16), M.darkMetal, { pos: [-0.04, -0.16, s * 0.2], parent: arm });
    add(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12), M.chrome, { pos: [-0.02, -0.34, s * 0.24], rot: [Math.PI / 2, 0, 0], parent: arm });
  });
  add(new THREE.BoxGeometry(0.5, 0.05, 0.3), M.brushedMetal, { pos: [2.0, -0.55, 0.95], parent: truckBody });
  add(new THREE.BoxGeometry(0.5, 0.05, 0.3), M.brushedMetal, { pos: [2.0, -0.9, 0.95], parent: truckBody });
  add(new THREE.CylinderGeometry(0.26, 0.26, 1.1, 18), M.chrome, { pos: [2.75, -0.75, 0.85], rot: [0, 0, Math.PI / 2], parent: truckBody });
  add(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 12), M.chrome, { pos: [3.68, 1.1, 0.8], parent: truckBody });

  // Driver door (hinged at its front edge; needs the key)
  const door = new THREE.Group();
  door.name = 'truck-door';
  door.position.set(1.68, 0.35, 0.86);
  truckBody.add(door);
  // Door bottom flush with the raised cab floor (y 0.28 truck-local)
  add(new THREE.BoxGeometry(0.85, 0.95, 0.06), paint, { pos: [0.45, 0.40, 0], parent: door });
  add(new THREE.BoxGeometry(0.7, 0.5, 0.04), glass, { pos: [0.45, 0.75, 0.01], parent: door });
  add(new THREE.BoxGeometry(0.14, 0.035, 0.05), grilleDark, { pos: [0.75, 0.05, 0.05], parent: door });

  // Hood — tilts FORWARD like the real VNL, pivot at the front bumper
  const hood = new THREE.Group();
  hood.name = 'truck-hood';
  hood.position.set(-2.3, -0.45, 0);
  truckBody.add(hood);
  // top panel (sloped down toward the nose) + side panels + fender arches
  add(new THREE.BoxGeometry(3.75, 0.07, 1.5), paint, { pos: [1.85, 1.42, 0], rot: [0, 0, 0.09], parent: hood });
  // Hood power-dome / center character line (photo 01: subtle raised ridge
  // running down the hood's centerline, most visible in the 3/4 shot).
  add(new THREE.BoxGeometry(2.1, 0.03, 0.24), paint, { pos: [1.3, 1.465, 0], rot: [0, 0, 0.09], parent: hood });
  add(new THREE.BoxGeometry(3.75, 0.95, 0.06), paint, { pos: [1.85, 0.85, 0.74], rot: [0, 0.0, 0.02], parent: hood });
  add(new THREE.BoxGeometry(3.75, 0.95, 0.06), paint, { pos: [1.85, 0.85, -0.74], rot: [0, 0, 0.02], parent: hood });
  add(new THREE.BoxGeometry(1.3, 0.12, 0.34), paint, { pos: [0.85, 0.42, 0.78], parent: hood });
  add(new THREE.BoxGeometry(1.3, 0.12, 0.34), paint, { pos: [0.85, 0.42, -0.78], parent: hood });

  // Nose — reworked from a single flat face to a 3-panel taper matching the
  // pointed "bug nose" silhouette in docs/reference/truck/
  // 01-exterior-front-3q.png and 02-exterior-front-straight-on.png: wide at
  // the headlight line, narrowing and receding toward a pointed black chin
  // at the bumper (ratios measured against the hood width anchor, 1.46
  // units full-width at the fender arches per the box above).
  add(new THREE.BoxGeometry(0.1, 0.5, 1.46), paint, { pos: [0.08, 1.18, 0], parent: hood });        // upper face, full width
  add(new THREE.BoxGeometry(0.18, 0.42, 1.28), paint, { pos: [0.18, 0.78, 0], parent: hood });       // mid face, receded + narrower
  add(new THREE.BoxGeometry(0.28, 0.32, 0.92), lowerBody, { pos: [0.32, 0.44, 0], parent: hood });    // lower chin, receded + narrower, gloss black like the real bumper's lower valance
  add(new THREE.BoxGeometry(0.34, 0.24, 0.66), lowerBody, { pos: [0.42, 0.16, 0], parent: hood });    // bumper valance, further tucked under

  // Grille insert — single dark panel across the mid face (not slats: the
  // real grille reads as one large mesh insert), plus the chrome diagonal
  // bar that's the VNL's signature front-end accent.
  add(new THREE.BoxGeometry(0.03, 0.36, 1.1), grilleDark, { pos: [0.19, 0.8, 0], parent: hood });
  add(new THREE.BoxGeometry(0.02, 1.05, 0.12), M.chrome, { pos: [0.185, 0.8, 0], rot: [0, 0, 0.55], shadow: false, parent: hood });

  // Headlight pods — round units at the mid-face outer corners (photo 01:
  // roughly mid-height, well above the bumper), with an amber DRL strip
  // running below them near the top of the valance.
  [1, -1].forEach(s => {
    add(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 20), M.white, { pos: [0.16, 0.9, s * 0.63], rot: [0, 0, Math.PI / 2], shadow: false, parent: hood });
    add(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16), M.chrome, { pos: [0.14, 0.9, s * 0.63], rot: [0, 0, Math.PI / 2], shadow: false, parent: hood });
    add(new THREE.BoxGeometry(0.04, 0.05, 0.3), M.orange, { pos: [0.29, 0.58, s * 0.6], shadow: false, parent: hood });
    // Round fog light, inset in the lower bumper valance
    add(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 14), M.darkMetal, { pos: [0.44, 0.16, s * 0.42], rot: [0, 0, Math.PI / 2], shadow: false, parent: hood });
  });

  // Small hood-mounted convex spotter mirror (white, body-color shell) —
  // visible low on the fender in photo 01, used for curbing the front wheel.
  add(new THREE.SphereGeometry(0.045, 12, 10), M.white, { pos: [0.85, 0.55, 0.72], parent: hood });
  tick();

  // Radiator — sits behind the grille, ahead of the engine-mounted viscous
  // fan. Position derived from this file's own coordinate note above
  // ("truck is turned 180° ... fan/damper end (+x) under the nose"): with
  // truckBody rotated 180° about Y, a point at hood-local x has world x =
  // 2.3 − x (hood.position.x is −2.3). The engine's fan sits at world x ≈
  // 1.3–1.5 (FED_X = 1.26 plus the fan stack), the grille frame is at
  // hood-local x = 0.1 (world x ≈ 2.2). Local x = 0.45 (world x ≈ 1.85)
  // puts the radiator core in the gap between them. Not yet confirmed by
  // an actual render screenshot — no headless browser was available in
  // this pass, so treat this placement as reasoned-but-unverified until a
  // render-reference-diff pass (or the dev server) confirms it.
  add(new THREE.BoxGeometry(0.08, 1.05, 1.3), M.darkMetal, { pos: [0.45, 0.85, 0], parent: hood });
  // Core fin ribbing — thin horizontal brushed-metal bands across the face
  // so the core reads as finned rather than a flat slab (visible texture in
  // docs/reference/truck/11-engine-bay-steer-axle.png and
  // 12-engine-bay-hood-open.png, though neither is a clean straight-on shot
  // of the core itself — spacing here is reasoned, not photo-measured).
  for (let i = 0; i < 9; i++) {
    add(new THREE.BoxGeometry(0.005, 0.02, 1.28), M.brushedMetal, { pos: [0.495, 0.42 + i * 0.11, 0], shadow: false, parent: hood });
  }
  // Top and bottom plastic tanks
  add(new THREE.BoxGeometry(0.1, 0.1, 1.34), M.black, { pos: [0.45, 1.38, 0], parent: hood });
  add(new THREE.BoxGeometry(0.1, 0.1, 1.34), M.black, { pos: [0.45, 0.32, 0], parent: hood });
  // Fan shroud ring, just behind the core, facing the engine's viscous fan
  add(new THREE.TorusGeometry(0.42, 0.035, 10, 20), M.black, { pos: [0.62, 0.85, 0], rot: [0, Math.PI / 2, 0], parent: hood });
  tick();

  // ══════════════════════════════════════
  // 17. TOOLBOX — Snap-on "MR. BIG" wall, rebuilt to the proportions
  // measured off docs/reference/toolbox-snapon-reference.png (scale basis:
  // the two mechanics in frame ≈ 70in tall → wall ≈ 216in wide, 88in tall,
  // 24in deep; counter at 43in hits them mid-torso like the photo).
  // Layout left→right: tall locker · drawer bay A · drawer bay B ·
  // stacked bay C with the big "MR. BIG" bottom drawer · double-door locker.
  // Six drawers stay functional (names `toolbox-drawer-<key>` map 1:1 to
  // ToolPanel's CATEGORY_TOOLS and slide via userData.slides); the rest of
  // the ~40 drawer faces are facade (`toolbox-facade`, click-inert).
  // Scale basis: wheel Ø = 1.0 scene unit ≈ 43in, dims are inches × IN.
  // ══════════════════════════════════════
  const IN = 1 / 43;
  const toolbox = new THREE.Group();
  toolbox.name = 'toolbox-chest';
  toolbox.position.set(-0.35, -1.1, -7.5); // pushed 3x deeper along the back of the shop, facing the truck
  group.add(toolbox);

  // Gloss-black powder-coat: clearcoat catches the shop lights like the photo.
  const gloss = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0e, metalness: 0.85, roughness: 0.3, clearcoat: 1.0, clearcoatRoughness: 0.08 });
  const glossFace = new THREE.MeshPhysicalMaterial({ color: 0x16161b, metalness: 0.8, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xb9bcc2, metalness: 0.9, roughness: 0.25 });

  // Text decal on a transparent canvas — logos, badge, placards.
  const decal = (text: string, w: number, h: number, opts?: { color?: string; bg?: string; italic?: boolean; header?: string }) => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = Math.max(64, Math.round(512 * (h / w)));
    const g = c.getContext('2d')!;
    if (opts?.bg) { g.fillStyle = opts.bg; g.fillRect(0, 0, c.width, c.height); }
    if (opts?.header) { // placard style: colored band on top with the text
      g.fillStyle = '#b81f2d'; g.fillRect(0, 0, c.width, c.height * 0.28);
      g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `bold ${Math.round(c.height * 0.17)}px sans-serif`;
      g.fillText(opts.header, c.width / 2, c.height * 0.14);
    } else {
      g.fillStyle = opts?.color ?? '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `${opts?.italic === false ? '' : 'italic '}bold ${Math.round(c.height * 0.62)}px sans-serif`;
      g.fillText(text, c.width / 2, c.height / 2);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    m.name = 'toolbox-decal';
    return m;
  };
  const putDecal = (mesh: THREE.Mesh, x: number, y: number, z: number) => { mesh.position.set(x, y, z); toolbox.add(mesh); };

  // Vertical stack: casters → base cab (counter at 43") → open riser → canopy → crown rail
  const CASTER_H = 5 * IN, COUNTER_Y = 43 * IN, RISER_H = 18 * IN, CAN_H = 20 * IN, CROWN_H = 8 * IN;
  const CAN_Y0 = COUNTER_Y + RISER_H, TOP_Y = CAN_Y0 + CAN_H;
  const W = 216 * IN, D = 24 * IN, CAN_D = 18 * IN;
  const frontZ = D / 2;
  const canFrontZ = -D / 2 + CAN_D; // canopy sits against the back plane

  // Bay widths (inches, left→right) measured off the photo
  const BAYS = { lockerL: 21, bankA: 47, bankB: 52, bankC: 43, lockerR: 53 };
  const bayX = {} as Record<keyof typeof BAYS, [number, number]>;
  {
    let x = -W / 2;
    (Object.keys(BAYS) as (keyof typeof BAYS)[]).forEach(k => { bayX[k] = [x, x + BAYS[k] * IN]; x += BAYS[k] * IN; });
  }
  const mid = (k: keyof typeof BAYS) => (bayX[k][0] + bayX[k][1]) / 2;
  const bw = (k: keyof typeof BAYS) => BAYS[k] * IN;

  // Casters: a pair under every bay seam
  for (let i = 0; i <= 6; i++) {
    const cx = -W / 2 + (i / 6) * W * 0.98 + W * 0.01;
    [[-D * 0.32], [D * 0.32]].forEach(([cz]) => {
      add(new THREE.CylinderGeometry(2.5 * IN, 2.5 * IN, 1.6 * IN, 12), M.rubber, { pos: [cx, 2.5 * IN, cz], rot: [Math.PI / 2, 0, 0], parent: toolbox });
    });
  }
  // Kick rail behind the casters
  add(new THREE.BoxGeometry(W, CASTER_H * 0.7, D * 0.86), M.darkMetal, { pos: [0, CASTER_H * 0.6, 0], parent: toolbox });

  // ── Drawer-bay carcasses (bays A/B/C): base cab + stainless counter + riser back + canopy + lift door
  (['bankA', 'bankB', 'bankC'] as const).forEach(k => {
    const w = bw(k), cx = mid(k);
    add(new THREE.BoxGeometry(w, COUNTER_Y - CASTER_H, D), gloss, { pos: [cx, CASTER_H + (COUNTER_Y - CASTER_H) / 2, 0], parent: toolbox });
    add(new THREE.BoxGeometry(w + 0.006, 1.2 * IN, D + 0.02), steel, { pos: [cx, COUNTER_Y + 0.6 * IN, 0], parent: toolbox });
    add(new THREE.BoxGeometry(w, RISER_H, 2 * IN), gloss, { pos: [cx, COUNTER_Y + RISER_H / 2, -D / 2 + IN], parent: toolbox });
    add(new THREE.BoxGeometry(w, CAN_H, CAN_D), gloss, { pos: [cx, CAN_Y0 + CAN_H / 2, canFrontZ - CAN_D / 2], parent: toolbox });
    // Lift-up canopy door: glossy panel, chrome lip along its bottom edge
    add(new THREE.BoxGeometry(w - 1.5 * IN, CAN_H - 2 * IN, 0.5 * IN), glossFace, { pos: [cx, CAN_Y0 + CAN_H / 2, canFrontZ + 0.3 * IN], parent: toolbox });
    add(new THREE.BoxGeometry(w - 1.5 * IN, 0.8 * IN, 0.9 * IN), M.chrome, { pos: [cx, CAN_Y0 + 1.6 * IN, canFrontZ + 0.4 * IN], parent: toolbox });
  });

  // ── Crown rail across the three drawer bays, carrying the script logos
  const crownW = bayX.lockerR[0] - bayX.bankA[0];
  const crownX = (bayX.bankA[0] + bayX.lockerR[0]) / 2;
  add(new THREE.BoxGeometry(crownW, CROWN_H, CAN_D), gloss, { pos: [crownX, TOP_Y + CROWN_H / 2, canFrontZ - CAN_D / 2], parent: toolbox });
  putDecal(decal('Snap-on', 14 * IN, 4 * IN), mid('bankA'), TOP_Y + CROWN_H / 2, canFrontZ + 0.01);
  putDecal(decal('Snap-on', 14 * IN, 4 * IN), mid('bankC'), TOP_Y + CROWN_H / 2, canFrontZ + 0.01);

  // ── Tall lockers (left single, right double) rise flush to the canopy top
  (['lockerL', 'lockerR'] as const).forEach(k => {
    const w = bw(k), cx = mid(k), lockerH = TOP_Y + CROWN_H - CASTER_H;
    add(new THREE.BoxGeometry(w, lockerH, D), gloss, { pos: [cx, CASTER_H + lockerH / 2, 0], parent: toolbox });
    const doors = k === 'lockerR' ? 2 : 1;
    for (let i = 0; i < doors; i++) {
      const dw = (w - 2 * IN) / doors;
      const dx = cx - (w - 2 * IN) / 2 + dw * (i + 0.5);
      add(new THREE.BoxGeometry(dw - 0.4 * IN, lockerH - 2 * IN, 0.5 * IN), glossFace, { pos: [dx, CASTER_H + lockerH / 2, frontZ + 0.15 * IN], parent: toolbox });
      add(new THREE.CylinderGeometry(0.7 * IN, 0.7 * IN, 0.6 * IN, 12), M.chrome, { pos: [dx + (i === 0 ? 1 : -1) * dw * 0.32, COUNTER_Y + 9 * IN, frontZ + 0.5 * IN], rot: [Math.PI / 2, 0, 0], parent: toolbox });
    }
    // red-headed IMPORTANT placard, like the cards taped to the photo's lockers
    putDecal(decal('', 7 * IN, 9.5 * IN, { bg: '#f4f2ee', header: 'IMPORTANT' }), cx - (k === 'lockerR' ? bw(k) * 0.24 : 0), COUNTER_Y + RISER_H + 2 * IN, frontZ + 0.45 * IN);
  });
  putDecal(decal('Snap-on', 10 * IN, 3 * IN, { color: '#3a3a40' }), mid('lockerR') + bw('lockerR') * 0.22, COUNTER_Y + 2 * IN, frontZ + 0.45 * IN);

  // ── Chrome trim strip on every bay seam
  (Object.keys(BAYS) as (keyof typeof BAYS)[]).slice(0, -1).forEach(k => {
    add(new THREE.BoxGeometry(0.8 * IN, TOP_Y - CASTER_H, 0.5 * IN), M.chrome, { pos: [bayX[k][1], CASTER_H + (TOP_Y - CASTER_H) / 2, frontZ + 0.1 * IN], parent: toolbox });
  });

  // ── Drawers. Functional ones slide (userData contract shared with toggleDrawer);
  // facade ones are solid faces with the same full-width Snap-on pull.
  const drawerFace = (w: number, h: number, cx: number, cy: number, parent: THREE.Group) => {
    add(new THREE.BoxGeometry(w, h - 0.3 * IN, 0.5 * IN), glossFace, { pos: [cx, cy, 0.25 * IN], parent });
    add(new THREE.BoxGeometry(w * 0.95, 0.7 * IN, 0.7 * IN), M.chrome, { pos: [cx, cy + h / 2 - 0.75 * IN, 0.45 * IN], parent });
  };
  const buildDrawer = (key: DrawerKey, w: number, h: number, cx: number, cy: number) => {
    const d0 = new THREE.Group();
    d0.name = `toolbox-drawer-${key}`;
    d0.position.set(cx, cy, frontZ);
    d0.userData.closedZ = frontZ;
    d0.userData.openZ = frontZ + D * 0.55;
    d0.userData.w = w;
    d0.userData.h = h; // read by focusDrawer to frame a close-up sized to this drawer
    toolbox.add(d0);
    add(new THREE.BoxGeometry(w - 0.8 * IN, h - 0.5 * IN, D * 0.8), M.darkMetal, { pos: [0, 0, -D * 0.4], parent: d0 });
    add(new THREE.BoxGeometry(w, h - 0.3 * IN, 0.5 * IN), glossFace, { pos: [0, 0, 0.25 * IN], parent: d0 });
    add(new THREE.BoxGeometry(w * 0.95, 0.7 * IN, 0.7 * IN), M.chrome, { pos: [0, h / 2 - 0.75 * IN, 0.45 * IN], parent: d0 });
    // Visible contents — the tools live IN the drawers, laid out on the
    // tub liner so sliding a drawer open shows real hardware: graded
    // socket rows in the socket drawers, fanned combination wrenches in
    // the wrench banks, loose kit in specialty/general. Cheap primitives,
    // no shadows (matches ToolPanel's CATEGORY_TOOLS counts of 10 per
    // socket/wrench drawer).
    const tubTop = (h - 0.5 * IN) / 2;
    const innerW = w - 3 * IN;
    if (key === 'sockets-metric' || key === 'sockets-standard') {
      for (let i = 0; i < 10; i++) {
        const sx = -innerW / 2 + (i + 0.5) * (innerW / 10);
        const r = (0.32 + i * 0.035) * IN;
        [0.28, 0.55].forEach(f => {
          add(new THREE.CylinderGeometry(r, r, 0.85 * IN, 10), M.chrome,
            { pos: [sx, tubTop + 0.42 * IN, -D * f], shadow: false, parent: d0 });
        });
      }
    } else if (key === 'wrenches-metric' || key === 'wrenches-standard') {
      for (let i = 0; i < 10; i++) {
        const sx = -innerW / 2 + (i + 0.5) * (innerW / 10);
        add(new THREE.BoxGeometry(0.55 * IN, 0.22 * IN, (6.5 + i * 0.7) * IN), M.chrome,
          { pos: [sx, tubTop + 0.11 * IN, -D * 0.42], shadow: false, parent: d0 });
      }
    } else {
      // specialty / general: torque wrench, ratchet + extension, filter
      // wrench ring, screwdriver, drain pan / rags
      add(new THREE.BoxGeometry(12 * IN, 0.6 * IN, 0.9 * IN), M.chrome, { pos: [-innerW * 0.28, tubTop + 0.3 * IN, -D * 0.3], shadow: false, parent: d0 });
      add(new THREE.BoxGeometry(8 * IN, 0.5 * IN, 0.7 * IN), M.brushedMetal, { pos: [-innerW * 0.05, tubTop + 0.25 * IN, -D * 0.5], shadow: false, parent: d0 });
      add(new THREE.CylinderGeometry(1.6 * IN, 1.6 * IN, 0.5 * IN, 14), M.darkMetal, { pos: [innerW * 0.18, tubTop + 0.25 * IN, -D * 0.35], shadow: false, parent: d0 });
      add(new THREE.BoxGeometry(5 * IN, 0.45 * IN, 0.45 * IN), M.red, { pos: [innerW * 0.33, tubTop + 0.22 * IN, -D * 0.52], shadow: false, parent: d0 });
      add(new THREE.BoxGeometry(6 * IN, 0.8 * IN, 4 * IN), M.rubber, { pos: [innerW * 0.45, tubTop + 0.4 * IN, -D * 0.32], shadow: false, parent: d0 });
    }
    return d0;
  };
  const facade = new THREE.Group();
  facade.name = 'toolbox-facade';
  facade.position.set(0, 0, frontZ);
  toolbox.add(facade);

  // Fill a column with drawer rows; rows in `live` become the functional drawers.
  const column = (cx: number, w: number, rows: number[], live: Partial<Record<number, DrawerKey>>) => {
    const usable = COUNTER_Y - CASTER_H - 2 * IN;
    const total = rows.reduce((a, b) => a + b, 0);
    let y = COUNTER_Y - 1 * IN; // fill top→down like the photo's shallow-to-deep banks
    rows.forEach((rh, i) => {
      const h = (rh / total) * usable;
      const cy = y - h / 2;
      const key = live[i];
      if (key) buildDrawer(key, w - 0.8 * IN, h - 0.25 * IN, cx, cy);
      else drawerFace(w - 0.8 * IN, h - 0.25 * IN, cx, cy, facade);
      y -= h;
    });
  };

  // Bay A: wide column of 6 + narrow column of 8 (sockets live top-right, like a real setup —
  // small parts closest to hand). Rows are relative heights, shallow up top.
  column(mid('bankA') - bw('bankA') * 0.23, bw('bankA') * 0.52, [2, 2, 2.6, 3, 3.6, 4.2], {});
  column(mid('bankA') + bw('bankA') * 0.27, bw('bankA') * 0.42, [2, 2, 2, 2.4, 2.8, 3, 3.4, 3.8], { 0: 'sockets-metric', 1: 'sockets-standard' });

  // Bay B: two even banks of 8 shallow rows; wrenches live in the left bank
  column(mid('bankB') - bw('bankB') * 0.25, bw('bankB') * 0.46, [2, 2, 2.2, 2.4, 2.8, 3, 3.4, 3.8], { 0: 'wrenches-metric', 1: 'wrenches-standard' });
  column(mid('bankB') + bw('bankB') * 0.25, bw('bankB') * 0.46, [2, 2, 2.2, 2.4, 2.8, 3, 3.4, 3.8], {});
  // keypad locks on the counter rail, silver discs like the photo
  [mid('bankB') - 4 * IN, mid('bankB') + 4 * IN].forEach(x => {
    add(new THREE.CylinderGeometry(1.1 * IN, 1.1 * IN, 0.5 * IN, 16), steel, { pos: [x, COUNTER_Y + 0.62 * IN, frontZ - 2 * IN], parent: toolbox });
  });

  // Bay C: full-width stack — specialty on top, the deep "MR. BIG" drawer (general) at the bottom
  column(mid('bankC'), bw('bankC'), [2, 2.2, 2.6, 3, 3.6, 6.5], { 0: 'specialty', 5: 'general' });
  putDecal(decal('Snap-on', 9 * IN, 2.6 * IN), mid('bankC'), COUNTER_Y - 1 * IN - (COUNTER_Y - CASTER_H - 2 * IN) * 0.45, frontZ + 0.6 * IN);
  putDecal(decal('MR. BIG', 10 * IN, 3.2 * IN, { color: '#d7d9dd', italic: false }), mid('bankC') - bw('bankC') * 0.22, CASTER_H + 2.6 * IN, frontZ + 0.6 * IN);

  // ── Replacement WABCO air compressor staged at the toolbox — it sits on
  // the stainless counter of bay A (the part lives in the toolbox until it
  // goes on the engine), drive gear facing along the counter.
  const { group: spareCompressor } = buildWabcoCompressor();
  spareCompressor.name = 'toolbox-air-compressor';
  spareCompressor.position.set(mid('bankA'), COUNTER_Y + 1.2 * IN + 0.066, 4 * IN);
  spareCompressor.rotation.y = Math.PI / 2;
  toolbox.add(spareCompressor);

  tick();

  // ══════════════════════════════════════
  // Position & finalize
  // ══════════════════════════════════════
  group.position.y = 0;
  group.rotation.y = Math.PI * 0.08; // slight initial angle

  // X-ray flow mode — hidden by default (buildFlowSystems sets flowGroup
  // .visible = false); toggleXray in the component flips flowGroup
  // visibility and ghosts these casing materials to ~12% opacity so the
  // oil/coolant/air-exhaust streams read through the block, head, valve
  // cover, and covers. updateFlows() only runs (in animate()) while
  // userData.xrayOn is true.
  const { flowGroup, systems: flowSystems } = buildFlowSystems();
  group.add(flowGroup);
  group.userData.flowSystems = flowSystems;
  group.userData.xrayMaterials = [M.teal, M.darkTeal, M.brushedMetal, M.darkMetal, M.black];
  group.userData.xrayOn = false;

  // Complete loading
  tick(); tick(); tick(); tick(); tick();
  setProgress(100);
  setTimeout(() => setLoading(false), 500);
}

// ═══════════════════════════════════════════════════════════
// 2017 HYUNDAI SONATA — built from the photos in docs/reference/sonata/:
// front 3/4 (silver, hex grille with 4 chrome slats, swept-back headlights,
// chrome beltline trim), rear (wide taillights wrapping the corners, chrome
// trunk strip, right-side oval exhaust tip), and the engine bay (black GDi
// cover on a transverse 2.4L four, battery left-rear, airbox right-front,
// brake booster at the cowl, radiator behind the grille).
// Same stylized scale as the VNL: car ≈ 4.0 units long (real 4855 mm),
// ground at y −1.1, wheels r 0.28 ≈ 16" alloys. The car group is rotated
// 180° like the truck so the nose faces the walk-up camera (+x world) and
// the driver door faces −z world; the door/hood groups reuse the
// 'truck-door'/'truck-hood' names so the shared walk-around hinges work.
// ═══════════════════════════════════════════════════════════
export function buildSonata2017(
  group: THREE.Group,
  setProgress: (n: number) => void,
  setLoading: (b: boolean) => void,
) {
  let step = 0;
  const totalSteps = 12;
  const tick = () => { step++; setProgress(Math.min(98, Math.round((step / totalSteps) * 100))); };

  // Materials — silver clearcoat paint per the photos
  const paint = new THREE.MeshPhysicalMaterial({ color: 0xc4c7cb, metalness: 0.85, roughness: 0.3, clearcoat: 1.0, clearcoatRoughness: 0.08 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x0d1520, metalness: 0.9, roughness: 0.05, transparent: true, opacity: 0.9 });
  const M = {
    chrome: new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.96, roughness: 0.08 }),
    brushedMetal: new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.85, roughness: 0.25 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.82, roughness: 0.32 }),
    black: new THREE.MeshStandardMaterial({ color: 0x0f0f0f, metalness: 0.25, roughness: 0.65 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x141414, metalness: 0.0, roughness: 0.98 }),
    redLens: new THREE.MeshStandardMaterial({ color: 0xa01020, metalness: 0.3, roughness: 0.25 }),
    white: new THREE.MeshStandardMaterial({ color: 0xeaeaea, metalness: 0.05, roughness: 0.6 }),
    blue: new THREE.MeshStandardMaterial({ color: 0x0033aa, metalness: 0.1, roughness: 0.6 }),
  };

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, opts?: { pos?: [number, number, number]; rot?: [number, number, number]; shadow?: boolean; parent?: THREE.Group }) => {
    const mesh = new THREE.Mesh(geo, mat);
    if (opts?.pos) mesh.position.set(...opts.pos);
    if (opts?.rot) mesh.rotation.set(...opts.rot);
    if (opts?.shadow !== false) { mesh.castShadow = true; mesh.receiveShadow = true; }
    (opts?.parent ?? group).add(mesh);
    return mesh;
  };

  const car = new THREE.Group();
  car.name = 'car-body';
  car.rotation.y = Math.PI; // nose (local −x) toward the walk-up camera
  group.add(car);

  // ── Body: main mass, beltline at y −0.12, rockers down to −0.80
  add(new THREE.BoxGeometry(4.0, 0.68, 1.52), paint, { pos: [0, -0.46, 0], parent: car });
  // Nose fascia + tail fascia round the box off
  add(new THREE.BoxGeometry(0.22, 0.5, 1.46), paint, { pos: [-2.0, -0.5, 0], parent: car });
  add(new THREE.BoxGeometry(0.2, 0.55, 1.46), paint, { pos: [1.98, -0.48, 0], parent: car });
  tick();

  // ── Greenhouse: raked windshield → roof → fastback rear glass (photos:
  // the C-pillar flows almost straight into the trunk)
  add(new THREE.BoxGeometry(0.78, 0.03, 1.3), glass, { pos: [-0.1, 0.17, 0], rot: [0, 0, 0.64], parent: car });
  add(new THREE.BoxGeometry(1.2, 0.05, 1.32), paint, { pos: [0.8, 0.43, 0], parent: car });
  add(new THREE.BoxGeometry(0.68, 0.03, 1.28), glass, { pos: [1.62, 0.2, 0], rot: [0, 0, -0.68], parent: car });
  // Trunk lid with the subtle lip spoiler from the rear photo
  add(new THREE.BoxGeometry(0.5, 0.05, 1.42), paint, { pos: [1.85, -0.04, 0], parent: car });
  add(new THREE.BoxGeometry(0.1, 0.03, 1.3), paint, { pos: [2.02, -0.02, 0], parent: car });
  tick();

  // ── Glass + chrome beltline trim (photo: bright strip under the side
  // glass running the full window line)
  // Passenger side: one fixed pane; driver side: quarter glass only (the
  // door carries its own window)
  add(new THREE.BoxGeometry(1.5, 0.34, 0.03), glass, { pos: [0.85, 0.18, -0.655], parent: car });
  add(new THREE.BoxGeometry(0.7, 0.3, 0.03), glass, { pos: [1.25, 0.16, 0.655], parent: car });
  [-0.675, 0.675].forEach(z => {
    add(new THREE.BoxGeometry(2.4, 0.025, 0.02), M.chrome, { pos: [0.7, -0.01, z], shadow: false, parent: car });
  });
  tick();

  // ── Wheels: 16" alloys — tire + chrome hub + 5 spokes
  const wheelAt = (wx: number, wz: number) => {
    add(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 24), M.rubber, { pos: [wx, -0.82, wz], rot: [Math.PI / 2, 0, 0], parent: car });
    add(new THREE.CylinderGeometry(0.16, 0.16, 0.21, 18), M.brushedMetal, { pos: [wx, -0.82, wz], rot: [Math.PI / 2, 0, 0], parent: car });
    add(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 10), M.chrome, { pos: [wx, -0.82, wz], rot: [Math.PI / 2, 0, 0], shadow: false, parent: car });
  };
  [[-1.25, 0.72], [-1.25, -0.72], [1.25, 0.72], [1.25, -0.72]].forEach(([wx, wz]) => wheelAt(wx, wz));
  tick();

  // ── Front end per the 3/4 photo: hexagonal grille with 4 chrome slats,
  // chrome surround, swept-back headlights, dark lower intake
  add(new THREE.BoxGeometry(0.06, 0.3, 0.95), M.black, { pos: [-2.08, -0.32, 0], parent: car });
  for (let i = 0; i < 4; i++) {
    add(new THREE.BoxGeometry(0.03, 0.02, 0.9), M.chrome, { pos: [-2.1, -0.42 + i * 0.07, 0], shadow: false, parent: car });
  }
  add(new THREE.BoxGeometry(0.03, 0.04, 1.0), M.chrome, { pos: [-2.1, -0.19, 0], shadow: false, parent: car });
  // Hyundai badge on the top slat
  add(new THREE.BoxGeometry(0.03, 0.06, 0.12), M.chrome, { pos: [-2.11, -0.3, 0], shadow: false, parent: car });
  // Headlights sweeping back along the fenders
  [-1, 1].forEach(s => {
    add(new THREE.BoxGeometry(0.42, 0.11, 0.34), M.white, { pos: [-1.88, -0.18, s * 0.58], rot: [0, s * -0.25, 0], parent: car });
  });
  // Dark lower intake + fog light bezels
  add(new THREE.BoxGeometry(0.06, 0.16, 1.05), M.black, { pos: [-2.09, -0.66, 0], parent: car });
  [-1, 1].forEach(s => {
    add(new THREE.BoxGeometry(0.05, 0.1, 0.16), M.black, { pos: [-2.06, -0.6, s * 0.62], shadow: false, parent: car });
  });
  tick();

  // ── Rear per the rear photo: wide taillights wrapping the corners,
  // chrome trunk strip, license recess, right oval exhaust tip
  [-1, 1].forEach(s => {
    add(new THREE.BoxGeometry(0.14, 0.13, 0.52), M.redLens, { pos: [2.02, -0.16, s * 0.52], parent: car });
    add(new THREE.BoxGeometry(0.3, 0.13, 0.14), M.redLens, { pos: [1.9, -0.16, s * 0.72], parent: car });
  });
  add(new THREE.BoxGeometry(0.03, 0.03, 1.1), M.chrome, { pos: [2.09, -0.13, 0], shadow: false, parent: car });
  add(new THREE.BoxGeometry(0.04, 0.16, 0.32), M.black, { pos: [2.09, -0.35, 0], parent: car });
  add(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 12), M.chrome, { pos: [2.06, -0.72, 0.5], rot: [0, 0, Math.PI / 2], shadow: false, parent: car });
  // Mirrors on the A-pillars
  [-1, 1].forEach(s => {
    add(new THREE.BoxGeometry(0.16, 0.09, 0.1), paint, { pos: [-0.32, 0.0, s * 0.82], parent: car });
  });
  tick();

  // ── Driver door (local +z = world −z, facing the walk-up camera).
  // Hinged at its front edge; same name + hinge direction as the truck
  // door so clickDoor works unchanged.
  const door = new THREE.Group();
  door.name = 'truck-door';
  door.position.set(-0.45, -0.35, 0.765);
  car.add(door);
  add(new THREE.BoxGeometry(0.88, 0.58, 0.05), paint, { pos: [0.44, 0, 0], parent: door });
  add(new THREE.BoxGeometry(0.72, 0.32, 0.03), glass, { pos: [0.42, 0.44, -0.015], parent: door });
  add(new THREE.BoxGeometry(0.14, 0.03, 0.04), M.chrome, { pos: [0.7, 0.08, 0.035], shadow: false, parent: door });
  tick();

  // ── Interior visible through the glass: dash, wheel, two front seats,
  // rear bench
  add(new THREE.BoxGeometry(0.3, 0.16, 1.3), M.black, { pos: [-0.18, -0.14, 0], parent: car });
  add(new THREE.TorusGeometry(0.09, 0.02, 8, 20), M.black, { pos: [-0.05, -0.08, 0.4], rot: [0.5, 0, 0], shadow: false, parent: car });
  [-0.38, 0.38].forEach(z => {
    add(new THREE.BoxGeometry(0.4, 0.34, 0.42), M.black, { pos: [0.42, -0.2, z], parent: car });
  });
  add(new THREE.BoxGeometry(0.35, 0.3, 1.2), M.black, { pos: [1.15, -0.22, 0], parent: car });
  tick();

  // ── Engine bay (exposed when the hood lifts) — from the engine-bay
  // photo: black inner fenders/firewall, transverse black GDi engine
  // cover, battery left-rear, airbox right-front, brake booster at the
  // cowl, coolant + washer bottles, radiator behind the grille
  add(new THREE.BoxGeometry(1.5, 0.3, 0.1), M.black, { pos: [-1.2, -0.3, 0.66], parent: car });
  add(new THREE.BoxGeometry(1.5, 0.3, 0.1), M.black, { pos: [-1.2, -0.3, -0.66], parent: car });
  add(new THREE.BoxGeometry(0.1, 0.35, 1.4), M.black, { pos: [-0.48, -0.3, 0], parent: car });
  add(new THREE.BoxGeometry(1.5, 0.05, 1.4), M.darkMetal, { pos: [-1.2, -0.62, 0], parent: car });
  tick();

  // Transverse 2.4 GDi: black engine cover with the silver oil-cap circle
  // and a brushed badge plate (photo shows "GDi" on the cover's right)
  add(new THREE.BoxGeometry(0.58, 0.14, 0.52), M.black, { pos: [-1.02, -0.3, 0.08], parent: car });
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 14), M.brushedMetal, { pos: [-1.12, -0.22, -0.02], shadow: false, parent: car });
  add(new THREE.BoxGeometry(0.14, 0.015, 0.08), M.brushedMetal, { pos: [-0.88, -0.225, 0.22], shadow: false, parent: car });
  // Intake manifold under the cover's front edge
  add(new THREE.BoxGeometry(0.34, 0.16, 0.44), M.darkMetal, { pos: [-1.3, -0.44, 0.08], parent: car });
  // Battery with red positive-terminal cover (left-rear of the bay)
  add(new THREE.BoxGeometry(0.28, 0.2, 0.2), M.black, { pos: [-0.68, -0.34, 0.48], parent: car });
  add(new THREE.BoxGeometry(0.08, 0.04, 0.06), M.redLens, { pos: [-0.6, -0.23, 0.42], shadow: false, parent: car });
  // Fuse box beside the battery
  add(new THREE.BoxGeometry(0.24, 0.1, 0.26), M.black, { pos: [-1.05, -0.32, 0.52], parent: car });
  // Airbox + corrugated intake duct to the engine (right-front)
  add(new THREE.BoxGeometry(0.28, 0.2, 0.28), M.black, { pos: [-1.5, -0.36, -0.44], parent: car });
  add(new THREE.CylinderGeometry(0.045, 0.045, 0.4, 10), M.rubber, { pos: [-1.28, -0.32, -0.25], rot: [Math.PI / 2.4, 0.5, 0], shadow: false, parent: car });
  // Brake booster + master cylinder at the cowl, driver side
  add(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 18), M.black, { pos: [-0.56, -0.24, 0.35], rot: [0, 0, Math.PI / 2], parent: car });
  add(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 10), M.white, { pos: [-0.63, -0.24, 0.35], rot: [0, 0, Math.PI / 2], shadow: false, parent: car });
  // Coolant reservoir + blue washer cap
  add(new THREE.BoxGeometry(0.16, 0.16, 0.14), M.white, { pos: [-1.52, -0.36, 0.45], parent: car });
  add(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 10), M.blue, { pos: [-1.66, -0.28, 0.3], shadow: false, parent: car });
  // Strut towers
  [-0.55, 0.55].forEach(z => {
    add(new THREE.CylinderGeometry(0.09, 0.11, 0.1, 14), M.darkMetal, { pos: [-0.72, -0.28, z], parent: car });
  });
  // Radiator + fan shroud behind the grille
  add(new THREE.BoxGeometry(0.06, 0.32, 1.05), M.darkMetal, { pos: [-1.85, -0.42, 0], parent: car });
  add(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 16), M.black, { pos: [-1.78, -0.4, 0.2], rot: [0, 0, Math.PI / 2], shadow: false, parent: car });
  tick();

  // ── Hood — rear-hinged at the cowl (pivot here, panel extends to the
  // nose); clickHood swings it to rot.z −1.0 which lifts the front edge
  const hood = new THREE.Group();
  hood.name = 'truck-hood';
  hood.position.set(-0.5, -0.1, 0);
  car.add(hood);
  add(new THREE.BoxGeometry(1.55, 0.05, 1.46), paint, { pos: [-0.78, -0.02, 0], rot: [0, 0, -0.04], parent: hood });
  // Character-line ridges the photo shows running up the hood
  [-0.35, 0.35].forEach(z => {
    add(new THREE.BoxGeometry(1.3, 0.02, 0.05), paint, { pos: [-0.75, 0.01, z], rot: [0, 0, -0.04], shadow: false, parent: hood });
  });
  tick();

  // Complete loading
  tick(); tick();
  setProgress(100);
  setTimeout(() => setLoading(false), 400);
}
