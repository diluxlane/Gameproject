# AFTERSIGNAL: 2030 — Story and Development Bible

**Status:** 0.1 prototype concept and technical specification. All future dates/events below refer to a fictional alternate timeline. No real-world catastrophic event or conspiracy is being claimed as fact.

## North star

A cinematic, mysterious, replayable first-person 3D survival world that is **generated from code** and delivers striking atmosphere on phones and desktops without downloaded visual models or texture packs. The game opens with a 2019–2030 prologue and then gives the player independent agency in 2030. The player's actual objective is not to defeat an endless sequence of enemies, but to **survive, investigate and separate truth from deception**.

## Narrative structure

**2019: Archive Zero** — Researchers find an encrypted recording bearing the impossible date 2030. It is dismissed as a fabrication.

**2026: The Fracture of Trust** — Robotics, AI systems and synthetic media accelerate. Unverified online rumors about secret organizations and strange creatures multiply. Ordinary citizens struggle to distinguish facts and fabrication.

**2027: The Silent Research Program** — A fictional illness and public instability place health services and communication networks under pressure. A clandestine scientific project searches for signals that appear to predict future events.

**2028: The Convergence** — A classified attempt to decode the signal opens unfamiliar atmospheric anomalies. UFO-like objects appear. Sightings of unfamiliar creatures are reported near the Rift. Factions disagree about what caused it.

**2029: The Fragmentation** — Cascading emergencies and fictional global conflicts leave governments and infrastructure fractured. This is a backdrop, **not a detailed simulation of real-world war plans**. Society's fear and desensitization become themes explored via media archives and survivor testimony rather than graphic content.

**2030: The Last Signal** — The playable game begins near Shelter 17. The familiar geography is altered. Some advanced machinery still operates; some zones contain anomalous ecosystems and huge distant creatures. The player must restore an archived transmitter while building an understanding of what is real.

## Mystery layers

| Layer | Initial player impression | Potential story reveal |
|---|---|---|
| Anomalous craft | Alien invasion | Some objects are terrestrial prototypes; the origin of others remains uncertain |
| Area 51-inspired facility | Definitive proof of extraterrestrials | Research into unusual aircraft and a hidden experimental signal program |
| Ancient secret society symbols | Secret masterminds | Symbols reused by a fictional faction to mislead outsiders |
| Reptilian rumors | Shapeshifting leaders | A fictional nonhuman species may exist, but viral footage is not evidence of it |
| Leviathan / Behemoth legends | Ancient monsters returned | Gigantic unknown organisms in isolated Rift regions |
| Prehistoric sightings | Dinosaurs survived | Anomalies link environments with different histories |
| The Changed | Zombies | A mysterious fictional condition, investigated without graphic imagery or real bioengineering instructions |
| 2019 signal | Simple time travel | Records are from multiple overlapping timelines; player choices can expose the falsification |

## The first playable arc — The Relay

**Goal:** Produce a self-contained, finishable experience, not a sprawling unfinished map.

1. Watch/skip the cinematic prologue; awake in 2030.
2. Learn movement and survival at Shelter 17.
3. Explore ruined streets and recover two emergency supply crates.
4. Decode a 2019 archival record; learn how misinformation obscured genuine research.
5. Avoid a mechanical security patrol and wandering anomaly, restore the relay.
6. Reach the Rift and receive a 2030 transmission; complete Chapter 01.
7. Continue exploring the world after the mission.

The current prototype implements the above loop in simplified form. It does **not** currently implement full crafting, complex encounters, simulated villages or large-scale combat.

## Future world regions

- **Shelter Sector:** dependable recovery area with upgrades, water and emergency supplies.
- **Old City:** procedural streets, overgrown architecture, lost broadcasts and surviving technology.
- **Industrial Wastes:** abandoned data centers, factories, malfunctioning robot patrols.
- **Classified Facility:** original speculative location, archives, sensors and signal experiments.
- **Rift Basin:** atmospheric distortions, prehistoric-looking wildlife, shifting geometry.
- **Oceanic Rift:** distant Leviathan-scale encounter represented by silhouette and weather before any interactive ocean ecosystem.
- **The Deep Wilds:** future Behemoth-scale creature and natural survival systems.
- **High-Altitude Zone:** unidentified aerial craft, sky phenomena and optional traversal puzzles.

