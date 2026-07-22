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

## Reading the design

**The Figma MCP server does not work on this file** — it authenticates as an
account the VIVAT file was never shared with, and every call fails with "you
don't have edit access". Do not burn turns retrying it.

Read the design from the local export instead:

```
node scripts/fig.mjs find <regex> [TYPE]   # search layer names
node scripts/fig.mjs tree <id> [depth]     # dump a subtree
node scripts/fig.mjs node <id>             # parent, siblings, master component
node scripts/fig.mjs raw  <id> [k1,k2]     # full node JSON, for fields the index drops
```

ids take either form: `1968:71551` or the `1968-71551` in Figma URLs.

This is generally *better* than the MCP server, not just a fallback: it is
offline, has no rate limits, returns exact numbers rather than a rendering, and
can diff variants against each other — which is how the hover states and the
coral tile's motion were derived. The MCP server is still the only way to get a
rendered screenshot, so ask a human for one when the geometry is ambiguous.

`VIVAT_SOURCES/` (gitignored) holds `canvas.fig` plus `images/` and `videos/`
keyed by content hash. `scripts/fig.mjs` builds `canvas.index.json` next to it on
first run and reuses it while `canvas.fig` is unchanged — ~0.5s per query
instead of ~2.7s. Delete it or pass `index --rebuild` after re-exporting.

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
