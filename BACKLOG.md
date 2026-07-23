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
filter drawer, popular-carousel tabs, header search. Still open:

- **Add to cart** (own thread). Card cart buttons + full-width "в корзину" pill
  + header cart icon are inert (`product-card.js`, `header.html`). Seam:
  `addToCart(id)` → optimistic header-badge bump, later `POST /cart`. Needs the
  card to print `data-product-id` (the contract), which also sets up a cart page.

- **Data authored in JS → server `@foreach`** (own thread; refactor, not a
  stub). `categories` (`catalog-menu.js`), `stores` (`stores-map.js`) and the
  product arrays in `main.js` / `catalog.js` are hard-coded. In Blade they come
  from the model; each single-unit's markup should be a clean HTML block filled
  from data (see CLAUDE.md). Bigger than a seam — schedule deliberately.

- **"Только фирменные магазины" toggle** (part of the refactor thread). Already
  filters the store list client-side (`stores-map.js`, commented there) — it's
  effectively our method minus URL state. Low priority: align it to a named seam
  + URL param only when the store list becomes a server fetch.

## Not started

- The remaining `src/pages/` stubs (PDP, order flow). The .fig has full designs —
  `fig.mjs find PDP` / `find Order`. Catalog (desktop) is done; its mobile canvas
  is the next iteration.
