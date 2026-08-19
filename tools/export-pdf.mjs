// Exports the deck to a PDF with clickable links.
//
// Usage: node tools/export-pdf.mjs [outFile]
//
// Serves the repo, drives headless Chrome over the DevTools protocol to print
// one PDF per slide, then merges them via tools/merge-pdf.py.
//
// Requires: Node 22+ (global WebSocket), Google Chrome, python3 with pypdf.
// See DECK-SPECS.md ("PDF export") for why it works this way.
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = resolve(process.argv[2] ?? join(repoRoot, "App-Intents-Blueprint.pdf"));
const pageDir = join(repoRoot, ".pdf-pages");

const PORT = 8799;
const DEBUG_PORT = 9333;
const PROFILE = "/tmp/deck-export-chrome-profile";

// The deck is a fixed 1920x1080 canvas; rem-based type overflows shorter
// viewports, so render at the design size and map it 1:1 onto the PDF page.
const CANVAS = { width: 1920, height: 1080 };
const PAPER = { width: CANVAS.width / 96, height: CANVAS.height / 96 };

const CHROME_CANDIDATES = [
  process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
].filter(Boolean);

const chromeBin = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chromeBin) {
  console.error(`FAIL: Chrome not found. Tried:\n  ${CHROME_CANDIDATES.join("\n  ")}\nSet CHROME=/path/to/chrome`);
  process.exit(1);
}

const children = [];
const cleanup = () => children.forEach((c) => !c.killed && c.kill());
process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});

const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
};

const withTimeout = (p, ms, label) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout: ${label}`)), ms))]);

const waitFor = async (probe, ms, label) => {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try {
      return await probe();
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  fail(`timeout waiting for ${label}`);
};

children.push(
  spawn("python3", ["-m", "http.server", String(PORT)], { cwd: repoRoot, stdio: "ignore" })
);
await waitFor(
  () => fetch(`http://127.0.0.1:${PORT}/index.html`).then((r) => (r.ok ? true : Promise.reject())),
  15000,
  "static server"
);

children.push(
  spawn(
    chromeBin,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      `--user-data-dir=${PROFILE}`,
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--window-size=${CANVAS.width},${CANVAS.height}`,
      "about:blank",
    ],
    { stdio: "ignore" }
  )
);
const targets = await waitFor(
  () => fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`).then((r) => r.json()),
  20000,
  "chrome devtools"
);

const target = targets.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
if (!target) fail("no Chrome page target found");

const ws = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
const listeners = new Map();
let nextId = 1;

ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve: res, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : res(msg.result);
  } else if (msg.method && listeners.has(msg.method)) {
    listeners.get(msg.method).forEach((fn) => fn(msg.params));
  }
});

const send = (method, params = {}) =>
  new Promise((res, reject) => {
    const id = nextId++;
    pending.set(id, { resolve: res, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

const once = (method) =>
  new Promise((res) => {
    const fns = listeners.get(method) ?? [];
    const fn = (p) => {
      listeners.set(method, listeners.get(method).filter((f) => f !== fn));
      res(p);
    };
    listeners.set(method, [...fns, fn]);
  });

const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) fail(`page error: ${r.exceptionDetails.text}`);
  return r.result.value;
};

await withTimeout(
  new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", () => rej(new Error("websocket error")), { once: true });
  }),
  10000,
  "websocket open"
).catch((e) => fail(e.message));

await send("Page.enable");
// The reused Chrome profile caches aggressively, which would silently export a
// stale deck after edits.
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });

const url = `http://127.0.0.1:${PORT}/index.html`;
const loaded = once("Page.loadEventFired");
await send("Page.navigate", { url });
await withTimeout(loaded, 30000, "page load");

await send("Emulation.setDeviceMetricsOverride", { ...CANVAS, deviceScaleFactor: 1, mobile: false });
// Print media collapses the deck to its narrow-viewport layout, so export the
// screen layout instead.
await send("Emulation.setEmulatedMedia", { media: "screen" });

const slideNumbers = await evaluate(
  `Array.from(document.querySelectorAll(".slide")).map((s) => Number(s.dataset.slide))`
);
if (!slideNumbers.length) fail(`no slides found at ${url} (error page or wrong URL?)`);

