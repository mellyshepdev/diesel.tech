# Part Manifest — EngineViewer.tsx scene graph

Registry required by the `part-manifest-registry` skill. One row per named
top-level part/sub-assembly in `engine-viewer/src/EngineViewer.tsx`. This is
additive only — never delete or rewrite a row for a part that still exists;
if a part is reworked, add a new row noting what superseded what.

Backfilled 2026-07-20 from every existing `.name = '...'` assignment in the
file (ground truth — see `grep "\.name = '" EngineViewer.tsx`). Scale-basis
column points at the in-file comment carrying the actual numbers rather than
restating them here, since restated numbers rot when the file changes and
the comment doesn't.

| name | parent group | source photo(s) | scale basis / anchor | added |
|---|---|---|---|---|
| `flow-points` | `flow-systems` | n/a (procedural particles) | n/a | pre-2026-07-20 |
| `flow-systems` | engine group | n/a | n/a | pre-2026-07-20 |
| `service-oil-pan` | engine group | `docs/reference/Oil_Pan_-_Diesel.png`, `Used-9999-VOLVO-Oil-Pan-*.webp` | see comment at `EngineViewer.tsx` ~line 2022 (oil pan) | pre-2026-07-20 |
| `service-drain-plug` | `service-oil-pan` | same as oil pan | inherits oil pan basis | pre-2026-07-20 |
| `oil-stream` / `oil-puddle` | engine group | n/a (physics fx) | n/a | pre-2026-07-20 |
| `transmission-ishift` | engine group | QRG (see `volvo-d13f-engine-quick-reference-guide.pdf`) | I-Shift tops out ~y 0.22, cab floor rests above it (see truck-cab comment ~line 3429) | pre-2026-07-20 |
| `service-turbo` | engine group | `docs/reference/engine/` reman-turbo photos (4) | compressor scroll Ø D = 0.4 scene units — see comment ~line 207/2717 | pre-2026-07-20 |
| `turbo-oil-spray` / `turbo-oil-puddle` / `turbo-coolant-spray` / `turbo-coolant-puddle` | `service-turbo` | n/a (physics fx) | inherits turbo basis | pre-2026-07-20 |
| `egr-cooler` | engine group | `docs/reference/egr/` | — | pre-2026-07-20 |
| `service-egr-valve` / `service-egr-harness` / `service-egr-coupler` / `service-egr-vband` / `service-egr-venturi` / `service-venturi-line` / `service-venturi-clamp` | `egr-cooler` assembly | `docs/reference/egr/` | inherits EGR cooler basis | pre-2026-07-20 |
| `engine-starter` | engine group | no dedicated close-up photo yet — body/solenoid reasoned from general D13 starter shape; see comment ~line 3247 | Delco-Remy/Bosch-style DC starter, sized off engine block anchor | pre-2026-07-20 |
| `air-compressor` | engine group | `docs/reference/air-compressor/wabco-photo.webp`, `wabco-exploded.jpg` | ~0.33 units tall ≈ 215mm real — see comment ~line 3303 | pre-2026-07-20 |
| `truck-cab` | top-level (`group`) | `docs/reference/truck/01`–`23` (VNL 860, 23 photos: exterior, engine bay, interior) | frame rail length 6.2 units; see rotation/coordinate note ~line 3404 | pre-2026-07-20; front-end/two-tone/mirrors reworked 2026-07-20 (see below) |
| `truck-door` (VNL) | `truck-cab` | `docs/reference/truck/14` (interior door open) | door bottom flush with cab floor y 0.28 | pre-2026-07-20 |
| `truck-hood` (VNL) | `truck-cab` | `docs/reference/truck/01`,`02`,`03`,`11`,`12` (front 3q/straight-on/engine bay) | hood pivots at front bumper, tilts forward | pre-2026-07-20; nose/grille/bumper reworked 2026-07-20 (see below) |
| `toolbox-chest` | top-level (`group`) | `docs/reference/toolbox-snapon-reference.png` | wheel Ø = 1.0 unit ≈ 43in — see comment ~line 3507 | pre-2026-07-20 |
| `toolbox-decal` | `toolbox-chest` | same (canvas-drawn text, not a photo asset) | n/a | pre-2026-07-20 |
| `toolbox-facade` | `toolbox-chest` | same | click-inert, cosmetic only | pre-2026-07-20 |
| `toolbox-air-compressor` | `toolbox-chest` | same WABCO photos as `air-compressor` (shared `buildWabcoCompressor()`) | inherits `air-compressor` basis | pre-2026-07-20 |
| `car-body` | top-level (`group`, Sonata vehicle) | `docs/reference/sonata/` | car ≈ 4.0 units ≈ 4855mm real | pre-2026-07-20 |
| `truck-door` (Sonata, reused name) | `car-body` | `docs/reference/sonata/` | same door/hinge convention as VNL, different vehicle | pre-2026-07-20 |
| `truck-hood` (Sonata, reused name) | `car-body` | `docs/reference/sonata/` | same convention as VNL | pre-2026-07-20 |

## Entries added 2026-07-20 session

| name | parent group | source photo(s) | scale basis / anchor | added |
|---|---|---|---|---|
| `service-valvecover-bolt-<i>` (×16) | engine group (cylinder head) | none dedicated — bolt positions match existing head-geometry loop (x = −0.85 + i·0.24, z = ±0.3) | inherits head/block anchor | 2026-07-20 (uncommitted prior pass) |
| Front accessory drive pulleys (`FED_X` group: upper idler, refrigerant compressor, tensioner, lower idler) + serpentine belt tube | engine group, front face | none dedicated — positions reasoned off crank damper anchor (damper center y −0.06, z 0, r≈0.155) | see comment ~line 3151 | pre-2026-07-20 (static); pulley + belt rotation driven by `engineOn`/`rpm` added 2026-07-20 |
| Truck front nose/bumper/grille rework (grille insert, chrome Volvo slash, headlight pods + DRL, lower black valance + fog lights, hood power-dome, hood-mounted mirror) | `truck-hood` | `docs/reference/truck/01-exterior-front-3q.png`, `02-exterior-front-straight-on.png` | grille width/headlight position measured against hood width (3.75 units) per those two photos | 2026-07-20 |
| Two-tone lower body/rocker skirt (cab + frame gap to fuel tank) | `truck-cab` | `docs/reference/truck/04-exterior-side-profile-driver.png` | skirt lower edge at wheel-arch height, matches photo's black/white split line | 2026-07-20 |
| Aero mirror housings (upgraded from flat boxes) | `truck-cab` | `docs/reference/truck/01`, `04` | mirror head height ≈ 0.4× door-glass height per photo 01 | 2026-07-20 |
| Radiator core fin ribbing | `truck-hood` | `docs/reference/truck/11-engine-bay-steer-axle.png`, `12-engine-bay-hood-open.png` | inherits existing radiator placement (marked unverified — see comment ~line 3478) | 2026-07-20 |
| Starter pinion one-shot engage/disengage animation | `engine-starter` | n/a (mechanism behavior, not new geometry) | ties to `engineOn` transition per `mechanism-kinematics` skill | 2026-07-20 |
