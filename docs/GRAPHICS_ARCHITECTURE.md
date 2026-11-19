# Renderer decision record

**Ship the first branch with Three.js WebGLRenderer, a glTF/PBR art pipeline and a static local simulation.** The audited starting point was six tracked files at fe88a78. Its world renderer encoded most objects as colored procedural meshes; interaction, touch input, saving and stereo were independent ideas worth preserving. A renderer swap alone would have left the same art problem.

| Requirement | Three.js WebGL2 / WebGPU | PlayCanvas | Babylon.js | Custom GLSL / WGSL |
|---|---|---|---|---|
| PBR, geometric detail, animation | glTF standard/physical materials, skinning, animation mixers, instancing. Classic renderer or node materials on the newer backend. | Component/entity pipeline, glTF, skinning, material and lighting tooling. | PBR, glTF, animation groups and scene system. | All material models, import conventions, tangents and skinning require ownership. |
| Shadows and indirect light | Shadow maps, environment probes. AO, SSR and temporal passes have backend-specific implementations. | Clustered lighting, shadows, probes and baked lightmaps are a good fit for authored interiors. | Shadow generators, environment lighting, SSAO and SSR pipelines. | Maximum control; maintaining stable shadow bias, roughness and history rejection across devices becomes engine work. |
| Tone map, AA, fog, weather | Filmic operators, MSAA, post passes. Node systems support custom pipelines. Fog and water need art direction on either backend. | Post effects, tone mapping, camera rendering pipeline. Custom shaders for specialized water and weather. | Default rendering pipeline, fog, post-processing and material extensibility. | Excellent for a bounded effect such as a distorted carrier. Poor cost/benefit for reproducing a full engine. |
| Vegetation, terrain, streaming, LOD | InstancedMesh, frustum bounds, LOD, explicit resource disposal. District traversal and streaming remain application responsibilities. | Hardware instancing, batching, asset bundles and entity tools. | Thin instances, LOD, asset containers, instantiation and world-space partition options. | Raw WebGPU compute/indirect draws suit very dense terrain; a separate compatible implementation is expensive. |
| Input, physics and XR | WebXR camera/input helpers, stereo support. A compact kinematic controller fits this flat yard. Full-body physics needs integration. | Entity scripts, physics integration and XR sensors/controllers. | Strong built-in camera/controller abstraction, physics integration and XR experience helpers. | All collision, handoff, projection and comfort controls are bespoke. |
| CPU/GPU/memory | Draw submission can dominate with unbatched geometry. Texture residency dominates asset bytes after decode. | Good published many-object CPU result. A different content/tool workflow would need adoption. | Broad systems are useful for a larger campaign. Feature cost depends on which pipelines are enabled. | Shader freedom does not fix draw count, overdraw or texture residency. |

[Three renderer guide](https://threejs.org/manual/pages/webgpurenderer) · [PlayCanvas graphics](https://developer.playcanvas.com/user-manual/graphics/) · [Babylon specifications](https://www.babylonjs.com/specifications/) · [cross-engine methodology](https://endel.github.io/webgpu-webgl-benchmarks/)

**Decision rationale.** A few static authored locations, shared prop meshes and one sun do not need a compute-first engine. WebGL2 allows a common test path and reuses ordinary glTF materials. Three offers low-level placement control and a small integration surface for the existing browser game. PlayCanvas deserves a production bake-off if entity editing, clustered lights or scene batching become the dominant authoring cost. Babylon deserves one if the project becomes physics- or headset-led. A WebGPU/TSL backend should earn its place on frame-time, parity and device coverage using the same two scenes. Automatic fallback exists in Three's WebGPURenderer; this implementation explicitly uses the classic renderer.

## Data flow and rendering

Pinned packages → checksum-verified source assets → local public/art → static production build → browser fetch/decode → assembled world → shader warm-up → first frame. No runtime CDN. Loading counts completed assets/maps and preparation stages. A count is not a byte percentage. A failed fetch or unavailable WebGL displays an error and a retry action. One world is shared by menu and play across restarts; assets stay resident while that district is in use.

An HDR panorama supplies sky color and prefiltered specular lighting. Directional shadow maps ground the structures; static geometry allows reuse between frames. Three's filmic output compresses bright highlights. The one local practical gives the radio bench a warmer reading. Normal and roughness maps supply material variation. Puddles receive environment reflections; nearby dynamic geometry is not reflected. Foliage and lattice elements reuse buffers and submit repeated geometry as instances. The skyline is scenery outside the walkable boundary.

## Translating Unreal research into browser targets

| Unreal concept | What to preserve perceptually | Implementation decision |
|---|---|---|
| Lumen dynamic GI/reflections | Neighbor color, shadow fill and contact | Use local or baked irradiance and reflection probes before dynamic bounce. The yard currently has a single environment and hemisphere fill. Bake the shelter separately next. |
| Nanite virtual geometry | Continuous silhouettes without obvious pop | Use offline mesh reduction, small material sets, instancing, authored distance levels and collision proxies. Nanite's virtualized cluster rasterizer is outside this renderer. |
| TSR | Stable fine edges at a lower internal resolution | Current path uses MSAA and spatial scale changes. Temporal reconstruction needs velocity, jitter, history rejection and transparent vegetation tests. Compare in moving footage before adopting. |
| Volumetrics | Separation of near and far planes | Exponential distance haze plus a photographed sky. A low-resolution local fog volume could serve one future anomaly, with a depth-aware composite. |

[Epic rendering-path matrix](https://dev.epicgames.com/documentation/unreal-engine/supported-features-by-rendering-path-for-desktop-with-unreal-engine) · [TSR](https://dev.epicgames.com/documentation/unreal-engine/temporal-super-resolution-in-unreal-engine) · [Lumen performance guide](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-performance-guide-for-unreal-engine)

## Budgets and gates

Use 16.7 ms and 33.3 ms as desktop and phone frame-time targets; record median and p95 independently. A 1024² RGBA8 map with a full mip chain can occupy about 5.33 MiB before driver compression, regardless of JPEG transfer size. Sharing maps matters. Create per-district ownership and release geometries, textures, image bitmaps and render targets on district unload before implementing world streaming. Test repeated load/unload cycles, context loss, and low-memory startup under pressure. KTX2/Basis packaging, lightmap atlases, controller physics on uneven terrain, temporal AA and selective SSR remain candidate upgrades. Benchmark XR separately at the headset’s target refresh rate.
