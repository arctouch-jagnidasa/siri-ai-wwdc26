# App Intents Blueprint Deck — HTML Build Specs

Handoff document for continuing work on the ArcTouch-branded HTML presentation. No build step: edit `index.html`, `styles.css`, and `assets/`, then reload in a browser.

## Repository layout

| Path | Role |
|------|------|
| `index.html` | All slide markup (13 slides inside `#track`) |
| `styles.css` | ArcTouch tokens, layout, slide components |
| `deck.js` | Horizontal carousel navigation, deep links, Swift highlighting |
| `assets/` | Logos, illustrations, screenshots |
| `vendor/` | highlight.js + Swift grammar, Phosphor icon font |
| `README.md` | Quick start |
| `DECK-SPECS.md` | This file |

**Original source:** `App_Intents_Blueprint.pptx` (NotebookLM-style outline).  
**Content verification:** `/Users/jagnidasa/Downloads/IO and WWDC blog posts.pdf` (domain taxonomy, iOS 27 labels, snippet behavior).

## Run locally

```bash
cd /Users/jagnidasa/repos/app-intents-blueprint-deck
python3 -m http.server 8765
# http://127.0.0.1:8765/?slide=1
```

Serving over HTTP is optional for static assets but recommended when testing cache-busted images (`?v=2`).

---

## Architecture

```
<body>
  <div class="deck" id="deck">
    <div class="deck__track" id="track">
      <section class="slide" data-slide="N">…</section>
      …
    </div>
  </div>
  <nav class="controls">…</nav>
  <p class="hint" id="hint">…</p>
  <script src="deck.js"></script>
</body>
```

- **One file, one slide:** each `<section class="slide">` is a full viewport.
- **Horizontal track:** `#track` is a flex row; `deck.js` translates it with `translate3d(-index * 100%, 0, 0)`.
- **Slide count is automatic:** `deck.js` uses `document.querySelectorAll(".slide").length`. Renumbering `data-slide`, `aria-label`, and `.slide__count` text is still required for humans and deep links.
- **No framework, no bundler.** Google Fonts loaded from CDN; icons and syntax highlighting are vendored.

### Head dependencies (`index.html`)

- Fonts: Figtree + Noto Sans (Google Fonts)
- `styles.css`, `vendor/phosphor/style.css`
- `vendor/highlight.min.js`, `vendor/swift.min.js` (defer)
- `deck.js` at end of body

---

## Slide anatomy

Every slide (except minor hero/closing variants) follows this skeleton:

```html
<section class="slide" data-slide="N" aria-label="Slide N">
  <div class="slide__chrome">
    <img class="logo" src="assets/ArcTouch-logotype-color-white-background-RGB.svg" alt="ArcTouch" />
    <span class="slide__count">NN / 13</span>
  </div>
  <header class="slide__header">
    <h1>Title with <span class="accent">emphasis</span></h1>
    <p class="lede">Optional subtitle paragraph.</p>
  </header>
  <!-- slide-specific content -->
</section>
```

### Slide modifiers

| Class | Use |
|-------|-----|
| `slide--hero` | Slide 1 only. Orange gradient background. Use `logo--light` (orange-background SVG). No hero image currently. |
| `slide--closing` | Slide 13. Closing blueprint layout + tagline. |
| `is-active` | Set on slide 1 in HTML; toggled by JS. Do not rely on it in CSS for layout. |

### Typography helpers

| Class | Purpose |
|-------|---------|
| `.accent` | Orange emphasis inside `h1` (`--orange-intense`) |
| `.lede` | Muted subtitle under the title |
| `.eyebrow` | Uppercase label (hero slide) |
| `:not(pre) > code` | Inline code chips (grey background) |
| `pre code.language-swift` | Block code; highlighted by highlight.js |

### Logo variants

| Slide | Logo file | Class |
|-------|-----------|-------|
| 1 (hero) | `ArcTouch-logotype-color-orange-background-RGB.svg` | `logo logo--light` |
| 2–13 | `ArcTouch-logotype-color-white-background-RGB.svg` | `logo` |

---

## Adding, removing, or renumbering slides

1. Insert or delete a `<section class="slide">` inside `#track` (before the closing `</div></div>`).
2. Renumber **every** remaining slide:
   - `data-slide="N"`
   - `aria-label="Slide N"`
   - `.slide__count` → `NN / TOTAL` (zero-padded, e.g. `03 / 14`)
