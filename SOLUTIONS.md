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

## Deriving states from the design

- **`fig.mjs` diffs component variants** (default vs hover/pressed) — read the
  exact deltas instead of guessing. That's where hover colours, zoom factors and
  the animated transforms came from. See `CLAUDE.md`.
- **A constant overlay/wash a component always carries is a token, not a hover
  effect** — check whether it's on the base variant. Ref: `bg-overlay-light` on
  the promo tiles.
- **No prototype interaction in Figma → no auto-motion in code.** Don't add
  auto-advance/animation the design doesn't specify.
