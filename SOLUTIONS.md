# Solved once — reuse, don't re-derive

General techniques worked out on the home page. Each is a trap or a pattern that
will recur on the next page; the reference is just where to read a worked
example, not the point itself.

## Tailwind v4

- **A custom class used with a variant MUST be `@utility`, never
  `@layer components`.** Tailwind only generates variants (`max-md:`, `hover:`,
  …) for utilities it owns; a component-layer class used as `max-md:foo` emits
  *nothing*, silently — no error, no rule. This cost the "double scrollbar".
  Ref: `.scroll-rail`, `app.css`.

## Native horizontal scroll rails

- **One markup, two behaviours by breakpoint**: desktop translates a track
  behind arrows; below `md` the viewport scrolls natively. Cleaner than two
  separate components. Ref: `carouselSection()` / `initCarousel()`, `main.js`.
- **Read layout constants (gap, card width) per interaction, not once at init** —
  they change across breakpoints, and a cached value drifts after a resize.
- **Native scroll reacts only to touch/trackpad; a mouse drag does nothing.**
  Pointer devices need an explicit drag-to-scroll handler. Ref: `enableDragScroll()`.
- **Draw the scroll position, don't style the native scrollbar.** Hide it
  (`@utility scroll-rail`) and mirror `scrollLeft`/`scrollWidth` onto a bar.
  Ref: `initScrollProgress()`.
- **Nested sliders must not chain by default.** Decide per breakpoint whether an
  inner gesture hands off to the outer rail — desktop usually no, touch usually
  yes. Ref: `advanceOuterCarousel()`, `product-card.js`.
- **Hide the arrows when the track fits, don't just disable them.** A rail whose
  cards all fit the viewport has nothing to scroll — leaving the arrows visible
  (even greyed) looks broken. This is easy to miss until a filter/tab trims the
  rail to one or two cards at runtime, so gate it on `maxOffset() > 0` inside the
  same `apply()` that runs on every change, not once at init. Ref: `apply()` in
  `carousel.js` (surfaced by the Популярные-товары tab filter).

## Touch gestures

- **Swipe needs `touch-action` set** (`touch-pan-y` for a horizontal swipe) or
  the browser claims the gesture and fires `pointercancel`.
- **Commit on `pointermove` past a threshold, not on `pointerup`** — a
  release-only handler never runs when touch cancels mid-gesture. Ref: hero swipe,
  `hero-slider.js`.

## Faithful-to-Figma media

- **Reproduce a Figma media box with CSS custom properties, one box per
  breakpoint — not `object-cover`** — when the design hand-places a crop.
  Ref: `.cat-media` / `.hero-media`, `app.css`.
- **Fix baked-in artifacts (letterbox, wrong aspect) at the source asset**, with
  ffmpeg — don't paper over them in CSS. Check new video with `cropdetect` first.

## Filters: form + request seam (prototype → AJAX)

The catalog filters will ship as server-side filtering (AJAX) in the Blade
build. Don't model that as either a dead open/close UI **or** a throwaway
client-side filtering engine — model it as a **real form with one request
seam**, so the port swaps one function and nothing else.

- **The drawer is a real `<form>`; every field `name` is a future query
  parameter** (`collection[]`, `facade[]`, `price_min`, …). This is the
  portable artifact — in Blade the form ports 1:1 and the names become the
  request params. Ref: `partials/catalog-filters.html`.
- **Each product card prints the filterable attributes as `data-*`**
  (`data-collection`, `data-price`, …) — the same values Blade prints from the
  model. Ref: `buildCard()` in `catalog.js`.
- **All filtering funnels through one function, `applyFilters()`** — *the seam*.
  Today its body reads the form, shows/hides cards by their `data-*`, updates
  the count/badge, and writes the URL. Later the body becomes
  `fetch('/catalog?' + params)` → replace the grid with server HTML. The form
  markup, field names and wiring don't change. The `params` it builds is
  already the query string the server will receive. Ref: `applyFilters()`,
  `catalog.js` — it's commented as the swap point.
- **State lives in the URL** (`history.pushState` on apply, hydrate from
  `location.search` on load + `popstate`), so refresh/share/back work now and
  match how the server route will read the request. Ref: `hydrateFromURL()`.
- **Quick-filter chips are shortcuts, not a second source of truth**: a chip
  toggles the matching form input and re-runs the seam; chip active-state is
  derived back from the form. Never let a chip hold state the form doesn't.

The rule that generalises: when a prototype stands in for a future server
round-trip, make the *inputs* real (form, field names, URL) and hide the fake
part behind a single named function. The seam is the only throwaway code.

## Deriving states from the design

- **`fig.mjs` diffs component variants** (default vs hover/pressed) — read the
  exact deltas instead of guessing. That's where hover colours, zoom factors and
  the animated transforms came from. See `CLAUDE.md`.
- **A constant overlay/wash a component always carries is a token, not a hover
  effect** — check whether it's on the base variant. Ref: `bg-overlay-light` on
  the promo tiles.
- **No prototype interaction in Figma → no auto-motion in code.** Don't add
  auto-advance/animation the design doesn't specify.
