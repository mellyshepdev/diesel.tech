---
name: mechanism-kinematics
description: Use when rigging any part that moves continuously or cyclically once the engine is "running" — belts, pulleys, spinning shafts, reciprocating pistons, gear-driven accessories (air compressor, starter motor pinion, alternator), as opposed to the one-shot open/close motions (hinges, slides) already covered by userData.hinges/slides. Triggers on "make it spin", "animate the belt", "the compressor should turn with the engine", "starter should crank then disengage", or any accessory driven off the crank/gear train.
---

# Mechanism Kinematics

`3d-part-fidelity` section 4 covers one-shot mechanisms (hood hinge, drawer
slide) via `userData.hinges`/`userData.slides`. Engine-driven accessories are
a different category — continuous or cyclic motion that must stay
kinematically consistent with whatever drives it (the crank, the gear
train, another pulley) rather than animating on its own arbitrary timer.
This skill covers that category.

## 1. Identify the real drive relationship before animating anything

For any new moving accessory, name the actual mechanical link before writing
rotation code:

- **Gear-driven** (air compressor, oil pump, typically off the front gear
  train): rotation speed is a fixed ratio to crank speed, ratio set by the
  real gear tooth counts if known, otherwise a reasonable typical ratio
  stated as an assumption. Direction depends on gear count in the train
  (each mesh reverses direction) — don't default every accessory to
  "same direction as crank" without checking.
- **Belt-driven** (alternator, fan, sometimes water pump): rotation speed
  is the inverse ratio of pulley diameters (`speed_driven = speed_driver *
  diameter_driver / diameter_driven`). Measure pulley diameters with
  `photo-anchor-measurement` before picking a speed ratio — don't guess it.
- **Reciprocating** (piston-type air compressor internals, if modeled):
  crank-slider geometry, not a simple sine — position follows the same
  crank-conrod relationship as the engine's own pistons, reuse that math if
  it already exists in the file rather than approximating with a bare sine
  wave.
- **Clutch/engagement mechanisms** (starter motor pinion, PTO): two distinct
  states (disengaged/idle, engaged/driving) with a real transition, not an
  instant switch — see section 3.

## 2. Extend the existing animation-state pattern, don't invent a new one

Follow the `userData.hinges`/`userData.slides` precedent: add a parallel
`userData.spins` (or similarly named) array/map advanced once per frame in
the same `animate()` loop, storing whatever a continuous rotator needs
(current angle, angular speed, driving-shaft reference or ratio). Keep the
bookkeeping in the same place the existing patterns live so a future reader
finds all animation state in one spot, not scattered across ad hoc
`useFrame`-style one-offs per part.

## 3. Engagement mechanisms are two-phase, like the ratchet interaction

A starter motor is the clearest case: in reality, (1) the solenoid pushes
the pinion gear into mesh with the flywheel ring gear, *then* (2) the motor
spins and cranks the engine; on start, the pinion retracts before the
flywheel spins past the motor's speed. Model this as two tracked states
(pinion position: retracted/engaged, motor: off/cranking) with the engaged
state gating whether the spin animation drives the flywheel at all — a
starter that visually spins while its pinion floats disengaged from the
flywheel, or that engages and cranks in a single instant click, is the same
category of fidelity bug as a hood that opens on a click to the shell.

## 4. Idle vs. running vs. off states

Decide, per mechanism, what state the *rest* of the engine's animation
system is in when this part should be moving at all (engine off = nothing
turns; cranking = starter turns the flywheel, everything gear/belt-driven
off the crank turns slowly; running = full speed). A newly-added spinning
part that ignores the engine's overall on/off state and just spins
constantly regardless of context will look disconnected from everything
else even if its own rotation math is correct.
