# AFTERSIGNAL: 2030 — The Awakening

A locally rendered first-person survival mystery set at East Bank receiving station. Ira wakes to a message from her sister on an evacuated ferry. Restore the intake, tune the yard repeater and decide who hears the original 2019 recording.

## Play the development branch

Requires Node 22.12+ or Node 24, and a browser with WebGL2 and hardware acceleration enabled.

```sh
git clone --branch dev/awakening-waterworks --single-branch https://github.com/diluxlane/Gameproject.git
cd Gameproject
npm ci
npm run dev
```

Open the localhost URL printed by Vite. The first development start or build downloads 120 pinned, checksum-verified art files (73,286,681 bytes) into public/art. Subsequent runs reuse them. A built copy contains every runtime resource. The game has no account service, analytics, runtime CDN or mandatory backend. Serve it over HTTP; double-clicking index.html does not initialize ES modules reliably.

```sh
npm run build
npm run preview
```

To play a prebuilt copy, extract it, run `python -m http.server 8000 --bind 127.0.0.1` in the directory containing index.html, and visit http://127.0.0.1:8000. On Windows, `py -m http.server 8000 --bind 127.0.0.1` also works with the Python launcher.

## Controls

| Action | Input |
|---|---|
| Move / run | WASD or up/down arrows / left Shift. Touch joystick or gamepad left stick. |
| Look | Mouse lock after a click, drag on touch, left/right arrows, or right stick. |
| Use | E, contextual touch button, or gamepad A. |
| Journal, inventory and station plan | J; M opens the plan directly. |
| Pause / resume | Escape or Pause. |
| Settings | Menu or pause screen. Graphics presets, sound, guidance, reduced camera motion and sensitivity. |
| Phone viewer | Enable stereo and optional motion look during play. Drag works without sensors. |
| Headset inspection | Settings offers a seated station tour only when the browser reports immersive VR support. Experimental. |

New Game starts the historical montage. Continue restores the local checkpoint, including the final broadcast decision. Storage is scoped to the browser and origin. Chapters also offers the original 0.1 game when a 0.1 save is present. Localhost and HTTPS are suitable secure contexts for compatible XR hardware.

## Design and evidence

- [AAA and browser project research](docs/AAA_RESEARCH.md)
- [Graphics architecture](docs/GRAPHICS_ARCHITECTURE.md)
- [Visual design bible](docs/VISUAL_DESIGN_BIBLE.md) and [art credits](docs/ASSETS.md)
- [Story bible](docs/STORY_BIBLE.md)
- [Gameplay and persistence](docs/GAMEPLAY_DESIGN.md)
- [Implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md)
- [QA, captures and performance](docs/QA_AND_PERFORMANCE.md)

Append `?profile` to expose read-only frame diagnostics under window.stationProfile. Append `?capture` to hold render scale for comparable art captures. These modes send no telemetry. No release deployment is part of this branch.
