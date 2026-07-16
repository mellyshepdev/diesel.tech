// Guided step tracker for a repair. Adapted from the interactive-3d-engine
// simulator's ProcedurePanel: numbered steps with completed / current / pending
// states and the tool each step calls for. Steps are derived from EngineViewer's
// real physics state (filters off, plug pulled, oil drained, bolts out, pan
// dropped), so the tracker always reflects what's actually been done.

import { TOOLS, type Tool } from "./ToolPanel";

export interface ProcStep {
  id: number;
  label: string;
  done: boolean;
  /** step is mid-action (e.g. oil actively draining) */
  active?: boolean;
  requiredTool?: Tool | null;
  /** small progress hint, e.g. "2/8" */
  detail?: string;
}

export default function ProcedurePanel({
  title,
  steps,
}: {
  title: string;
  steps: ProcStep[];
}) {
  const doneCount = steps.filter((s) => s.done).length;
  const currentIndex = steps.findIndex((s) => !s.done);
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  return (
    <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">
          📋 Procedure — {title}
        </span>
        <span className="font-mono text-[11px] text-gray-400">
          {doneCount}/{steps.length}
        </span>
      </div>

      <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#00b4ff,#00ffaa)" }}
        />
      </div>

      <div className="space-y-1">
        {steps.map((step, i) => {
          const isCurrent = i === currentIndex;
          const circle = step.done
            ? "bg-green-600 text-white"
            : isCurrent || step.active
              ? "bg-amber-500 text-black animate-pulse"
              : "bg-gray-700 text-gray-300";
          const text = step.done
            ? "text-green-300 line-through"
            : isCurrent || step.active
              ? "text-white font-medium"
              : "text-gray-500";
          return (
            <div
              key={step.id}
              className={`flex gap-2.5 rounded-md p-1.5 ${isCurrent && !step.done ? "bg-amber-500/5" : ""}`}
            >
              <div
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${circle}`}
              >
                {step.done ? "✓" : step.id}
              </div>
              <div className="min-w-0">
                <p className={`text-[12px] leading-tight ${text}`}>
                  {step.label}
                  {step.detail && (
                    <span className="ml-1 font-mono text-[10px] text-gray-500">({step.detail})</span>
                  )}
                </p>
                {isCurrent && step.active && (
                  <span className="mt-0.5 inline-block text-[10px] text-amber-300">In progress…</span>
                )}
                {isCurrent && !step.active && step.requiredTool && (
                  <span className="mt-0.5 inline-block text-[10px] text-amber-400">
                    Required tool: {TOOLS[step.requiredTool].name}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
