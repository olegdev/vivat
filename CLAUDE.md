# VIVAT — customer site

Static marketing site built from a Figma design. Vite + Tailwind v4, vanilla JS,
no framework. Each page builds to a single self-contained HTML file.

```
npm run dev      # vite dev server → /pages/customer/main.html
npm run build    # one vite build per page → dist/ (inlines all JS/CSS)
```

`src/index.html` is a hand-kept screen index (→ `dist/index.html`). **Add every
new page under `src/pages/` to it** — it isn't generated.

## Where we stand

`src/pages/customer/main.html` — the customer home page. Desktop (fixed 1440
canvas) and mobile (fluid, below `md`) are both done: header, catalog mega-menu,
burger menu, hero, category tiles, three product carousels, promo tiles, socials,
stores map (Yandex Maps v3), production block, footer.

`src/pages/customer/catalog.html` — the catalog listing page. Desktop (Figma
Catalog-default 759:60482) and mobile (Figma catalog 1997:267656 — "малая
плитка") are both done. Breadcrumbs, title, filters bar + sort, product grid
(4-col desktop / 2-col mobile), filter drawer, pagination, popular carousel, SEO
block. Below `md` the named filter pills collapse to a single funnel that opens
the drawer, the sort fills the row, chips scroll, cards gain a full-width "в
корзину" pill, and the page carries the bottom nav. The filter drawer is a real
form wired through a single `applyFilters()` request seam — see SOLUTIONS.md ›
"Filters: form + request seam" before touching it. The settings bar also has its
selected state (Figma Catalog-selected-parameters 913:92082 / 1997:301160): the
chip row becomes the selected parameters + "Очистить все", pills gain a count,
the funnel goes dark. The carousel machinery both pages share now lives in
`src/components/carousel.js`.

`src/pages/customer/action.html` — the Акции listing page. Desktop (Figma Action
2248:97191) and mobile (Figma 2248:110193) are both done, and it is assembled
almost entirely from parts the other two pages already own: breadcrumbs + H1, a
wrapping 3-col grid of the home page's promo tiles (`partials/promo-card.html`,
hover and all), the socials block in its own Figma variant, the shared carousel
rail, and the green SEO band (`partials/seo-kitchens.html`, shared with the
catalog). Two things are specific to it, both read off the design: the rail's
title-block has an empty `buttons` frame, so it takes `desktopAction: false`, and
below `md` its cards are the 320px `cards-other` tile in one row rather than the
152px two-row layout, so it takes `mobileCard: "l"`. The 360 frame (a partial
copy — it is still named "catalog") has no socials block; below `md` that section
follows the home page's mobile block instead, by decision, not from the frame.

`src/pages/customer/pdp.html` — the product page. Desktop (Figma PDP
914:101099) and mobile (Figma 1997:305719) are both done. Several more Figma
frames are states of it, not screens of their own: `sticky price` 1884:366246
and `DPD` 2027:83602 (the desktop and mobile bottom bars), `PDP-package`
922:126723 / 2028:114053 and `PDP-docs` 942:34310 / 2029:116633 (two panels of
the Характеристики tab bar, at both widths).

Its own parts are the anchor bar over the photos, the 900px photo column, the
412px summary panel (`partials/pdp-summary.html`), the Характеристики block
(`partials/pdp-specs.html`) and the bottom bars
(`partials/sticky-price.html`); everything below is reuse — four carousel rails,
the stores map under this page's heading, the green SEO band, footer.

Mobile is not a narrower desktop — four things genuinely change:

- **The photo column becomes one swipeable rail.** Three stacked 900×671 shots
  turn into full-width 256px slides that snap, with the badges and the share
  action drawn on each slide (`partials/pdp-photo-overlay.html`) and a dot per
  photo below. Same DOM: the flex column becomes a scrolling row.
