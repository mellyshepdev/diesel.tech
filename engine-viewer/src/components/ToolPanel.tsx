// Tool chest contents. The chest itself is a real 3D object in the scene
// (see buildVolvoD13's toolbox section) with physical drawers that slide
// open on click. This panel just shows what's inside whichever drawer is
// currently open — no flat UI navigation, the 3D drawers ARE the navigation.

export type Tool =
  // metric sockets
  | "socket8" | "socket10" | "socket12" | "socket13" | "socket14" | "socket15"
  | "socket17" | "socket19" | "socket21" | "socket24"
  // standard (SAE) sockets
  | "socketS516" | "socketS38" | "socketS716" | "socketS12" | "socketS916"
  | "socketS58" | "socketS34" | "socketS1316" | "socketS78" | "socketS1516"
  // metric wrenches
  | "wrenchM8" | "wrenchM10" | "wrenchM12" | "wrenchM13" | "wrenchM14" | "wrenchM15"
  | "wrenchM17" | "wrenchM19" | "wrenchM21" | "wrenchM24"
  // standard (SAE) wrenches
  | "wrenchS516" | "wrenchS38" | "wrenchS716" | "wrenchS12" | "wrenchS916"
  | "wrenchS58" | "wrenchS34" | "wrenchS1316" | "wrenchS78" | "wrenchS1516"
  // specialty
  | "filterWrench" | "lineWrench" | "torqueWrench" | "feelerGauge" | "feeler36"
  | "dialIndicator" | "barringTool"
  // general
  | "ratchet" | "snapOnRatchet" | "extension" | "drainPan" | "funnel" | "screwdriver" | "key" | "towel";

const mSock = (mm: number, desc: string) =>
  ({ name: `${mm}mm Socket`, icon: "⚙️", desc });
const sSock = (sz: string, desc: string) =>
  ({ name: `${sz}" Socket`, icon: "⚙️", desc });
const mWr = (mm: number) =>
  ({ name: `${mm}mm Combination Wrench`, icon: "🔧", desc: `Open + box end, ${mm}mm` });
const sWr = (sz: string) =>
  ({ name: `${sz}" Combination Wrench`, icon: "🔧", desc: `Open + box end, ${sz}"` });

export const TOOLS: Record<Tool, { name: string; icon: string; desc: string }> = {
  // ── metric sockets ──
  socket8: mSock(8, "Valve cover bolts"),
  socket10: mSock(10, "V-band clamp T-bolts"),
  socket12: mSock(12, "Brackets & clamps"),
  socket13: mSock(13, "Oil drain plug / plate springs"),
  socket14: mSock(14, "Adjusting screw locknuts"),
  socket15: mSock(15, "Pan / alternator bolts"),
  socket17: mSock(17, "Mounts & fittings"),
  socket19: mSock(19, "Frame & bracket bolts"),
  socket21: mSock(21, "Fuel filter housing"),
  socket24: mSock(24, "Large fittings"),
  // ── standard (SAE) sockets ──
  socketS516: sSock("5/16", "Hose clamps"),
  socketS38: sSock("3/8", "Light brackets"),
  socketS716: sSock("7/16", "Light brackets"),
  socketS12: sSock("1/2", "General fasteners"),
  socketS916: sSock("9/16", "General fasteners"),
  socketS58: sSock("5/8", "General fasteners"),
  socketS34: sSock("3/4", "Heavy fasteners"),
  socketS1316: sSock("13/16", "Heavy fasteners"),
  socketS78: sSock("7/8", "Heavy fasteners"),
  socketS1516: sSock("15/16", "Heavy fasteners"),
  // ── metric wrenches ──
  wrenchM8: mWr(8), wrenchM10: mWr(10), wrenchM12: mWr(12), wrenchM13: mWr(13),
  wrenchM14: { name: "14mm Combination Wrench", icon: "🔧", desc: "Holds adjusting screws while torquing locknuts" },
  wrenchM15: mWr(15), wrenchM17: mWr(17), wrenchM19: mWr(19), wrenchM21: mWr(21), wrenchM24: mWr(24),
  // ── standard (SAE) wrenches ──
  wrenchS516: sWr("5/16"), wrenchS38: sWr("3/8"), wrenchS716: sWr("7/16"),
  wrenchS12: sWr("1/2"), wrenchS916: sWr("9/16"), wrenchS58: sWr("5/8"),
  wrenchS34: sWr("3/4"), wrenchS1316: sWr("13/16"), wrenchS78: sWr("7/8"), wrenchS1516: sWr("15/16"),
  // ── specialty ──
  filterWrench: { name: "Filter Wrench 9998487", icon: "🔩", desc: "Spin-on filter removal" },
  lineWrench: { name: "Line Wrench", icon: "🔩", desc: "Oil & coolant line fittings" },
  torqueWrench: { name: "Torque Wrench", icon: "📐", desc: "Nm/ft-lb click-type — locknuts & covers" },
  feelerGauge: { name: "Feeler Gauge Set", icon: "📏", desc: "Valve lash: inlet 0.20mm, exhaust 0.80/1.0mm" },
  feeler36: { name: "3.6mm Feeler 85111377", icon: "📏", desc: "VEB brake-rocker roller-to-cam check" },
  dialIndicator: { name: "Dial Indicator Kit", icon: "🎯", desc: "9989876 + ext 85111493 + base 9999696" },
  barringTool: { name: "Turning Tool 88800014", icon: "🔄", desc: "Bar the engine over at the flywheel" },
  // ── general ──
  ratchet: { name: "Ratchet Wrench", icon: "🔧", desc: "Reversible ratchet drive" },
  snapOnRatchet: { name: "Snap-on Ratcheting Wrench", icon: "🔧", desc: "72-tooth reversible — takes 3\" or 6\" extensions" },
  extension: { name: "Extension Bar", icon: "📏", desc: "Reach deep bolts" },
  drainPan: { name: "Drain Pan", icon: "🛢️", desc: "Catch draining oil" },
  funnel: { name: "Funnel", icon: "🫗", desc: "Pour new oil" },
  screwdriver: { name: "Screwdriver", icon: "🪛", desc: "Phillips / flat blade" },
  key: { name: "Truck Key", icon: "🔑", desc: "Unlocks the cab door" },
  towel: { name: "Towel / Rags", icon: "🧽", desc: "Clean surfaces" },
};

