# AGENTS.md

## Cursor Cloud specific instructions

This repository is a single, dependency-free static presentation deck (`index.html`, `styles.css`, `deck.js`, plus vendored assets in `vendor/` and `assets/`). There is no package manager, build step, database, backend, lint config, or automated test suite. All third-party code (highlight.js, Swift grammar, Phosphor icons) is vendored in-repo; only web fonts load from a CDN at runtime.

### Running the deck (the only service)
- Serve statically from the repo root: `python3 -m http.server 8765`, then open `http://127.0.0.1:8765/?slide=1`. This is the documented dev workflow (see `README.md`).
- `python3` is preinstalled in the environment; no install step is required.
- Development is edit-and-reload: change the HTML/CSS/JS and refresh the browser. There is no hot reload.
- Navigation: arrow keys / Space / PageUp / PageDown, click left/right third of a slide, swipe on touch, `F` for fullscreen, and `?slide=N` deep-links to a slide. See `DECK-SPECS.md` for the full slide inventory and component reference.

### Lint / test / build
- None exist. There is nothing to lint, no test runner, and no build/bundle step — "building" is just serving the static files.