- **The summary re-orders.** Desktop reads title → colours → size → geometry →
  price; mobile reads title → size → geometry → colours → price. The DOM is
  authored in desktop order and `max-md:order-*` re-sequences it, which is the
  one place `order-*` is used in this project — see SOLUTIONS.md.
- **The order button moves out of the summary into the bottom bar**, and that
  bar is a different component from the desktop one: `modal-button-container`
  (2027:89990) is *always* visible and stacks on the bottom nav, where the
  desktop `sticky-price` bar is revealed by scroll. Both live in
  `partials/sticky-price.html`; the page reserves 132px (72 nav + 60 bar).
- **The anchor bar over the photos is gone**, and the Характеристики tab bar
  becomes a horizontally scrolling row with a white fade over its right edge.

Two design decisions worth not re-litigating, both confirmed with the client:

- The Характеристики bar mixes **four panels and two anchors**. Описание /
  Модули / Состав / Документы switch the panel; Отзывы and Где купить scroll to
  the sections further down. Figma draws panels for only three of the four —
  **Состав has no frame** and carries placeholder rows marked TODO in
  `partials/pdp-specs.html`; replace them when the design lands.
- `PDP-package` underlines **Модули**, and that is the tab its комплектация list
  belongs to, even though the frame's name says otherwise. The Модули *carousel*
  further down the page is a separate section.

One deliberate deviation: the mobile frame titles the stores block **"Наши
салоны"** while desktop titles it **"Где купить"**. Both pages use "Где купить"
— the desktop frame overrides the title on purpose and the tab bar has a label
pointing at it, whereas the mobile instance only overrides the *description*,
which reads as a component that was never re-titled. Say so if it comes up.

`src/pages/customer/order.html` — оформление заказа. Desktop (Figma Order
942:110179) and mobile (2029:126838 and the frames after it) are both done.
Figma draws `Order-step0/1/2` as separate frames, but they are three states of
this one page: each is the previous one with a section appended, and `Order`
itself is identical to `Order-step2`. `data-step` gates them.

Two things about it are worth not rediscovering:

- **Steps accumulate on desktop and replace each other on mobile.** The 1440
  frames put all three on one scroll, so the cart stays visible under шаг 1 and
  шаг 2; the 360 frames are three separate screens. Each `[data-step-section]`
  therefore carries both rules — `hidden` for "later than the current step" and
  `max-md:hidden` for "not the current step".
- **Шаг 1 is `partials/stores.html` in a third mode, not a new block.**
  `renderStoresMap({ selectable: true })` re-dresses the same partial: white
  surface, the step's copy in the title hooks, a selection ring, and below `md`
  a full-screen map with a drag-snapped bottom sheet (`components/store-sheet.js`)
  where the reading pages show a 320px map. See SOLUTIONS.md › "A shared partial
  gains a mode from JS".

Its own parts are the cart line (`partials/cart-card.html`, which also owns the
quantity stepper — it exists nowhere else) and the summary
(`partials/order-summary.html`); the contact form, the alert band and the
confirmation overlay live in the page. Below `md` the site header is replaced by
a modal-style bar whose title names the step.

Everything else in `src/pages/` is a stub.

## Where this is heading — PHP Blade

This static build is a **prototype for a PHP Blade theme**: the markup will be
ported to `.blade.php` templates and rendered server-side. That target sets one
architectural rule — **structure is HTML, behaviour is JS.**

- Anything shared across pages (header, footer, and other chrome) lives as a
  plain **HTML fragment**, one file per future Blade partial, so the port to
  `@include('partials.header')` / `<x-header/>` is mechanical.
- Do **not** author shared structure as JS render functions. JS is for
  behaviour (open/close, carousels, drag), not for emitting the page's
  structure. Every component now follows this — where a script fills a list, the
  single-unit markup is a clean HTML `<template>` in the partial that the script
  clones and fills; it never builds markup from strings.
