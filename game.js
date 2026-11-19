import { buildWorld, stations } from "./engine.js";

const $ = (id) => document.getElementById(id);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const chapters = [
  [
    "2019 · SURVEY TAPE 17",
    "Three knocks on an empty line.",
    "East Bank engineer Ira Vale records three knocks in a disconnected pump. She files the tape beside a pressure chart. The river is perfectly still.",
  ],
  [
    "2020–2025 · CORRECTIONS",
    "The crossing that closed twice.",
    "Two signed evacuation lists name the same ferry. On one, Ira’s sister Neri makes the crossing. On the other, the ferry never arrives.",
  ],
  [
    "2026–2027 · AUTOMATIC SERVICE",
    "The city keeps listening.",
    "Municipal machines inherit the night shift. Relay crews hear instructions before dispatch sends them. A research circle starts collecting the discrepancies.",
  ],
  [
    "2028 · PHASE TEST",
    "A second tide.",
    "An experiment couples the city clocks to the signal. Salt water rises on dry stairwells. Beyond the aerials, another skyline stands inside this one.",
  ],
  [
    "2029 · EVACUATION",
    "Leave the receiver on.",
    "Border fighting closes the roads. A fever empties the shelters. Neri leaves her water ration and a handwritten frequency on the last workbench.",
  ],
  [
    "2030 · DAY ONE",
    "The Awakening",
    "At the East Bank station, something knocks three times. Ira opens her eyes. The receiver is still warm.",
  ],
];
const objectives = [
  ["radio", "Listen to the shelter radio", "Shelter 17"],
  ["kit", "Recover the maintenance kit", "Field stores"],
  ["plant", "Restore the intake generator", "Pump 04"],
  ["beacon", "Tune the return signal", "Yard repeater"],
  ["archive", "Read the original survey tape", "Tape library"],
  ["beacon", "Decide who hears the recording", "Yard repeater"],
];
const findings = [
  "Neri’s transmission names the stores and asks for clean water. Three knocks follow her voice.",
  "The maintenance kit contains a ceramic fuse, a water flask and Neri’s tag: return channel 71.4.",
  "The intake is pumping. With power restored, the yard repeater can receive.",
  "A silver hull crossed the dish. The carrier played the three knocks before Ira touched the key.",
  "Tape 17 bears Ira’s handwriting from 2019. Its pressure trace matches today’s generator start.",
];
const saveKey = "aftersignal-east-bank-v2",
  settingsKey = saveKey + "-settings";
const fresh = () => ({
  x: 0,
  z: 15.4,
  yaw: -0.66,
  pitch: -0.08,
  stage: 0,
  flask: 0,
  manifests: [],
  water: 92,
  energy: 100,
  ending: "",
  seconds: 0,
});
const get = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k));
  } catch {
    return null;
  }
};
const put = (k, data) => {
  try {
    localStorage.setItem(k, JSON.stringify(data));
  } catch {
    notify("Local storage unavailable. This session can still be played.");
  }
};
const baseSettings = {
  quality: matchMedia("(pointer:coarse)").matches ? "Low" : "High",
  volume: 0.38,
  sensitivity: 1,
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  guide: true,
};
let settings = { ...baseSettings, ...get(settingsKey) },
  player = fresh(),
  world,
  mode = "loading",
  shot = 0,
  time = 0,
  last = 0,
  elapsedShot = 0,
  noticeUntil = 0,
  autosave = 0;
let stereo = false,
  gyro = false,
  origin = null,
  originYaw = 0,
  stickX = 0,
  stickZ = 0,
  audio,
  gamepadPressed = false;
