(() => {
  "use strict";

  const MATRIX_W = 128;
  const MATRIX_H = 64;
  const DETENTS_PER_TURN = 20;
  const UPSTREAM_SHA = "f6f777751a04c44206eeaa5ee6cf602cd4b4a38b";
  const RAW_BASE = `https://raw.githubusercontent.com/engmung/Patternflow/${UPSTREAM_SHA}/web/src/lib/presets`;
  const SOURCE_BASE = `https://github.com/engmung/Patternflow/blob/${UPSTREAM_SHA}/web/src/lib/presets`;
  const CACHE_KEY = `pixel-flow-patterns-${UPSTREAM_SHA}`;
  const PATTERN_FILES = [
    "origin","wave-saw","0510","0511","0512","0513","0514","0515","0515-3","0515-4","0516","0517","0518","0519-1","0519-2","0520","0521","0522","0524","0524-2","0526","0527","0528","0529","0530","0531","0601","0602","0609","0614","0614-2","0619","0622","0624","0628","0629","0629-2","0701","0707","0710","0712","0712-2","0713","0715","0716","0718","0719","a-big-hit"
  ];

  const displayCanvas = document.querySelector("#display");
  const displayCtx = displayCanvas.getContext("2d", { alpha: false });
  const stageCanvas = document.createElement("canvas");
  const stageCtx = stageCanvas.getContext("2d");
  const maskCanvas = document.createElement("canvas");
  const maskCtx = maskCanvas.getContext("2d");
  const sourceCanvas = document.createElement("canvas");
  const sourceCtx = sourceCanvas.getContext("2d");
  sourceCanvas.width = MATRIX_W;
  sourceCanvas.height = MATRIX_H;
  sourceCtx.imageSmoothingEnabled = false;

  const panel = document.querySelector("#panel");
  const patternSelect = document.querySelector("#pattern");
  const textureSelect = document.querySelector("#texture");
  const statusEl = document.querySelector("#status");
  const metaEl = document.querySelector("#meta");

  const state = {
    patterns: [], activeIndex: 0, module: null, params: {},
    data: new Uint8ClampedArray(MATRIX_W * MATRIX_H * 4), imageData: null,
    knobValues: [0.5, 0.5, 0.5, 0.5], knobDeltas: [0, 0, 0, 0], btnPressed: [false, false, false, false],
    texture: "led", glow: 0.58, running: true, time: 0,
    lastTime: performance.now(), viewport: { x: 0, y: 0, w: 1, h: 1 },
    frameInterval: 1000 / 30, lastDraw: 0,
  };
  state.imageData = new ImageData(state.data, MATRIX_W, MATRIX_H);

  const display = {
    width: MATRIX_W,
    height: MATRIX_H,
    setPixel(x, y, r, g, b) {
      const xi = Math.floor(x), yi = Math.floor(y);
      if (xi < 0 || xi >= MATRIX_W || yi < 0 || yi >= MATRIX_H) return;
      let cr, cg, cb;
      if (Array.isArray(r)) { cr = r[0] ?? 0; cg = r[1] ?? 0; cb = r[2] ?? 0; }
      else { cr = r; cg = g ?? 0; cb = b ?? 0; }
      const i = (yi * MATRIX_W + xi) * 4;
      state.data[i] = clampByte(cr);
      state.data[i + 1] = clampByte(cg);
      state.data[i + 2] = clampByte(cb);
      state.data[i + 3] = 255;
    },
    setValue(x, y, value) {
      const v = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
      const c = Math.round(v * 255);
      this.setPixel(x, y, c, c, c);
    },
  };

  function clampByte(value) {
    return Number.isFinite(value) ? Math.max(0, Math.min(255, Math.round(value))) : 0;
  }

  function compilePatternCode(code) {
    const normalized = code
      .replace(/^\s*import\s+.*?;?\s*$/gm, "")
      .replace(/\bexport\s+(?=(?:async\s+)?function|const|let|var|class)/g, "");
    const wrapper = `"use strict";\n${normalized}\nreturn { setup: typeof setup === "function" ? setup : undefined, update: typeof update === "function" ? update : undefined, draw: typeof draw === "function" ? draw : undefined };`;
    const module = new Function(wrapper)();
    if (typeof module.draw !== "function") throw new Error("Pattern has no draw(display, params, time) function.");
    return module;
  }

  function decodeQuoted(match) {
    if (!match) return "";
    try { return JSON.parse(`"${match[1]}"`); } catch { return match[1]; }
  }

  function parsePresetFile(source, slug) {
    const marker = "code: `";
    const start = source.indexOf(marker);
    const end = source.lastIndexOf("`,");
    if (start < 0 || end <= start) throw new Error(`Cannot parse ${slug}`);
    const raw = source.slice(start + marker.length, end);
    const code = new Function(`return \`${raw}\`;`)();
    return {
      id: decodeQuoted(source.match(/\bid:\s*"((?:\\.|[^"])*)"/)) || slug,
      num: Number(source.match(/\bnum:\s*(\d+)/)?.[1] ?? 999),
      name: decodeQuoted(source.match(/\bname:\s*"((?:\\.|[^"])*)"/)) || slug,
      desc: decodeQuoted(source.match(/\bdesc:\s*"((?:\\.|[^"])*)"/)),
      author: decodeQuoted(source.match(/\bauthor:\s*"((?:\\.|[^"])*)"/)) || "Seunghun LEE",
      license: decodeQuoted(source.match(/\blicense:\s*"((?:\\.|[^"])*)"/)) || "CC-BY-SA-4.0",
      labOnly: /\blabOnly:\s*true/.test(source),
      slug,
      code,
    };
  }

  async function mapLimit(items, limit, worker) {
    const results = new Array(items.length);
    let cursor = 0;
    async function run() {
      while (cursor < items.length) {
        const index = cursor++;
        try { results[index] = await worker(items[index], index); }
        catch (error) { results[index] = { error }; }
      }
    }
    await Promise.all(Array.from({ length: limit }, run));
    return results;
  }

  function loadCache() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      return Array.isArray(cached) ? cached : [];
    } catch { return []; }
  }

  function saveCache(patterns) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(patterns)); }
    catch (error) { console.warn("Pattern cache unavailable", error); }
  }

  async function loadOfficialLibrary(force = false) {
    const cached = force ? [] : loadCache();
    if (cached.length) installLibrary(cached, `Cached official library · ${cached.length} patterns`);
    else installLibrary(FALLBACK_PATTERNS, "2 bundled official patterns · loading full library…");

    statusEl.textContent = "Fetching PatternFlow library…";
    const fetched = await mapLimit(PATTERN_FILES, 6, async (slug) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(`${RAW_BASE}/pattern-${slug}.ts`, {
          cache: force ? "reload" : "force-cache",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`${response.status} ${slug}`);
        return parsePresetFile(await response.text(), slug);
      } finally {
        clearTimeout(timer);
      }
    });
    const patterns = fetched.filter((result) => result && !result.error).sort((a, b) => a.num - b.num);
    const showcase = patterns.filter((pattern) => !pattern.labOnly);
    if (showcase.length >= 30) {
      saveCache(showcase);
      installLibrary(showcase, `Official PatternFlow library · ${showcase.length} patterns`);
    } else {
      const failed = fetched.filter((result) => result?.error).length;
      statusEl.textContent = cached.length ? `Using cache · remote failures ${failed}` : "Remote library unavailable · bundled fallback";
    }
  }

  function installLibrary(patterns, status) {
    const previousId = state.patterns[state.activeIndex]?.id || "origin";
    state.patterns = patterns;
    patternSelect.innerHTML = "";
    for (const [index, pattern] of patterns.entries()) {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = `${String(pattern.num).padStart(2, "0")} · ${pattern.name}`;
      patternSelect.append(option);
    }
    const nextIndex = Math.max(0, patterns.findIndex((pattern) => pattern.id === previousId));
    loadPattern(nextIndex);
    statusEl.textContent = status;
  }

  function extractKnobLabels(code) {
    const labels = ["Knob 1", "Knob 2", "Knob 3", "Knob 4"];
    for (const match of code.matchAll(/Knob\s*([1-4]):\s*([^\n·]+)/gi)) {
      labels[Number(match[1]) - 1] = match[2].trim().replace(/\s*\([^)]*\)\s*$/, "");
    }
    return labels;
  }

  function loadPattern(index) {
    if (!state.patterns.length) return;
    state.activeIndex = (index + state.patterns.length) % state.patterns.length;
    const pattern = state.patterns[state.activeIndex];
    patternSelect.value = String(state.activeIndex);
    try {
      state.module = compilePatternCode(pattern.code);
      state.params = {};
      state.data.fill(0);
      state.knobValues = [0.5, 0.5, 0.5, 0.5];
      state.knobDeltas = [0, 0, 0, 0];
      state.btnPressed = [false, false, false, false];
      state.module.setup?.(state.params);
      syncKnobUI();
      const labels = extractKnobLabels(pattern.code);
      document.querySelectorAll(".control[data-knob]").forEach((element, knobIndex) => {
        element.querySelector("label").textContent = labels[knobIndex];
        element.querySelector("label").title = labels[knobIndex];
      });
      metaEl.innerHTML = `${escapeHtml(pattern.desc || "Official PatternFlow preset")}<br>${escapeHtml(pattern.author)} · ${escapeHtml(pattern.license)} · <a target="_blank" rel="noreferrer" href="${SOURCE_BASE}/pattern-${encodeURIComponent(pattern.slug)}.ts">source</a>`;
    } catch (error) {
      statusEl.textContent = `Compile error: ${error.message}`;
      console.error(error);
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  }

  function syncKnobUI() {
    state.knobValues.forEach((value, index) => {
      document.querySelector(`#knob${index}`).value = String(value);
      document.querySelector(`#out${index}`).value = value.toFixed(2);
    });
  }

  document.querySelectorAll(".control[data-knob]").forEach((control, index) => {
    const input = control.querySelector("input");
    input.addEventListener("input", () => {
      const next = Number(input.value);
      state.knobDeltas[index] += (next - state.knobValues[index]) * DETENTS_PER_TURN;
      state.knobValues[index] = next;
      control.querySelector("output").value = next.toFixed(2);
    });
    control.querySelector(".press").addEventListener("click", () => { state.btnPressed[index] = true; });
  });

  patternSelect.addEventListener("change", () => loadPattern(Number(patternSelect.value)));
  textureSelect.addEventListener("change", () => { state.texture = textureSelect.value; rebuildMask(); });
  document.querySelector("#previous").addEventListener("click", () => loadPattern(state.activeIndex - 1));
  document.querySelector("#next").addEventListener("click", () => loadPattern(state.activeIndex + 1));
  document.querySelector("#lessGlow").addEventListener("click", () => { state.glow = Math.max(0, state.glow - 0.12); });
  document.querySelector("#moreGlow").addEventListener("click", () => { state.glow = Math.min(1, state.glow + 0.12); });
  document.querySelector("#fullscreen").addEventListener("click", toggleFullscreen);
  document.querySelector("#reload").addEventListener("click", () => loadOfficialLibrary(true));

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(innerWidth * dpr));
    const height = Math.max(1, Math.floor(innerHeight * dpr));
    for (const canvas of [displayCanvas, stageCanvas, maskCanvas]) { canvas.width = width; canvas.height = height; }
    displayCtx.imageSmoothingEnabled = false;
    stageCtx.imageSmoothingEnabled = false;
    const targetAspect = MATRIX_W / MATRIX_H;
    let viewportW = width;
    let viewportH = viewportW / targetAspect;
    if (viewportH > height) { viewportH = height; viewportW = viewportH * targetAspect; }
    state.viewport = { x: Math.round((width - viewportW) / 2), y: Math.round((height - viewportH) / 2), w: Math.round(viewportW), h: Math.round(viewportH) };
    displayCtx.fillStyle = "#000";
    displayCtx.fillRect(0, 0, width, height);
    rebuildMask();
  }

  function roundedRect(ctx, x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function rebuildMask() {
    if (!maskCanvas.width) return;
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskCtx.fillStyle = "#fff";
    const { x, y, w, h } = state.viewport;
    const cellW = w / MATRIX_W;
    const cellH = h / MATRIX_H;
    const cell = Math.min(cellW, cellH);
    const gapRatio = state.texture === "led" ? 0.28 : state.texture === "hybrid" ? 0.16 : 0.07;
    const gap = cell * gapRatio;
    for (let gy = 0; gy < MATRIX_H; gy++) {
      for (let gx = 0; gx < MATRIX_W; gx++) {
        const px = x + gx * cellW + gap / 2;
        const py = y + gy * cellH + gap / 2;
        const pw = Math.max(0.5, cellW - gap);
        const ph = Math.max(0.5, cellH - gap);
        if (state.texture === "led") {
          maskCtx.beginPath();
          maskCtx.ellipse(px + pw / 2, py + ph / 2, pw / 2, ph / 2, 0, 0, Math.PI * 2);
          maskCtx.fill();
        } else if (state.texture === "hybrid") {
          roundedRect(maskCtx, px, py, pw, ph, cell * 0.18);
          maskCtx.fill();
        } else {
          maskCtx.fillRect(px, py, pw, ph);
        }
      }
    }
  }

  function renderPattern(dt) {
    if (!state.module) return;
    const input = {
      knobDeltas: state.knobDeltas.slice(),
      knobValues: state.knobValues.slice(),
      knobNormalized: state.knobValues.slice(),
      knobRanges: [[0,1],[0,1],[0,1],[0,1]],
      btnPressed: state.btnPressed.slice(),
      btnHeld: [false, false, false, false],
    };
    state.params.knobValues = input.knobValues;
    state.params.knobNormalized = input.knobNormalized;
    state.params.knobDeltas = input.knobDeltas;
    state.params.knobRanges = input.knobRanges;
    state.params.btnPressed = input.btnPressed;
    state.params.btnHeld = input.btnHeld;
    state.module.update?.(dt, input, state.params);
    state.knobDeltas.fill(0);
    state.btnPressed.fill(false);
    state.data.fill(0);
    state.module.draw(display, state.params, state.time);
    sourceCtx.putImageData(state.imageData, 0, 0);
  }

  function compose() {
    const { x, y, w, h } = state.viewport;
    stageCtx.clearRect(0, 0, stageCanvas.width, stageCanvas.height);
    stageCtx.imageSmoothingEnabled = false;
    stageCtx.drawImage(sourceCanvas, x, y, w, h);
    stageCtx.globalCompositeOperation = "destination-in";
    stageCtx.drawImage(maskCanvas, 0, 0);
    stageCtx.globalCompositeOperation = "source-over";

    const trailFade = 0.28 + (1 - state.glow) * 0.46;
    displayCtx.fillStyle = `rgba(0,0,0,${trailFade})`;
    displayCtx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);

    const baseCell = state.viewport.w / MATRIX_W;
    const blur = Math.max(0, baseCell * state.glow * (state.texture === "led" ? 1.4 : 0.7));
    if (blur > 0.2) {
      displayCtx.save();
      displayCtx.globalCompositeOperation = "screen";
      displayCtx.globalAlpha = 0.72 * state.glow;
      displayCtx.filter = `blur(${blur}px) brightness(${1.25 + state.glow})`;
      displayCtx.drawImage(stageCanvas, 0, 0);
      displayCtx.restore();
    }
    displayCtx.filter = "none";
    displayCtx.globalAlpha = 1;
    displayCtx.globalCompositeOperation = "source-over";
    displayCtx.drawImage(stageCanvas, 0, 0);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (now - state.lastDraw < state.frameInterval) return;
    const dt = Math.min(0.08, Math.max(0, (now - state.lastTime) / 1000));
    state.lastTime = now;
    state.lastDraw = now;
    if (state.running) state.time += dt;
    try {
      renderPattern(state.running ? dt : 0);
      compose();
    } catch (error) {
      statusEl.textContent = `Runtime error: ${error.message}`;
      console.error(error);
    }
  }

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (event) => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "SELECT") return;
    if (event.key === " ") {
      event.preventDefault();
      state.running = !state.running;
      state.lastTime = performance.now();
    } else if (event.key.toLowerCase() === "h") panel.classList.toggle("hidden");
    else if (event.key.toLowerCase() === "f") toggleFullscreen();
    else if (event.key === "ArrowRight") loadPattern(state.activeIndex + 1);
    else if (event.key === "ArrowLeft") loadPattern(state.activeIndex - 1);
    else if (event.key.toLowerCase() === "m") {
      const modes = ["led", "hybrid", "pixel"];
      state.texture = modes[(modes.indexOf(state.texture) + 1) % modes.length];
      textureSelect.value = state.texture;
      rebuildMask();
    }
  });

  const FALLBACK_PATTERNS = window.PF_FALLBACK_PATTERNS || [];
  resize();
  requestAnimationFrame(frame);
  if (new URLSearchParams(location.search).has("offline")) {
    installLibrary(FALLBACK_PATTERNS, "Offline test · 2 bundled official patterns");
  } else {
    loadOfficialLibrary(false);
  }
})();
