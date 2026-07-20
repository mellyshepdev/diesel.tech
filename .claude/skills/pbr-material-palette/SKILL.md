---
name: pbr-material-palette
description: Use whenever creating a THREE.MeshStandardMaterial (or similar) for a new engine/truck/toolbox part in EngineViewer.tsx. Provides a shared, reference-checked palette of real diesel-engine material finishes (cast iron, machined aluminum, powder coat, rubber, chrome, glass) so new parts match the color/roughness/metalness of parts already in the scene instead of each part inventing its own one-off values. Triggers on "what color should this be", "add material", "make it look metal/rubber/painted", or any new build* function reaching for MeshStandardMaterial.
---

# PBR Material Palette

Parts modeled in different sessions drift in material values even when the
geometry is correct — one part's "cast iron" ends up a different gray/rough
value than another part's "cast iron" modeled weeks later, and the engine
reads as mismatched even though each part is individually fine. This skill
is a shared palette so that stops happening.

## 1. Check for an existing material before writing a new one

Before calling `new THREE.MeshStandardMaterial({...})`, search
`EngineViewer.tsx` for a material already used for the same real-world
finish (grep color/roughness values near existing parts of the same
material family — e.g. the block/head casting, the oil pan stamped steel,
the valve cover). Reuse it (or a shared constant/factory if one exists)
rather than hand-picking new numbers that happen to look close.

## 2. Canonical finishes (starting palette — extend, don't fork)

Treat these as the base values for common diesel-engine finishes; adjust
only with a reason tied to a reference photo (e.g. "this casting is more
weathered/lighter in the photo"), not by feel:

- **Raw cast iron** (block, head, flywheel housing): dark neutral gray,
  fairly high roughness (~0.75-0.85), metalness low-moderate (~0.3-0.4) —
  cast surfaces scatter light, they don't shine.
- **Machined/faced aluminum** (valve cover, front cover, brackets): lighter
  gray, lower roughness (~0.35-0.5), higher metalness (~0.7-0.8) on faced
  surfaces; cast (unmachined) aluminum areas should use higher roughness
  like cast iron, not the same shiny value as the machined face.
- **Powder-coat / painted steel** (chassis rails, some covers): whatever
  base color the photo shows, roughness (~0.5-0.6), metalness low (~0.1-0.2)
  — paint is not metallic even over steel.
- **Rubber** (hoses, belts, mounts): near-black or dark colored, roughness
  high (~0.85-0.95), metalness ~0.
- **Chrome/polished** (stacks, some brackets): low roughness (~0.1-0.2),
  high metalness (~0.9+), and needs an environment map or the scene's
  existing lighting rig to read as reflective at all — flat chrome without
  reflection just looks light gray, check it actually reads as shiny in a
  render before accepting it.
- **Glass/lens** (gauges, mirrors): use existing glass material if the scene
  has one already (check truck interior/mirror parts first).

## 3. New finishes need a photo-cited reason

If a part needs a finish not covered above (e.g. a specific paint color, a
rusted/weathered look), cite the reference photo that shows it in a code
comment next to the material, same as geometry comments cite photos for
dimensions. "Looked about right" is not a value source for a real part's
material any more than it is for its dimensions.

## 4. Consistency check before calling a part done

After adding a new material, render it next to at least one already-existing
part of the same real finish (block casting next to another cast-iron part,
etc.) and confirm they read as the same material family under the same
lighting — not identical color necessarily (wear/dirt varies) but the same
roughness/metalness character. Mismatched material character between
adjacent same-finish parts is as visible an error as mismatched geometry.
