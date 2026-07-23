# Solved once — reuse, don't re-derive

Pointers to the tricky bits already worked out on the home page. Read the code
at the reference before rebuilding any of this on the next page.

## Rails / carousels

- **One rail pattern, two behaviours.** Desktop translates `[data-track]` behind
  arrows; below `md` `[data-viewport]` scrolls natively. Both built by
  `carouselSection()` → `initCarousel()`. — `src/pages/customer/main.js:267`
- **Step by card pitch, read the gap per step** (not cached — it differs across
  breakpoints, `gap-6` / `gap-2`). — `main.js:288`
- **Inner card gallery must NOT drive the outer rail on desktop** (separate
  controls); it only chains below `md` where the rail is one scroll surface. —
  `src/components/product-card.js:142`
- **Pointer drag on desktop** (native scroll only reacts to touch/trackpad):
  `enableDragScroll()`, with `ignore` for anything running its own slider. —
  `main.js:165`

## Scrollbars / indicators

- **Double scrollbar** = a rail class used as `max-md:scroll-rail` while defined
  in `@layer components`. Variant-used custom classes MUST be `@utility` or
  Tailwind emits nothing, silently. — `app.css:671`
- **Mobile scroll indicator** (the 2px bar, not a native scrollbar): markup in
  `carouselSection()`, driven by `initScrollProgress()`, styled `.scroll-progress`.
  Figma `scroll` 1965:373920 — 16px gutters, `#808080` thumb, square ends. —
  `main.js:230`, `app.css:651`

## Hero slider

- **No auto-advance** — the Figma banner has no prototype interaction; don't add
  one. — `src/components/hero-slider.js:6`
- **Touch swipe** needs `touch-pan-y` + commit on `pointermove` (release-only
  dies to pointercancel on touch). — `hero-slider.js:66,177`

## Promo tiles (hover / animation)

- Hover states came from **diffing the Figma default vs hover variants** with
  `fig.mjs`, not guessing: caption `#808080`, media zoom `1.05`. — `app.css:417`
- **Coral tile motion**: clusters sit under a rotated/mirrored parent, so the
  per-group `matrix()` is the composed default→hover transform solved in the
  SVG's 437-unit space (`transform-box: view-box`). — `app.css:435`
- **Constant 10% #141414 wash** every news-card carries → `bg-overlay-light`. —
  `main.js:346`
- **`desktopOnly` tiles** (edge slivers) → `max-md:hidden`. — `main.js:353`

## Media boxes

- Category tiles & hero reproduce the Figma media box verbatim via CSS vars, a
  separate box per breakpoint — NOT `object-cover`. — `.cat-media` / `.hero-media`
  `app.css:611,630`
- **Baked-in letterbox** (promo video) is cropped at the source with ffmpeg, not
  hidden in CSS — check new videos with `cropdetect` first.
