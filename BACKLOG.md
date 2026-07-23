# Backlog

Only things that are actually open. Delete lines as they land.

## Known gaps

- Product cards show the same image three times — the gallery and its dots are
  real, the data isn't. Needs per-product image sets.
- Card data across all sections is mock (`src/pages/customer/main.js`). Counts
  were padded to ten to match the mobile 2×5 layout; prices and titles are
  invented.
- Every CTA is `href="#"`. No other page exists to link to.
- Hero slides 2 and 3 are mock — only slide 1 exists in Figma.
- Yandex Maps key is inlined as a fallback in `main.js`. Move to
  `VITE_YANDEX_MAPS_KEY` before this is public.

## Seams to wire (form + request seam pattern — see SOLUTIONS.md)

Places that will be a server round-trip in the Blade build. Done so far: catalog
filter drawer, popular-carousel tabs, header search, add-to-cart, stores filter.

The JS-string structure debt is unwound: every repeated unit is now a clean HTML
`<template>` in its partial that the component clones (product-card, catalog-menu,
mobile-menu, stores). What stays in JS is only the mock *data* arrays
(`categories`, `stores`, the product lists) — in Blade those come from the model
and are printed into the same templates; nothing structural remains to convert.

- The mobile burger-menu search field is still an inert `<form onsubmit="return
  false">` (partials/mobile-menu.html) — not wired to components/search.js. Give
  it `data-search`/`name="q"` and run initSearch() over it when mobile search
  lands.

## Not started

- The remaining `src/pages/` stubs (PDP, order flow). The .fig has full designs —
  `fig.mjs find PDP` / `find Order`. Catalog (desktop) is done; its mobile canvas
  is the next iteration.
