# AFTERSIGNAL: 2030 — Game Prototype 0.1

An original, **fully client-side WebGL2 survival mystery** in the Zyberlane XR family. The future has become unfamiliar: a fictional cascade of AI breakthroughs, misinformation, worldwide emergencies, strange sightings, and the Convergence has left society fragmented by 2030. You awake near Shelter 17 and must recover two supply crates, decode a classified archive, restore a signal relay, and approach the mysterious Rift.

## Play

Open `index.html` in a modern browser supporting WebGL2. No dependencies, build steps, CDN, textures, models, sound files, or backend are needed. Static-hosting works (GitHub Pages, Vercel, Netlify). If the browser blocks ES modules from `file://`, run a local HTTP server instead:

```sh
python -m http.server 8000
```

Visit `http://localhost:8000/`.

Controls: `W A S D` to move; mouse to look (click the world to lock); `Shift` to run; `E` to interact; `J` for journal; `V` for phone stereoscopic view; `Escape` to pause. On a phone, use the left virtual joystick, drag the world to look, and tap Interact. The optional Motion button asks for orientation permission when required. A non-gyro phone still has manual touch controls.

## Currently implemented

- Skippable original cinematic prologue with 2019–2030 timeline.
- Code-generated 3D world: 85x85-grid terrain, roads, city ruins, trees, mountains, shelter, supply crates, archive, relay, luminous Rift, drifting UFO, flying prehistoric-like silhouette, patrolling robot, wandering silhouette.
- World fog, atmospheric sky, day cycle and simple shader lighting, no external visual art assets.
- First-person exploration, pointer-lock and touch controls, local save/continue.
- Resource management (condition, energy, water), exploration tasks, proximity interaction and progress tracking.
- Non-graphic hazards and shelter recovery.
- Optional phone side-by-side stereo rendering and basic DeviceOrientation controls (permission dependent).
- Adjustable graphics render resolution.
- Small procedural Web Audio drone, initiated only after a user gesture.

## Honest limitations

This is an **early playable vertical slice**, not yet an extensive open-world campaign. In particular: there is no real WebXR headset integration, physics engine, occlusion culling, advanced shadows, NPC dialogue, multiplayer, photorealistic characters, 3D sound, vast continuous world streaming, detailed inventory UI, sophisticated crafting, or full-length multi-act narrative. Stereoscopic split-screen does not equal a certified headset experience. The renderer has not been benchmarked on every device, and touch sensor orientation accuracy requires device testing.

The story is fiction. Claims about living dinosaurs, reptilians, secret societies, aliens, global wars and outbreaks are not established as facts or predictions. No copyrighted film scripts or movie artwork are included.

## Code and architecture

- `index.html`: accessible UI skeleton, cinematic and gameplay HUD.
- `style.css`: adaptive premium dark interface.
- `engine.js`: original, dependency-free WebGL2 shaders, triangle mesh generation, geometric world and stereo rendering.
- `game.js`: timeline, survival mechanics, local persistence, sensors, controls, interaction, missions.
- `docs/GAME_DESIGN.md`: lore, inspiration, target game systems, phased implementation roadmap and QA criteria.

The production game can migrate to an established engine only if profiling justifies that added bundle weight. The first renderer is intentionally minimal and source-readable.

## Future releases

1. **0.2:** correctness and mobile performance QA, collision, visible shadows and better first-person interaction.
2. **0.3:** proper WebXR integration, tested motion-controller interactions, VR comfort.
3. **0.4:** procedural resource inventory, crafting UI, weather/temperature, terrain streaming.
4. **0.5:** narrative survivors, original factions, research logs, expanding city and outlying ruins.
5. **0.6+:** ecosystem variety, giant distant anomalies, alien and prehistoric world chapters, branching decisions, richer audio and cinematic events.

## Licensing

Game logic, names, fiction, art direction and procedural source are created for this prototype. Third-party examples linked in the research document are inspiration only; their source code and visual artwork were not copied. Project copyright and future license remain with the repository owner until a license is selected.