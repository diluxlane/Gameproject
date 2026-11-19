// Receiving Station 17. Dimensions and placement are in metres.
import * as T from "three";
import { MeshoptSimplifier } from "meshoptimizer/simplifier";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { StereoEffect } from "three/addons/effects/StereoEffect.js";

const root = import.meta.env.BASE_URL + "art/";
const metal = (color, roughness = 0.64, metalness = 0.65) =>
  new T.MeshStandardMaterial({ color, roughness, metalness });
const v = (x, y, z) => new T.Vector3(x, y, z);
const white = metal("#ada998"),
  dark = metal("#343b39"),
  amber = metal("#bc7736");
const box = new T.BoxGeometry(),
  cylinder = new T.CylinderGeometry(1, 1, 1, 12);
const ball = new T.SphereGeometry(1, 24, 12);
const up = v(0, 1, 0);
const profiles = {
  Low: [0.75, 512, false, 26],
  Medium: [1, 1024, true, 48],
  High: [1.35, 2048, true, 75],
  Ultra: [1.75, 4096, true, 120],
};
export const stations = {
  radio: [-2.6, 13],
  kit: [-9, -6],
  plant: [8, -8],
  archive: [1, -20],
  beacon: [5, 3],
};
export async function buildWorld(canvas, progress) {
  const fixedCapture = new URLSearchParams(location.search).has("capture");
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.89;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(61, 1, 0.08, 640);
  const stereoEffect = new StereoEffect(renderer);
  const obstacles = [],
    foliage = [],
    batches = new Map(),
    models = {};
  let seed = 1731;
  const rand = () =>
    (seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296;
  let completed = 0;
  const names = [
    "portable_generator",
    "metal_toolbox",
    "covered_car",
    "power_box_01",
    "grass_medium_01",
    "concrete_road_barrier",
    "painted_wooden_bench",
    "medical_box",
    "street_lamp_01",
    "fern_02",
    "modular_factory_facade",
    "boombox",
    "industrial_wall_lamp",
    "shrub_02",
    "cardboard_box_01",
    "painted_wooden_cabinet_02",
    "propane_tank",
  ];
  const surfaces = [
    "concrete_floor_02",
    "rusty_metal_02",
    "corrugated_iron_03",
    "worn_asphalt",
    "cracked_concrete_wall",
  ];
  const total = names.length + surfaces.length * 3 + 3;
  const done = (label) => progress(++completed, total, label);
  const tex = new T.TextureLoader(),
    loader = new GLTFLoader();
  const mats = {};
  await Promise.all([
    new HDRLoader().loadAsync(root + "dusk.hdr").then((t) => {
      t.mapping = T.EquirectangularReflectionMapping;
      scene.background = t;
      scene.environment = t;
      scene.environmentIntensity = 0.58;
      scene.backgroundIntensity = 0.76;
      scene.environmentRotation.y = scene.backgroundRotation.y = 2.1;
      done("Sky and reflection probe");
    }),
    ...surfaces.map(async (name) => {
      const maps = await Promise.all(
        ["diff", "nor_gl", "rough"].map(async (ch) => {
          const t = await tex.loadAsync(root + name + "_" + ch + ".jpg");
          t.wrapS = t.wrapT = T.RepeatWrapping;
          t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          if (ch === "diff") t.colorSpace = T.SRGBColorSpace;
          done("Surveying surfaces");
          return t;
        }),
      );
      mats[name] = new T.MeshStandardMaterial({
        map: maps[0],
        normalMap: maps[1],
        roughnessMap: maps[2],
        roughness: 0.88,
        metalness: /metal|iron/.test(name) ? 0.48 : 0.03,
      });
    }),
    ...names.map(async (name) => {
      models[name] = (
        await loader.loadAsync(root + (name + "/" + name + ".gltf"))
      ).scene;
      done("Unpacking station equipment");
    }),
  ]);
  const concrete = mats.cracked_concrete_wall,
    rust = mats.rusty_metal_02,
    iron = mats.corrugated_iron_03;
  scene.fog = new T.FogExp2("#b1a795", 0.006);
  const sun = new T.DirectionalLight("#ffd29d", 2.6);
  sun.position.set(-32, 23, -33);
  sun.target.position.set(0, 0, -6);
  scene.add(sun, sun.target);
  Object.assign(sun.shadow.camera, {
    left: -33,
    right: 33,
    top: 34,
    bottom: -34,
    near: 0.1,
    far: 105,
  });
  sun.shadow.normalBias = 0.025;
  sun.shadow.bias = -0.00025;
  scene.add(new T.HemisphereLight("#c2d6e0", "#665247", 0.38));
  const coll = (x, z, w, d) =>
    obstacles.push([x - w / 2, z - d / 2, x + w / 2, z + d / 2]);
  function stamp(geo, mat, pos, scale, quat = new T.Quaternion()) {
    const key = geo.uuid + mat.uuid;
    if (!batches.has(key)) batches.set(key, { geo, mat, matrices: [] });
    batches.get(key).matrices.push(new T.Matrix4().compose(pos, quat, scale));
  }
  function block(x, y, z, w, h, d, mat = concrete, solid = false) {
    // Unique metre-scale UVs keep formwork and corrosion at a consistent texel density.
    if (mat.map) {
      const g = new T.BoxGeometry(w, h, d),
        p = g.attributes.position,
        n = g.attributes.normal,
        uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        const side = Math.abs(n.getX(i)) > 0.5,
          top = Math.abs(n.getY(i)) > 0.5;
        uv.setXY(
          i,
          (side ? p.getZ(i) : p.getX(i)) / 3,
          (top ? p.getZ(i) : p.getY(i)) / 3,
        );
      }
      const m = new T.Mesh(g, mat);
      m.position.set(x, y, z);
      m.castShadow = m.receiveShadow = true;
      scene.add(m);
    } else stamp(box, mat, v(x, y, z), v(w, h, d));
    if (solid) coll(x, z, w, d);
  }
  function rod(a, b, r, mat = dark) {
    const delta = b.clone().sub(a);
    stamp(
      cylinder,
      mat,
      a.clone().lerp(b, 0.5),
      v(r, delta.length(), r),
      new T.Quaternion().setFromUnitVectors(up, delta.normalize()),
    );
  }
  await MeshoptSimplifier.ready;
  const reductions = new WeakMap(),
    detailGroups = [];
  function reduced(geometry) {
    if (
      !geometry.index ||
      geometry.index.count < 900 ||
      !MeshoptSimplifier.supported
    )
      return geometry;
    if (reductions.has(geometry)) return reductions.get(geometry);
    const attr = geometry.attributes.position,
      positions = new Float32Array(attr.count * 3);
    for (let i = 0; i < attr.count; i++)
      positions.set([attr.getX(i), attr.getY(i), attr.getZ(i)], i * 3);
    const [indices] = MeshoptSimplifier.simplify(
      Uint32Array.from(geometry.index.array),
      positions,
      3,
      Math.floor((geometry.index.count * 0.16) / 3) * 3,
      0.045,
      ["Permissive"],
    );
    const result = new T.BufferGeometry();
    for (const [key, value] of Object.entries(geometry.attributes))
      result.setAttribute(key, value);
    result.setIndex(new T.BufferAttribute(indices, 1));
    result.boundingSphere = geometry.boundingSphere;
    reductions.set(geometry, result);
    return result;
  }
  function prop(name, x, z, extent, y = 0, angle = 0, source = models[name]) {
    const obj = source.clone(true);
    obj.position.set(0, 0, 0);
    obj.rotation.y += angle;
    obj.updateMatrixWorld(true);
    const bounds = new T.Box3().setFromObject(obj),
      size = bounds.getSize(v()),
      center = bounds.getCenter(v());
    const s = extent / Math.max(size.x, size.y, size.z);
    const group = new T.Group();
    group.add(obj);
    group.scale.setScalar(s);
    group.position.set(
      x - center.x * s,
      y - bounds.min.y * s,
      z - center.z * s,
    );
    obj.traverse((m) => {
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    const proxy = group.clone(true);
    proxy.traverse((m) => {
      if (m.isMesh) m.geometry = reduced(m.geometry);
    });
    scene.add(group, proxy);
    detailGroups.push({ group, proxy });
    return group;
  }
  function placard(
    text,
    sub,
    x,
    y,
    z,
    width,
    base = "#d0c5a7",
    ink = "#242e2b",
  ) {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = base;
    g.fillRect(0, 0, 1024, 256);
    g.fillStyle = ink;
    g.fillRect(0, 0, 18, 256);
    g.font = "bold 95px sans-serif";
    g.fillText(text, 48, 121, 930);
    g.font = "35px monospace";
    g.fillText(sub, 52, 199, 920);
    for (let i = 0; i < 4200; i++) {
      g.fillStyle = rand() > 0.5 ? "#0002" : "#fff2";
      g.fillRect(rand() * 1024, rand() * 256, rand() * 4 + 1, 1);
    }
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    const sign = new T.Mesh(
      new T.PlaneGeometry(width, width / 4),
      new T.MeshStandardMaterial({ map: t, roughness: 0.85 }),
    );
    sign.position.set(x, y, z);
    scene.add(sign);
  }
  block(0, -0.36, -5, 94, 0.7, 84, mats.worn_asphalt);
  // Open-fronted maintenance shelter, covered work bay and rear archive wall.
  function shed(x, z, w, d, h) {
    block(x, h / 2, z + d / 2, w, h, 0.3, concrete, true);
    for (const side of [-1, 1]) {
      block(x + (side * w) / 2, h / 2, z, 0.24, h, d, concrete, true);
      rod(
        v(x + (side * w) / 2, h - 0.2, z - d / 2),
        v(x + (side * w) / 2, h - 0.2, z + d / 2),
        0.11,
        rust,
      );
    }
    block(x, h + 0.04, z, w + 0.8, 0.18, d + 0.9, iron);
    block(x, 0.015, z, w, 0.05, d, mats.concrete_floor_02);
    for (let k = -d / 2; k <= d / 2; k += 1.35)
      block(x, h - 0.1, z + k, w, 0.16, 0.08, dark);
  }
  shed(0, 14, 9, 6, 3.7);
  block(-2.6, 0.82, 13, 2.6, 0.13, 1.05, rust, true);
  for (const x of [-3.7, -1.5])
    for (const z of [12.6, 13.4]) rod(v(x, 0, z), v(x, 0.82, z), 0.045);
  function manifestPage(x, y, z, side, passenger) {
    const paper = document.createElement("canvas");
    paper.width = 480;
    paper.height = 640;
    const g = paper.getContext("2d");
    g.fillStyle = "#c9b996";
    g.fillRect(0, 0, 480, 640);
    g.fillStyle = "#283b36";
    g.font = "bold 34px monospace";
    g.fillText("EAST BANK", 32, 56);
    g.font = "20px monospace";
    g.fillText("CROSSING 04 / " + side, 32, 95);
    for (let i = 0; i < 9; i++) {
      g.fillRect(26, 143 + 48 * i, 420, 1);
      g.fillText(String(i + 1).padStart(2, "0"), 32, 179 + 48 * i);
    }
    g.font = "italic 24px Georgia";
    g.fillText(passenger, 118, 321);
    g.fillText("N. Vale", 330, 572);
    const map = new T.CanvasTexture(paper);
    map.colorSpace = T.SRGBColorSpace;
    const page = new T.Mesh(
      new T.PlaneGeometry(0.29, 0.39),
      new T.MeshStandardMaterial({ map, roughness: 0.93 }),
    );
    page.rotation.set(-Math.PI / 2, 0, 0.18);
    page.position.set(x, y, z);
    scene.add(page);
  }
  manifestPage(-1.75, 0.891, 13.15, "SHORE", "Mara Sol / missed departure");
  manifestPage(-9.96, 0.889, -5.58, "FERRY", "Mara Sol / aboard");
  prop("boombox", -2.6, 13, 0.78, 0.89, Math.PI * 0.18);
  prop("painted_wooden_cabinet_02", -3.4, 15.8, 1.8, 0, 1.4);
  coll(-3.4, 15.8, 1.1, 1);
  prop("industrial_wall_lamp", -4.26, 13.2, 0.55, 2.25, 1.57);
  for (const [x, z, s, y] of [
    [2, 13.9, 0.59, 0],
    [2.45, 13.5, 0.44, 0],
    [2, 13.9, 0.42, 0.48],
    [-3.4, 10.65, 0.65, 0],
  ])
    prop("cardboard_box_01", x, z, s, y, x);
  placard("17   /   INTAKE", "EAST BANK MAINTENANCE", -2.4, 2.52, 16.82, 2.8);
  prop("painted_wooden_bench", 2.8, 15, 2.2);
  coll(2.8, 15, 2.2, 0.7);
  block(-10, 0.44, -6, 3.2, 0.88, 1.4, concrete, true);
  prop("metal_toolbox", -9, -6, 0.83, 0.88);
  prop("medical_box", -10.5, -6, 0.56, 0.88);
  block(-10, 1.8, -8.2, 5.1, 3.6, 0.32, iron, true);
  placard("FIELD STORES", "FUSES   /   FILTERS", -10, 2.55, -8, 2.65);
  prop("portable_generator", 8, -8, 2.5);
  coll(8, -8, 2.1, 1.2);
  block(10, 1.55, -11, 5.3, 3.1, 0.45, concrete, true);
  prop("power_box_01", 9.6, -10.55, 1.15, 1);
  placard(
    "PUMP 04",
    "MUNICIPAL WATER   /   EAST INTAKE",
    9.6,
    2.65,
    -10.76,
    3.4,
  );
  for (const x of [7.5, 8.15]) {
    rod(v(x, 0.25, -10.4), v(x, 2.9, -10.4), 0.11, rust);
    rod(v(x, 2.9, -10.4), v(x + 1, 2.9, -10.4), 0.11, rust);
  }
  block(1, 1.7, -21, 7, 3.4, 0.55, concrete, true);
  prop("power_box_01", 1, -20.5, 1.35, 0.7);
  placard("TAPE LIBRARY", "COASTAL SURVEY   /   2019", 1, 2.65, -20.71, 3.65);
  block(5, 0.63, 3, 1.8, 1.26, 0.75, iron, true);
  prop("boombox", 5, 3, 0.68, 1.26);
  prop("covered_car", -8, 2, 4.6, 0, 0.45);
  coll(-8, 2, 2.9, 3.6);
  for (const [x, z, a] of [
    [-13, 8, 0.2],
    [13, 4, -0.2],
    [12, -18, 0.3],
    [-12, -18, 0.08],
  ]) {
    prop("concrete_road_barrier", x, z, 3.3, 0, a);
    coll(x, z, 3.3, 0.85);
  }
  for (const [x, z] of [
    [-14, 1],
    [12, -2],
    [-12, -17],
  ])
    prop("street_lamp_01", x, z, 7);
  // The archive and pump share an enclosed service room with intake vents and an overhead cable tray.
  for (const [x, z, w, h, depth] of [
    [1, -21, 7, 3.4, 3.8],
    [10, -11, 5.3, 3.1, 3.6],
    [-10, -8.2, 5.1, 3.6, 2.9],
  ]) {
    for (const dir of [-1, 1])
      block(
        x + dir * (w / 2 - 0.09),
        h / 2,
        z - depth / 2,
        0.18,
        h,
        depth,
        iron,
        true,
      );
    block(x, h / 2, z - depth, w, h, 0.22, concrete, true);
    block(x, h + 0.08, z - depth / 2, w + 0.55, 0.2, depth + 0.55, iron);
    for (let j = 0; j < 7; j++)
      block(
        x + w * 0.33,
        h * 0.49 + j * 0.085,
        z + 0.33,
        w * 0.21,
        0.045,
        0.075,
        dark,
      );
    for (let j = 0; j < 4; j++)
      rod(
        v(x - w * 0.46, h + 0.15, z - (depth * j) / 4),
        v(x + w * 0.46, h + 0.15, z - (depth * j) / 4),
        0.04,
        dark,
      );
  }
  const trayStart = v(1, 3.7, -23),
    trayEnd = v(10, 3.6, -13);
  for (const delta of [-0.21, 0.21])
    rod(
      trayStart.clone().add(v(delta, 0, 0)),
      trayEnd.clone().add(v(delta, 0, 0)),
      0.07,
      dark,
    );
  for (let i = 0; i <= 22; i++) {
    const p = trayStart.clone().lerp(trayEnd, i / 22);
    rod(
      p.clone().add(v(-0.24, 0, 0)),
      p.clone().add(v(0.24, 0, 0)),
      0.04,
      rust,
    );
  }
  // Main reflector: curved, separated panels, radial back trusses, feed horn and mount.
  function dish(cx, cz, R, alt, az) {
    const hub = v(cx, alt, cz),
      q = new T.Quaternion().setFromEuler(new T.Euler(-0.94, az, 0, "YXZ"));
    const pt = (r, a, offset = 0) =>
      v(r * Math.cos(a), r * Math.sin(a), (0.31 * r * r) / R + offset)
        .applyQuaternion(q)
        .add(hub);
    const pos = [],
      uv = [],
      indices = [];
    const sectors = 32,
      rings = 5;
    for (let k = 0; k < sectors; k++) {
      for (let j = 0; j < rings; j++) {
        const start = pos.length / 3;
        for (const [r, a] of [
          [j, 0.012],
          [j + 1, 0.012],
          [j + 1, 0.988],
          [j, 0.988],
        ]) {
          const rad = Math.max(0.12, (r / rings) * R),
            ang = ((k + a) * Math.PI * 2) / sectors,
            p = pt(rad, ang);
          pos.push(...p.toArray());
          uv.push((rad * Math.cos(ang)) / 4, (rad * Math.sin(ang)) / 4);
        }
        indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
      }
      const a = (k * 2 * Math.PI) / sectors,
        b = ((k + 1) * 2 * Math.PI) / sectors;
      for (let j = 1; j <= rings; j++) {
        rod(
          pt((R * j) / rings, a, -0.04),
          pt((R * j) / rings, b, -0.04),
          R * 0.0045,
          white,
        );
      }
      rod(pt(0.1, a, -0.1), pt(R * 0.65, a, -R * 0.13), R * 0.012, dark);
      rod(pt(R * 0.65, a, -R * 0.13), pt(R, a, -0.06), R * 0.009, white);
      if (k % 8 === 0)
        rod(pt(R * 0.89, a), pt(0, 0, R * 0.75), R * 0.009, white);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const skin = mats.concrete_floor_02.clone();
    skin.color.set("#d8dbd7");
    skin.normalScale.setScalar(0.19);
    skin.side = T.DoubleSide;
    skin.metalness = 0.32;
    skin.roughness = 0.64;
    const bowl = new T.Mesh(geo, skin);
    bowl.castShadow = bowl.receiveShadow = true;
    scene.add(bowl);
    stamp(ball, dark, pt(0, 0, R * 0.75), v(R * 0.071, R * 0.071, R * 0.085));
    for (const side of [-1, 1]) {
      rod(v(cx + side * R * 0.42, 0.5, cz + R * 0.22), hub, R * 0.039, white);
      rod(v(cx + side * R * 0.4, 0.5, cz - R * 0.35), hub, R * 0.032, rust);
    }
    for (const side of [-1, 1])
      for (let j = 0; j < 5; j++) {
        const t = j / 5,
          n = (j + 1) / 5;
        const leg = (z, u) =>
          v(cx + side * R * 0.41, 0.5, cz + R * z).lerp(hub, u);
        rod(leg(0.22, t), leg(-0.35, n), R * 0.009, white);
        rod(leg(-0.35, t), leg(0.22, n), R * 0.009, dark);
      }
    block(cx, 0.4, cz, R * 1.19, 0.8, R * 0.94, concrete, true);
  }
  dish(12, -30, 12, 13, -0.41);
  dish(-30, -48, 6.4, 8, 0.82);
  // Radio lattice towers, segmented aerial cables, and pipe gallery.
  function mast(x, z, h) {
    const point = (level, corner) => {
      const a = ((corner % 3) * Math.PI * 2) / 3,
        r = (1 - level / h) * 1.2 + 0.2;
      return v(x + Math.cos(a) * r, level, z + Math.sin(a) * r);
    };
    for (let j = 0; j < h; j += 2)
      for (let k = 0; k < 3; k++) {
        const next = Math.min(j + 2, h);
        rod(point(j, k), point(next, k), 0.065, dark);
        rod(point(j, k), point(next, k + 1), 0.037, rust);
        rod(point(j, k), point(j, k + 1), 0.038, white);
      }
    stamp(
      ball,
      new T.MeshBasicMaterial({ color: 0xff522c }),
      point(h, 0),
      v(0.11, 0.11, 0.11),
    );
  }
  mast(-16, -25, 22);
  mast(26, -33, 29);
  for (let k = 0; k < 3; k++) {
    let last = v(-16, 16 + k * 0.25, -25);
    for (let i = 1; i <= 24; i++) {
      const t = i / 24,
        p = v(
          -16 + 42 * t,
          16 + 3 * t - 3 * Math.sin(Math.PI * t) + k * 0.25,
          -25 - 8 * t,
        );
      rod(last, p, 0.027);
      last = p;
    }
  }
  for (let j = 0; j < 4; j++) {
    const y = 1.15 + j * 0.48;
    rod(v(-15, y, -24), v(-15, y, 10), 0.18, rust);
    for (let z = -24; z <= 10; z += 2)
      stamp(
        cylinder,
        dark,
        v(-15, y, z),
        v(0.22, 0.075, 0.22),
        new T.Quaternion().setFromAxisAngle(v(1, 0, 0), Math.PI / 2),
      );
  }
  for (let z = -24; z < 11; z += 4) block(-15, 0.6, z, 1.5, 1.2, 0.4, concrete);
  // Rebuild two occupied factory elevations from matched 3 m masonry and window modules.
  const facade = models.modular_factory_facade;
  function masonry(name, x, y, z, angle) {
    const module = facade.getObjectByName(name);
    const orientation = new T.Quaternion().setFromAxisAngle(up, angle);
    module.traverse((m) => {
      if (m.isMesh)
        stamp(
          reduced(m.geometry),
          m.material,
          v(x, y, z),
          v(1, 1, 1),
          orientation,
        );
    });
  }
  for (let floor = 0; floor < 3; floor++)
    for (let bay = 0; bay < 10; bay++) {
      const variant =
        floor === 0 && bay === 3
          ? "door_garage_centered_01"
          : bay % 3 === 0
            ? "window_tall_large_01"
            : "window_centered_large_01";
      for (const prefix of ["wall_", ""])
        masonry(prefix + variant, -18, floor * 3, -24 + bay * 3, Math.PI / 2);
    }
  for (let floor = 0; floor < 2; floor++)
    for (let bay = 0; bay < 12; bay++) {
      const variant =
        bay % 4 === 0 ? "window_tall_large_01" : "window_centered_large_01";
      for (const prefix of ["wall_", ""])
        masonry(prefix + variant, -24 + bay * 3, floor * 3, -32, 0);
    }
  block(-21, 4.3, -9, 5.8, 8.6, 31, dark);
  block(-7, 2.9, -35, 38, 5.8, 5, dark);
  // Damp patches vary inside the asphalt material, with no floating reflection meshes.
  mats.worn_asphalt.color.set("#bebdb7");
  mats.worn_asphalt.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <roughnessmap_fragment>",
      `#include <roughnessmap_fragment>
   float wetPatch = smoothstep(.38,.56,texture2D(roughnessMap,vRoughnessMapUv*.13).g);
   roughnessFactor=mix(roughnessFactor,.21,wetPatch*.75);
   diffuseColor.rgb*=1.-.23*wetPatch;`,
    );
  };
  // Distant evacuation blocks and broken slab silhouettes.
  // Hyperboloid shells, service bands and exhaust stacks distinguish the old generating district.
  const shell = concrete.clone();
  shell.color.set("#a29d91");
  shell.side = T.DoubleSide;
  for (const [x, z, h, r] of [
    [-34, -86, 27, 10],
    [-10, -96, 24, 9],
    [46, -74, 19, 7],
  ]) {
    const profile = [];
    for (let j = 0; j <= 24; j++) {
      const t = j / 24;
      profile.push(new T.Vector2(r * (0.53 + 1.08 * (t - 0.68) ** 2), t * h));
    }
    const tower = new T.Mesh(new T.LatheGeometry(profile, 60), shell);
    tower.position.set(x, 0.4, z);
    tower.castShadow = true;
    scene.add(tower);
    const lip = new T.Mesh(
      new T.TorusGeometry(profile.at(-1).x, 0.16, 6, 64),
      dark,
    );
    lip.rotation.x = Math.PI / 2;
    lip.position.set(x, h + 0.42, z);
    scene.add(lip);
  }
  for (const [x, z, h] of [
    [-51, -69, 31],
    [-47, -70, 34],
    [32, -89, 27],
    [36, -90, 25],
  ]) {
    const chimney = new T.Mesh(new T.CylinderGeometry(0.64, 1.05, h, 20), iron);
    chimney.position.set(x, h / 2, z);
    scene.add(chimney);
    for (let j = 0; j < 4; j++)
      stamp(cylinder, rust, v(x, h - j * 2.75 - 0.5, z), v(0.79, 1.15, 0.79));
  }
  for (let i = 0; i < 8; i++) {
    const x = 22 + (i % 4) * 4.5,
      z = -55 - Math.floor(i / 4) * 6,
      h = 6 + (i % 3);
    stamp(cylinder, white, v(x, h / 2, z), v(2.1, h, 2.1));
    stamp(ball, dark, v(x, h, z), v(2.1, 0.65, 2.1));
  }
  for (const [x, z, s] of [
    [12, -10, 1.3],
    [12.8, -10.4, 1.4],
    [-11, -7.1, 1.0],
  ])
    prop("propane_tank", x, z, s);
  // Planted clumps use actual leaf meshes; shared instanced buffers and distance bands.
  const grass =
    models.grass_medium_01.getObjectByName("grass_medium_01_mid_a_LOD0") ||
    models.grass_medium_01.children[0];
  function scatter(source, count, range, height) {
    const m = source.isMesh
      ? source
      : (() => {
          let first;
          source.traverse((o) => {
            if (!first && o.isMesh) first = o;
          });
          return first;
        })();
    const geom = reduced(m.geometry);
    geom.computeBoundingBox();
    const b = geom.boundingBox,
      sz = b.getSize(v()),
      base = b.getCenter(v());
    base.y = b.min.y;
    for (let band = 0; band < 4; band++) {
      const mesh = new T.InstancedMesh(geom, m.material, Math.ceil(count / 4));
      const pivot = new T.Object3D();
      for (let i = 0; i < mesh.count; i++) {
        const x = (band % 2 === 0 ? -1 : 1) * (9 + rand() * range),
          z = (band < 2 ? -20 : 1) + rand() * 17,
          s = (height * (0.48 + rand())) / sz.y;
        pivot.position.set(x, 0, z);
        pivot.rotation.y = rand() * 6.28;
        pivot.scale.setScalar(s);
        pivot.updateMatrix();
        mesh.setMatrixAt(
          i,
          pivot.matrix
            .clone()
            .multiply(
              new T.Matrix4().makeTranslation(-base.x, -base.y, -base.z),
            ),
        );
      }
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      scene.add(mesh);
      foliage.push(mesh);
    }
  }
  scatter(grass, 300, 8, 0.44);
  scatter(models.fern_02, 66, 7, 0.72);
  for (const [x, z, h] of [
    [-12, -8, 1.65],
    [-12.8, -9, 1.95],
    [12, -16, 1.63],
    [13.5, -16.7, 2.25],
    [-12, 6, 1.6],
  ])
    prop("shrub_02", x, z, h, 0, x, models.shrub_02.children[0]);
  // Paint only where the yard was used.
  for (let z = -19; z < 11; z += 3)
    stamp(box, amber, v(-3.7, 0.007, z), v(0.095, 0.009, 1.25));
  placard(
    "SHELTER 17",
    "EAST BANK   /   RECEIVING STATION",
    0,
    3.28,
    17.82,
    4.6,
  );
  for (const { geo, mat, matrices } of batches.values()) {
    const mesh = new T.InstancedMesh(geo, mat, matrices.length);
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
  }
  const drone = new T.Group();
  scene.add(drone);
  function moving(geo, mat, x, y, z, sx, sy, sz, parent) {
    const m = new T.Mesh(geo, mat);
    m.scale.set(sx, sy, sz);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  moving(ball, dark, 0, 0, 0, 0.43, 0.21, 0.36, drone);
  const rotors = [];
  for (const x of [-0.48, 0.48])
    for (const z of [-0.42, 0.42]) {
      moving(box, white, x * 0.55, 0, z * 0.55, 0.48, 0.06, 0.25, drone);
      rotors.push(moving(box, dark, x, 0.1, z, 0.57, 0.024, 0.055, drone));
    }
  moving(
    ball,
    new T.MeshBasicMaterial({ color: 0xffa44e }),
    0,
    -0.15,
    0.28,
    0.09,
    0.07,
    0.08,
    drone,
  );
  const anomaly = new T.Group();
  scene.add(anomaly);
  moving(ball, metal("#85918e", 0.17, 0.92), 0, 0, 0, 6.5, 0.82, 3, anomaly);
  const strip = new T.MeshBasicMaterial({ color: "#ffcc82" });
  for (let i = -4; i <= 4; i++)
    moving(ball, strip, i, 0.02, 2.35, 0.065, 0.05, 0.07, anomaly);
  const pilot = moving(
    ball,
    new T.MeshBasicMaterial({ color: 0x282727 }),
    9.6,
    1.9,
    -10.22,
    0.08,
    0.08,
    0.04,
    scene,
  );
  const lamp = new T.PointLight("#ffab56", 5, 5);
  lamp.position.set(-4.0, 2.4, 13.2);
  scene.add(lamp);
  let quality,
    scale = 1,
    stereo = false,
    lastScale = 0,
    slow = 0,
    lastTime = 0;
  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(scale);
    renderer.setSize(innerWidth, innerHeight, false);
  }
  function preset(q) {
    quality = profiles[q] || profiles.High;
    scale = Math.min(devicePixelRatio, quality[0]);
    renderer.shadowMap.enabled = quality[2];
    sun.castShadow = quality[2];
    sun.shadow.mapSize.setScalar(quality[1]);
    if (sun.shadow.map) {
      sun.shadow.map.dispose();
      sun.shadow.map = null;
    }
    renderer.shadowMap.needsUpdate = true;
    resize();
  }
  preset(matchMedia("(pointer:coarse)").matches ? "Low" : "High");
  window.addEventListener("resize", resize);
  const bounds = [-13.8, -21, 13.8, 17];
  const allowed = (x, z) =>
    x > bounds[0] &&
    x < bounds[2] &&
    z > bounds[1] &&
    z < bounds[3] &&
    !obstacles.some(
      ([a, b, c, d]) =>
        x > a - 0.26 && x < c + 0.26 && z > b - 0.26 && z < d + 0.26,
    );
  function setCamera(pos, look) {
    camera.position.copy(pos);
    camera.lookAt(look);
  }
  function frame(player, mode, t, stage, motion = true, shot = 0) {
    if (mode === "menu")
      setCamera(
        v(-10 + Math.sin(motion ? t * 0.047 : 0) * 1.2, 3.1, 5.2),
        v(1, 8.6, -32),
      );
    else if (mode === "intro") {
      const shots = [
        [-1, 1.4, 11, -2.6, 1.1, 13],
        [5, 2, 2, -13, 12, -25],
        [-9, 1.9, 1, -9, 1, -6],
        [4, 1.8, -4, 10, 2, -11],
        [-5, 2.5, -8, 8, 10, -32],
        [-1, 2.2, 15, 0, 1.5, 9],
      ];
      const a = shots[shot % shots.length];
      setCamera(v(...a.slice(0, 3)), v(...a.slice(3)));
    } else {
      camera.position.set(player.x, 1.66, player.z);
      camera.rotation.order = "YXZ";
      camera.rotation.set(player.pitch, -player.yaw, 0);
    }
    drone.position.set(
      2 + Math.sin(t * 0.23) * 5,
      2.4 + Math.sin(t) * 0.18,
      -13,
    );
    drone.rotation.y = t * 0.32;
    rotors.forEach((r) => (r.rotation.y = t * 32));
    pilot.material.color.setHex(stage >= 3 ? 0xffbb5a : 0x282727);
    anomaly.visible = stage >= 4;
    anomaly.position.set(
      -10 + Math.sin(t * 0.08) * 19,
      18 + Math.sin(t * 0.16),
      -52,
    );
    detailGroups.forEach(({ group, proxy }) => {
      group.visible =
        group.position.distanceTo(camera.position) < quality[3] * 0.19;
      proxy.visible = !group.visible;
    });
    foliage.forEach((o) => {
      o.visible =
        o.boundingSphere.center.distanceTo(camera.position) -
          o.boundingSphere.radius <
        quality[3];
      o.count = Math.max(
        1,
        Math.floor(o.instanceMatrix.count * Math.min(1, quality[3] / 74)),
      );
    });

    if (lastTime) slow = slow * 0.85 + Math.min(0.5, t - lastTime) * 0.15;
    if (!fixedCapture && t - lastScale > 4 && slow > 0.042 && scale > 0.55) {
      scale = Math.max(0.55, scale * 0.87);
      resize();
      lastScale = t;
      slow = 0;
    }
    lastTime = t;
    if (stereo && mode === "play") stereoEffect.render(scene, camera);
    else renderer.render(scene, camera);
  }
  done("Assembling station");
  await renderer.compileAsync(scene, camera);
  done("Preparing shaders");
  // A seated inspection tour has its own loop, quality preset and discrete viewpoints.
  // Head pose is owned by WebXR for the entire session. No artificial camera motion.
  async function tour(onEnd) {
    const session = await navigator.xr.requestSession("immersive-vr", {
      optionalFeatures: ["local-floor"],
    });
    const rig = new T.Group(),
      spots = [
        [0, 14],
        [-6, -5],
        [6, -6],
        [2, -17],
      ],
      poses = [0, -0.6, 0.4, 0];
    let spot = 0;
    rig.add(camera);
    scene.add(rig);
    function place() {
      rig.position.set(spots[spot][0], 1.5, spots[spot][1]);
      rig.rotation.y = poses[spot];
      camera.position.set(0, 0, 0);
      camera.rotation.set(0, 0, 0);
    }
    const change = () => {
      spot = (spot + 1) % spots.length;
      place();
    };
    session.addEventListener("select", change);
    const recenter = () => {
      place();
      const xrCamera = renderer.xr.getCamera();
      const head = xrCamera.getWorldPosition(v());
      rig.position.x += spots[spot][0] - head.x;
      rig.position.z += spots[spot][1] - head.z;
    };
    session.addEventListener("squeeze", recenter);
    const end = () => {
      renderer.setAnimationLoop(null);
      session.removeEventListener("select", change);
      session.removeEventListener("squeeze", recenter);
      scene.remove(rig);
      rig.remove(camera);
      renderer.xr.enabled = false;
      onEnd();
    };
    session.addEventListener("end", end, { once: true });
    try {
      renderer.xr.enabled = true;
      renderer.xr.setFramebufferScaleFactor(0.75);
      renderer.xr.setReferenceSpaceType("local");
      preset("Low");
      detailGroups.forEach(({ group, proxy }) => {
        group.visible = false;
        proxy.visible = true;
      });
      foliage.forEach(
        (o) =>
          (o.count = Math.max(1, Math.floor(o.instanceMatrix.count * 0.2))),
      );
      place();
      rig.position.y = 1.5;
      await renderer.xr.setSession(session);
      renderer.setAnimationLoop(() => renderer.render(scene, camera));
    } catch (error) {
      await session.end();
      throw error;
    }
  }
  return {
    frame,
    tour,
    allowed,
    preset,
    stereo(value) {
      stereo = value;
    },
    patrolX: (t) => 2 + Math.sin(t * 0.23) * 5,
    renderer,
  };
}
