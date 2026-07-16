// Volvo D13 factory reference data, extracted from the two documents in the
// repo root: the EPA2007 D13F Engine Quick Reference Guide (PV776-QRG07-D13F,
// Volvo Group North America, Nov 2009) and the Volvo Trucks D13 Engine Family
// spec sheet (2017). Values are the factory's — do not "round" or edit them
// without checking the source PDFs.

export interface SpecRow {
  label: string;
  value: string;
}

export interface TorqueRow {
  fastener: string;
  spec: string;
  note?: string;
}

// ── Engine specification (QRG p.11 + 2017 spec sheet) ──────────────
export const ENGINE_SPEC: SpecRow[] = [
  { label: 'Engine type', value: 'In-line 6, direct injection diesel' },
  { label: 'Displacement', value: '12.78 L (780 cu in)' },
  { label: 'Bore × Stroke', value: '131 × 158 mm (5.16 × 6.22 in)' },
  { label: 'Cylinder spacing', value: '168 mm (6.61 in)' },
  { label: 'Compression ratio', value: '16:1 (D13F) / 17.0:1 (2017 D13)' },
  { label: 'Firing order', value: '1-5-3-6-2-4' },
  { label: 'Valve actuation', value: 'SOHC, 4 valves per cylinder' },
  { label: 'Aspiration', value: 'Variable geometry turbo, sliding nozzle' },
  { label: 'Max injection pressure', value: '35,000 psi (2,400 bar)' },
  { label: 'Peak power range', value: '335–500 hp' },
  { label: 'Peak torque range', value: '1350–1850 lb-ft' },
  { label: 'Low idle', value: '600 rpm' },
  { label: 'Max full-load rpm', value: '1900 rpm' },
  { label: 'Dry weight (full dress)', value: '1182 kg (2605 lb)' },
  { label: 'Length × Width × Height', value: '1366 × 971 × 1281 mm (54 × 38 × 50 in)' },
  { label: 'Cylinder head bolts', value: 'M16 × 38, 200 mm long' },
  { label: 'Pistons', value: 'One-piece steel, 3 ring grooves' },
  { label: 'Crankshaft', value: 'Forged steel, 7 main bearings' },
  { label: 'Thermostat', value: 'Sleeve type, 82 °C (180 °F)' },
  { label: 'Engine brake', value: 'I-VEB, 500 hp @ 2200 rpm' },
];

// ── Performance ratings (QRG p.12, D13F) ───────────────────────────
export const RATINGS: { designation: string; hp: string; hpRpm: string; torque: string }[] = [
  { designation: 'D13F335', hp: '335 hp (250 kW)', hpRpm: '1400–1700', torque: '1350 lb-ft @ 1100' },
  { designation: 'D13F375', hp: '375 hp (280 kW)', hpRpm: '1400–1700', torque: '1450 lb-ft @ 1100' },
  { designation: 'D13F405', hp: '405 hp (302 kW)', hpRpm: '1500–1700', torque: '1450 lb-ft @ 1100' },
  { designation: 'D13F425', hp: '425 hp (317 kW)', hpRpm: '1500–1600', torque: '1550 lb-ft @ 1100' },
  { designation: 'D13F435', hp: '435 hp (324 kW)', hpRpm: '1400–1800', torque: '1650 lb-ft @ 1100' },
  { designation: 'D13F485', hp: '485 hp (362 kW)', hpRpm: '1600–1900', torque: '1650 lb-ft @ 1100' },
];

// ── Oil system (QRG p.14, 84, 90–92 + 2017 spec sheet) ─────────────
export const OIL_SYSTEM: SpecRow[] = [
  { label: 'Total lube capacity', value: '36 L (38 qt)' },
  { label: 'Sump capacity', value: '25 L min – 30 L max (26.4–31.7 qt)' },
  { label: 'Filters', value: 'Two full-flow + one bypass, spin-on' },
  { label: 'Full-flow filter capacity', value: '4.0–4.5 L (4.2–4.8 qt) for the pair' },
  { label: 'Oil spec', value: 'Volvo VDS-4, SAE 10W-30' },
  { label: 'Drain interval (normal)', value: '45,000 mi (75,000 km) — 2017 D13' },
  { label: 'Oil & filter change (highway)', value: '30,000 mi / 48,000 km / 500 h' },
  { label: 'Oil & filter change (vocational)', value: '15,000 mi / 24,000 km / 90 days / 300 h' },
  { label: 'Oil pan', value: 'Plastic or steel; 22 spring-tension screws' },
  { label: 'Pan sensor', value: 'Oil level + temperature sensor in pan' },
  { label: 'Sump position', value: 'Front or rear sump (axle fwd / axle back)' },
  { label: 'Oil pump', value: 'Gear type, crankshaft-gear driven, rear of engine' },
  { label: 'Oil cooler', value: 'Immersed in coolant inside coolant duct cover' },
];

