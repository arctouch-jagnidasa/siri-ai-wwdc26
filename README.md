# App Intents Blueprint — ArcTouch Deck

HTML presentation deck recreating the structure and content of `App_Intents_Blueprint.pptx`, restyled with [ArcTouch brand guidelines](https://www.arctouch.com).

**17 slides.** For architecture, slide inventory, CSS components, and edit workflows, see **[DECK-SPECS.md](./DECK-SPECS.md)**.

## Open the deck

```bash
open index.html
```

Or serve locally:

```bash
python3 -m http.server 8765
# then visit http://127.0.0.1:8765/?slide=1
```

## Navigation

- ← / → or Space / PageUp / PageDown
- Click left/right third of the slide
- Swipe on touch devices
- `F` for fullscreen
- URL `?slide=N` deep-links to a slide

## Branding notes

- Colors: Warm Orange `#FF8300`, Intense Warm Orange `#E77600` (text on white), Deep Grey `#55565A`
- Type: Figtree (headings), Noto Sans (body)
- Logos from official ArcTouch brand assets

## Illustrations

Feature visuals live in `assets/illustrations/`:

- ArcTouch-style 3D icons (trinity, orchestration, shortcuts/spotlight)
- Apple Developer “Getting Started with App Intents” diagram on slide 4 (gateway)
- Slide 1 is title-only (no hero image)


