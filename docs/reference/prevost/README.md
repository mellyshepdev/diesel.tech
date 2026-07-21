# Prevost H3-45 reference photos

Source: user upload, "2027 Prevost Loki H3-45" (a Loki Coach conversion —
gray/silver paint with a diagonal two-tone stripe, "LOKI COACH H3" decal on
the driver-side luggage bay). Uploaded to the repo root without the standard
`docs/reference/<vehicle>/NN-description.ext` naming (percent-encoded spaces
in the original filenames collapsed to literal `20`s on download); moved
here and renamed 2026-07-21. Build the Prevost `prevost-*` geometry in
`EngineViewer.tsx` to match these specific photos, not generic H3-45/motorcoach
knowledge — see the `3d-part-fidelity` skill before modeling from these.

| File | Shows |
|---|---|
| 01 | Front 3/4 exterior — full driver-side profile visible: luggage bay doors, character-line stripe, tri-axle layout (single steer, close-coupled drive+tag pair at the rear), roof line, both mirror arms |
| 02 | Straight-on front exterior — grille, headlight clusters, windshield/wiper layout, mirror mounting, front bumper |
| 03 | Cockpit dash, driver's-eye view — steering wheel w/ Prevost badge + column stalks, digital gauge cluster, rocker-switch panel (left of wheel), center touchscreen infotainment display, shifter/parking-brake console, driver seat |

## Known gaps

No rear, opposite (curbside) profile, engine-bay/rear-hatch, or passenger-cabin
(lounge/galley/lavatory) photos exist yet. The H3-45 is a rear-engine
("pusher") coach — no equivalent to the VNL's front hood — so the engine
access hatch geometry is reasoned from general H3-45 knowledge (rear-mounted,
transverse or longitudinal engine bay behind the rearmost axle) rather than a
specific photo; flag as unverified and ask for a rear 3/4 shot if precision
on the hatch/engine-bay area matters. Side length/window-bay proportions
past what photo 01's 3/4 angle reveals are reasoned off that single photo,
not cross-referenced against a second profile angle — normally two angles
minimum per `3d-part-fidelity` §1, not met here yet for the mid/rear body.