3. Update the HTML comment above each slide (`<!-- N. Title -->`).
4. Set `is-active` only on slide 1 (or whichever slide should show on cold load before JS runs).
5. Verify: open `?slide=1` through `?slide=TOTAL`, keyboard nav, progress bar width.

`deck.js` does **not** read `data-slide`; it uses DOM order. Keep `data-slide` in sync with order for debugging and URLs.

---

## Slide inventory (13 slides)

| # | Comment | Title (h1) | Layout pattern | Key classes / assets |
|---|---------|--------------|----------------|----------------------|
| 1 | Title | Siri Got Smarter | Hero, title-only | `slide--hero`, `.hero`, `.eyebrow` |
| 2 | Why it matters | From nested screens to a conversation | Two-column UX compare | `.compare.compare--ux`, `.ux-steps` |
| 3 | Snippets | What a short chat can achieve | Screenshot gallery | `.shot-gallery`, `.shot`, `.shot-notes` |
| 4 | Inclusive | More inclusive by design | 2×2 card grid | `.inclusive-grid`, `.inclusive-card`, Phosphor icons |
| 5 | Gateway | The Gateway to system experiences | Diagram + spoke list | `.split.split--visual`, `.fig--frame`, `.hub__spokes--stack`, `.spoke` |
| 6 | Trinity | The Foundational Trinity | Icon + stacked cards | `.split--visual-left`, `.trinity--compact`, `.card--primary/top-grey/top-soft` |
| 7 | Two paths | Two Paths: Schemas and Custom Intents | Two-column definition lists | `.compare`, `compare__col--legacy/new`, `<dl>` |
| 8 | Taxonomy | The Schema Taxonomy Map | Two regions + chip groups | `.taxonomy.taxonomy--two`, `.chip-groups`, `.chip--new/expanded` |
| 9 | Semantic bridge | Implementing the Semantic Bridge | Code before/after | `.bridge`, `.code-panel`, Swift in `<pre><code>` |
| 10 | Orchestration | Multi-App Orchestration | Icon + flow + cards | `.flow-row--stacked`, `.orchestrate`, `icon-orchestration.png` |
| 11 | Edge case | What if nothing fits a schema? | Vertical callouts | `.stack`, `.callout`, `.callout--warn` |
| 12 | Custom intents | Custom Intents Still Count | Icon + three cards | `.split--visual-left`, `icon-shortcuts-spotlight.png` |
| 13 | Blueprint | The Integration Blueprint | Numbered steps + tagline | `slide--closing`, `.blueprint`, `.closing-line` |

### Removed slides (do not re-add without intent)

These were in the original PPTX flow and were deleted or merged:

| Former topic | Fate |
|--------------|------|
| Notes Domain Anatomy | Removed |
| Snippet Views (standalone) | Merged into slide 3 |
| Managing Execution Contexts | Removed |
| Photos & Files | Removed |

Current deck: **13 slides** (was 15).

---

## CSS component catalog

### Layout primitives

| Class | Description |
|-------|-------------|
| `.split` | Generic two-column flex |
| `.split--visual` | Image left, content right (slide 5). Image uses `object-fit: contain` — do not switch to `cover` or diagram overlaps header. |
| `.split--visual-left` | Icon/illustration left, cards right (slides 6, 10, 12) |
| `.split--paths` | Variant for path comparison (unused on slide 7 currently) |
| `.stack` | Vertical stack of callouts (slide 11) |

### Compare columns (slides 2, 7)

```html
<div class="compare"> <!-- or compare--ux for slide 2 -->
  <div class="compare__col compare__col--legacy">…</div>
  <div class="compare__col compare__col--new">…</div>
</div>
```

Slide 2 uses ordered lists (`.ux-steps`); slide 7 uses `<dl>` with `<dt>`/`<dd>` rows.

### Cards

Base: `.card` with optional modifiers:

| Modifier | Visual |
|----------|--------|
| `card--primary` | Orange top border (intents / featured) |
| `card--top-grey` | Grey top border (entities) |
| `card--top-soft` | Soft orange top border (enums) |
| `card--dark` | Dark background, light text |
| `card--warm` | Warm tinted background |
| `card--muted` | Muted grey background |

Meta label: `.card__meta` — often includes `<i class="ph ph-…">`.

### Inclusive grid (slide 4)

```html
<article class="card inclusive-card">
  <div class="inclusive-card__lead">
    <i class="ph ph-microphone" aria-hidden="true"></i>
    <p class="card__meta">Voice & type</p>
  </div>
  <div class="inclusive-card__body">
    <h2>…</h2>
    <p>…</p>
  </div>
</article>
```