const keys = new Set();
function saved() {
  const p = get(saveKey);
  if (
    !p ||
    !Number.isInteger(p.stage) ||
    p.stage < 0 ||
    p.stage > 6 ||
    !Number.isFinite(p.x) ||
    !Number.isFinite(p.z)
  )
    return null;
  const clean = fresh();
  for (const key of ["x", "z", "yaw", "pitch", "seconds", "energy", "water"])
    if (Number.isFinite(p[key])) clean[key] = p[key];
  clean.manifests = ["radio", "kit"].filter(
    (key) => Array.isArray(p.manifests) && p.manifests.includes(key),
  );
  clean.stage = p.stage;
  clean.flask = p.flask === 1 ? 1 : 0;
  clean.ending =
    typeof p.ending === "string" ? p.ending.replace(/[&<>"']/g, "") : "";
  return clean;
}
function save() {
  if (mode === "play") put(saveKey, player);
}
function notify(text) {
  $("notice").textContent = text;
  noticeUntil = performance.now() + 6000;
}
function screen(next) {
  mode = next;
  for (const id of ["loading", "menu", "intro", "hud"])
    $(id).hidden = id !== (next === "play" ? "hud" : next);
  document.querySelector("header").hidden = next === "loading";
  if (next === "menu") {
    $("continue").disabled = !saved();
    $("start").focus();
  }
  keys.clear();
  stickX = stickZ = 0;
}
function modal(title, html, kicker = "FIELD SERVICE") {
  if (document.pointerLockElement) document.exitPointerLock();
  keys.clear();
  stickX = stickZ = 0;
  $("panel-title").textContent = title;
  $("panel-kicker").textContent = kicker;
  $("panel-body").innerHTML = html;
  if (!$("panel").open) $("panel").showModal();
}
function close() {
  if ($("panel").open) $("panel").close();
}
function button(label, fn) {
  const b = document.createElement("button");
  b.textContent = label;
  b.onclick = fn;
  $("panel-body").append(b);
  return b;
}
function sound() {
  if (!audio) {
    try {
      const ctx = new AudioContext(),
        master = ctx.createGain();
      master.connect(ctx.destination);
      const hum = ctx.createOscillator(),
        gain = ctx.createGain();
      hum.frequency.value = 52;
      gain.gain.value = 0.035;
      hum.connect(gain).connect(master);
      hum.start();
      const sample = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate),
        data = sample.getChannelData(0);
      let prior = 0;
      for (let i = 0; i < data.length; i++) {
        prior = (prior + (Math.random() - 0.5) * 0.12) / 1.03;
        data[i] = prior;
      }
      const wind = ctx.createBufferSource(),
        windGain = ctx.createGain(),
        filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 720;
      windGain.gain.value = 0.14;
      wind.buffer = sample;
      wind.loop = true;
      wind.connect(filter).connect(windGain).connect(master);
      wind.start();
      audio = { ctx, master, hum, windGain };
    } catch {
      return;
    }
  }
  audio.master.gain.value = settings.volume;
  audio.ctx.resume().catch(() => {});
}
function ping(hz = 220, length = 0.18) {
  if (!audio) return;
  const { ctx, master } = audio,
    o = ctx.createOscillator(),
    g = ctx.createGain();
  o.frequency.value = hz;
  g.gain.setValueAtTime(0.085, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + length);
  o.connect(g).connect(master);
  o.start();
  o.stop(ctx.currentTime + length);
  o.onended = () => {
    o.disconnect();
    g.disconnect();
  };
}
function intro() {
  close();
  player = fresh();
  shot = 0;
  elapsedShot = 0;
  screen("intro");
  showShot();
  sound();
}
function newGame() {
  if (saved()) {
    modal(
      "Start Day One again?",
      "<p>Starting the chapter replaces the East Bank checkpoint when you enter the shelter.</p>",
    );
    button("Start chapter", intro);
    button("Keep checkpoint", close);
  } else intro();
}
function showShot() {
  const row = chapters[shot];
  $("date").textContent = row[0];
  $("headline").textContent = row[1];
  $("transcript").textContent = row[2];
  elapsedShot = 0;
}
function awaken() {
  screen("play");
  save();
  notify("Drag to look · WASD to walk · E to use · J for field book");
  updateHUD();
}
function next() {
  if (++shot >= chapters.length) awaken();
  else showShot();
}
function refreshSettings() {
  put(settingsKey, settings);
  if (audio) audio.master.gain.value = settings.volume;
}
let inHeadset = false;
function options() {
  modal(
    "Settings",
    '<label>Graphics preset<select id="quality">' +
      ["Low", "Medium", "High", "Ultra"]
        .map((q) => "<option>" + q + "</option>")
        .join("") +
      '</select></label><label>Master volume<input id="volume" type="range" min="0" max="1" step=".01"></label><label>Look sensitivity<input id="sens" type="range" min=".3" max="2" step=".1"></label><label>Reduce camera motion<input id="reduced" type="checkbox"></label><label>Show distance and bearing<input id="guideOpt" type="checkbox"></label><p>WASD or left stick to walk. Drag, mouse lock, right stick or ← → to turn. E or gamepad A to interact. Shift to run.</p>',
  );
  $("quality").value = settings.quality;
  $("quality").onchange = (e) => {
    settings.quality = e.target.value;
    world.preset(settings.quality);
    refreshSettings();
  };
  for (const [id, key] of [
    ["volume", "volume"],
    ["sens", "sensitivity"],
    ["reduced", "reduced"],
    ["guideOpt", "guide"],
  ]) {
    const input = $(id),
      check = input.type === "checkbox";
    input[check ? "checked" : "value"] = settings[key];
    input.oninput = () => {
      settings[key] = check ? input.checked : +input.value;
      refreshSettings();
    };
  }
  if (mode === "play") {
    button(stereo ? "Disable phone stereo" : "Enable phone stereo", () => {
      stereo = !stereo;
      world.stereo(stereo);
      close();
    });
    button(gyro ? "Recenter motion" : "Enable motion look", async () => {
      try {
        if (!window.DeviceOrientationEvent) throw Error();
        if (
          DeviceOrientationEvent.requestPermission &&
          (await DeviceOrientationEvent.requestPermission()) !== "granted"
        )
          throw Error();
        gyro = true;
        origin = null;
        close();
        notify("Motion look enabled. Use Settings to recenter.");
      } catch {
        close();
        notify("Motion sensor unavailable. Drag to look.");
      }
    });
    if (gyro)
      button("Turn off motion", () => {
        gyro = false;
        close();
      });
  }
  if (navigator.xr) {
    const target = $("panel-body");
    navigator.xr
      .isSessionSupported("immersive-vr")
      .then((supported) => {
        if (
          !supported ||
          !$("panel").open ||
          target.querySelector("#quality") === null
        )
          return;
        button("Headset station tour", () => {
          modal(
            "Seated station tour",
            "<p>Use the trigger to move to the next viewpoint. Squeeze to recenter horizontally. Exit with the headset system menu.</p>",
          );
          button("Enter VR", async () => {
            close();
            save();
            inHeadset = true;
            const finish = () => {
              if (!inHeadset) return;
              inHeadset = false;
              world.preset(settings.quality);
              last = 0;
              requestAnimationFrame(loop);
              if (mode === "play") pause();
            };
            try {
              await world.tour(finish);
            } catch {
              finish();
              modal(
                "Headset unavailable",
                "<p>The browser could not start an immersive session.</p>",
              );
              button("Close", close);
            }
          });
        });
      })
      .catch(() => {});
  }
  button("Done", close);
}
function pause() {
  if (mode !== "play") return;
  save();
  modal("Paused", "<p>Your checkpoint has been saved on this browser.</p>");
  button("Resume", close);
  button("Settings", options);
  button("Restart chapter", newGame);
  button("Main menu", () => {
    close();
    stereo = false;
    world.stereo(false);
    screen("menu");
  });
}
function map() {
  const marks = Object.entries(stations)
    .map(
      ([id, [x, z]]) =>
        '<circle cx="' +
        (x + 17) +
        '" cy="' +
        (z + 25) +
        '" r=".9"/><text x="' +
        (x + 18) +
        '" y="' +
        (z + 25) +
        '">' +
        id +
        "</text>",
    )
    .join("");
  modal(
    "Station plan",
    '<svg class="map" viewBox="-2 -2 47 48" role="img" aria-label="North is up. Current position and the five stations."><path fill="none" d="M 3 4 H 31 V 42 H 3 Z M 12 36 V 42 H 22 V 36"/>' +
      marks +
      '<circle style="fill:white" cx="' +
      (player.x + 17) +
      '" cy="' +
      (player.z + 25) +
      '" r="1.1"/></svg><p>White dot · your position. North is up.</p>',
  );
  button("Field book", book);
}
function book() {
  const equipment = [
    player.stage >= 2
      ? player.stage >= 3
        ? "Installed ceramic fuse"
        : "Ceramic fuse"
      : "No maintenance kit",
    player.flask ? "Filled flask" : "No filled flask",
  ];
  modal(
    "Field book",
    "<p>" +
      equipment.join(" · ") +
      "</p><hr><p>" +
      (findings.slice(0, player.stage).join("</p><p>") ||
        "A receiver hums inside Shelter 17.") +
      "</p>" +
      (player.ending ? "<p>" + player.ending + "</p>" : ""),
    "INVENTORY & JOURNAL",
  );
  if (player.flask)
    button("Drink from flask", () => {
      player.flask = 0;
      player.water = 100;
      save();
      book();
    });
  for (const key of player.manifests) {
    const p = document.createElement("p");
    p.textContent = manifestText[key];
    $("panel-body").append(p);
  }
  button("Station map", map);
  button("Close", close);
}
function advance() {
  player.stage++;
  if (player.stage === 4) {
    for (const delay of [0, 310, 810]) setTimeout(() => ping(116, 0.12), delay);
  }
  save();
  updateHUD();
  ping(392);
  notify(findings[player.stage - 1] || player.ending);
}
function near(id) {
  const [x, z] = stations[id];
  return Math.hypot(player.x - x, player.z - z) < 2.8;
}
const manifestText = {
  radio:
    "Shore copy. Seat 04, Mara Sol. Missed departure. Signed by Neri at 06:12.",
  kit: "Ferry copy. Seat 04, Mara Sol. Aboard with one small bag. Signed by Neri at 06:12.",
};
function unreadPage() {
  return Object.keys(manifestText).find(
    (id) => near(id) && !player.manifests.includes(id),
  );
}
function action() {
  if (mode !== "play" || $("panel").open) return;
  const stage = player.stage,
    id = objectives[stage]?.[0];
  if (!id || !near(id)) {
    const page = unreadPage();
    if (page) {
      modal(
        "Crossing 04",
        "<p>" + manifestText[page] + "</p>",
        "CARBON MANIFEST",
      );
      button("Copy to field book", () => {
        player.manifests.push(page);
        save();
        close();
        notify(
          player.manifests.length === 2
            ? "Two originals. Same passenger, same signature, different shore."
            : "Passenger copy recorded.",
        );
      });
      return;
    }
    if (near("plant") && stage >= 3) {
      player.water = 100;
      player.flask = 1;
      save();
      notify("Flask filled at the restored intake.");
    }
    return;
  }
  if (stage === 0) {
    modal(
      "A voice in the static",
      "<p>“Ira. If this reaches the bank, there’s a fuse in the field stores. Please start the pump. We still have people on the ferry.”</p>",
      "INCOMING · NERI VALE",
    );
    button("Log transmission", () => {
      close();
      advance();
    });
  } else if (stage === 1) {
    player.flask = 1;
    advance();
  } else if (stage === 2) {
    modal(
      "Prime the intake",
      "<p>The contact drawer is empty. A ceramic fuse fits the open socket. The pressure gauge rests at zero.</p>",
    );
    button("Fit fuse and start pump", () => {
      close();
      advance();
      if (audio) audio.hum.frequency.value = 68;
    });
  } else if (stage === 3) {
    modal(
      "Return channel",
      '<p>The dial has three surviving presets. Neri marked her return frequency on the maintenance tag in your field book.</p><p id="feedback" role="status"></p>',
    );
    for (const value of ["70.8", "71.4", "74.1"])
      button(value + " MHz", () => {
        if (value === "71.4") {
          close();
          advance();
        } else {
          $("feedback").textContent =
            "Carrier noise. Try the frequency on the tag.";
          ping(97);
        }
      });
  } else if (stage === 4) {
    modal(
      "Archive Zero",
      "<p>Pressure trace, 14 October 2019. Beside it are the knocks, the pump starting and your breath. The handwriting is yours. In the margin Neri wrote “Keep both lists.”</p>",
      "SURVEY ORIGINAL · TAPE 17",
    );
    button("Keep the evidence", () => {
      close();
      advance();
    });
  } else {
    modal(
      "Who should hear it?",
      "<p>The ferry and the settlement share the carrier. The open channel could reunite families. A private reply would protect the ferry’s location.</p>",
    );
    for (const [label, ending] of [
      [
        "Open broadcast",
        "Both evacuation lists are on the public channel. Someone on shore starts reading names.",
      ],
      [
        "Reply to Neri",
        "A private acknowledgement reaches the ferry. Three knocks come back.",
      ],
    ])
      button(label, () => {
        player.ending = ending;
        close();
        advance();
        modal("End of Day One", "<p>" + ending + "</p>", "CHAPTER COMPLETE");
        button("Return to station", close);
      });
  }
}
function updateHUD() {
  const row = objectives[player.stage];
  $("objective").textContent = row?.[1] || "Day One complete";
  let guide = "Explore the receiving station";
  if (row) {
    const [x, z] = stations[row[0]],
      dx = x - player.x,
      dz = z - player.z;
    const dir = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
      (Math.round(Math.atan2(dx, -dz) / (Math.PI / 4)) + 8) % 8
    ];
    guide =
      row[2] +
      (settings.guide
        ? " · " + Math.round(Math.hypot(dx, dz)) + " m " + dir
        : "");
  }
  $("guide").textContent = guide;
  const ready = row && near(row[0]),
    refill = player.stage >= 3 && near("plant");
  $("interact").hidden = !(ready || refill || unreadPage());
  $("interact").textContent =
    "E · " + (ready ? row[1] : refill ? "Fill flask" : "Read passenger copy");
  $("vitals").textContent =
    "WATER " +
    Math.round(player.water) +
    "%   /   ENERGY " +
    Math.round(player.energy) +
    "%";
}
$("start").onclick = newGame;
$("continue").onclick = () => {
  player = saved() || fresh();
  if (!world.allowed(player.x, player.z))
    Object.assign(player, { x: 0, z: 15.4 });
  screen("play");
  sound();
  updateHUD();
};
$("chapters").onclick = () => {
  modal("Chapters", "<p>Day One, 2030 · East Bank receiving station.</p>");
  button("01 · The Awakening", newGame);
  if (get("zyberlane-aftersignal2030-v01"))
    button("Open original 0.1 save", () =>
      location.assign(import.meta.env.BASE_URL + "legacy/index.html"),
    );
};
$("settings").onclick = options;
$("next").onclick = next;
$("skip").onclick = awaken;
$("pause").onclick = pause;
$("journal").onclick = book;
$("interact").onclick = action;
document.addEventListener("keydown", (e) => {
  if (mode !== "play" || $("panel").open) return;
  keys.add(e.code);
  if (e.repeat) return;
  if (e.code === "KeyE") action();
  if (e.code === "KeyJ") book();
  if (e.code === "KeyM") map();
  if (e.code === "Escape") {
    e.preventDefault();
    pause();
  }
});
document.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => {
  keys.clear();
  if (mode === "play" && !$("panel").open) pause();
});
window.addEventListener("pagehide", save);
let drag = null;
function look(dx, dy) {
  player.yaw += dx * 0.003 * settings.sensitivity;
  player.pitch = clamp(
    player.pitch - dy * 0.003 * settings.sensitivity,
    -1.24,
    1.24,
  );
}
$("world").onpointerdown = (e) => {
  if (mode !== "play" || $("panel").open) return;
  drag = e.pointerId;
  $("world").setPointerCapture(e.pointerId);
  if (e.pointerType === "mouse")
    $("world")
      .requestPointerLock?.()
      ?.catch?.(() => {});
};
window.addEventListener("pointermove", (e) => {
  if (
    mode === "play" &&
    !$("panel").open &&
    (document.pointerLockElement || drag === e.pointerId)
  )
    look(e.movementX, e.movementY);
});
window.addEventListener("pointerup", () => (drag = null));
window.addEventListener("pointercancel", () => (drag = null));
const stick = $("stick");
function steer(e) {
  const r = stick.getBoundingClientRect();
  stickX = clamp((e.clientX - r.left - r.width / 2) / 38, -1, 1);
  stickZ = clamp((r.top + r.height / 2 - e.clientY) / 38, -1, 1);
  stick.firstChild.style.transform =
    "translate(" + stickX * 20 + "px," + -stickZ * 20 + "px)";
}
stick.onpointerdown = (e) => {
  stick.setPointerCapture(e.pointerId);
  steer(e);
};
stick.onpointermove = (e) => {
  if (stick.hasPointerCapture(e.pointerId)) steer(e);
};
stick.onlostpointercapture = () => {
  stickX = stickZ = 0;
  stick.firstChild.style.transform = "";
};
window.addEventListener("deviceorientation", (e) => {
  if (!gyro || mode !== "play" || $("panel").open || e.alpha === null) return;
  if (origin === null) {
    origin = e.alpha;
    originYaw = player.yaw;
  }
  player.yaw =
    originYaw - ((((e.alpha - origin + 540) % 360) - 180) * Math.PI) / 180;
  player.pitch = clamp(((e.beta || 0) - 48) * 0.009, -1, 1);
});
function tick(dt) {
  const pad = navigator.getGamepads?.()?.[0],
    axis = (i) => (Math.abs(pad?.axes[i] || 0) > 0.17 ? pad.axes[i] : 0);
  const pressed = !!pad?.buttons[0]?.pressed;
  if (pressed && !gamepadPressed) action();
  gamepadPressed = pressed;
  player.yaw +=
    (axis(2) +
      (keys.has("ArrowRight") ? 1 : 0) -
      (keys.has("ArrowLeft") ? 1 : 0)) *
    dt *
    1.8;
  player.pitch = clamp(player.pitch - axis(3) * dt * 1.5, -1.24, 1.24);
  const x =
      stickX + axis(0) + Number(keys.has("KeyD")) - Number(keys.has("KeyA")),
    z =
      stickZ -
      axis(1) +
      Number(keys.has("KeyW") || keys.has("ArrowUp")) -
      Number(keys.has("KeyS") || keys.has("ArrowDown"));
  const run = keys.has("ShiftLeft") && player.energy > 8,
    len = Math.max(1, Math.hypot(x, z)),
    speed = ((run ? 4.5 : 2.45) * dt) / len;
  const dx = (x * Math.cos(player.yaw) + z * Math.sin(player.yaw)) * speed,
    dz = (x * Math.sin(player.yaw) - z * Math.cos(player.yaw)) * speed;
  if (world.allowed(player.x + dx, player.z)) player.x += dx;
  if (world.allowed(player.x, player.z + dz)) player.z += dz;
  const hazard =
    Math.hypot(player.x - world.patrolX(last / 1000), player.z + 13) < 2.5;
  player.energy = clamp(
    player.energy + dt * (hazard ? -11 : run && (x || z) ? -5 : 2.5),
    0,
    100,
  );
  player.water = clamp(player.water - dt * (run ? 0.11 : 0.06), 0, 100);
  if (player.energy <= 0 || player.water <= 0) {
    Object.assign(player, { x: 0, z: 15.4, water: 70, energy: 75 });
    notify("Shelter beacon recovered you. Your evidence is safe.");
    save();
  }
  if (hazard && !$("notice").textContent)
    notify("Survey patrol overhead. Move clear of its scan.");
  player.seconds += dt;
  autosave += dt;
  if (autosave >= 8) {
    save();
    autosave = 0;
  }
  updateHUD();
}
const profile = new URLSearchParams(location.search).has("profile")
  ? (window.stationProfile = {})
  : null;
