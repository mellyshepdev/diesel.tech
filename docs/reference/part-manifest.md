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
| `RatchetBody` (HandHUD 2D SVG icon, not a scene-graph mesh — `components/HandHUD.tsx`) | rendered inside `HandHUD`/`RatchetStack`, selected via `ToolPanel`'s `ratchet`/`socket*` tools | `docs/reference/tools/snapon-ratchet-reference.jpg` (moved from repo-root upload `3116165994.jpg`) | flat 2D redesign, not photo-measured: chrome head+shaft kept, grip recolored to black cushion grip with red ferrule/buttcap + red "Snap-on" wordmark, oval "Snap-on" head stamp + ON-marked reverse switch added, matching the reference photo's actual ratchet | 2026-07-20 |
| Rear tandem: dual wheels (`dualWheelAt`), axle housings + interaxle driveshaft, walking-beam suspension + air springs | `truck-cab` (all parented to `truckBody`, no dedicated names — geometry only, not raycast targets) | `docs/reference/truck/08-rear-tandem-axle-top.png`, `09-rear-tandem-fifthwheel-2.png` | axle x-positions inherit the pre-existing wheel anchors (2.4, 3.3); outer dual tire offset 0.30 = tire width 0.28 (existing tire-width anchor) + ~0.02 gap | 2026-07-20 |
| `truck-fifthwheel` | `truck-cab` | `docs/reference/truck/06-rear-frame-fifthwheel.png`, `09-rear-tandem-fifthwheel-2.png` | plate radius 0.46, positioned ahead of the forward tandem axle (x 2.1 vs axle at 2.4); not photo-measured pixel-for-pixel — reasoned off frame rail spacing (z ±0.42). **Bug fixed 2026-07-21**: the plate cylinder was rotated `[PI/2,0,0]` (copy-pasted from the wheel geometry above it), which stands a cylinder up on its edge — correct for a wheel, wrong for a plate that has to lie flat. Removed the rotation (CylinderGeometry's default Y-axis orientation is already flat/horizontal); the 0.06-thick disc was reading as a near-invisible edge-on sliver from almost every angle, which is why it looked like it "wasn't showing up." | 2026-07-20; orientation fixed 2026-07-21 |
| Rear crossmember, mud flaps, 3-light marker bar, cab back-wall grab handle | `truck-cab` | `docs/reference/truck/05-exterior-rear.png` | frame rail end (x 3.5, rails span to 3.55) | 2026-07-20 |
| 3D cab interior: dash, steering wheel/column, two pedestal seats, center console (previously exterior-only — the 2D in-cab overlay had no 3D counterpart behind the glass) | `truck-cab` | `docs/reference/truck/15-interior-dash-steering-seats.png`, `20-interior-dash-full-both-seats.png`, `21-interior-dash-center-stack-parkingbrake.png` | dash x = 1.58, just aft of windshield (x 1.48); driver seat at z +0.5 matches driver door z 0.86 | 2026-07-20 |
| Hood-release lever interaction (`hoodLeverPulled` state + HOOD RELEASE button in the in-cab modal; VNL only) — `clickHood()` now refuses to open the hood until pulled, and refuses while still `inCab` | n/a (mechanism/interaction behavior, not new geometry — per `3d-part-fidelity` §4, which was blocked on the interior existing until the row above landed) | n/a | re-latches (`hoodLeverPulled` back to `false`) whenever the hood is closed again, so it must be pulled fresh each time | 2026-07-20 |
| Mechanic career ladder: `coins`/`mechanicLevel` state (EngineViewer.tsx), 6-tier `LEVELS`/`REPAIRS` gating, Tool Shop (`TOOL_PRICES`/`ownedTools` in ToolPanel.tsx — specialty tools bought in the drawer they already live in) | n/a (game-progression state, not scene geometry) | n/a | superseded below: all 7 specialty tools are priced now (not just filterWrench/lineWrench), and progress syncs to an account, not just localStorage | 2026-07-20 |
| `hood-cable` repair (RepairId, tier 3): distilled 5-step version of a real Volvo TSB (hood release cable binding/broken — VNL/VNR/VNM/VNX/VAH/VHD) | n/a (button-driven checklist, no new 3D trim geometry — reuses the existing dash/steering-column meshes from the row above rather than modeling individual kick/dash/A-pillar panels) | `docs/reference/tsb/hood-release-cable-tsb.pdf` (source TSB, 23pp/58 steps) | ties into the hood-release-lever row above — step 5 is literally "pull the lever, verify it opens clean" | 2026-07-20 |
| Sleeper compartment: bunk + mattress, nightstand, overhead storage bins (×2), folding ceiling ladder, mini-fridge, climate control panel | `truck-cab` | `docs/reference/truck/16-interior-sleeper-bunk.png`, `17-interior-sleeper-overhead-ladder.png`, `18-interior-sleeper-climate-fridge.png`, `19-interior-sleeper-ladder-storage.png` | positioned in the cab's rear third (x 2.35–3.55), under the raised high-roof section (see `truck-cab` roof box ~line 3599) | 2026-07-20 |
| Vehicle-picker fix: engine choice (`#engine-select`) moved onto the pre-start vehicle-selection screen; the always-visible engine-brand switcher row was removed from the main toolbar | n/a (UI-flow fix, no geometry) | n/a | previously every other engine (Volvo/Cummins/Paccar) stayed one click away on the main page with no "back" step — now changing it requires returning to vehicle selection (`🚗 Vehicle`) | 2026-07-20 |
| Toolbox drawer zoom: `focusDrawer()` queues `engineGroup.userData.cameraMove` (eased once per frame in `animate()`, same lerp-toward-target pattern as `userData.hinges`/`slides`), replacing the old instant-snap shared `focusToolbox()` wide shot when a drawer opens | n/a (camera behavior, no geometry) | n/a | superseded below: reworked to a top-down shot, not straight-on — a face-on view only ever showed the closed drawer front, never the tools on the tray floor | 2026-07-20 |
| Tool pricing expanded to all 7 specialty tools (`TOOL_PRICES`) + a `TOOL_MIN_LEVEL` gate per tool (ToolPanel.tsx) | n/a (game-progression state) | n/a | superseded below: every tool is priced now, not just specialty | 2026-07-20 |
| Account login: Keycloak PKCE flow (`src/keycloakAuth.ts`, `blacksheep` realm, client `diesel-tech-frontend`) + `diesel-tech-backend`'s new `/api/v1/progress` GET/PUT (`player_progress` table, keyed on the JWT `sub`) — coins/ownedTools now sync to an account instead of only `localStorage` when signed in | n/a (auth/backend, no geometry) | n/a | merge-on-login takes `max(local, server)` coins and the *union* of owned tools rather than trusting either side blindly, so a guest session's progress before signing in isn't lost; backend `.env`'s `KEYCLOAK_URL` was pointed at a dead domain (`login.theofficialblacksheepco.com`) and fixed to the real `bsco-keycloak.fly.dev` — backend still needs deploying (Railway, per user's choice) and the Keycloak client's `redirectUris` still needs the production Pages URL added | 2026-07-20 |
| Level-1 tier restructured to two jobs: `fluid-check` renamed "PM Service" (added a 5th checkpoint, greasing every chassis zerk fitting) + new `annual-inspection` ("Annual Inspection") | n/a (button-checklist jobs, no new geometry — annual-inspection's "real thing being inspected" is the tandem-axle/fifth-wheel geometry already in `truck-cab`, see the tandem-suspension row above) | n/a | superseded below: annual-inspection expanded from 2 to 5 checkpoints. Both jobs stay exempt from the `hoodOpen` gate in `openRepair` and need no specialty tool — the only two jobs a level-1 Lube Tech can actually start | 2026-07-20 |
| Drawer zoom reworked to top-down (not straight-on): camera sits mostly above the drawer with a slight forward tilt (never perfectly vertical, to dodge OrbitControls' pole singularity when view direction lines up with `camera.up`) | n/a (camera behavior) | n/a | shows the tools actually laid out on the tray floor (per `buildDrawer`'s socket rows/wrench fans), which the old face-on shot never revealed | 2026-07-20 |
| Annual Inspection expanded to 5 checkpoints: rear axle housing bolts, differential carrier bolts, fifth wheel (grease/kingpin/mounts), tire tread & pressure, brake pads/shoes & drums/rotors | n/a (button checklist) | n/a | coin reward raised 75→110 for the added scope | 2026-07-20 |
| Toolbox sections economy: `TOOLBOX_SECTIONS` (Specialty Drawer, Full Wall Upgrade) — toolbox starts as a 5-drawer chest (sockets ×2, wrenches ×2, general), the specialty drawer and the wall's decorative facade/lockers are bought separately via a new "🔓 Toolbox Upgrades" panel | n/a (visibility gating on existing groups, not new geometry — "never delete, only add": the full built wall stays in the scene, `toolbox-drawer-specialty`/`toolbox-facade` just start `.visible = false`) | n/a | `ownedSections` persisted to `localStorage` (`diesel-tech-owned-sections`); `toggleDrawer('specialty')` refuses to open until bought | 2026-07-20 |
| Tool pricing: every tool costs coins now, not just specialty — sockets/combination wrenches/general hand tools flat-priced (~5–90 coins, common off-the-shelf items), specialty still scaled by real-world rarity (unchanged) | n/a (game-progression state) | n/a | `ownedTools` starts empty — PM Service/Annual Inspection are the only tool-free jobs, so a brand-new tech can always earn the first coins | 2026-07-20 |
| Smoother camera transitions: `focusToolbox()` and `resetCamera()` now queue `engineGroup.userData.cameraMove` (same eased pattern as `focusDrawer`) instead of an instant `camera.position.set()` | n/a (camera behavior) | n/a | `cameraMove` gained an optional `onDone` callback (mirrors the existing `oilFlow.onDone` convention) so `resetCamera` only re-arms `autoRotate` once the ease actually finishes, not immediately (which would otherwise fight the lerp) | 2026-07-20 |
| Keyboard nav: arrow keys walk the camera+target together (pan), WASD turns the view direction (target orbits the fixed camera position) — read once per frame from a `keysHeldRef` Set, eased in `animate()` | n/a (camera behavior) | n/a | deliberately arrows=move / WASD=look per the user's chosen scheme, not the more common reverse mapping; guards against `SELECT`/`INPUT`/contentEditable focus so it won't fight the vehicle/engine pickers | 2026-07-20 |
| Mobile layout: added `flex-wrap` to the header's badge row and engine-selector/action-button row, plus `max-w-[92vw]` on the Toolbox/Repairs/Sections floating panels | n/a (CSS only) | n/a | `html body #root` has `overflow: hidden` (see index.css) — un-wrapped flex rows wider than the viewport were being silently clipped (buttons past the edge were invisible *and* unclickable) rather than wrapping or scrolling | 2026-07-20 |
| Cab interior detail pass: steering wheel rebuilt as a grouped assembly (rim/button-pad spokes/hub badge/gauge-cluster hood, was a bare torus+cap), seats gained side bolsters/swivel base/armrest/headrest posts (was pedestal+3 boxes), dash gained air vents/radio-climate knobs/red-yellow trailer-air-and-parking-brake pull knobs — supersedes the "3D cab interior" row above, same `truck-cab` parent | `truck-cab` | `docs/reference/truck/21-interior-dash-center-stack-parkingbrake.png` (dash/knobs), `22-interior-steering-wheel-cluster.png` (wheel), `15-interior-dash-steering-seats.png` (seats) | wheel rim radius 0.16 (unchanged basis, now a `wheel` group at the same position/tilt); seat cushion 0.44×0.42 (unchanged basis, bolsters/armrest added at its edges) | 2026-07-21 |

## Entries added 2026-07-21, toolbox redesign + lighting/fifth-wheel pass

| name | parent group | source photo(s) | scale basis / anchor | added |
|---|---|---|---|---|
| Toolbox/cart corrected to an actually-small starter state: a first-level tech's cart is a genuine waist/chest-high, 4-caster, 5-drawer rectangular rolling cart, not the full 216in "MR. BIG" wall with a couple of hidden drawer faces (the prior `TOOLBOX_SECTIONS`/visibility-toggle build always constructed the entire wall regardless of what was owned). `buildToolboxGroup(ownedSections)` is now a standalone module function, not a `buildVolvoD13` closure, so `activeBays`/`hasHutch` gate what geometry actually gets built, and a purchase (`buySection`) rebuilds the subtree in place (remove old `toolbox-chest`, call again, re-add, re-parent the spare compressor) instead of just toggling `.visible`. Supersedes the "Toolbox sections economy" row above — same "never delete, only add" spirit, just correctly sized geometry instead of a permanently-full wall. `TOOLBOX_SECTIONS` renamed `bankB`/`bankC`/`lockers` (capacity/cosmetic only, no new tool categories) | top-level (`group`), returned by `buildToolboxGroup` | `docs/reference/toolbox-snapon-reference.png` (full chest, once all 3 sections bought); no photo for the small starter cart (generic rolling-cart proportions, medium confidence) | starter bay 26in wide, 4 casters at the corners only (seam-based caster count once grown); bankB 30in, bankC 43in, end lockers 21in — same `IN = 1/43` scale as before | 2026-07-21 |
| `ToolPanel`'s `specialty` + `general` drawer categories merged into one `misc` drawer (`DrawerKey` shrank from 6 to 5, matching the starter cart's 5 physical drawers) — there's no longer a separate purchasable "Specialty Drawer" unlock; individual specialty tools still gate on `TOOL_PRICES`/`TOOL_MIN_LEVEL` as before, just found in a different physical drawer | `components/ToolPanel.tsx` (not a scene-graph part) | n/a | n/a | 2026-07-21 |
| Front cab-roof marker/clearance light bar: 5 amber lights along the leading edge of the sleeper roof, above the windshield | `truck-cab` | `docs/reference/truck/01-exterior-front-3q.png` (roof-edge lights visible, not pixel-measured — too low-res at that spot) | rail at x 1.66, matching the upper roof box's front edge (`BoxGeometry(2.0,0.85,1.6)` at pos x 2.65) | 2026-07-21 |
| Rear-facing sleeper-roof marker bar, mirroring the front bar at the roof's trailing edge | `truck-cab` | n/a — reasoned from the front bar's real-world convention (rear-facing clearance lights on a high-roof sleeper), no dedicated rear-roof close-up photo; medium confidence | rail at x 3.63, matching the upper roof box's rear face | 2026-07-21 |
| Headliner dome/reading light fixture (housing + amber-emissive lens + two switches) on the ceiling just behind the windshield header | `truck-cab` | `docs/reference/truck/14-interior-door-open-full-cab.png` | ceiling at y ≈ 1.47, derived from the cab shell box's top face (`BoxGeometry(2.2,1.22,1.7)` at pos y 0.89) | 2026-07-21 |
| Headlights given dedicated emissive lens/DRL materials (`headlightLens`, `drlAmber`) instead of the shared flat `M.white`/`M.orange`, so they read as lit per the reference photos rather than matte plastic | `truck-hood` | `docs/reference/truck/01-exterior-front-3q.png`, `02-exterior-front-straight-on.png` | same pod geometry/position as before, material only | 2026-07-21 |
| Rear ID bar (red-white-red) given dedicated emissive materials (`idBarRed`/`idBarWhite`) instead of the shared flat `M.red`/`M.white` | `truck-cab` | `docs/reference/truck/05-exterior-rear.png` | same geometry/position as before, material only | 2026-07-21 |
| Rear composite tail lamps added at each frame rail end (stacked red brake/tail, amber turn signal, white backup/reverse) — a bobtail tractor with no trailer needs its own full rear light set, which this rig didn't have beyond the small center ID bar | `truck-cab` | n/a — reasoned layout (no clean close-up of this rig's corner lamps exists in `docs/reference/truck/`), medium confidence | housing at x 3.49, z ±0.78 + 0.18 (outboard of the existing mud-flap brackets) | 2026-07-21 |
| Fifth wheel plate rebuilt from a plain round disc to the real kidney/oval casting shape (scaled cylinder + dark wedge overlay faking the kingpin-slot cutout at the throat), plus a release handle, grease zerk fitting, a "greasy worn steel" material, mounting brackets atop the existing support braces, and 3 coiled air/electrical lines (red service, blue emergency, black electrical) draped from the cab's back wall — supersedes the plain-disc `truck-fifthwheel` row above | `truck-cab` | `docs/reference/truck/06-rear-frame-fifthwheel.png`, `09-rear-tandem-fifthwheel-2.png` | same group position/orientation as the existing (already orientation-fixed) plate; coils anchored at x 2.35–2.42, above the plate at y 0.02–0.05 | 2026-07-21 |

## Entries added 2026-07-21, nose/grille rework

| name | parent group | source photo(s) | scale basis / anchor | added |
|---|---|---|---|---|
| Hood nose reworked to match the 2027 VNL860's actual restyled front end (previous pass at `EngineViewer.tsx` ~line 4568 had modeled a classic-VNL nose — round headlight pods, single flat grille panel, diagonal chrome slash — that doesn't match this specific truck's photos at all). Grille rebuilt as a 3-segment kite/diamond silhouette with mesh slats, chrome perimeter trim, and a circular Volvo badge (chrome ring + dark disc), diagonal slash removed (not present in either front photo). Headlights rebuilt from round pods to angular V-blade units (tilted box + chrome trim + amber DRL strip at the same angle). Lower valance's round fog lights replaced with trapezoidal vent cutouts + a chrome splitter bar. Hood power-dome enlarged into a proper raised/recessed vent scoop with slats instead of a thin paint-colored ridge. Supersedes the "Truck front nose/bumper/grille rework" row above | `truck-hood` | `docs/reference/truck/01-exterior-front-3q.png`, `02-exterior-front-straight-on.png`, `03-exterior-front-3q-driver-side.png` | grille widest band ≈0.7× nose width anchor (1.46 units); headlight/vent positions reasoned off the same anchor — proportions eyeballed from the photos (browser-screenshot references, not clean crops), not pixel-measured; medium confidence, flag for a render-reference-diff pass once a headless browser is available | 2026-07-21 |

## Entries added 2026-07-21, water-pump side-bug fix

| name | parent group | source photo(s) | scale basis / anchor | added |
|---|---|---|---|---|
| Water pump + thermostat housing mirrored from x≈-0.98 (bell-housing/flywheel end) to x≈+0.98 (fan/nose end) — flagged in the 2026-07-20 session as sitting on the wrong side despite its own comment saying "front of block"; same class of bug the fan placement had already been corrected for. The coolant-loop X-ray flow path's pump/thermostat/radiator waypoints (previously x −0.98/−0.95/−1.35 to −1.55) were mirrored the same way so the particle stream starts/ends at the actual pump mesh instead of empty space; the gallery/head waypoints in the middle of that loop were left unchanged, which now reads as pump feeding the block at the front, coolant flowing rearward through the water jacket into the head, then forward again to the thermostat — closer to real physical routing than before, not just coincidentally fixed | engine group (no dedicated part name — raw geometry, not a named `THREE.Group`) | none dedicated — position reasoned off the same fan/nose (+x) vs. bell-housing (−x) convention as the starter (`engine-starter`, x −0.88 to −1.19) and FED_X (1.26, front-end-drive pulleys) anchors already in the file | 2026-07-21 |

## Entries added 2026-07-21, brake drums/chambers + ratchet naming clarification

| name | parent group | source photo(s) | scale basis / anchor | added |
|---|---|---|---|---|
| Brake drums, backing plates, chambers (spring/parking on drive axles, single service-only on the steer axle), slack adjusters, and S-cam stubs at all 6 wheel-ends (steer ×2, tandem drive ×4) — the Annual Inspection job's "brake pads/shoes and drums/rotors" checkpoint previously had no matching geometry, just checklist text | `truck-cab` (all parented to `truckBody`, no dedicated names — geometry only, not raycast targets, same convention as the tandem suspension row above) | none dedicated — no distinct brake close-up exists in `docs/reference/truck/` (hidden behind the wheel on any assembled-truck photo); built from standardized S-cam air-brake construction instead, same class of call as the starter motor / WABCO compressor (no this-truck photo, but a real catalog-standard part). Medium/low confidence, flag for a real photo if one turns up | drum radius 0.24, reasoned off the existing tire radius anchor (0.5 units): real 16.5in drum / ~43in tire ≈ 0.38×, rounded up slightly so the drum visibly peeks past the existing 0.22-radius chrome hub cover | 2026-07-21 |
| Ratchet tool names clarified: `ratchet` renamed `"1/2\" Drive Ratchet"`, `snapOnRatchet` renamed `"Snap-on 1/4\" Ratcheting Wrench"` (`components/ToolPanel.tsx`) — both tools' SVGs already read as visually Snap-on-branded (one from a 2026-07-20 autosave reskin, per the `RatchetBody` row above), which was flagged as a minor naming/label overlap since a player couldn't tell them apart by name alone. No geometry changed; the distinguishing detail (1/2in vs 1/4in drive, already baked into each tool's actual SVG geometry and extension lengths) is now in the display name instead of just implied | `components/ToolPanel.tsx` (not a scene-graph part) | n/a | n/a | 2026-07-21 |

## Entries added 2026-07-21, VNL dash/steering-wheel correctness pass

| name | parent group | source photo(s) | scale basis / anchor | added |
|---|---|---|---|---|
| Center dash stack rebuilt — flagged by the user as "doesn't look correct". Previous pass was a bare box + 4 identical chrome discs; direct comparison against the photo showed it was missing the stack's most recognizable features entirely: an open storage cubby, a hazard button, and two full rows of labeled rocker switches, and had the red/yellow trailer-air/parking-brake knobs positioned beside the radio instead of up at vent height where the photo actually shows them. Rebuilt with the cubby, hazard button, correctly-positioned pull knobs, a toggle row, a proper radio face w/ small green display, three large HVAC dials (was 4 generic identical knobs), and two switch rows with green tell-tales. Stack volume enlarged (0.16→0.3 tall) to actually fit the real control stack instead of compressing it | `truck-cab` | `docs/reference/truck/21-interior-dash-center-stack-parkingbrake.png` | same stack-body position/anchor as before (x 1.66, dash just aft of windshield x 1.48); driver-facing details at x≈1.745–1.762, proud of the 1.74 face the old knob cluster already used | 2026-07-21 |
| Steering wheel rebuilt — same user report. Previous pass had a thin uniform-diameter rim and a small chrome badge disc centered on the hub; the photo shows a thick padded rim and — the biggest miss — a large chrome-ringed VOLVO badge on its own boss well BELOW hub center (the horn pad), not centered. Rim tube radius 0.02→0.032, button pads widened (0.1×0.05→0.13×0.07) with paired sub-buttons, badge moved from the hub (0,0) to a dedicated lower boss at (0,−0.11) with a larger bezel (r 0.07 vs the old 0.038) | `truck-cab` | `docs/reference/truck/22-interior-steering-wheel-cluster.png` | same wheel group position/tilt/scale as before (position 1.5/0.72/0.5, rotation.x 1.15) | 2026-07-21 |
| Screen-edge view-toggle arrows (large semi-transparent `›`/`‹` buttons, right = walk to toolbox via `focusToolbox()`, left = back to vehicle via `resetCamera()`) | n/a (UI overlay, no scene geometry) | n/a | n/a | 2026-07-21 |

## Entries added 2026-07-21, Prevost H3-45 motorcoach (new vehicle)

| name | parent group | source photo(s) | scale basis / anchor | added |
|---|---|---|---|---|
| `buildPrevostH345()` — new `VehicleId` `'prevost'`, wired into the vehicle-select dropdown and the build dispatch alongside `buildVolvoD13`/`buildSonata2017`. Reuses the full D13 engine by calling `buildVolvoD13` into a private wrapper group, removing the VNL `truck-cab` body it also builds, and re-parenting the `toolbox-chest` it also builds back to the top level (so the toolbox isn't dragged into the engine bay's position/rotation) — same engine, no duplicated geometry, unlike the Sonata's fully independent 2.4L bay | top-level (`group`) | `docs/reference/prevost/01` (front 3/4 — full driver-side profile, luggage bays, tri-axle layout, roofline, mirrors), `02` (straight-on front — grille, headlights, windshield/wipers) | own independent scale (like the Sonata car-body), NOT derived from the VNL's frame-rail anchor — sized to comfortably wrap the reused engine bay at the tail. Coach spans local x −4.5 (nose) to +4.5 (tail) | 2026-07-21 |
| Coach body: fuselage + two-tone lower rocker + diagonal stripe accent (this "Loki Coach" livery), domed roof, front fascia (nose cap, split windshield, grille insert, chrome accent bar standing in for "PREVOST" lettering, headlight clusters, mirror arms, lower bumper valance), luggage-bay door row + window strip both sides, tri-axle wheels (single steer at the nose, close-coupled drive+tag pair at the tail — a real H3-45's non-driven tag axle sits much closer to the drive axle than the VNL's evenly-spaced tandem) | `truck-cab` (reused name, per the Sonata's established walk-around-hinge convention) | `docs/reference/prevost/01`, `02` | grille/headlight/mirror positions reasoned off the nose-cap geometry, not pixel-measured against a clean crop — medium confidence, same caveat as the VNL nose rework | 2026-07-21 |
| Passenger/entry door (reuses `'truck-door'`) and rear engine hatch (reuses `'truck-hood'`) — both built with the group origin at the hinge EDGE and the panel mesh offset from there (not centered on the origin), matching the VNL door/hood convention, so `setHinge`'s rotation swings them open instead of spinning them in place around their own center | `truck-cab` | door: `docs/reference/prevost/01` (entry door position, reasoned — no interior cabin photo). Hatch: **no photo at all** — H3-45 is a rear-engine pusher coach with no VNL-hood equivalent; hatch position/size and the reused engine bay's placement behind it are reasoned from general pusher-coach layout only. Flag for a rear 3/4 photo before trusting this placement, per the prevost README's known-gaps note | door hinge edge at its own local x=0; hatch hinge edge at its own local y=0 (bottom), panel offset +0.65y | 2026-07-21 |
| Cockpit: steering wheel (thick rim + large lower chrome-ringed badge boss, same convention as the VNL wheel rebuild above, standing in for a "PREVOST" roundel instead of "VOLVO"), digital gauge-cluster hood, large center touchscreen infotainment display (bigger/more prominent than the VNL's small radio), driver seat | `truck-cab` | `docs/reference/prevost/03` (cockpit dash, driver's-eye view) | wheel position/tilt reuses the same group-structure convention as the VNL wheel (thick torus rim, boss offset (0,−0.11) for the badge) | 2026-07-21 |
| Roofline amber marker lights | `truck-cab` | n/a — reasoned (every NA coach/bus carries these), no dedicated photo | rail at nose-adjacent x, matching the roof box's front section | 2026-07-21 |

**Known gaps, same as the prevost README**: no rear, opposite-profile, engine-bay, or passenger-cabin (lounge/galley/lav) photos exist yet, so the mid/rear body past what photo 01's 3/4 angle reveals, and the entire rear engine hatch/bay area, are reasoned rather than photo-verified. X-Ray flow mode stays VNL-only (gated on `vehicle === 'vnl860'`, unchanged) since it wasn't verified against the reused engine's new position/rotation inside the coach.

## Entries added 2026-07-21, concurrent buildPrevost() draft (kept, not wired up)

Another session's autosave process independently wrote its own Prevost H3-45
draft at the same time as the `buildPrevostH345` work above. It's kept in
`EngineViewer.tsx` (with an explanatory note at its definition) per this
project's "never delete, only add" rule rather than discarded, since it has
real merit — see that in-file note for why. It is **not** referenced by the
`VehicleId`/build dispatch; `buildPrevostH345` is what actually runs.

| name | parent group | source photo(s) | scale basis / anchor | added |
|---|---|---|---|---|
| `prevost-body` (`buildPrevost()`, unreferenced): front cap (windshield/pillar/header, grille bar + PREVOST decal, headlight clusters, bumper + corner markers, wipers, mirror arms, roof-cap taper), driver-side exterior (basement/window-band body shell, diagonal two-tone stripe, 6 luggage-bay doors, LOKI COACH H3 decal — this specific decal technique was ported into `buildPrevostH345`'s coach body instead of duplicated), roof marker lights, tri-axle wheels, and cockpit interior (dash, wheel w/ Prevost badge boss, digital cluster + center touchscreen decals, rocker-switch panel, tan driver seat, shifter console) | top-level (`group`), returned by `buildPrevost` | `docs/reference/prevost/01-exterior-front-3q.webp`, `02-exterior-front-straight-on.webp`, `03-interior-dash-cockpit.webp` | `CIN = 1/56` scene-units-per-inch, chosen so the real ~540in (45ft) coach comes out ≈9.6 units long — a cleaner real-world-derived scale basis than `buildPrevostH345`'s "sized to fit the reused engine" approach | 2026-07-21 |
| Deliberately NOT modeled in this draft: rear body/engine hatch, curbside (passenger-side) exterior detail, passenger-cabin interior — all blocked on missing reference photos per 3d-part-fidelity §1, and no `truck-door`/`truck-hood` objects exist so the pre-trip/hood-release/repair flow is gated off entirely for this vehicle rather than faked. A more conservative scope than `buildPrevostH345`'s reasoned-but-unverified rear hatch + reused engine bay | n/a | n/a — explicitly asked for in the prevost README's "Known gaps" section | n/a | 2026-07-21 |

## Entries added 2026-07-24, naming previously-unnamed water pump/radiator geometry

Per the "Water pump, radiator, bumper, fairing, and rear diff exist as unnamed
meshes / inspection-only geometry today" note at `EngineViewer.tsx` ~line 236
— these two now have proper names/groups and `focus` targets wired into
their `GENERIC_CHECKLISTS` entries. Bumper/fairing/rear-diff still pending
(same session, in progress).

| name | parent group | source photo(s) | scale basis / anchor | added |
|---|---|---|---|---|
| `service-water-pump` | engine group (`buildVolvoD13`'s `group`) | none dedicated — inherits the front-end-drive/fan anchor already established for the 2026-07-21 water-pump-side-bug-fix (x 0.98, matching the FED_X 1.26/fan-end convention) | same geometry/position as before, just wrapped in a named `THREE.Group` (pump housing cylinder + box, thermostat outlet stub) instead of loose meshes on the engine group directly | 2026-07-24 |
| `service-radiator` | `truck-hood` (`hood` group) | `docs/reference/truck/11-engine-bay-steer-axle.png`, `12-engine-bay-hood-open.png` (fin texture, reasoned spacing per existing comment) | same geometry/position as before (core, fin ribbing ×9, top/bottom tanks, fan shroud ring), just wrapped in a named `THREE.Group` instead of loose meshes parented directly to `hood` | 2026-07-24 |

## Entries added 2026-07-24, naming previously-unnamed fairing/bumper geometry

Continuing the water-pump/radiator naming pass above, same session.

| name | parent group | source photo(s) | scale basis / anchor | added |
|---|---|---|---|---|
| `service-fairing` | `truckBody` | `docs/reference/truck/04-exterior-side-profile-driver.png` | same geometry/position as before (two side skirt panels at z ±0.86, flush with cab side faces) — the "two-tone lower body/rocker skirt" row above already described this as "fairing", now it's actually named that in the scene graph | 2026-07-24 |
| `service-bumper` | `truck-hood` (`hood` group) | `docs/reference/truck/01-exterior-front-3q.png`, `02-exterior-front-straight-on.png` | same geometry/position as before (lower chin + valance panels, both brake-cooling vents, chrome splitter bar) — previously loose meshes parented directly to `hood`, now grouped under one name so `bumper-replace`'s checklist can focus the actual part | 2026-07-24 |

## Entries added 2026-07-24, naming rear-diff/interaxle driveline geometry

| name | parent group | source photo(s) | scale basis / anchor | added |
|---|---|---|---|---|
| `service-rear-diff` | `truckBody` | `docs/reference/truck/08-rear-tandem-axle-top.png`, `09-rear-tandem-fifthwheel-2.png` | same geometry/position as before (axle tube + diff-housing sphere bulge at each of AXLE1_X=4.6/AXLE2_X=5.5), just wrapped in a named group so `rear-diff-replace`'s checklist can focus it | 2026-07-24 |
| `service-driveline` | `truckBody` | `docs/reference/truck/08-rear-tandem-axle-top.png`, `09-rear-tandem-fifthwheel-2.png` | same geometry/position as before (short interaxle shaft between the two tandem axles) — **known gap, not fixed this pass**: this is only the interaxle shaft; the existing in-file comment at this location explains the main propshaft (transmission output to forward tandem axle) was deliberately never modeled, both because it crosses from `truckBody`'s rotated local frame into the engine's own top-level `group` frame (real coordinate-risk reason already documented pre-2026-07-24) and because no reference photo shows that underbody area (all `docs/reference/truck/` photos are exterior/engine-bay/interior, none underbody) — per `3d-part-fidelity` §1, this should stay unmodeled until a real photo of that area is available, not be guessed | 2026-07-24 |

## 2026-07-24, x-ray flow system colors changed to match a fixed fluid-color scheme

Not a new part (all 7 flow systems under `flow-points`/`flow-systems` already
existed and are covered by the pre-2026-07-20 manifest row above), but their
colors changed per explicit user request — a fixed color-coding scheme:
blue=coolant (was teal, `0x35e0c8`→`0x2288ff`), white=cold intake air (both
the intake-duct and cylinder-air systems, was pale blue `0x7fd0ff`/gray
`0xb9c7d2`→`0xffffff`), green=diesel fuel (was yellow, `0xffe14d`→`0x33cc55`),
black=exhaust smoke (was orange, `0xff9a55`→dark gray `0x3a3a3a`). Oil
circulation/splash (gold/amber) were left unchanged — not part of the
user's requested scheme.

The exhaust system also needed its `makeFlow()` call to opt into
`THREE.NormalBlending` (new optional param on `makeFlow`, defaults to the
existing `AdditiveBlending` for every other system) — black particles under
additive blending contribute nothing and are invisible, the same class of
bug already hit and fixed on the nasa-project sun's corona. Point size bumped
0.055→0.07 and rendered against the x-ray void's own near-black background
(`0x050810`) with dark gray rather than pure black so it still reads as
visible smoke rather than disappearing into the background.

## 2026-07-24, work order system: new named parts

New feature (`workOrderMode`/`workOrderStatus`/`WORK_ORDER_SYMPTOMS` in
EngineViewer.tsx) — vehicle only appears once a "🚛 Request Work Order" is
made (engineGroup animates in from x=-14 off-stage, toolbox position-
compensated to stay visually stationary since it's a sibling child, not
part of the vehicle), arrives already showing a real visible symptom tied
to a specific repair (filtered to what the tech's level/owned tools
actually allow), and pull-out grades job completion — an incomplete job
(specifically: wheels not chocked) drops a wheel off mid-departure and
docks coins on top of the already-reduced payout.

| name | parent group | source photo(s) | scale basis / anchor | added |
|---|---|---|---|---|
| `truck-wheel-flat` | `truckBody` | none dedicated — reuses the existing wheel geometry/anchor (driver-side steer axle, x=-1.5/z=0.75) | wheel radius 0.5 (existing anchor); "flat" is a runtime scale.y squash to 0.45 + y-offset, not new geometry | 2026-07-24 |
| `truck-wheel-loose` | `truckBody` | none dedicated — reuses existing dual-wheel geometry (rearmost passenger-side outer, x=5.5/z=1.08) | same wheel radius anchor as above; this is the QA-failure wheel (see `wheelFailure` in the animate loop), a different individual wheel than `truck-wheel-flat` | 2026-07-24 |
| `wo-coolant-puddle` | engine group (`buildVolvoD13`'s `group`) | none dedicated — positioned near `service-water-pump` (x 0.9) at ground level (y -1.09), same y-anchor as the existing turbo puddles | radius 0.35, smaller than the turbo puddles (0.4) | 2026-07-24 |
| `wo-exhaust-smoke` | engine group | none dedicated — positioned at the exhaust flow system's own downpipe-outlet waypoint (x 1.7, y -0.55, z 0.95), so it lines up with the already-established exhaust route rather than a new guessed position | 4 spheres, radii 0.09-0.18, gently pulsing/drifting in the animate loop while visible | 2026-07-24 |
| `service-rear-diff` / `service-driveline` | (already documented above, same session) | | | |

**Known gaps, honestly scoped rather than silently incomplete**: only 4 of
~20 RepairIds have a work-order symptom modeled (`annual-inspection` flat
tire, `water-pump-replace` coolant drip, `turbo-replace` oil/coolant leak
reusing the existing failure-puddle meshes, `dpf-service` black smoke) —
adding a symptom for more repairs (e.g. a visible fuel drip for
`fuel-filter-replace`, a squealing-belt cue for `drive-belt-replace`) is a
natural next addition, following the same `WORK_ORDER_SYMPTOMS` pattern,
not a redesign. The grading penalty is currently tied only to the
universal "chock the wheels" procStep (whichever repair is active) rather
than a per-repair-specific quality check (e.g. an actual coolant-fill
verification for the water-pump job) — same reasoning, a real v1 rather
than a fully generalized QA system.
