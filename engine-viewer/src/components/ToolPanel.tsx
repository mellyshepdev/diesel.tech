// Floating tool chest (side buttons). The chest is hierarchical, like a real
// mechanic's box: top-level drawers (Sockets / Wrenches / Specialty / General),
// Sockets and Wrenches split into Metric vs Standard (SAE), and only then do
// you see the individual sizes. Clicking a size drops that tool into your TOOL
// TRAY; clicking a tool in the tray puts it in your hand (selects it).

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
  | "ratchet" | "extension" | "drainPan" | "funnel" | "screwdriver" | "key" | "towel";

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
  extension: { name: "Extension Bar", icon: "📏", desc: "Reach deep bolts" },
  drainPan: { name: "Drain Pan", icon: "🛢️", desc: "Catch draining oil" },
  funnel: { name: "Funnel", icon: "🫗", desc: "Pour new oil" },
  screwdriver: { name: "Screwdriver", icon: "🪛", desc: "Phillips / flat blade" },
  key: { name: "Truck Key", icon: "🔑", desc: "Unlocks the cab door" },
  towel: { name: "Towel / Rags", icon: "🧽", desc: "Clean surfaces" },
};

export const TOOL_ORDER = Object.keys(TOOLS) as Tool[];

// Drawer structure of the chest
const SOCKETS_METRIC: Tool[] = ["socket8", "socket10", "socket12", "socket13", "socket14", "socket15", "socket17", "socket19", "socket21", "socket24"];
const SOCKETS_STANDARD: Tool[] = ["socketS516", "socketS38", "socketS716", "socketS12", "socketS916", "socketS58", "socketS34", "socketS1316", "socketS78", "socketS1516"];
const WRENCHES_METRIC: Tool[] = ["wrenchM8", "wrenchM10", "wrenchM12", "wrenchM13", "wrenchM14", "wrenchM15", "wrenchM17", "wrenchM19", "wrenchM21", "wrenchM24"];
const WRENCHES_STANDARD: Tool[] = ["wrenchS516", "wrenchS38", "wrenchS716", "wrenchS12", "wrenchS916", "wrenchS58", "wrenchS34", "wrenchS1316", "wrenchS78", "wrenchS1516"];
const SPECIALTY: Tool[] = ["filterWrench", "lineWrench", "torqueWrench", "feelerGauge", "feeler36", "dialIndicator", "barringTool"];
const GENERAL: Tool[] = ["ratchet", "extension", "drainPan", "funnel", "screwdriver", "key", "towel"];

type ChestView =
  | "root"
  | "sockets" | "sockets-metric" | "sockets-standard"
  | "wrenches" | "wrenches-metric" | "wrenches-standard"
  | "specialty" | "general";

import { useState } from "react";

interface ToolPanelProps {
  selectedTool: Tool | null;
  /** Tools the mechanic has pulled into the tray. */
  tray: Tool[];
  /** Chest click: toggle a tool in/out of the tray. */
  onGrab: (tool: Tool) => void;
  /** Tray click: put the tool in your hand. */
  onSelect: (tool: Tool) => void;
  /** Tools the active repair calls for — highlighted with a "NEED" badge. */
  requiredTools?: Tool[];
  onClose?: () => void;
}

