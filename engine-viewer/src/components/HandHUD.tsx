// First-person "in hand" HUD, FPS style: whatever tool is selected is drawn
// life-sized in the bottom-right corner, gripped by a mechanic's glove, so you
// can always see what you're holding. Sockets render ON the ratchet (with the
// 3"/10" extension in between when one is picked), like a real assembled drive.

import { TOOLS, type Tool } from "./ToolPanel";

interface HandHUDProps {
  tool: Tool | null;
  socketExt: "none" | "stubby" | "long";
}

/** "15mm Socket" → "15mm", '5/16" Socket' → '5/16"' */
const sizeOf = (tool: Tool) => TOOLS[tool].name.split(" ")[0];

// Shared gradient / material defs
const Defs = () => (
  <defs>
    <linearGradient id="hudChrome" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#8f979f" />
      <stop offset="0.35" stopColor="#e8edf2" />
      <stop offset="0.55" stopColor="#c3cad1" />
      <stop offset="1" stopColor="#767e87" />
    </linearGradient>
    <linearGradient id="hudSteel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#4a5058" />
      <stop offset="0.5" stopColor="#9aa2ab" />
      <stop offset="1" stopColor="#3d434b" />
    </linearGradient>
    <linearGradient id="hudBlack" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#15181d" />
      <stop offset="0.5" stopColor="#3a4048" />
      <stop offset="1" stopColor="#101318" />
    </linearGradient>
    <linearGradient id="hudRed" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#7e1d14" />
      <stop offset="0.45" stopColor="#e04a35" />
      <stop offset="1" stopColor="#6d160e" />
    </linearGradient>
    <linearGradient id="hudOrange" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#a34a08" />
      <stop offset="0.45" stopColor="#ff8c2e" />
      <stop offset="1" stopColor="#8f3d05" />
    </linearGradient>
  </defs>
);

/** Mechanic's glove gripping at ~y 370–445; drawn last so the fingers wrap the handle. */
const Glove = () => (
  <g>
    {/* sleeve / cuff */}
    <path d="M148 520 L148 436 Q148 420 164 418 L216 414 Q232 413 234 429 L244 520 Z" fill="#222d3d" />
    <path d="M150 444 L240 438" stroke="#182234" strokeWidth="4" fill="none" />
    {/* palm */}
    <ellipse cx="190" cy="410" rx="54" ry="48" fill="#33415a" />
    {/* thumb hooking around the near side */}
    <path d="M150 382 Q126 392 130 416 Q134 438 160 434 L176 426 L168 378 Z" fill="#3c4d6b" />
    {/* fingers wrapping the handle */}
    {[0, 1, 2, 3].map(i => (
      <rect
        key={i}
        x="146"
        y={370 + i * 18}
        width="84"
        height="16"
        rx="8"
        fill={i % 2 ? "#3d4e6b" : "#455879"}
        stroke="#2a3750"
        strokeWidth="1.5"
      />
    ))}
    {/* knuckle stitching */}
    <path d="M150 364 Q190 355 230 364" stroke="#22304a" strokeWidth="2.5" fill="none" />
  </g>
);

/** Chrome socket, drawn with its drive opening down at (180, bottomY), pointing up. */
const Socket = ({ bottomY, size }: { bottomY: number; size: string }) => {
  const h = 50;
  const top = bottomY - h;
  return (
    <g>
      <rect x="163" y={top} width="34" height={h} rx="5" fill="url(#hudSteel)" stroke="#2c3138" strokeWidth="1.5" />
      {/* hex opening at the business end */}
      <ellipse cx="180" cy={top} rx="17" ry="7" fill="#0c1016" />
      <ellipse cx="180" cy={top} rx="10" ry="4.5" fill="#1d232b" />
      {/* knurled band */}
      <rect x="163" y={bottomY - 16} width="34" height="7" fill="#31363d" />
      <text
        x="180"
        y={top + 30}
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fill="#1c2127"
        fontFamily="ui-monospace, monospace"
      >
        {size}
      </text>
    </g>
  );
};

/**
 * Ratchet handle + head; drive square top lands at y 138.
 * Styled off the mechanic's actual Snap-on reversible ratchet
 * (docs/reference/tools/snapon-ratchet-reference.jpg): drop-forged chrome
 * head with an etched "Snap-on" oval + ON marked reverse lever, a short
 * chrome shaft, then a black cushion-grip handle with a red ferrule collar,
 * red "Snap-on" wordmark, and a red buttcap tip.
 */