export const TOOL_ORDER = Object.keys(TOOLS) as Tool[];

// Drawer contents — each key here corresponds 1:1 to a physical, openable
// drawer on the 3D toolbox (see buildVolvoD13). Opening the drawer in 3D
// shows its contents below; there's no separate flat menu to navigate.
const SOCKETS_METRIC: Tool[] = ["socket8", "socket10", "socket12", "socket13", "socket14", "socket15", "socket17", "socket19", "socket21", "socket24"];
const SOCKETS_STANDARD: Tool[] = ["socketS516", "socketS38", "socketS716", "socketS12", "socketS916", "socketS58", "socketS34", "socketS1316", "socketS78", "socketS1516"];
const WRENCHES_METRIC: Tool[] = ["wrenchM8", "wrenchM10", "wrenchM12", "wrenchM13", "wrenchM14", "wrenchM15", "wrenchM17", "wrenchM19", "wrenchM21", "wrenchM24"];
const WRENCHES_STANDARD: Tool[] = ["wrenchS516", "wrenchS38", "wrenchS716", "wrenchS12", "wrenchS916", "wrenchS58", "wrenchS34", "wrenchS1316", "wrenchS78", "wrenchS1516"];
const SPECIALTY: Tool[] = ["filterWrench", "lineWrench", "torqueWrench", "feelerGauge", "feeler36", "dialIndicator", "barringTool"];
const GENERAL: Tool[] = ["ratchet", "snapOnRatchet", "extension", "drainPan", "funnel", "screwdriver", "key", "towel"];

// Nothing is free — a brand-new tech's toolbox starts empty (`ownedTools`
// defaults to an empty Set in EngineViewer.tsx); every single tool has to be
// bought before it'll come out of the drawer, common sockets included. The
// two level-1 jobs (PM Service, Annual Inspection) are deliberately
// tool-free so there's always a way to earn the first coins.
// Sockets/combination wrenches/general hand tools are flat-priced (common,
// off-the-shelf items — price doesn't hinge on which exact size). Specialty
// tools scale with real-world rarity/specialization instead (a feeler gauge
// set is a ~$15 parts-store item; the 3.6mm 85111377 feeler is a
// single-purpose dealer-numbered gauge with no other use — priced
// accordingly), not with whether a repair currently checks for it in code
// (filterWrench/lineWrench are the only two that do — see
// REPAIR_REQUIRED_TOOL in EngineViewer.tsx — but the rest are still worth
// owning/collecting).
export const TOOL_PRICES: Partial<Record<Tool, number>> = {
  ...Object.fromEntries([...SOCKETS_METRIC, ...SOCKETS_STANDARD].map(t => [t, 20])),
  ...Object.fromEntries([...WRENCHES_METRIC, ...WRENCHES_STANDARD].map(t => [t, 20])),
  ratchet: 50,
  snapOnRatchet: 90, // the upgrade over the basic ratchet — 72-tooth reversible, takes extensions
  extension: 25,
  drainPan: 15,
  funnel: 10,
  screwdriver: 15,
  key: 20,
  towel: 5,
  filterWrench: 120,
  lineWrench: 150,
  feelerGauge: 80,
  torqueWrench: 150,
  dialIndicator: 220,
  barringTool: 200,
  feeler36: 250,
};

