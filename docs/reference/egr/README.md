# EGR / exhaust manifold reference photos

Source: reverse-image-search results (Google Lens), screenshotted 2026-07-18.
**Unlike `docs/reference/truck/`, these are NOT photos of the user's own
truck** — they're generic Volvo D13 EGR cooler / exhaust manifold photos
pulled from Pinterest, Facebook, eBay, and Vander Haag's listings, plus one
parts diagram from a Volvo Penta (marine) listing. Treat these as rough
shape/layout reference only, not as ground truth for this specific engine —
cross-check against the real engine bay photos once available before
modeling anything as fact.

| File | Shows | Source |
|---|---|---|
| 01 | EGR cooler installed in bay, elevated/side angle | Pinterest |
| 02 | EGR cooler + turbo, closer front angle, still installed | Facebook |
| 03 | Exploded parts diagram: EGR venturi, exhaust manifold, mounting brackets, numbered callouts | ProPride Marine (Volvo Penta P/N 22249742 — **marine part, may not match the truck D13 EGR configuration exactly**) |
| 04 | EGR venturi pipe / coolant transfer tube, removed, isolated on white background | eBay listing |
| 05 | Exhaust manifold + turbo, installed, wide engine-bay shot | Vander Haag's (parts seller) |

## Known gap

No confirmed photo of the EGR cooler on the user's actual truck yet — the
truck gallery in `docs/reference/truck/` doesn't include a clear EGR shot.
If EGR geometry needs to go in `buildVolvoD13`, ask for a real photo of that
component on this specific engine before treating these as more than a
rough starting shape, per the `3d-part-fidelity` skill.
