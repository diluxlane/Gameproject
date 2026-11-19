# QA and performance · East Bank 0.2

**Disposition:** finishable development slice. Desktop browser interaction gate passed. Final art direction, physical-device performance, headset comfort and chapter-duration gates remain open.

## What ran

The final production build completed with Node 24.22.3 and Vite 7.3.1. The asset prebuild verified 120 files, 73,286,681 bytes, against SHA-256. The JS bundle was 714.02 kB before gzip and 192.35 kB gzipped. Vite reported its normal large-chunk warning. The downloadable build includes everything required at runtime, third-party notices, instructions and the historical 0.1 compatibility entry point. Archive integrity was checked after packaging.

A Playwright driver ran the built files in Chromium 153 headless using ANGLE/SwiftShader. Static HTTP responses were fulfilled from dist. WebGL2 genuinely rendered on the CPU software adapter. The browser did not fetch third-party resources to play. This setup exercises actual JS, glTF decoding, textures, DOM, input and rendering. It does not measure Internet throughput or a laptop GPU.

| Check | Evidence |
|---|---|
| Main story from fresh browser | Open Chapters, launch chapter, advance then skip montage, walk to each station using keyboard events. No player-state injection on this route. |
| Evidence and inventory | Receive transmission, pick up kit, copy both physical manifests, compare Mara Sol’s entries in the book, drink from flask, open map. |
| Recovery and puzzle | Pause, return to menu, continue at stores, walk to pump, install fuse and refill. Test wrong preset before correct 71.4 MHz. |
| Ending and save | Recover original recording, choose private reply, return to station and reload browser. Continue retains chapter completion. Zero captured page or console errors in the recorded run. |
| Alternate decision | A separate fixture at the final repeater exercised the public broadcast. Canceling restart retained completion. |
| Mobile UI/input | 390 × 844 emulated touch viewport, coarse pointer and dispatched touch contact. Joystick changed position. Settings switched Medium/Low and toggled phone stereo on and off. Emulation cannot establish physical sensor, touch latency or lens comfort. |
| Hardware still needed | Android/iOS motion permission and screen rotation, physical gamepad, headset pose/controllers, Safari and Firefox, integrated laptop GPU, device thermal and sustained memory pressure. |
| Build and source | npm run build passed, the prepared ZIP passed CRC verification. The seven requested design/QA documents and asset register are under docs. |

Run the mission regression from the repository root after npm run build. Install Python Playwright and its Chromium, or point CHROME at a compatible Chromium executable. Then run python scripts/test-chapter.py. The runner writes its captures and JSON to docs/evidence. The captured test route uses a software adapter deliberately.

## Recorded performance

800 × 480 CSS viewport, Low, dynamic internal resolution enabled. Each sample contains 24 consecutive animation-frame intervals. The initial menu sample includes warm-up stalls. Mean FPS is intervals divided by total wall time. GPU timer queries and total VRAM measurements were unavailable. JavaScript heap estimates do not include decoded GPU textures. The run is too short to characterize thermal or long-session behavior.

| View | Mean FPS | Median interval | p95 interval | Draws / triangles in last frame | Internal width |
|---|---:|---:|---:|---:|---:|
| Main menu | 5.02 | 16.7 ms | 1549.9 ms | 223 / 388,180 | 454 px |
| Archive yard | 6.55 | 150.0 ms | 216.7 ms | 49 / 162,972 | 440 px |

First rendered station frame occurred **6.74 s** after document navigation on the local fixture. Chromium reported about 47.4 MB JS heap, 87 resident textures and 115 geometries at the yard sample. Early iterations submitted about 2.38M triangles from the menu on Low. Shared reduced mesh indices, distance switching and lower foliage instance counts reduced that load. These software results miss the proposed 30/60 FPS gates. Real hardware results remain unknown.

[Raw profile](evidence/software-profile.json)

## Visual gate and iteration record

| View | Observed change | Remaining art work |
|---|---|---|
| [Menu](evidence/menu.jpg) | Replaced stacked distant slab towers with recognizable cooling shells and chimneys. The parabolic silhouette, feeds and lattice legs now read across the yard. | Skyline depth and the far perimeter need a designed transition into the city. |
| [Shelter](evidence/shelter.jpg) | Replaced an oversized polished radio and miniature street lantern with weathered equipment and a wall practical. Shelter now contains a real evidence sheet. | Baked indirect lighting, contact shadows, cable connections and more personal belongings are needed to make this someone’s lived-in refuge. |
| [Stores](evidence/stores.jpg) | Tool kit and medical case occupy a work surface. Marginal growth replaces much of the earlier random mid-road scatter. | Gap between stations still reads bare; moisture history, wheel traffic and human-scale evacuation traces need a dedicated pass. |
| [Pump](evidence/pump.jpg) | Photographic generator, tanks and material response distinguish equipment use. Wetness is integrated into asphalt after freestanding puddle geometry read as discs. | The pump building needs a more convincing inlet/outlet connection and improved ground contact. |
| [Archive](evidence/archive.jpg) | The cabinet, secondary dish and aerial event share the same space. The machinery remains readable in daylight. | The passing hull needs a distinctive model and motion. The archive needs a tactile tape mechanism and richer interior. |
| [Ending](evidence/ending.jpg) | Actual decision feedback in the playable route. | Performed voices and a visible reaction from the ferry remain production work. |

Main art captures use fixed poses at 1080 × 650, High, with adaptive resolution held for comparison. They are browser output. The [mission capture](evidence/mission-archive.jpg) was taken during the walk-through on Low. A resize previously cleared the canvas after rendering and could leave a blank frame in a transition capture; resolution adjustment now runs before drawing.

## Current decision

Do not expand the map until a physical laptop and phone profile exists, the shelter and pump pass a close-up contact/lighting review, and first-time players can recount the ferry mystery after playing. The available evidence demonstrates a short playable chapter with working saves. A 15–30 minute duration, photorealistic character performance, continuously streamed districts and headset campaign play have not been validated.