const RatchetBody = () => (
  <g>
    {/* chrome handle base (collar + buttcap show through at the ends) */}
    <rect x="168" y="268" width="24" height="240" rx="10" fill="url(#hudChrome)" stroke="#565d66" strokeWidth="1" />
    {/* red ferrule ring where the black grip meets the shaft */}
    <rect x="166" y="270" width="28" height="14" rx="5" fill="url(#hudRed)" stroke="#4a0d08" strokeWidth="1" />
    {/* black cushion grip (Snap-on's rubberized handle, not bare knurled chrome) */}
    <rect x="168" y="284" width="24" height="196" rx="10" fill="url(#hudBlack)" />
    {[0, 1, 2, 3, 4, 5, 6].map(i => (
      <line key={i} x1="170" y1={298 + i * 24} x2="190" y2={298 + i * 24} stroke="#000" strokeWidth="2" opacity="0.4" />
    ))}
    {/* "Snap-on" wordmark down the grip, red like the real handle */}
    <text
      x="180" y="388" textAnchor="middle" fontSize="11" fontWeight="800" fontStyle="italic"
      fill="#e0472f" fontFamily="ui-serif, Georgia, serif" transform="rotate(90 180 388)"
    >
      Snap-on
    </text>
    {/* red buttcap */}
    <rect x="168" y="480" width="24" height="28" rx="10" fill="url(#hudRed)" />
    {/* neck */}
    <rect x="173" y="205" width="14" height="70" fill="url(#hudChrome)" stroke="#565d66" strokeWidth="1" />
    {/* head */}
    <ellipse cx="180" cy="176" rx="31" ry="41" fill="url(#hudChrome)" stroke="#565d66" strokeWidth="1.5" />
    <circle cx="180" cy="172" r="16" fill="#3a4048" />
    <circle cx="180" cy="172" r="6" fill="#22262c" />
    {/* "Snap-on" stamp etched into the drop-forged head, per the reference photo */}
    <ellipse cx="180" cy="150" rx="17" ry="7" fill="none" stroke="#6b7280" strokeWidth="1" opacity="0.65" />
    <text x="180" y="152.5" textAnchor="middle" fontSize="6" fontWeight="700" fontStyle="italic" fill="#5b6470" fontFamily="ui-serif, Georgia, serif">
      Snap-on
    </text>
    {/* reverse switch, marked ON like the real ratchet's flip lever */}
    <ellipse cx="180" cy="194" rx="6.5" ry="5" fill="#20252b" stroke="#111418" strokeWidth="1" />
    <text x="180" y="196" textAnchor="middle" fontSize="4.5" fontWeight="800" fill="#8b939c">ON</text>
    {/* reverse lever */}
    <rect x="200" y="196" width="20" height="9" rx="4.5" transform="rotate(32 200 196)" fill="#31363d" />
    {/* 1/2" drive square sticking out the top */}
    <rect x="170" y="138" width="20" height="20" rx="2" fill="url(#hudSteel)" stroke="#2c3138" strokeWidth="1" />
  </g>
);

/** Full drive assembly: ratchet + optional extension + optional socket. */
const RatchetStack = ({ ext, socketSize }: { ext: "none" | "stubby" | "long"; socketSize?: string }) => {
  const extLen = ext === "long" ? 92 : ext === "stubby" ? 44 : 0;
  const stackTop = 140 - extLen; // where the socket's drive end sits
  return (
    <g>
      <RatchetBody />
      {extLen > 0 && (
        <g>
          <rect x="172" y={stackTop} width="16" height={extLen + 4} rx="3" fill="url(#hudChrome)" stroke="#565d66" strokeWidth="1" />
          <rect x="170" y={stackTop - 4} width="20" height="12" rx="2" fill="url(#hudSteel)" />
        </g>
      )}
      {socketSize && <Socket bottomY={stackTop + 6} size={socketSize} />}
    </g>
  );
};

const CombinationWrench = ({ size, flareNut }: { size: string; flareNut?: boolean }) => (
  <g>
    {/* shaft */}
    <rect x="170" y="160" width="20" height="348" rx="9" fill="url(#hudChrome)" stroke="#565d66" strokeWidth="1" />
    {/* box end up top (slotted when it's a line wrench) */}
    <circle cx="180" cy="122" r="34" fill="url(#hudChrome)" stroke="#565d66" strokeWidth="1.5" />
    <circle cx="180" cy="122" r="16" fill="#0d1420" />
    {flareNut && <rect x="172" y="82" width="16" height="26" fill="#0d1420" />}
    {/* open end peeking at the bottom, tucked behind the glove */}
    <path d="M162 500 L154 528 L168 528 L172 508 L188 508 L192 528 L206 528 L198 500 Z" fill="url(#hudChrome)" stroke="#565d66" strokeWidth="1" />
    <text
      x="0"
      y="0"
      transform="translate(184 320) rotate(-90)"
      textAnchor="middle"
      fontSize="15"
      fontWeight="800"
      fill="#4a5058"
      fontFamily="ui-monospace, monospace"
    >
      {size}
    </text>
  </g>
);

