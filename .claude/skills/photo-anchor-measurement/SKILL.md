---
name: photo-anchor-measurement
description: Use before writing any dimension into EngineViewer.tsx (or any build* function) that came from a reference photo rather than a spec sheet. Turns "eyeball a ratio" into a repeatable pixel-measurement procedure with an explicit anchor dimension, so every part's size is traceable back to a photo and a number instead of a guess. Triggers on "measure this from the photo", "how big should X be", "what's the ratio", or any new part whose only source is an image.
---

# Photo Anchor Measurement

Ratios eyeballed once and never rechecked are the second-biggest source of
"doesn't look like the real thing" complaints in this project, right behind
missing reference photos entirely (see `3d-part-fidelity`). This skill is the
actual measurement procedure — use it every time a dimension comes from a
photo instead of a spec sheet.

## 1. Pick ONE anchor per part family, reuse it

Before measuring anything new, check whether an anchor already exists for
this part family (e.g. the turbo's "compressor scroll diameter D = 0.4 scene
units" comment near `EngineViewer.tsx` ~line 207, or the block/crank anchor
used for the oil pan). New parts that bolt to or sit near an already-anchored
part must derive their size from that same anchor, not a fresh one — this is
what keeps the whole engine internally consistent.

If no anchor exists yet for this area of the engine, pick the most
confidently-known dimension in the reference photo (a bolt head of a known
standard size, a published block dimension, a part with a spec-sheet number)
and record it as the new anchor in a code comment, same style as existing
ones.

## 2. Measure in pixels, convert once

1. Open the reference photo with `Read` and identify the anchor's pixel span
   and the target dimension's pixel span in the *same photo* (never mix
   measurements taken from two different photos/angles — perspective differs).
2. `ratio = target_px / anchor_px`
3. `target_real = ratio * anchor_real_value`
4. Write both the pixel measurement and the resulting real-world number in
   the code comment, citing the reference filename — e.g. `// starter motor
   housing diameter ≈ 210px / 480px (block width) × 0.42m block width = 0.18m
   — measured off starter-3q.jpg`. A ratio with no source photo cited is not
   an acceptable comment.

## 3. Flag distortion instead of measuring through it

- Prefer the flattest, longest-lens, most head-on shot for measuring. Wide-angle
  and close-up 3/4 shots exaggerate near features and compress far ones —
  measuring a compressor mounted near the camera against a crank pulley far
  from it in the same wide shot will be wrong.
- If every available photo of a part has visible barrel/perspective distortion,
  say so explicitly in the comment (`// distorted wide shot, ±15% confidence`)
  rather than presenting a distorted-photo measurement as equally reliable to
  a clean one.
- Two independent measurements (different photos, different angles) that
  agree within ~10% confirm the number. Disagreement bigger than that means
  stop and get a better photo or ask the user, don't average and move on.

## 4. Record measurements where the next edit can find them

Keep a running measurement table for the part being built (scratch file or a
block comment above the relevant `build*` function) so a later pass adding a
neighboring part (e.g. the bracket that holds this part to the block) can
reuse the same numbers instead of re-deriving them from scratch or drifting
slightly off. This is what makes parts modeled in separate sessions still fit
together.