const assets = await withTimeout(
  evaluate(`Promise.all([
    document.fonts.ready,
    ...Array.from(document.images).map((img) =>
      img.complete ? Promise.resolve() : new Promise((res) => {
        img.addEventListener("load", res, { once: true });
        img.addEventListener("error", res, { once: true });
      })
    ),
  ]).then(() => ({
    images: document.images.length,
    broken: Array.from(document.images).filter((i) => !i.naturalWidth).map((i) => i.src),
  }))`),
  60000,
  "fonts and images ready"
);
if (assets.broken.length) fail(`broken images:\n  ${assets.broken.join("\n  ")}`);
console.log(`slides: ${slideNumbers.length} · images: ${assets.images}`);

// Blurred box-shadows come out of Chrome's PDF path as flat grey rectangles.
await evaluate(`(() => {
  const base = document.createElement("style");
  base.textContent = \`
    .controls, .hint { display: none !important; }
    html, body { height: ${CANVAS.height}px !important; }
    .deck, .deck__track { height: ${CANVAS.height}px !important; max-height: none !important; }
    .slide { height: ${CANVAS.height}px !important; overflow: hidden !important; }
    * { box-shadow: none !important; }
  \`;
  document.head.appendChild(base);
  const isolate = document.createElement("style");
  isolate.id = "__export_isolate";
  document.head.appendChild(isolate);
  return true;
})()`);

// Chrome's PDF path ignores the slide's bottom padding when sizing flexible
// children, which lets rows expand past the page edge. Freezing each slide's
// children at their measured screen heights keeps the printed layout faithful.
const pinning = await evaluate(`(() => {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, height: r.height };
  };

  // Measure everything before mutating anything: setting flex on a growing
  // child collapses it to its content height, and pinning that stale value
  // top-aligns whatever the child was centering.
  const before = slides.map((slide) => Array.from(slide.children).map(box));

  slides.forEach((slide, i) => {
    Array.from(slide.children).forEach((child, j) => {
      child.style.flex = "0 0 auto";
      child.style.height = before[i][j].height + "px";
    });
  });

  // Pinning must be geometrically inert; anything else means the printed
  // layout no longer matches the deck.
  const drift = [];
  slides.forEach((slide, i) => {
    Array.from(slide.children).forEach((child, j) => {
      const after = box(child);
      const delta = Math.max(
        Math.abs(after.top - before[i][j].top),
        Math.abs(after.height - before[i][j].height)
      );
      if (delta > 1) {
        drift.push(\`slide \${slide.dataset.slide} · \${child.className || child.tagName} moved \${Math.round(delta)}px\`);
      }
    });
  });

  return { count: before.reduce((n, kids) => n + kids.length, 0), drift };
})()`);
if (pinning.drift.length) fail(`pinning changed the layout:\n  ${pinning.drift.join("\n  ")}`);
console.log(`pinned ${pinning.count} slide children (layout unchanged)`);

rmSync(pageDir, { recursive: true, force: true });
mkdirSync(pageDir, { recursive: true });

// Printing the whole deck in one job blows up nonlinearly (7 slides ~1s, 10+
// never returns), so print one slide at a time and merge afterwards.
for (const n of slideNumbers) {
  await evaluate(
    `(document.getElementById("__export_isolate").textContent =
      '.slide:not([data-slide="${n}"]) { display: none !important; }'), true`
  );
  const { data } = await withTimeout(
    // Explicit paper size is required: with preferCSSPageSize Chrome lays out
    // at the default 8.5in width and collapses multi-column slides.
    send("Page.printToPDF", {
      printBackground: true,
      paperWidth: PAPER.width,
      paperHeight: PAPER.height,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      transferMode: "ReturnAsBase64",
    }),
    30000,
    `printToPDF slide ${n}`
  ).catch((e) => fail(e.message));
  writeFileSync(join(pageDir, `slide-${String(n).padStart(2, "0")}.pdf`), Buffer.from(data, "base64"));
  process.stdout.write(`.`);
}
process.stdout.write("\n");

const merge = spawn("python3", [join(repoRoot, "tools", "merge-pdf.py"), pageDir, outFile], {
  stdio: "inherit",
});
const code = await new Promise((res) => merge.on("close", res));
if (code !== 0) fail(`merge failed with exit code ${code}`);

rmSync(pageDir, { recursive: true, force: true });
cleanup();
process.exit(0);