const TorqueWrench = () => (
  <g>
    {/* head + drive */}
    <ellipse cx="180" cy="150" rx="27" ry="36" fill="url(#hudChrome)" stroke="#565d66" strokeWidth="1.5" />
    <circle cx="180" cy="147" r="12" fill="#3a4048" />
    <rect x="171" y="98" width="18" height="20" rx="2" fill="url(#hudSteel)" stroke="#2c3138" strokeWidth="1" />
    {/* long shaft */}
    <rect x="168" y="182" width="24" height="180" rx="6" fill="url(#hudChrome)" stroke="#565d66" strokeWidth="1" />
    {/* scale section with setting window */}
    <rect x="165" y="300" width="30" height="80" rx="4" fill="url(#hudBlack)" stroke="#0c0f13" strokeWidth="1" />
    {[0, 1, 2, 3, 4].map(i => (
      <line key={i} x1="167" y1={308 + i * 15} x2="180" y2={308 + i * 15} stroke="#9aa2ab" strokeWidth="1.5" />
    ))}
    <rect x="170" y="330" width="26" height="20" rx="3" fill="#e8edf2" />
    <text x="183" y="345" textAnchor="middle" fontSize="12" fontWeight="800" fill="#15181d" fontFamily="ui-monospace, monospace">
      Nm
    </text>
    {/* knurled adjuster grip */}
    <rect x="166" y="382" width="28" height="126" rx="12" fill="url(#hudBlack)" stroke="#0c0f13" strokeWidth="1" />
    {[0, 1, 2, 3, 4, 5].map(i => (
      <line key={i} x1="168" y1={392 + i * 19} x2="192" y2={392 + i * 19} stroke="#000" strokeWidth="2" opacity="0.55" />
    ))}
  </g>
);

const FilterWrench = () => (
  <g>
    {/* fluted cap cup, opening up — Volvo 9998487 style */}
    <path d="M116 96 L244 96 L230 196 L130 196 Z" fill="url(#hudSteel)" stroke="#2c3138" strokeWidth="1.5" />
    {[0, 1, 2, 3, 4, 5, 6].map(i => (
      <line key={i} x1={126 + i * 18} y1="100" x2={132 + i * 16} y2="192" stroke="#31363d" strokeWidth="2.5" />
    ))}
    <ellipse cx="180" cy="96" rx="64" ry="14" fill="#12161c" />
    <ellipse cx="180" cy="96" rx="52" ry="10" fill="#1e242c" />
    {/* square-drive boss + handle */}
    <rect x="170" y="196" width="20" height="22" rx="2" fill="url(#hudSteel)" />
    <rect x="169" y="216" width="22" height="292" rx="9" fill="url(#hudChrome)" stroke="#565d66" strokeWidth="1" />
  </g>
);

const FeelerGauge = ({ single }: { single?: boolean }) => (
  <g>
    {(single ? [0] : [-26, -13, 0, 13, 26]).map(a => (
      <rect
        key={a}
        x={single ? 172 : 175}
        y="128"
        width={single ? 16 : 10}
        height="180"
        rx="4"
        fill="url(#hudChrome)"
        stroke="#565d66"
        strokeWidth="1"
        transform={`rotate(${a} 180 308)`}
      />
    ))}
    <text x="180" y="120" textAnchor="middle" fontSize="14" fontWeight="800" fill="#c3cad1" fontFamily="ui-monospace, monospace">
      {single ? "3.6mm" : "0.20"}
    </text>
    {/* holder */}
    <rect x="160" y="300" width="40" height="160" rx="10" fill="url(#hudBlack)" stroke="#0c0f13" strokeWidth="1.5" />
    <circle cx="180" cy="318" r="6" fill="#565d66" />
  </g>
);