/** Oil flow path, in order, from the QRG "Oil Flow Control and Filtration"
 *  diagram (p.91). */
export const OIL_FLOW_PATH: string[] = [
  'Strainer',
  'Pickup Tube',
  'Oil Pump',
  'Pressure Pipe',
  'Oil Cooler',
  'Filter Housing',
  'Full-Flow Filters (2)',
  'By-Pass Filter',
  'Main Lubrication Gallery',
  'Piston Cooling Nozzles',
  'CCV Separator',
  'Exhaust Brake Oil Control Valve',
  'Air Compressor',
  'Turbocharger',
  'EGR Valve',
];

/** Six control valves in the lubrication circuit (QRG p.92). */
export const OIL_VALVES: SpecRow[] = [
  { label: 'Reducing valve', value: 'Maintains constant system oil pressure' },
  { label: 'Safety valve', value: 'Prevents excess pressure at high viscosity (cold)' },
  { label: 'Oil cooler thermostat valve', value: 'Bypasses cooler until oil warms to set point' },
  { label: 'Overflow valve, full-flow filter', value: 'Bypasses a clogged filter' },
  { label: 'Opening valve, piston cooling', value: 'Holds off piston cooling until set pressure' },
  { label: 'Control valve, piston cooling', value: 'Regulates flow to piston cooling channels' },
];

// ── Torque specs (QRG p.35–36 + p.16–47) ───────────────────────────
export const TORQUE_SPECS: TorqueRow[] = [
  { fastener: 'Oil pan screws (steel & plastic pan)', spec: '24 ± 4 Nm (18 ± 3 ft-lb)', note: 'Tighten middle-out, order 1–4; re-check bolts A and B last' },
  { fastener: 'Oil pan drain plug', spec: '60 ± 10 Nm (44 ± 7 ft-lb)' },
  { fastener: 'Oil filter', spec: '25 +5/−0 Nm (18.5 +3.5/−0 ft-lb)', note: 'Or 3/4 to 1 turn after gasket contact; install dry, oil the gasket' },
  { fastener: 'Oil filter housing', spec: '24 ± 4 Nm (18 ± 3 ft-lb)' },
  { fastener: 'Oil pump / pickup tube', spec: '24 ± 4 Nm (18 ± 3 ft-lb)' },
  { fastener: 'Piston cooling nozzle screws', spec: '24 ± 4 Nm (18 ± 3 ft-lb)', note: 'Do not reuse' },
  { fastener: 'Lube valve housing screws (4)', spec: '48 ± 8 Nm (35 ± 6 ft-lb)', note: 'Hand start all, then tighten' },
  { fastener: 'Valve cover (20 spring-tension screws)', spec: '24 ± 4 Nm (18 ± 3 ft-lb)', note: 'Tighten in numerical order' },
  { fastener: 'Main bearing cap screws', spec: '150 ± 20 Nm, then +120° ± 5°', note: 'Discard screws with four marks; use new' },
  { fastener: 'Connecting rod cap screws', spec: '20 ± 3 Nm → 60 ± 3 Nm → +90° ± 5°', note: 'Cross pattern; discard screws with four marks' },
];

// ── Key dimensions & wear limits (QRG p.65–75) ─────────────────────
export const DIMENSIONS: TorqueRow[] = [
  { fastener: 'Cylinder head unevenness (bottom face)', spec: '0.1 mm (0.004 in) max' },
  { fastener: 'Cylinder block length', spec: '1052 mm (41.42 in)' },
  { fastener: 'Block height above crank center', spec: '422 mm (16.61 in)' },
  { fastener: 'Liner sealing surface above block face', spec: '0.15–0.21 mm (0.006–0.008 in)' },
  { fastener: 'Lower compression ring groove clearance', spec: '0.09–0.14 mm (0.0035–0.0055 in)' },
  { fastener: 'Oil scraper ring groove clearance', spec: '0.05–0.10 mm (0.0019–0.0039 in)' },
  { fastener: 'Valve lash, inlet (cold, adjust)', spec: '0.2 mm (0.008 in)' },
  { fastener: 'Valve lash, exhaust (cold, adjust)', spec: '0.8 mm (0.031 in)' },
  { fastener: 'Valve lash, exhaust w/ VEB (cold)', spec: '1.0 mm' },
  { fastener: 'Rocker arm bearing clearance', spec: '0.08 mm (0.003 in) max' },
  { fastener: 'Camshaft bearing journal, std', spec: '69.97–70.00 mm (2.754–2.760 in)' },
  { fastener: 'Camshaft max end float', spec: '0.24 mm (0.0094 in)' },
  { fastener: 'Valve lift at zero play, inlet', spec: '13.1 mm (0.520 in)' },
  { fastener: 'Unit injector stroke', spec: '18 mm (0.710 in)' },
  { fastener: 'Main bearing journal Ø, std', spec: '108.0 mm (4.25 in)' },
  { fastener: 'Connecting rod journal Ø, std', spec: '99.0 mm (3.898 in)' },
  { fastener: 'Crankshaft axial clearance', spec: '0.4 mm (0.016 in) max' },
  { fastener: 'Rod end play at crank journal', spec: '0.35 mm (0.0138 in) max' },
  { fastener: 'Idler-to-camshaft gear backlash', spec: '0.05–0.15 mm (0.002–0.006 in)' },
  { fastener: 'Oil pump gear backlash', spec: '0.05–0.40 mm (0.002–0.016 in)' },
  { fastener: 'Timing gear teeth (crank/idler/cam)', spec: '63 / 84 outer–56 inner / 84' },
];