let pending = true;
function loop(now) {
  if (inHeadset) return;
  const raw = last ? (now - last) / 1000 : 0;
  last = now;
  const dt = Math.min(raw, 0.12);
  if (!$("panel").open) {
    time += dt;
    if (mode === "play") {
      tick(dt);
      if (audio) {
        audio.windGain.gain.setTargetAtTime(
          player.z > 11 ? 0.045 : 0.16,
          audio.ctx.currentTime,
          0.4,
        );
        audio.hum.frequency.setTargetAtTime(
          player.stage >= 3 ? 66 : 52,
          audio.ctx.currentTime,
          0.2,
        );
      }
    }
    if (mode === "intro") {
      elapsedShot += dt;
      if (elapsedShot > 9) next();
    }
  }
  if (performance.now() > noticeUntil) $("notice").textContent = "";
  world.frame(player, mode, now / 1000, player.stage, !settings.reduced, shot);
  if (profile) {
    const info = world.renderer.info;
    Object.assign(profile, {
      x: player.x,
      z: player.z,
      yaw: player.yaw,
      mode,
      stage: player.stage,
      calls: info.render.calls,
      triangles: info.render.triangles,
      textures: info.memory.textures,
      geometries: info.memory.geometries,
      renderWidth: world.renderer.domElement.width,
    });
  }
  if (pending) {
    performance.mark("station-ready");
    pending = false;
  }
  requestAnimationFrame(loop);
}
try {
  world = await buildWorld($("world"), (n, total, label) => {
    $("progress").value = n / total;
    $("loadlabel").textContent = label + " · " + n + " / " + total;
  });
  world.preset(settings.quality);
  screen("menu");
  requestAnimationFrame(loop);
} catch (error) {
  console.error(error);
  $("loadlabel").textContent = "Station could not load. " + error.message;
  $("retry").hidden = false;
  $("retry").onclick = () => location.reload();
}
