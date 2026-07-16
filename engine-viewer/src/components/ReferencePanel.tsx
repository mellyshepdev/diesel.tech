// Factory reference drawer: every spec, torque, dimension, procedure and
// photo pulled from the Volvo D13 documents in the repo (QRG PV776-QRG07-D13F
// and the 2017 D13 spec sheet). Data lives in ../data/d13Reference.ts.

import { useState } from 'react';
import {
  ENGINE_SPEC,
  RATINGS,
  OIL_SYSTEM,
  OIL_FLOW_PATH,
  OIL_VALVES,
  TORQUE_SPECS,
  DIMENSIONS,
  LUBRICANTS,
  OIL_CHANGE_PROCEDURE,
  OIL_LEVEL_CHECK,
  TURBO_SPEC,
  TURBO_REMOVAL,
  TURBO_INSTALL,
  REUSE_RULES,
  REF_PHOTOS,
  type SpecRow,
  type TorqueRow,
} from '../data/d13Reference';

type Tab = 'specs' | 'ratings' | 'oil' | 'torque' | 'dims' | 'service' | 'photos';

const TABS: { id: Tab; label: string }[] = [
  { id: 'specs', label: 'Specs' },
  { id: 'ratings', label: 'Ratings' },
  { id: 'oil', label: 'Oil System' },
  { id: 'torque', label: 'Torque' },
  { id: 'dims', label: 'Dimensions' },
  { id: 'service', label: 'Service' },
  { id: 'photos', label: 'Photos' },
];

function Rows({ rows }: { rows: SpecRow[] }) {
  return (
    <div className="space-y-1.5">
      {rows.map(r => (
        <div key={r.label} className="flex items-start justify-between gap-3">
          <span className="text-gray-500 text-[11px] leading-snug">{r.label}</span>
          <span className="text-white text-[11px] font-mono text-right leading-snug">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function TorqueRows({ rows }: { rows: TorqueRow[] }) {
  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div key={r.fastener} className="border-b border-white/5 pb-1.5">
          <div className="flex items-start justify-between gap-3">
            <span className="text-gray-400 text-[11px] leading-snug">{r.fastener}</span>
            <span className="text-cyan-300 text-[11px] font-mono text-right whitespace-nowrap">{r.spec}</span>
          </div>
          {r.note && <p className="text-gray-600 text-[10px] mt-0.5">{r.note}</p>}
        </div>
      ))}
    </div>
  );
}

function Steps({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div>
      <p className="text-cyan-300 text-[11px] font-bold uppercase tracking-widest mb-1.5">{title}</p>
      <ol className="space-y-1">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2 text-[11px] text-gray-300 leading-snug">
            <span className="text-gray-600 font-mono">{i + 1}.</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function ReferencePanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('specs');
  const [photo, setPhoto] = useState<number | null>(null);

  return (
    <div className="absolute left-4 top-32 w-[22rem] max-h-[68vh] flex flex-col bg-black/80 backdrop-blur-md border border-cyan-400/25 rounded-xl z-30">
      <div className="flex items-center justify-between p-3 pb-2">
        <span className="text-cyan-300 text-xs font-bold tracking-widest uppercase">📖 D13 Factory Reference</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-sm">✕</button>
      </div>
      <div className="flex flex-wrap gap-1 px-3 pb-2">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider ${
              tab === t.id
                ? 'text-cyan-300 border-cyan-400/60 bg-cyan-400/10'
                : 'text-gray-500 border-gray-700 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto px-3 pb-3 space-y-3">
        {tab === 'specs' && <Rows rows={ENGINE_SPEC} />}

        {tab === 'ratings' && (
          <div className="space-y-2">
            {RATINGS.map(r => (
              <div key={r.designation} className="border-b border-white/5 pb-1.5">
                <div className="flex justify-between">
                  <span className="text-white text-[11px] font-bold font-mono">{r.designation}</span>
                  <span className="text-cyan-300 text-[11px] font-mono">{r.hp}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>power @ {r.hpRpm} rpm</span>
                  <span>{r.torque} rpm</span>
                </div>
              </div>
            ))}
            <p className="text-gray-600 text-[10px]">EPA2007 D13F ratings. 2017 D13: 375–500 hp, up to 1850 lb-ft, cruise sweet spot 1375 rpm @ 65 mph.</p>
          </div>
        )}

        {tab === 'oil' && (
          <>
            <Rows rows={OIL_SYSTEM} />
            <div>
              <p className="text-cyan-300 text-[11px] font-bold uppercase tracking-widest mb-1">Oil flow path</p>
              <p className="text-gray-300 text-[11px] leading-relaxed">{OIL_FLOW_PATH.join(' → ')}</p>
            </div>
            <div>
              <p className="text-cyan-300 text-[11px] font-bold uppercase tracking-widest mb-1">Control valves</p>
              <Rows rows={OIL_VALVES} />
            </div>
          </>
        )}

        {tab === 'torque' && <TorqueRows rows={TORQUE_SPECS} />}

        {tab === 'dims' && <TorqueRows rows={DIMENSIONS} />}

        {tab === 'service' && (
          <>
            <Steps title="Oil & filter change (factory)" steps={OIL_CHANGE_PROCEDURE} />
            <Steps title="Oil level check" steps={OIL_LEVEL_CHECK} />
            <div>
              <p className="text-cyan-300 text-[11px] font-bold uppercase tracking-widest mb-1">Turbocharger</p>
              <Rows rows={TURBO_SPEC} />
            </div>
            <Steps title="Turbo removal" steps={TURBO_REMOVAL} />
            <Steps title="Turbo install" steps={TURBO_INSTALL} />
            <div>
              <p className="text-cyan-300 text-[11px] font-bold uppercase tracking-widest mb-1">Reuse rules</p>
              <Rows rows={REUSE_RULES} />
            </div>
            <div>
              <p className="text-cyan-300 text-[11px] font-bold uppercase tracking-widest mb-1">Lubricants & sealants</p>
              <Rows rows={LUBRICANTS} />
            </div>
          </>
        )}

        {tab === 'photos' && (
          <div className="grid grid-cols-2 gap-2">
            {REF_PHOTOS.map((p, i) => (
              <button key={p.src} onClick={() => setPhoto(i)} className="text-left group">
                <img
                  src={p.src}
                  alt={p.caption}
                  className="w-full h-20 object-cover rounded border border-white/10 group-hover:border-cyan-400/50 transition"
                  loading="lazy"
                />
                <p className="text-gray-500 text-[9px] mt-0.5 leading-tight line-clamp-2">{p.caption}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Photo lightbox */}
      {photo !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
          onClick={() => setPhoto(null)}
        >
          <div className="max-w-3xl max-h-full">
            <img src={REF_PHOTOS[photo].src} alt={REF_PHOTOS[photo].caption} className="max-h-[80vh] w-auto mx-auto rounded-lg" />
            <p className="text-gray-300 text-xs text-center mt-2">{REF_PHOTOS[photo].caption}</p>
            <p className="text-gray-600 text-[10px] text-center mt-1">tap anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