- Repeated, data-driven blocks (product cards, promo tiles, filter groups, menu
  rows, dealer cards) become Blade `@foreach` loops. Their unit lives as a
  `<template>` in the owning partial (`product-card`, `promo-card`,
  `catalog-menu`, `mobile-menu`, `stores`); the component clones it per datum, so
  the loop maps straight onto `@foreach`. Copy that pattern for new lists — do
  not go back to JS string templates.
- A unit whose **container** differs per page carries no width of its own: the
  promo tile is the same `<template>` in the home page's centred rail and in the
  Акции grid, and each container sizes its own children (`*:w-[437px]` on the
  rail, grid columns on the page).

**Include mechanism.** Shared chrome lives in `src/partials/*.html`, spliced
into pages at build time by `scripts/vite-plugin-includes.mjs` via
`<!--#include partials/NAME.html -->` (SSI-style, resolves from the Vite root,
works in both `npm run dev` and `npm run build`). One partial == one future
Blade partial — the port to `@include('partials.name')` is mechanical. Current
partials: `header`, `bottom-nav`, `footer`, `catalog-menu`, `mobile-menu`,
`catalog-filters`, `chip-close`, `stores`, `product-card`, `promo-card`,
`review-card`, `pdp-summary`, `pdp-specs`, `sticky-price`, `seo-kitchens`,
`cart-card`, `order-summary`.
Several carry both a static shell and the `<template>` unit(s) their component
clones (`catalog-menu`, `mobile-menu`, `stores`, `pdp-summary`, `pdp-specs`);
`product-card`, `promo-card` and `review-card` are templates only, and
`seo-kitchens` is plain shared content. The matching
`src/components/*.js` queries the shell and clones the templates — it never
builds markup.

**A partial that two pages mount under different copy takes data hooks, not a
copy.** `stores` is the home page's "Наши салоны" and the PDP's "Где купить" —
the heading and the lead paragraph carry `data-stores-title` /
`data-stores-desc`, and `renderStoresMap()` overrides them from the call site.
In Blade that becomes `@include('partials.stores', ['title' => …])`. Fixture
data two pages share lives in `src/data/` (the dealer network, the product photo
pool) rather than being pasted into both page scripts.

Partials are a raw text splice, so asset URLs written inside them are relative
to the **including page**, not the partial — every customer page sits at
`src/pages/customer/`, so `../../assets/...` is uniform.

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

The canonical Figma file is **`odPx3t2xUNTnIx09J9DpIS`**
(https://www.figma.com/design/odPx3t2xUNTnIx09J9DpIS/VIVAT) — pass this fileKey
to the MCP tools. Top-level pages: `Design` (189:10790), `UI SYSTEM`
(922:83156). Older copies `9d9EunlGqwIMf5hPZI3kmf` and `J5GoY36VJIg79HSzfDVn3f`
also exist — ignore them. Node ids are unchanged across the move, so ids quoted
anywhere in these docs still resolve.

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
- **Don't invent elements; propose, don't decide, when something's missing.**
  Build only what the design shows. If a node has hidden/empty children (the
  catalog title's `buttons` frame renders empty), they are absent — don't fill
  them with guessed icons (the invented like/share buttons were exactly this).
  When something genuinely is missing or ambiguous, **propose a solution and ask
  — never decide it silently** (that's how the price min/max inputs were handled).
- **Verify colour against the live render, not a stale snapshot or your eye.**
  The green SEO band's text is **white** — the `.fig` snapshot said `#292929`
  (stale) and it's easy to mis-eyeball dark on a mid-green. `canvas.fig` lags the
  live file, so for anything colour-critical (especially text on a coloured
  fill) confirm with an MCP screenshot and, if unsure, sample the pixels. Figma
  (live) wins over the snapshot. The band *background* is genuinely `#4a9b7d`
  (`surface-accent-alt`) — a different, darker green from the home block's
  `accent-green-200`, on purpose.
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