// Beyond affording it, rarer/pricier specialty tools also need the mechanic
// to have reached a minimum career level — a brand-new Lube Tech doesn't
// walk out with a dealer-only single-purpose gauge just because they saved
// up for one. Common sockets/wrenches/general tools have no level gate —
// anyone can walk into a parts store and buy one, it just costs money.
// Mirrors REPAIRS' unlockLevel gating in EngineViewer.tsx.
export const TOOL_MIN_LEVEL: Partial<Record<Tool, number>> = {
  filterWrench: 2,
  feelerGauge: 3,
  torqueWrench: 3,
  dialIndicator: 4,
  barringTool: 4,
  feeler36: 5,
  lineWrench: 6,
};

// Specialty + general merged into one "misc" drawer — a first-level tech's
// starter cart is 5 drawers (both socket drawers, both wrench drawers, and
// this one), not 6; there's no separate purchasable "specialty drawer"
// section anymore. Rarer specialty tools still gate on TOOL_PRICES/
// TOOL_MIN_LEVEL individually same as before, this only changes which
// physical drawer they're found in.
export const CATEGORY_TOOLS = {
  "sockets-metric": SOCKETS_METRIC,
  "sockets-standard": SOCKETS_STANDARD,
  "wrenches-metric": WRENCHES_METRIC,
  "wrenches-standard": WRENCHES_STANDARD,
  misc: [...SPECIALTY, ...GENERAL],
} as const;

export const CATEGORY_LABELS: Record<DrawerKey, string> = {
  "sockets-metric": "Metric Sockets",
  "sockets-standard": "Standard (SAE) Sockets",
  "wrenches-metric": "Metric Wrenches",
  "wrenches-standard": "Standard (SAE) Wrenches",
  misc: "Misc — General & Specialty Tools",
};

export type DrawerKey = keyof typeof CATEGORY_TOOLS;

interface ToolPanelProps {
  /** Which physical drawer is currently open — determines the contents shown. */
  drawerKey: DrawerKey;
  selectedTool: Tool | null;
  /** Tools the mechanic has pulled into the tray. */
  tray: Tool[];
  /** Tool click: toggle a tool in/out of the tray. */
  onGrab: (tool: Tool) => void;
  /** Tray click: put the tool in your hand. */
  onSelect: (tool: Tool) => void;
  /** Tools the active repair calls for — highlighted with a "NEED" badge. */
  requiredTools?: Tool[];
  /** Priced tools the mechanic hasn't bought yet — these render locked
   *  regardless of `requiredTools`, and clicking one buys it instead of
   *  grabbing it. Tools with no entry in TOOL_PRICES are always usable. */
  ownedTools: Set<Tool>;
  /** Coins on hand, shown on locked tools so it's clear whether they're
   *  affordable without leaving the drawer to check. */
  coins: number;
  /** Player's current career level (see mechanicLevel in EngineViewer.tsx) —
   *  gates the rarer specialty tools (TOOL_MIN_LEVEL) even if affordable. */
  mechanicLevel: number;
  /** Buy a priced, not-yet-owned tool (no-op if already owned, unaffordable,
   *  or under-leveled — EngineViewer enforces all three and reports back via
   *  serviceMsg). */
  onBuyTool: (tool: Tool) => void;
  /** Closes the panel AND slides the drawer shut in 3D. */
  onClose?: () => void;
}

