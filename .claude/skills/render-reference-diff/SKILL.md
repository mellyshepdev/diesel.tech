---
name: render-reference-diff
description: Use whenever a new or edited part in EngineViewer.tsx needs to be checked against its reference photo — this is the concrete screenshot-comparison mechanic that "visually verify before calling it done" (3d-part-fidelity, section 3) refers to. Triggers on "does this look right", "compare to the photo", "check the render", or before reporting any modeled part as finished.
---

# Render/Reference Diff Loop

A part isn't verified because the coordinates "should" produce the right
shape — it's verified because a render was actually held up against the
photo and the mismatches were found and fixed. This skill is the mechanics of
doing that, repeatably, instead of a one-off glance.

## 1. Match the camera to the photo before comparing anything

A render from a random orbit angle can't be compared to a fixed-angle photo.
Before screenshotting:

- Identify the reference photo's approximate viewpoint (straight side, straight
  front, 3/4 high, etc.) and set the debug camera to the same angle and
  roughly the same FOV. Reuse the `?bare=1` convention or add a similar
  query-flag for isolating just the part in question if the full scene
  clutters the comparison.
- If the photo is a 3/4 shot, don't compare it to a straight-on render and
  call differences "wrong" — match angle first, mismatch second.

## 2. Build the compare view, don't eyeball two separate windows

Prefer an actual overlay over side-by-side memory-comparison:

- A small local HTML page that stacks the reference photo at ~50% opacity
  over the render screenshot (same pixel dimensions), or a slider that wipes
  between them. This makes silhouette and proportion mismatches visible
  immediately instead of relying on memory to compare two images looked at
  seconds apart.
- If no headless screenshot tool is available in the environment, ask the
  user for a screenshot rather than skipping verification — "looks right to
  me" without an actual render is not verification.

## 3. Checklist, not vibes

Every diff pass writes down, explicitly:

- Silhouette: does the render's outline match the photo's outline at the
  same crop?
- Position: is each sub-feature at the same fraction of the anchor dimension
  (see `photo-anchor-measurement`) in both?
- Gaps/overlaps: anything touching in the photo that floats apart in the
  render, or vice versa?
- Presence: anything visible in one that's simply missing from the other
  (a bolt boss, a bracket, a hose fitting)?

Fix the single worst mismatch from the list, re-render, repeat. Do not batch
multiple fixes between renders — a batch of three fixes with one render at
the end hides which fix actually helped.

## 4. Minimum iteration count

Do at least 3 full render→compare→fix loops before presenting a part as
done, even if it "looks fine" after one pass — the first pass reliably
catches the big silhouette error and misses the smaller position/gap errors
that only show up once the big one is gone. After presenting, keep looping
on the user's feedback using the same mechanic rather than switching back to
eyeballing.
