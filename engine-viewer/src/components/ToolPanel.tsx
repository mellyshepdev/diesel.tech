// Floating toolbox panel (side buttons). Ported from the interactive-3d-engine
// simulator reference, restyled to match the viewer's glass overlays and made
// self-contained (no external store) so it wires to EngineViewer's local state.

export type Tool =
  | "ratchet"
  | "socket8"
  | "socket10"
  | "socket13"
  | "socket15"
  | "socket21"
  | "extension"
  | "drainPan"
  | "filterWrench"
  | "funnel"
  | "screwdriver"
  | "lineWrench"
  | "towel";

export const TOOLS: Record<Tool, { name: string; icon: string; desc: string }> = {
  ratchet: { name: "Ratchet Wrench", icon: "🔧", desc: "Reversible ratchet drive" },
  socket8: { name: "8mm Socket", icon: "⚙️", desc: "Valve cover bolts" },
  socket10: { name: "10mm Socket", icon: "⚙️", desc: "V-band clamp T-bolts" },
  socket13: { name: "13mm Socket", icon: "⚙️", desc: "Oil drain plug" },
  socket15: { name: "15mm Socket", icon: "⚙️", desc: "Pan / alternator bolts" },
  socket21: { name: "21mm Socket", icon: "⚙️", desc: "Fuel filter housing" },
  extension: { name: "Extension Bar", icon: "📏", desc: "Reach deep bolts" },
  drainPan: { name: "Drain Pan", icon: "🛢️", desc: "Catch draining oil" },
  filterWrench: { name: "Filter Wrench", icon: "🔩", desc: "Spin-on filter removal" },
  funnel: { name: "Funnel", icon: "🫗", desc: "Pour new oil" },
  screwdriver: { name: "Screwdriver", icon: "🪛", desc: "Phillips / flat blade" },
  lineWrench: { name: "Line Wrench", icon: "🔩", desc: "Oil & coolant line fittings" },
  towel: { name: "Towel / Rags", icon: "🧽", desc: "Clean surfaces" },
};

export const TOOL_ORDER = Object.keys(TOOLS) as Tool[];

interface ToolPanelProps {
  selectedTool: Tool | null;
  onSelect: (tool: Tool) => void;
  /** Tools the active repair calls for — highlighted with a "NEED" badge. */
  requiredTools?: Tool[];
  onClose?: () => void;
}

export default function ToolPanel({
  selectedTool,
  onSelect,
  requiredTools = [],
  onClose,
}: ToolPanelProps) {
  return (
    <div className="absolute left-4 top-32 z-30 w-72 max-h-[65vh] overflow-y-auto rounded-xl border border-cyan-400/25 bg-black/75 p-3 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-cyan-300">
          <span className="text-base">🧰</span> Toolbox
        </span>
        {onClose && (
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-white">
            ✕
          </button>
        )}
      </div>

      <p className="mb-2 px-1 text-[11px] text-blue-300">
        {selectedTool ? `Selected: ${TOOLS[selectedTool].name}` : "Select a tool to use"}
      </p>

      <div className="space-y-1.5">
        {TOOL_ORDER.map((tool) => {
          const info = TOOLS[tool];
          const isSelected = selectedTool === tool;
          const isRequired = requiredTools.includes(tool);
          const cls = isSelected
            ? "bg-blue-600/25 border-blue-500 shadow-lg shadow-blue-500/10"
            : isRequired
              ? "bg-amber-500/15 border-amber-500/60 animate-pulse"
              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20";
          return (
            <button
              key={tool}
              onClick={() => onSelect(tool)}
              className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-all duration-200 ${cls}`}
            >
              <span className="text-xl">{info.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-white">{info.name}</div>
                <div className="truncate text-[11px] text-gray-400">{info.desc}</div>
              </div>
              {isRequired && !isSelected && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
                  NEED
                </span>
              )}
              {isSelected && (
                <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