// ── Lubricants & sealants (QRG p.52) ───────────────────────────────
export const LUBRICANTS: SpecRow[] = [
  { label: 'Oil filter seal', value: 'Clean engine oil' },
  { label: 'Valve stems and guides', value: 'Clean engine oil' },
  { label: 'Engine fasteners and washers', value: 'Clean engine oil' },
  { label: 'Cup / threaded plugs', value: 'Loctite 277 or Teflon thread sealer' },
  { label: 'Exhaust manifold studs', value: 'High-temp 1161929 anti-seize' },
  { label: 'Turbocharger mounting nuts', value: '1161929 anti-seize' },
  { label: 'O-rings (coolant, EPDM)', value: 'Clean coolant or Dow Corning 55' },
  { label: 'Front cover / flywheel housing', value: '3092340 sealant' },
  { label: 'Cylinder liner seat', value: '1161231 sealant' },
  { label: 'Crankshaft seals', value: 'MUST BE DRY MOUNTED — no oil, never reuse' },
  { label: 'Head gasket', value: 'Pre-coated; no sealing compound — clean & degrease' },
];

// ── Oil & filter change, factory procedure (QRG p.136–137) ─────────
export const OIL_CHANGE_PROCEDURE: string[] = [
  'Run the engine to normal operating temperature, shut off, and drain the oil before it cools.',
  'Thoroughly clean the area around the filters before removing.',
  'Remove the spin-on filters with filter wrench 9998487 (or equivalent); wipe the mounting base clean.',
  'Apply a film of clean engine oil to the sealing gasket on each new filter (install the filters themselves dry).',
  'Install the filters and tighten 3/4 to 1 turn after the gasket contacts the base.',
  'Fill the crankcase with the recommended oil (VDS-4 10W-30, 25–30 L sump).',
  'Start the engine, check for leaks, run ~5 minutes, shut off, recheck level and top up.',
];

export const OIL_LEVEL_CHECK: string[] = [
  'Park on level ground; do not overfill.',
  'Best checked COLD (before first start, or after ~2 h parked); at operating temp (>80 °C) wait 15 min after shutdown.',
  'Insert the dipstick fully; level must be between LOW and FULL, never above FULL.',
];

// ── Fastener / gasket reuse rules (QRG p.47–51) ────────────────────
export const REUSE_RULES: SpecRow[] = [
  { label: 'Oil pan special screws', value: 'No limit if no cracks, corrosion or damage' },
  { label: 'Main / rod cap screws', value: 'Discard when marked with four punch marks' },
  { label: 'Oil pan steel/rubber gasket', value: 'Reuse only if undamaged' },
  { label: 'Valve seals', value: 'Replace whenever removed' },
  { label: 'Crankshaft seals', value: 'Never reuse; mount dry' },
  { label: 'RTV sealant joints', value: 'Remove old sealant, clean, apply fresh' },
];

// ── Reference photos shipped with the app ──────────────────────────
export interface RefPhoto {
  src: string;
  caption: string;
}

export const REF_PHOTOS: RefPhoto[] = [
  { src: 'images/ref/oil-pan-exploded.png', caption: 'Oil pan exploded view — pan, gasket, stiffener, drain plug + washer, dipstick & tube, mounting bolts (assembly order and spacing)' },
  { src: 'images/ref/oil-pan-used-1.webp', caption: 'Used Volvo D13 steel oil pan — flange bolt holes around the full perimeter (22 screws)' },
  { src: 'images/ref/oil-pan-used-2.webp', caption: 'Used Volvo D13 oil pan — sump end with drain plug boss' },
  { src: 'images/ref/oil-pan-used-3.webp', caption: 'Used Volvo D13 oil pan — gasket flange detail' },
  { src: 'images/ref/d13-front-quarter.webp', caption: 'Volvo D13 — front quarter view: fan, damper, filters at lower right' },
  { src: 'images/ref/d13-render.webp', caption: 'Volvo D13 3D model render' },
  { src: 'images/ref/d13-render-2.jpg', caption: 'Volvo D13 3D model render — left side' },
];