White cards, large orange Phosphor icon left, body right.

### Gateway hub (slide 5)

- `.fig.fig--frame` wraps Apple diagram
- `.hub__spokes.hub__spokes--stack` — vertical list
- `.spoke` / `.spoke--featured` — icon + `.spoke__label`
- Diagram file: `assets/illustrations/app-intents-framework.png` (cache-bust with `?v=N` when replacing)

### Taxonomy chips (slide 8)

```html
<div class="chip-groups">
  <div class="chip-group">
    <p class="chip-group__label">New in iOS 27</p>
    <ul class="chips">
      <li class="chip--new"><i class="ph ph-…"></i>Domain <span class="chip__badge">New</span></li>
    </ul>
  </div>
</div>
```

- `chip--new` — orange styling + "New" badge
- `chip--expanded` — expanded styling + "Expanded" badge
- Plain `<li>` — "Since iOS 18" domains
- `.chips--soft` — shortcuts-restricted domains (right column)
- `.chip-legend` exists in CSS but was removed from slide 8

### Code bridge (slide 9)

```html
<div class="bridge">
  <article class="code-panel">…</article>
  <div class="bridge__arrow">→</div>
  <article class="code-panel code-panel--adopted">…</article>
</div>
```

Use `class="language-swift"` on `<code>` inside `<pre>`. `deck.js` runs `hljs.highlightElement` on load.

### Screenshots (slide 3)

```html
<figure class="shot">
  <img src="assets/screenshots/…" alt="…" />
  <figcaption><span>Short label</span> Longer explanation.</figcaption>
</figure>
```

Gallery: `.shot-gallery` (4-up grid). Footer bullets: `.shot-notes`.

### Closing blueprint (slide 13)

`.blueprint` → `.blueprint__step` with `.blueprint__n` (01, 02, 03). Featured step: `.blueprint__step--featured`. Tagline: `.closing-line`.

### Legacy / unused in current deck

CSS still defines `.snippet-layout`, `.snippet-card`, `.header-icon`, `.chip-legend`, `.taxonomy--three` — safe to reuse if adding slides; not referenced in current `index.html`.

---

## Brand tokens (`styles.css` `:root`)

| Token | Value | Usage |
|-------|-------|-------|
| `--orange` | `#ff8300` | Brand primary |
| `--orange-intense` | `#e77600` | Accent text on white |
| `--orange-mild` / `--orange-soft` | lighter oranges | Gradients, chips |
| `--grey-deep` | `#55565a` | Body text, headings |
| `--grey-mild` / `--grey-soft` | greys | Ledes, meta |
| `--bg`, `--bg-secondary`, `--bg-tertiary` | whites / greys / peach | Surfaces |
| `--font-display` | Figtree | Headings, counts |
| `--font-body` | Noto Sans | Body |
| `--slide-pad` | `clamp(1.5rem, 4vw, 3.5rem)` | Slide padding |
| `--radius`, `--shadow` | 12px, soft shadow | Cards, figures |

Slide background: subtle peach gradient overlay on white (default slides); hero uses orange gradient.

---

## Icons (Phosphor)

Loaded from `vendor/phosphor/style.css`. Usage:

```html
<i class="ph ph-gear-six" aria-hidden="true"></i>
```

