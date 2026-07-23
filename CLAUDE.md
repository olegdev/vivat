# VIVAT — customer site

Static marketing site built from a Figma design. Vite + Tailwind v4, vanilla JS,
no framework. Each page builds to a single self-contained HTML file.

```
npm run dev      # vite dev server → /pages/customer/main.html
npm run build    # one vite build per page → dist/ (inlines all JS/CSS)
```

## Where we stand

`src/pages/customer/main.html` — the customer home page — is the only real page.
Desktop (fixed 1440 canvas) and mobile (fluid, below `md`) are both done: header,
catalog mega-menu, burger menu, hero, category tiles, three product carousels,
promo tiles, socials, stores map (Yandex Maps v3), production block, footer.

Everything else in `src/pages/` is a stub.

## Before building anything

Read **`SOLUTIONS.md`** first — reusable techniques already worked out (the
Tailwind variant gotcha, native scroll rails, touch gestures, faithful media,
deriving states from Figma). Building the next page means reusing these, not
re-deriving them.

**Keep it current.** Whenever you come back to fix or rework something the first
version got wrong — a separate task, not the original build — and the fix
carries a lesson that generalises, add it to `SOLUTIONS.md`. That doc exists
because these traps cost real time the first time; a fix that isn't written down
gets re-hit on the next page.

## Reading the design

Two sources. **Reach for the local export first, fall back to the Figma MCP
server for whatever it doesn't have.**

```
node scripts/fig.mjs find <regex> [TYPE]   # search layer names
node scripts/fig.mjs tree <id> [depth]     # dump a subtree
node scripts/fig.mjs node <id>             # parent, siblings, master component
node scripts/fig.mjs raw  <id> [k1,k2]     # full node JSON, for fields the index drops
```

ids take either form: `1968:71551` or the `1968-71551` in Figma URLs.

Local first because it is offline, unmetered, returns exact numbers rather than
a rendering, and can diff component variants against each other — which is how
the promo hover states and the coral tile's motion were derived.

Go to the MCP server when:

- you need a **rendered screenshot** — the export can't produce one;
- the node **isn't in the export**, or a value looks wrong. `canvas.fig` is a
  snapshot (see `VIVAT_SOURCES/meta.json` for its export date), so anything
  designed since then only exists in Figma. On any disagreement Figma wins;
- you need **prototype/motion data** the .fig doesn't carry.

If MCP answers "you don't have edit access", the file isn't shared with the
authenticated account — say so and carry on with the local export rather than
retrying.

`VIVAT_SOURCES/` (gitignored) holds `canvas.fig` plus `images/` and `videos/`
keyed by content hash. `scripts/fig.mjs` builds `canvas.index.json` next to it on
first run and reuses it while `canvas.fig` is unchanged — ~0.5s per query
instead of ~2.7s. Re-export and run `index --rebuild` when Figma has moved on.

Format note: block 0 is the kiwi schema (raw deflate), block 1 is the document
(**ZSTD** in current exports). Off-the-shelf .fig parsers assume deflate for both
and fail here; node's `zlib` handles both, so `kiwi-schema` is the only dep.

## Rules

- **Take numbers from the design, not from the screenshot.** Sizes, colours,
  gaps and hover states all come out of `fig.mjs`. Several bugs were shipped by
  eyeballing values that were a token away in the file.
- **Don't invent behaviour.** If the Figma node has no prototype interaction,
  the element doesn't animate or advance on its own. The hero used to
  auto-rotate purely because someone assumed a carousel should.
- Tokens live in `@theme` in `src/styles/app.css` and are the single source of
  truth. Use `bg-overlay-light`, not `bg-[#141414]/10`.
- Mobile is expressed with `max-md:` utilities at the call site. Only what
  utilities cannot express goes in `app.css`.
- Custom classes used with a variant (`max-md:scroll-rail`) **must** be
  `@utility`, not `@layer components` — Tailwind only generates variants for
  utilities it owns, and otherwise emits nothing, silently.
- Verify in the browser at both 1440 and 390 before calling something done.

## Layout facts worth not rediscovering

- The desktop promo row is centred and overflows its 1360 frame, so the two edge
  tiles are clipped to slivers on purpose. Mobile shows three whole tiles.
- Compact "other" cards (152px) lay out as two rows of five on mobile
  (`.rail-2row`, column count handed in as `--cols`).
- Category tiles and the hero reproduce their Figma media box verbatim via CSS
  custom properties, with a separate box per breakpoint — they are not
  `object-cover`.
