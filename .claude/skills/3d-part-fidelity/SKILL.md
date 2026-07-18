---
name: 3d-part-fidelity
description: Use before modeling or editing any real-world truck/engine/toolbox geometry in engine-viewer (EngineViewer.tsx, buildVolvoD13, or any new build* function). Enforces reference-photo grounding, dimensional accuracy, visual verification, and realistic mechanism interactions instead of guessing geometry from general knowledge. Triggers on requests like "build the truck", "the cab doesn't look right", "add the interior", "model the hood/lever/dash", or any new physical part.
---

# 3D Part Fidelity

This project models a real, specific vehicle (a Volvo VNL 860 the user owns) and a
real D13 engine using hand-placed `THREE.BoxGeometry`/`CylinderGeometry` primitives
in `engine-viewer/src/EngineViewer.tsx`. Geometry built from "what a truck generally
looks like" instead of the user's actual truck is the single biggest source of
complaints in this project ("looks nothing like the real truck"). This skill exists
to stop that from happening again.

## 1. Never model a real part without a photo in the repo

Before writing geometry for any real-world part (truck cab, interior, dash,
toolbox, engine accessory, etc.):

1. `ls docs/reference/` and grep for the part. Open every candidate image with
   the `Read` tool (webp/png/jpg all render) — do not trust filenames alone,
   several existing reference images are named ambiguously (e.g.
   `730_a2014_0135.webp` is actually an engine photo, not a truck photo).
2. If no reference photo of that specific part/angle exists, **stop and ask the
   user for it** rather than building from memory or generic "truck-shaped"
   knowledge. Say explicitly what's missing (e.g. "no interior/dash photos —
   need at least the steering column area to place the hood-release lever").
3. When photos exist, cross-reference at least two angles before writing any
   geometry — a single 3/4 shot hides proportions that a straight-on shot
   reveals (and vice versa).

## 2. Match proportions, not vibes

Real vehicles have specific, checkable ratios. For each part, before coding:

- Measure rough ratios directly off the reference image (e.g. "cab height ≈
  1.1× hood length", "windshield rake ≈ 20° off vertical", "wheel diameter ≈
  0.4× frame rail height"). Write these ratios as a code comment next to the
  geometry, citing the reference filename — follow the existing convention
  already used for the oil pan (`EngineViewer.tsx` ~line 2022: "Modeled after
  the used D13 pan reference photos in public/images/ref/: ...").
- Reuse the existing scale basis already established for the engine (see the
  turbo comment ~line 207: "Scale basis: compressor scroll diameter D = 0.4
  scene units") — new parts must be sized consistently against parts already
  in the scene, not eyeballed independently.

## 3. Visually verify before calling it done

Geometry that only exists as coordinates you typed is unverified. Before
reporting a part as finished:

- Use the existing `?bare=1` query-flag convention (hides the truck body so
  the engine can be screenshotted alone — see `EngineViewer.tsx` ~line 2617)
  or add an equivalent flag for the new part if useful.
- Start the dev server (`npm run dev` in `engine-viewer/`) and use the
  `claude-in-chrome` tool (or the `run` skill) to actually load the scene,
  orbit to roughly match the reference photo's camera angle, and take a
  screenshot.
- Compare the screenshot against the reference photo side by side. Look for
  the failure modes that keep happening: wrong aspect ratio on the cab,
  missing/misplaced features, flat single-color surfaces where the real part
  has visible components. Iterate before declaring it done — do not just
  trust that the coordinates "should" look right.

## 4. Interaction fidelity — mechanisms must behave like the real ones

Per explicit user feedback, cosmetic accuracy isn't enough — the *interaction*
must match how the real mechanism actually works:

- **Hood release**: in the real truck, the hood only releases via a lever
  under the steering column/dash, reachable from inside the cab. Clicking the
  hood shell itself must NOT open it. Model the lever as its own named object
  (e.g. `truck-hood-lever`) inside the cab interior, only clickable once
  `inCab` is true, and route `clickHood()`-equivalent logic through that
  lever instead of (or in addition to, gated) the hood mesh. If the interior
  isn't modeled yet, that's a blocker for this — say so rather than faking it
  on the exterior hood.
- **Fastener turning (ratchet/socket)**: this is a two-phase interaction, not
  an instant click-to-remove:
  1. *Engage* — the socket must be visibly moved onto the bolt/nut head
     first (with the right tool in hand; wrong size shouldn't seat).
  2. *Turn* — only after seated, rotation happens via a sustained
     clockwise drag/sweep gesture (or repeated clicks simulating ratchet
     clicks), not a single instant click. Model this as pointer-drag angle
     tracking (accumulate drag angle around the fastener's screen position,
     same click-vs-drag distinction the canvas already uses via
     `onPointerDown`/`onPointerUp` and the 6px-move threshold) rather than
     firing the removal on pointerup alone.
- When adding a new mechanism, ask: "how does this actually work on the real
  machine?" before wiring a single click to the full result. If unsure, ask
  the user — don't assume a click is always the right interaction.

## 5. Existing conventions to reuse, not reinvent

- `add(geo, mat, opts)` helper in `buildVolvoD13` for creating+parenting+
  shadow-flagging meshes.
- Raycast click routing by name prefix: `service-`, `truck-`, `toolbox-`
  (see the ancestor-walk in the `pointerup` handler and `partClickRef`).
  Any new interactive object needs a prefixed name and a branch in
  `partClickRef.current`.
- Animation-driven state lives on `engineGroup.userData` and is advanced
  once per frame in the `animate()` loop — see `userData.hinges` (rotation
  lerp, used for door/hood swing) and `userData.slides` (position lerp, used
  for toolbox drawers) for the pattern to follow for any new animated state
  (e.g. a drag-rotated fastener, or the hood lever's own small motion).