const DialIndicator = () => (
  <g>
    {/* dial face */}
    <circle cx="180" cy="160" r="66" fill="url(#hudChrome)" stroke="#565d66" strokeWidth="2" />
    <circle cx="180" cy="160" r="56" fill="#f2f4f6" stroke="#767e87" strokeWidth="1.5" />
    {Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      return (
        <line
          key={i}
          x1={180 + Math.sin(a) * 46}
          y1={160 - Math.cos(a) * 46}
          x2={180 + Math.sin(a) * 53}
          y2={160 - Math.cos(a) * 53}
          stroke="#15181d"
          strokeWidth="2.5"
        />
      );
    })}
    <line x1="180" y1="160" x2="196" y2="118" stroke="#cc2200" strokeWidth="3" />
    <circle cx="180" cy="160" r="5" fill="#15181d" />
    <text x="180" y="196" textAnchor="middle" fontSize="11" fontWeight="700" fill="#3a4048" fontFamily="ui-monospace, monospace">
      0.01mm
    </text>
    {/* stem + contact plunger */}
    <rect x="175" y="226" width="10" height="150" rx="4" fill="url(#hudSteel)" />
    <rect x="172" y="370" width="16" height="140" rx="7" fill="url(#hudChrome)" stroke="#565d66" strokeWidth="1" />
  </g>
);

const BarringTool = () => (
  <g>
    {/* engagement body that keys into the flywheel housing */}
    <rect x="146" y="120" width="68" height="130" rx="12" fill="url(#hudSteel)" stroke="#2c3138" strokeWidth="1.5" />
    {[0, 1, 2].map(i => (
      <rect key={i} x="146" y={140 + i * 36} width="68" height="8" fill="#31363d" />
    ))}
    {/* 1/2" drive square on top for the breaker bar */}
    <rect x="170" y="98" width="20" height="24" rx="2" fill="url(#hudBlack)" />
    <text x="180" y="278" textAnchor="middle" fontSize="11" fontWeight="700" fill="#9aa2ab" fontFamily="ui-monospace, monospace">
      88800014
    </text>
    {/* shaft into the hand */}
    <rect x="170" y="250" width="20" height="258" rx="9" fill="url(#hudChrome)" stroke="#565d66" strokeWidth="1" />
  </g>
);

const Screwdriver = () => (
  <g>
    {/* flat blade tip up */}
    <path d="M172 66 L188 66 L185 92 L175 92 Z" fill="url(#hudChrome)" />
    <rect x="176" y="88" width="8" height="270" fill="url(#hudSteel)" />
    {/* fluted red handle in the fist */}
    <rect x="156" y="352" width="48" height="156" rx="18" fill="url(#hudRed)" stroke="#54100a" strokeWidth="1.5" />
    {[0, 1, 2].map(i => (
      <rect key={i} x={164 + i * 12} y="360" width="5" height="140" rx="2.5" fill="#54100a" opacity="0.55" />
    ))}
  </g>
);

const DrainPan = () => (
  <g transform="rotate(-6 180 260)">
    {/* body wall */}
    <path d="M44 256 L58 330 Q180 372 302 330 L316 256 Z" fill="#15202c" stroke="#0b1118" strokeWidth="2" />
    {/* rim + old-oil sheen */}
    <ellipse cx="180" cy="256" rx="136" ry="46" fill="#1d2a38" stroke="#0b1118" strokeWidth="3" />
    <ellipse cx="180" cy="258" rx="118" ry="36" fill="#0a0d08" />
    <ellipse cx="150" cy="250" rx="42" ry="12" fill="#2a2410" opacity="0.8" />
  </g>
);

const Funnel = () => (
  <g>
    <ellipse cx="180" cy="122" rx="92" ry="26" fill="url(#hudOrange)" stroke="#7c3504" strokeWidth="2" />
    <ellipse cx="180" cy="122" rx="76" ry="19" fill="#402005" />
    <path d="M92 128 L268 128 L198 282 L162 282 Z" fill="url(#hudOrange)" stroke="#7c3504" strokeWidth="2" />
    <rect x="162" y="280" width="36" height="150" rx="10" fill="url(#hudOrange)" stroke="#7c3504" strokeWidth="2" />
  </g>
);

const TruckKey = () => (
  <g>
    {/* blade with cut notches */}
    <path d="M167 268 L167 84 Q167 68 180 68 Q193 68 193 84 L193 108 L184 116 L193 126 L193 148 L185 156 L193 166 L193 268 Z" fill="url(#hudChrome)" stroke="#565d66" strokeWidth="1.5" />
    <line x1="176" y1="80" x2="176" y2="262" stroke="#767e87" strokeWidth="3" />
    {/* fob */}
    <rect x="128" y="262" width="104" height="180" rx="22" fill="#171b21" stroke="#2c333d" strokeWidth="2.5" />
    {/* iron-mark style badge */}
    <circle cx="180" cy="316" r="28" fill="#20262e" stroke="#8a929c" strokeWidth="3" />
    <line x1="158" y1="330" x2="202" y2="302" stroke="#8a929c" strokeWidth="5" />
    {/* lock / unlock buttons */}
    <rect x="146" y="368" width="30" height="20" rx="7" fill="#2e3540" stroke="#454e5c" strokeWidth="1.5" />
    <rect x="184" y="368" width="30" height="20" rx="7" fill="#2e3540" stroke="#454e5c" strokeWidth="1.5" />
    <text x="161" y="382" textAnchor="middle" fontSize="11" fill="#9aa2ab">🔒</text>
    <text x="199" y="382" textAnchor="middle" fontSize="11" fill="#9aa2ab">🔓</text>
  </g>
);