export default function ToolPanel({
  selectedTool,
  tray,
  onGrab,
  onSelect,
  requiredTools = [],
  onClose,
}: ToolPanelProps) {
  const [view, setView] = useState<ChestView>("root");

  const drawer = (label: string, icon: string, target: ChestView, count: number, needed: number) => (
    <button
      key={target}
      onClick={() => setView(target)}
      className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-all duration-200 ${
        needed > 0
          ? "bg-amber-500/15 border-amber-500/60"
          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-white">{label}</div>
        <div className="text-[11px] text-gray-400">{count} tools</div>
      </div>
      {needed > 0 && (
        <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
          NEED {needed}
        </span>
      )}
      <span className="text-gray-500">›</span>
    </button>
  );

  const toolButton = (tool: Tool) => {
    const info = TOOLS[tool];
    const inTray = tray.includes(tool);
    const isRequired = requiredTools.includes(tool);
    const cls = inTray
      ? "bg-green-600/20 border-green-500/60"
      : isRequired
        ? "bg-amber-500/15 border-amber-500/60 animate-pulse"
        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20";
    return (
      <button
        key={tool}
        onClick={() => onGrab(tool)}
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

  const neededIn = (tools: Tool[]) => requiredTools.filter(t => tools.includes(t) && !tray.includes(t)).length;

  const back = (to: ChestView, label: string) => (
    <button onClick={() => setView(to)} className="mb-2 flex items-center gap-1 px-1 text-[11px] font-semibold text-cyan-300 hover:text-white">
      ‹ {label}
    </button>
  );

  const listViews: Partial<Record<ChestView, { back: [ChestView, string]; title: string; tools: Tool[] }>> = {
    "sockets-metric":   { back: ["sockets", "Sockets"], title: "Metric Sockets", tools: SOCKETS_METRIC },
    "sockets-standard": { back: ["sockets", "Sockets"], title: "Standard (SAE) Sockets", tools: SOCKETS_STANDARD },
    "wrenches-metric":  { back: ["wrenches", "Wrenches"], title: "Metric Wrenches", tools: WRENCHES_METRIC },
    "wrenches-standard":{ back: ["wrenches", "Wrenches"], title: "Standard (SAE) Wrenches", tools: WRENCHES_STANDARD },
    "specialty":        { back: ["root", "Tool Chest"], title: "Specialty — Volvo Service Tools", tools: SPECIALTY },
    "general":          { back: ["root", "Tool Chest"], title: "General", tools: GENERAL },
  };
  const list = listViews[view];

  return (
    <div className="absolute left-4 top-32 z-30 w-72 max-h-[70vh] overflow-y-auto rounded-xl border border-cyan-400/25 bg-black/75 p-3 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-cyan-300">
          <span className="text-base">🧰</span> Tool Chest
        </span>
        {onClose && (
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-white">✕</button>
        )}
      </div>

      {/* ── Tool tray: what you've grabbed; click to put in hand ── */}
      <div className="mb-3 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.04] p-2">
        <div className="mb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
          🧲 Tool Tray {tray.length > 0 && <span className="text-gray-400">({tray.length})</span>}
        </div>
        {tray.length === 0 ? (
          <p className="px-1 text-[11px] text-gray-500">Empty — open a drawer and grab tools.</p>
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

      {/* ── Chest navigation ── */}
      {view === "root" && (
        <div className="space-y-1.5">
          {drawer("Sockets", "⚙️", "sockets", SOCKETS_METRIC.length + SOCKETS_STANDARD.length, neededIn([...SOCKETS_METRIC, ...SOCKETS_STANDARD]))}
          {drawer("Wrenches", "🔧", "wrenches", WRENCHES_METRIC.length + WRENCHES_STANDARD.length, neededIn([...WRENCHES_METRIC, ...WRENCHES_STANDARD]))}
          {drawer("Specialty — Volvo Tools", "🎯", "specialty", SPECIALTY.length, neededIn(SPECIALTY))}
          {drawer("General", "🛠️", "general", GENERAL.length, neededIn(GENERAL))}
        </div>
      )}

      {view === "sockets" && (
        <div className="space-y-1.5">
          {back("root", "Tool Chest")}
          {drawer("Metric Sockets", "⚙️", "sockets-metric", SOCKETS_METRIC.length, neededIn(SOCKETS_METRIC))}
          {drawer("Standard (SAE) Sockets", "⚙️", "sockets-standard", SOCKETS_STANDARD.length, neededIn(SOCKETS_STANDARD))}
        </div>
      )}

      {view === "wrenches" && (
        <div className="space-y-1.5">
          {back("root", "Tool Chest")}
          {drawer("Metric Wrenches", "🔧", "wrenches-metric", WRENCHES_METRIC.length, neededIn(WRENCHES_METRIC))}
          {drawer("Standard (SAE) Wrenches", "🔧", "wrenches-standard", WRENCHES_STANDARD.length, neededIn(WRENCHES_STANDARD))}
        </div>
      )}

      {list && (
        <div className="space-y-1.5">
          {back(...list.back)}
          <div className="px-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-300">{list.title}</div>
          {list.tools.map(toolButton)}
        </div>
      )}
    </div>
  );
}
