# The Awakening · interaction specification

The station is a first-person, metre-scale investigation. Its first question is practical: can Ira restore the intake before the ferry must leave? The player is free to walk the yard and identify the equipment before receiving instructions. The transmitter puzzle uses a value supplied by an earlier discovery.

| State | Place and required action | Persistent consequence |
|---|---|---|
| On waking | Walk to the bench and acknowledge Neri’s radio message | Her voice and request enter the journal. |
| Looking for repair parts | Visit the field stores; collect the kit | Add the ceramic fuse, one water flask and the channel tag. |
| Intake offline | Reach the actual generator; install the fuse | The fuse moves from inventory to installed state. The intake becomes a refill point. |
| Carrier active | Return to yard repeater; tune the marked frequency | Wrong presets give audible and written feedback. Correct tuning reveals the silver hull. |
| Archive accessible | Inspect the cabinet and authenticate Tape 17 | The journal records the matching trace and Ira’s handwriting. |
| Decision | Return to the repeater; choose a public transmission or private reply | Save ending, show its immediate consequence and retain access to the yard. |

**Movement.** Standing eye height with normalized diagonal movement, axis-separated collision against the equipment and buildings, sprint with stamina cost, recovery when walking or still. Desktop uses WASD, click/drag or pointer lock, arrow-key turn and E. Touch uses a captured joystick, drag look and a contextual action button. Standard-mapped gamepads can walk, look and interact. Dialog choices use regular browser controls. A full controller-only menu pass remains necessary.

**Survival.** Water drains during activity. The portable flask restores water once. A working pump can refill it. Crossing under the survey drone drains energy and displays a warning. Exhaustion or dehydration returns Ira to shelter with discoveries intact. This is a forgiving consequence for a mystery chapter. It preserves the player's evidence and offers a reason to repair the pump early.

**Inventory, evidence and map.** The field book contains equipment, the usable flask, the recorded observations and a station plan with the current position. Evidence is cumulative. The tuning clue must remain accessible after leaving the stores. Future inventory items should each serve a survival need or resolve a contradiction.

**Persistence.** One local checkpoint per browser origin. Store position, view, narrative stage, water, energy, flask, play time and final choice. Save at interactions, while exploring, on pause and when leaving the page. A new game requires confirmation when a valid checkpoint exists. The rebuilt geography has a separate save namespace. Chapters exposes the archived 0.1 game to browsers with an original save.

**Accessibility and comfort.** All critical dialogue appears as text. Sound is optional. Manual look remains available without sensors. Distance guidance and motion settings are independent. The phone stereo view uses two perspective cameras. The experimental headset tour uses fixed viewpoints. Quest dialogs and full mission progression are currently designed for a flat display.

**Duration.** This is a complete short mission loop. Fifteen to thirty minutes is the target for the expanded chapter. Earn that time by adding the ferry manifest investigation, an optional maintenance path, performed dialogue and one threat with a readable safe route. Do not inflate time by slowing walking, increasing thirst or imposing unskippable transmissions.

**Optional investigation.** After handling the radio or supply kit, inspect the carbon manifest beside it. Copy both into the field book to compare Mara Sol’s passenger status across two signed originals. Either order is valid. The main pressure-trace investigation remains completable if the player misses this contradiction.