export default function ToolPanel({
  drawerKey,
  selectedTool,
  tray,
  onGrab,
  onSelect,
  requiredTools = [],
  ownedTools,
  coins,
  mechanicLevel,
  onBuyTool,
  onClose,
}: ToolPanelProps) {
  const tools = CATEGORY_TOOLS[drawerKey];

  const toolButton = (tool: Tool) => {
    const info = TOOLS[tool];
    const price = TOOL_PRICES[tool];
    const locked = price !== undefined && !ownedTools.has(tool);
    const inTray = tray.includes(tool);
    const isRequired = requiredTools.includes(tool);
    if (locked) {
      const minLevel = TOOL_MIN_LEVEL[tool];
      const underLeveled = minLevel !== undefined && mechanicLevel < minLevel;
      const affordable = !underLeveled && coins >= price;
      return (
        <button
          key={tool}
          onClick={() => onBuyTool(tool)}
          title={underLeveled ? `Reach Level ${minLevel} to buy this` : affordable ? `Buy for ${price} coins` : `Need ${price - coins} more coins`}
          className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-left opacity-75 transition-all duration-200 hover:bg-white/5"
        >
          <span className="text-xl grayscale">🔒</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-gray-300">{info.name}</div>
            <div className="truncate text-[11px] text-gray-500">
              {underLeveled ? `Reach Level ${minLevel} to unlock` : info.desc}
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${underLeveled ? 'bg-white/10 text-gray-400' : affordable ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-400'}`}>
            {underLeveled ? `Lv.${minLevel}` : `🪙 ${price}`}
          </span>
        </button>
      );
    }
    const cls = inTray
      ? "bg-green-600/20 border-green-500/60"
      : isRequired
        ? "bg-amber-500/15 border-amber-500/60 animate-pulse"
        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20";
    return (
      <button
        key={tool}
        onClick={() => onGrab(tool)}
        title={inTray ? `${info.name} — click to remove from tray` : `${info.name} — click to add to tray`}
        className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-all duration-200 ${cls}`}
      >
        <span className="text-xl">{info.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-white">{info.name}</div>
          <div className="truncate text-[11px] text-gray-400">{info.desc}</div>
        </div>
        {isRequired && !inTray && (
          <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black">NEED</span>
        )}
        {inTray && (
          <span className="rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-black">IN TRAY</span>
        )}
      </button>
    );
  };

  return (
    <div className="absolute left-4 top-32 z-30 w-72 max-w-[92vw] max-h-[70vh] overflow-y-auto rounded-xl border border-cyan-400/25 bg-black/75 p-3 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-cyan-300">
          <span className="text-base">🧰</span> {CATEGORY_LABELS[drawerKey]}
        </span>
        {onClose && (
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-white" title="Close drawer">✕</button>
        )}
      </div>

      {/* ── Tool tray: what you've grabbed; click to put in hand ── */}
      <div className="mb-3 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.04] p-2">
        <div className="mb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
          🧲 Tool Tray {tray.length > 0 && <span className="text-gray-400">({tray.length})</span>}
        </div>
        {tray.length === 0 ? (
          <p className="px-1 text-[11px] text-gray-500">Empty — grab a tool from the drawer below.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {tray.map(tool => (
              <button
                key={tool}
                onClick={() => onSelect(tool)}
                title={TOOLS[tool].name}
                className={`flex items-center gap-1 rounded-md border px-1.5 py-1 text-[11px] transition-all ${
                  selectedTool === tool
                    ? "border-blue-500 bg-blue-600/30 text-white shadow shadow-blue-500/20"
                    : "border-white/15 bg-white/5 text-gray-200 hover:bg-white/15"
                }`}
              >
                <span>{TOOLS[tool].icon}</span>
                <span className="max-w-[88px] truncate">{TOOLS[tool].name.replace(" Combination Wrench", "").replace(" Socket", "")}
                  {tool.startsWith("socket") ? " skt" : tool.startsWith("wrench") ? " wr" : ""}</span>
                <span
                  onClick={e => { e.stopPropagation(); onGrab(tool); }}
                  className="ml-0.5 text-gray-500 hover:text-red-400"
                >✕</span>
              </button>
            ))}
          </div>
        )}
        <p className="mt-1 px-1 text-[10px] text-gray-500">
          {selectedTool ? `In hand: ${TOOLS[selectedTool].name}` : "Click a tray tool to put it in your hand."}
        </p>
      </div>

      {/* ── This drawer's contents ── */}
      <div className="space-y-1.5">
        {tools.map(toolButton)}
      </div>
    </div>
  );
}