## Survival design principles

- Atmosphere, environmental puzzles and uncertainty precede confrontation.
- Survival resources should be manageable, not tedious. Water and energy are replenishable; shelter is meaningful.
- Avoid graphic injury and violence. Focus on evasion, defensive systems, exploration and rescue.
- Every frightening discovery should support empathy for the people who experienced the collapse.
- Scarcity must coexist with wonder, hope and restoration.
- All conspiracy claims are either labeled as genuine sourced history, unverified rumors, or invented game lore.

## Cinematic technique: learn, do not copy

- **Interstellar (2014):** scientific wonder, time-related emotions and a central human question.
- **Inception (2010), Tenet (2020), Memento (2000):** clues that gain meaning from changing chronology.
- **Kalki 2898 AD (2024):** world-building that juxtaposes ancient narrative motifs and futuristic inequality.
- **28 Days Later (2002):** entering an empty world and reconstructing what happened through observation.
- **Children of Men (2006):** social collapse shown through incidental environment details; resilience and hope.
- **The Last of Us:** strong human-scale stakes and environmental storytelling.
- **Other epidemic/zombie stories:** suspense from uncertainty, survivor choices and social fractures.

The game must not reproduce scripts, dialogue, characters, signature design assets or protected artwork from these properties. The term **Kalki 2898 AD** is a tentative interpretation of the user's earlier “Kolukki” mention and needs confirmation if a different film was intended.

## Procedural technical strategy

- First milestone uses a **custom, dependency-free WebGL2 renderer** and GLSL ES 3 shaders.
- Static world mesh: terrain grid, faceted ruins, procedurally varied trees, mountain silhouettes, roads and markers.
- Dynamic mesh: abstract patrolling robot, flying creature silhouette, distant UFO, Rift sparkle.
- Sky shader: gradient, stars and fog atmosphere; world shader: simple directional lighting, procedural material variation, distance fog and emissive hints.
- Local-only JavaScript simulation; UI and persistence in localStorage; original low-volume Web Audio ambience.
- Progressive improvements: dynamic scene streaming, instancing, optional WebGPU renderer, quality telemetry **without sending personal data**, collision geometry, lighting upgrades.

**Quality targets, not guarantees:** midrange phone ~30 FPS, desktop ~60 FPS. Measure real-world CPU/GPU timings, time to first frame, memory use and compressed download bytes. A small source bundle can still consume much more RAM and GPU compute than its file size suggests.

**VR strategy:** first ensure comfortable desktop and mobile play. Phone split-screen VR can be offered as experimental. Proper WebXR headset mode needs verified head pose, input controller support and comfortable locomotion; do not claim full support until tested.

## Test checklist

- [ ] WebGL2 pipeline compiles on current desktop Chrome/Edge and Android Chrome.
- [ ] Prologue starts, advances and skips correctly.
- [ ] Keyboard movement, mouse look and interaction work.
- [ ] Touch joystick and touch-look work on a phone without gyroscope.
- [ ] Orientation permission handling works on a supported device.
- [ ] Every quest marker can be reached; core quest is completable.
- [ ] Saving/reloading retains progress; localStorage failure doesn't break gameplay.
- [ ] VR button produces stereo view; real WebXR is not claimed yet.
- [ ] Quality settings render correctly and are benchmarked.
- [ ] No external runtime requests, secrets, analytics, art downloads or copyrighted content.
- [ ] Game remains non-graphic, readable, usable, and has a clear pause/exit.

## Research links and technical references

- BFI, Nolan/time: https://www.bfi.org.uk/sight-and-sound/features/christopher-nolan-time-games
- Sony Pictures, 28 Days Later official synopsis: https://www.sonypictures.co.uk/movies/28dayslater
- PlayStation Blog, The Last of Us world design: https://blog.playstation.com/2023/02/07/the-last-of-us-developers-hbo-creators-on-building-the-world-around-joel-and-ellie/
- Abyssal Garden original demo: https://github.com/Noniv/abyssal-garden
- Aetherfall browser project: https://github.com/NT9712/aetherfall
- Reclamation source-only procedural WebGL: https://github.com/richardtokar/reclamation
- Independent renderer benchmarks (scene-specific): https://github.com/endel/webgpu-webgl-benchmarks