Browse icons at [phosphoricons.com](https://phosphoricons.com). Class pattern: `ph ph-{name}`.

Common icons in deck: `gear-six`, `cube`, `list-bullets`, `sparkle`, `magnifying-glass`, `lightning`, `device-mobile`, domain icons on taxonomy chips.

---

## JavaScript (`deck.js`)

| Feature | Behavior |
|---------|----------|
| Navigation | Prev/next buttons, ←/→, Space, PageUp/Down, Home/End |
| Click zones | Left third = prev, right third = next (ignores `.controls`, links, buttons) |
| Touch | Swipe > 60px |
| Deep link | `?slide=N` (1-based); updates via `history.replaceState` |
| Progress | `#progress` bar width = `(index + 1) / slides.length` |
| Fullscreen | `F` toggles |
| Title | `document.title` = active slide `h1` text + ` — ArcTouch` |
| Hint | `#hint` fades after 4.5s |
| Swift HL | `pre code.language-swift` on load |

First paint: `render(false)` jumps to deep-linked slide without animation.

---

## Assets

### Logos (`assets/`)

- `ArcTouch-logotype-color-white-background-RGB.svg` — default chrome
- `ArcTouch-logotype-color-orange-background-RGB.svg` — hero slide
- `ArcTouch-logotype-color-grey-background-RGB.svg` — available, unused
- `ArcTouch-logomark-color-transparent-background-RGB.png` — available, unused

### Illustrations (`assets/illustrations/`)

| File | Used on |
|------|---------|
| `app-intents-framework.png` | Slide 5 (Apple “Getting Started with App Intents” diagram) |
| `icon-trinity.png` | Slide 6 |
| `icon-orchestration.png` | Slide 10 |
| `icon-shortcuts-spotlight.png` | Slide 12 |
| `icon-schemas.png`, `icon-snippets.png` | Not currently referenced |
| `hero-siri-*.png` | Legacy hero experiments; slide 1 is title-only |

### Screenshots (`assets/screenshots/`)

Active on slide 3:

- `snippet-entity-in-siri.png`
- `snippet-confirm-send.png`
- `snippet-result-landmark.png`
- `snippet-confirm-tickets.png`

`assets/screenshots/extracted/` — raw PDF/PPTX extractions; reference only.

When replacing images, keep descriptive `alt` text (accessibility + presenter notes).

---

## Content rules (verified against blog PDF)

Use these labels consistently on slide 8 and in copy:

**Primary domains (Siri chat):**

- **New in iOS 27:** Audio, Calendar, Clock, Maps, Messages, Notes, Phone, Reminders
- **Expanded in iOS 27:** Mail, Photos, System & in-app search
- **Since iOS 18:** Camera, Files
- **Full adoption required:** Mail, Clock, Messages

**Shortcuts-restricted:** Books, Browser, Journaling, Presentation, Reader, Spreadsheet, Whiteboard, Word Processor

Terminology:

- Say **Primary domains** vs **Shortcuts-restricted domains** (not “single-purpose”).
- iOS references: **iOS 27 betas** where version-specific.
- Custom intents: strong for Shortcuts/Spotlight; schema intents unlock native Siri reasoning.
- Avoid overstating AppShortcuts / IndexedEntity as Siri-chat discovery paths.

---

## Common edit recipes

### Change slide title copy

Edit `h1` (and optional `.lede`) inside `.slide__header`. Accent phrase goes in `<span class="accent">`.

### Add a screenshot to slide 3

Drop PNG in `assets/screenshots/`, add a `<figure class="shot">` inside `.shot-gallery`. Adjust grid in `.shot-gallery` CSS if count ≠ 4.

### Replace slide 5 diagram

Overwrite `assets/illustrations/app-intents-framework.png`, bump query string in `src` (e.g. `?v=3`). Confirm `object-fit: contain` in `.split--visual .fig img` — diagram must fit without cropping into header.

### Add a taxonomy domain chip

Copy an existing `<li>` in the appropriate `.chip-group`. Match icon + badge class (`chip--new`, `chip--expanded`, or plain).

### Add Swift sample on a new slide

```html
<pre><code class="language-swift">…</code></pre>
```

Wrap in `.code-panel` if matching slide 9 styling.

---

## Verification checklist

After structural edits:

- [ ] Slide count in every `.slide__count` matches total
- [ ] `data-slide` values are 1…N with no gaps
- [ ] Only slide 1 has `slide--hero` and orange logo
- [ ] `?slide=1` and `?slide=N` load correct slides
- [ ] Progress bar fills correctly on last slide
- [ ] Slide 5 diagram does not overlap title on laptop + large display
- [ ] Swift blocks on slide 9 show syntax colors
- [ ] Phosphor icons render (font loaded)
- [ ] No horizontal overflow on 1280×720 and 1920×1080

---

## Gotchas

1. **Inline vs block code:** `:not(pre) > code` styles inline chips; `pre code` must stay unstyled for highlight.js.
2. **Slide 5 sizing:** Constrain with `.split--visual .fig img { object-fit: contain; }` — filling caused header overlap.
3. **HTML comments are stale:** Some comments say `<!-- 3. Foundational Trinity -->` on slide 6, etc. — cosmetic only.
4. **README slide count:** Keep in sync with this doc when slides change.
5. **Git:** Do not commit unless explicitly requested.

---

## Suggested next work (optional)

- Sync README with current slide count and link here
- Remove or repurpose unused hero PNGs under `assets/illustrations/`
- Print/export CSS (`@media print`) if PDF export is needed
- Responsive pass for very narrow viewports (< 900px)