const Towel = () => (
  <g>
    <path
      d="M118 136 Q76 240 140 302 Q114 366 168 432 L236 432 Q266 348 240 302 Q296 218 244 146 Q182 112 118 136 Z"
      fill="#a83232"
      stroke="#6d1c1c"
      strokeWidth="2.5"
    />
    <path d="M140 170 Q170 230 150 290" stroke="#6d1c1c" strokeWidth="3" fill="none" opacity="0.7" />
    <path d="M200 160 Q230 230 205 300" stroke="#6d1c1c" strokeWidth="3" fill="none" opacity="0.7" />
    <path d="M170 310 Q200 360 185 420" stroke="#6d1c1c" strokeWidth="3" fill="none" opacity="0.7" />
  </g>
);

const ExtensionBar = () => (
  <g>
    <rect x="171" y="130" width="18" height="378" rx="6" fill="url(#hudChrome)" stroke="#565d66" strokeWidth="1" />
    <rect x="173" y="100" width="14" height="34" rx="2" fill="url(#hudSteel)" stroke="#2c3138" strokeWidth="1" />
    <rect x="166" y="216" width="28" height="14" rx="4" fill="url(#hudSteel)" />
  </g>
);

function toolArt(tool: Tool, socketExt: "none" | "stubby" | "long") {
  if (tool.startsWith("socket")) return <RatchetStack ext={socketExt} socketSize={sizeOf(tool)} />;
  if (tool.startsWith("wrench")) return <CombinationWrench size={sizeOf(tool)} />;
  switch (tool) {
    case "ratchet": return <RatchetStack ext="none" />;
    case "extension": return <ExtensionBar />;
    case "filterWrench": return <FilterWrench />;
    case "lineWrench": return <CombinationWrench size="line" flareNut />;
    case "torqueWrench": return <TorqueWrench />;
    case "feelerGauge": return <FeelerGauge />;
    case "feeler36": return <FeelerGauge single />;
    case "dialIndicator": return <DialIndicator />;
    case "barringTool": return <BarringTool />;
    case "screwdriver": return <Screwdriver />;
    case "drainPan": return <DrainPan />;
    case "funnel": return <Funnel />;
    case "key": return <TruckKey />;
    case "towel": return <Towel />;
  }
}

function handLabel(tool: Tool, socketExt: "none" | "stubby" | "long") {
  if (tool.startsWith("socket")) {
    const ext = socketExt === "long" ? ' + 10" ext' : socketExt === "stubby" ? ' + 3" ext' : "";
    return `${sizeOf(tool)} Socket on Ratchet${ext}`;
  }
  return TOOLS[tool].name;
}

export default function HandHUD({ tool, socketExt }: HandHUDProps) {
  if (!tool) return null;
  return (
    <div
      key={`${tool}-${socketExt}`}
      className="hand-hud-enter pointer-events-none absolute bottom-0 right-0 z-10 select-none"
      // Sized off width AND height: the SVG's ~360:520 aspect ratio means a
      // pure `vw` width (the old formula) blows up to cover a short, wide
      // "widescreen" mobile-landscape viewport where height, not width, is
      // the scarce dimension. Capping via `min(30vw, 48vh)` keeps the
      // rendered tool's height under ~0.48*1.44 ≈ 70% of viewport height.
      style={{ width: "clamp(180px, min(30vw, 48vh), 400px)" }}
      aria-label={`In hand: ${handLabel(tool, socketExt)}`}
    >
      <div className="hand-hud-bob">
        <div className="mb-1 flex justify-center">
          <span className="rounded-full border border-cyan-400/30 bg-black/70 px-3 py-1 text-[11px] font-bold tracking-wide text-cyan-200 backdrop-blur-sm">
            🖐 {handLabel(tool, socketExt)}
          </span>
        </div>
        <svg viewBox="0 0 360 520" className="block h-auto w-full drop-shadow-[0_8px_24px_rgba(0,0,0,0.65)]">
          <Defs />
          <g transform="rotate(-13 190 430)">
            {toolArt(tool, socketExt)}
            <Glove />
          </g>
        </svg>
      </div>
    </div>
  );
}
