# VIVAT — Design System Rules (Figma → Code)

Rules for translating the Figma file **VIVAT** (`9d9EunlGqwIMf5hPZI3kmf`) into this
codebase. Read this before implementing any screen. Goal: **pixel-perfect ("один в
один") fidelity** against Figma, using the project's own tokens.

---

## 1. Stack

- **Build:** Vite (multi-page). Every `src/pages/**/*.html` is a build entry.
- **Styling:** Tailwind CSS **v4** (CSS-first config, no `tailwind.config.js`).
  No component framework — pixel-perfect fidelity conflicted with opinionated
  defaults, so components are built directly on the design tokens.
- **Font:** Onest (400/500/600), loaded via Google Fonts in each page `<head>`.
- **Language:** `<html lang="ru">`.

Design tokens live in [`src/styles/app.css`](src/styles/app.css) — the single source
of truth. The **`@theme`** block exposes the *full* Figma variable set as Tailwind
utilities; use these for fidelity (`bg-surface-raised`, `text-text-secondary`,
`border-border-light`, …).

---

## 2. Directory layout

```
src/
  index.html            # screen directory / landing
  main.js               # imports styles/app.css (link from every page)
  styles/app.css        # tokens + theme  (SOURCE OF TRUTH)
  pages/
    customer/main.html  # reference screen
    <role>/<screen>.html
  partials/             # (optional) shared markup notes for header/footer
public/
  assets/               # committed images/icons exported from Figma
```

Figma pages map to roles: **customer**, **dealer**, **b2b** (+ mobile variants at 360px).

---

## 2a. Assets — ALWAYS from source, never cropped from screenshots

The full Figma export lives in [`VIVAT_SOURCES/`](VIVAT_SOURCES/) — `images/` and
`videos/` hold every raw asset, filenamed by its Figma hash (40-char SHA1 = the
`imageHash` / `videoHash` on the node's fill).

**Rules:**

- **Always source assets from `VIVAT_SOURCES/`.** Never crop or screenshot a region
  and use that as the asset — it is lower resolution and misaligned.
- **Check the fill type before assuming "image".** Many hero/promo elements are
  **video** fills, not images. `get_design_context` does *not* export video (only
  PNG/JPEG/GIF/WebP), so a video fill shows up as an empty `<div>` and a near-blank
  screenshot. Confirm with `use_figma`: read `node.fills`, `IMAGE` → `imageHash`,
  `VIDEO` → `videoHash`.
- **Map the hash to a file:** `VIVAT_SOURCES/images/<hash>` or `…/videos/<hash>`
  (no extension). Detect the real type with `file`, copy into `public/assets/…`
  with the correct extension, and reference it. For video use `<video muted loop
  playsinline>` (autoplay needs `muted`), with an `ffmpeg`-extracted poster frame.
- **Vector nodes** (social icons, the coral promo tile) have no raster source at
  all — export them with `download_assets` + `defaultFormat: "svg"`.
- **CSS-referenced assets belong in `src/`, not `public/`.** A `url()` pointing
  into `public/` can only be resolved at runtime, so every build warned
  ("didn't resolve at build time"). The six social glyphs live in
  [`src/styles/social/`](src/styles/social/) and are bound to `.social-<name>`
  classes in `app.css`, which lets Vite hash and inline them. `public/` stays
  for things referenced from markup by path (photos, video, icons in `<img>`).
- Verified video fills on customer/Main:
  | Where | videoHash |
  | --- | --- |
  | Hero banner | `ff823d39…` |
  | Category "Кухни" | `bffeea02…` |
  | Category "Мойки" | `4c274da4…` |
  | Category "Бытовая техника" | `f5a020b1…` |
  | Category "Столы" | `410ec194…` |
  | Category "Стулья" | `d15641fb…` |
  | Category "Столешницы" | `d09649ca…` |
  | Promo "Скидка 20% на стул" | `27bee0a4…` |
  | "Производство" banner | `26ff4269…` |

  All six category tiles are video — a static screenshot of them looks like a
  still image, which is exactly the trap this rule exists to prevent.

---

## 3. Token map (Figma variable → utility)

Figma names use `/`; Tailwind utilities use `-`. Pattern: `color/text/primary`
→ CSS var `--color-text-primary` → utility `text-text-primary` / `bg-text-primary`.

### Colors — semantic (prefer these)

| Figma variable            | Utility example              | Hex       |
| ------------------------- | ---------------------------- | --------- |
| color/text/primary        | `text-text-primary`          | `#292929` |
| color/text/secondary      | `text-text-secondary`        | `#808080` |
| color/text/muted          | `text-text-muted`            | `#acacac` |
| color/text/link-highlighted | `text-text-link-highlighted` | `#ff5546` |
| color/text/inverse-primary | `text-text-inverse-primary` | `#ffffff` |
| color/bg/page             | `bg-bg-page`                 | `#ffffff` |
| color/bg/subtle           | `bg-bg-subtle`               | `#f8f8f8` |
| color/surface/default     | `bg-surface-default`         | `#f3f3f3` |
| color/surface/raised      | `bg-surface-raised`          | `#cbcbcb` |
| color/surface/strong      | `bg-surface-strong`          | `#292929` |
| color/surface/brand       | `bg-surface-brand`           | `#ff5546` |
| color/surface/accent      | `bg-surface-accent`          | `#f8bb92` |
| color/surface/accent-alt  | `bg-surface-accent-alt`      | `#4a9b7d` |
| color/borders/default     | `border-border-default`      | `#cbcbcb` |
| color/borders/light       | `border-border-light`        | `#e7e7e7` |
| color/borders/subtle      | `border-border-subtle`       | `#eeeeee` |
| color/divider/default     | `border-divider-default`     | `#cbcbcb` |
| color/icons/primary       | `text-icon-primary`          | `#292929` |
| color/overlay/strong      | `bg-overlay-strong`          | `rgba(20,20,20,.9)` |

Also `components/*` (`components-red`, `components-strong`, …), full `icons/*`, and
`divider/*` exist as utilities — see `app.css`.

### Colors — primitive palettes (use only when no semantic token fits)

- Brand: `*-brand-200 500 600 800 900 1000` (800 = `#ff5546` = daisyUI `primary`)
- Accent yellow: `*-accent-yellow-200 … 1000`
- Accent green: `*-accent-green-200 … 1000` (800 = `#4a9b7d` = daisyUI `secondary`)
- Neutral: `*-neutral-white 30 50 70 100 150 220 350 500 600 700 800 900 950 black`

### Typography (Desktop scale) — size/line-height/weight are baked in

| Figma style     | Utility            | px / lh / weight |
| --------------- | ------------------ | ---------------- |
| Display L       | `text-display-l`   | 56 / 64 / 600    |
| H1              | `text-h1`          | 34 / 40 / 600    |
| H2              | `text-h2`          | 30 / 36 / 600    |
| H3              | `text-h3`          | 24 / 28 / 600    |
| H4              | `text-h4`          | 20 / 24 / 600    |
| H5              | `text-h5`          | 16 / 24 / 600    |
| Body XL         | `text-body-xl`     | 24 / 32 / 500    |
| Body L          | `text-body-l`      | 20 / 32 / 400    |
| Body N          | `text-body-n`      | 16 / 24 / 400    |
| Body S          | `text-body-s`      | 14 / 18 / 400    |
| Body S-accent   | `text-body-s-accent` | 14 / 18 / 500  |
| Body XS         | `text-body-xs`     | 12 / 16 / 400    |
| Button M        | `text-button-m`    | 16 / 24 / 500    |
| Link M underline| `text-link-m`      | 16 / 24 / 400    |

The `text-*` utility already sets weight + line-height — don't re-add `leading-*` or
`font-*` unless the design overrides it.

### Spacing

Figma's spacing scale (`0 1 2 4 6 8 10 12 16 24 32 40 44 48 56 64 80 96 112 148`)
is 4px-based and **already matches Tailwind's default scale 1:1** — so no custom
spacing tokens exist by design. Use the plain scale: `p-4` = 16px, `gap-6` = 24px,
`px-10` = 40px, `h-11` = 44px. Reserve arbitrary values for true layout
dimensions only (`w-[1440px]`, `h-[327px]`), never for spacing.

### Radius (Figma `radius/*`)

| Figma | Utility | Value |
| ----- | ------- | ----- |
| radius/no | `rounded-no` | 0 |
| radius/S | `rounded-s` | 2px |
| radius/N | `rounded-n` | 4px — cards, tiles, media |
| radius/L | `rounded-l` | 8px |
| radius/XL | `rounded-xl` | 12px |
| radius/rounded | `rounded-pill` | 24px — buttons, chips, badges |

### Borders & shadows

Thickness: `--border-width-1 / -1_5 / -2` (1 / 1.5 / 2px).
Shadows come from Figma effect styles — only two exist:
`shadow-dropdown` (`0 4px 17.6px rgba(0,0,0,.14)`) and `shadow-navbar`
(`0 -3px 5px rgba(0,0,0,.2)`). Don't invent others.

---

## 4. Components

Component classes live in `@layer components` in [`app.css`](src/styles/app.css),
transcribed from the Figma UI SYSTEM component sets. **Use these instead of
re-typing utility strings** — that is what keeps buttons from drifting.

### Button — from set `buttons` (581:21622, 240 variants)

`.btn` + one size + one value. **Figma naming: `primary` is the DARK button,
`accent` is the red one** — don't swap them.

| Size | h / px / gap / text |
| ---- | ------------------- |
| `.btn-s` | 32 / 12 / 6 / 14px |
| `.btn-m` | 44 / 16 / 8 / 16px |
| `.btn-l` | 56 / 24 / 8 / 20px |

| Value | default → hover → active |
| ----- | ------------------------ |
| `.btn-primary` | `#292929` → `#151515` → `#151515` |
| `.btn-accent` | `#ff5546` → `#e64d3f` → `#ff5546` |
| `.btn-secondary` | `#f3f3f3` → `#eeeeee` → `#414141` + white text |
| `.btn-ghost` | transparent → `#eeeeee` → `#414141` + white text |
| `.btn-white` | `#ffffff` → `#eeeeee` (catalog pills on tiles) |

`disabled` / `aria-disabled` → `#e7e7e7` bg + `#999999` text, automatically.

### Other component classes

| Class | Use |
| ----- | --- |
| `.icon-btn` | circular 44px icon button (cart, card action) |
| `.carousel-arrow` | 48px bordered arrow — hero, product & promo carousels |
| `.carousel-dot` + `aria-current="true"` | slider indicator line |
| `.badge` + `.badge-l/-s` + `.badge-new/-hit/-discount` | product & tile badges |
| `.chip` + `aria-selected="true"` | tab chips ("Популярные товары") |
| `.mobile-menu-item` | 44px row of the mobile burger menu (see §7) |

State is driven by ARIA attributes, not class juggling — so the JS just sets
`aria-current` / `aria-selected` and CSS does the rest.

### Extracted JS patterns

- **Product card** — [`src/components/product-card.js`](src/components/product-card.js),
  data-driven, two footer variants (color swatches + comments / category link).
- **Tab chips, carousel section shell, promo tiles** — in
  [`src/pages/customer/main.js`](src/pages/customer/main.js).

Reusable primitives (e.g. the toggle switch in "Наши салоны") are hand-rolled with
`peer` + token colors. When you build a new recurring element, extract it the same
way rather than copy-pasting markup.

**Fidelity rule:** match the Figma spec exactly (radius, padding, border color) using
token utilities. Arbitrary values (`rounded-[24px]`, `h-[327px]`) are expected wherever
no scale step matches — fidelity beats convenience.

---

## 5. Workflow per screen

1. `get_screenshot` the target frame → understand layout.
2. `get_design_context` per section (frames are tall; split to stay under limits).
   Always pass `skillNames: "figma-design-to-code"`.
3. Map the returned React+Tailwind reference → this project's token utilities.
4. **Icons/images:** never hand-draw `<svg>`. Download the exported asset from the
   `get_design_context` asset URLs into `public/assets/` and commit it. Size icons
   with a fixed square container (`size-[24px]`) + `<img>` filling it.
5. Reuse existing components/partials (product card, header, footer) — don't re-derive.
6. Verify against the screenshot before marking done.

---

## 6. Conventions

- Desktop canvas width **1440px**; content column **1360px** (`px-40` = 40px sides).
- Mobile canvas **360px**, margin 16 (`px-4`), gutter 8–12. One DOM serves both:
  the breakpoint is Tailwind's **`md` (768px)** — desktop classes stay unprefixed,
  mobile overrides use **`max-md:`**. Type switches to the `text-m-*` scale.
  See §7.
- No inline hex in markup — always a token utility. If a color is missing, add it to
  `@theme` in `app.css` first, then use it.
- Keep class lists readable; extract repeated blocks (cards, tiles) into a documented
  pattern rather than copy-paste drift.

---

## 7. Mobile (360px frames)

Source frame: **customer › body `1968:71493`** (and the components it instances).
Implemented on `customer/main.html`; use it as the reference for other screens.

**Rule: one DOM, `max-md:` overrides.** Add mobile classes next to the desktop
ones rather than forking markup. Only two blocks are duplicated with
`md:hidden` / `max-md:hidden` — the **site header** and the **footer** — because
their mobile structure shares almost nothing with desktop.

### What changes below `md`

| Area | Desktop → Mobile |
| --- | --- |
| Canvas | `w-[1440px]` → `w-full` (`mx-auto w-full md:w-[1440px]`) |
| Header | utility bar + nav + search → subtle strip (Москва / Стать дилером), then burger · centred logo · profile |
| Hero | 640px, media + arrows → 508px, **no media** (Figma parks the video box at left 436, outside the frame), centred type at the top, dots at `bottom-2` |
| Category tiles | two 387px rows → one 2-col grid, `contents` on the rows + `order-*` to reach the mobile sequence; "весь каталог" tile drops out |
| Carousels | transform + arrows → native scroll (`.scroll-rail`) + `.scroll-progress` bar + full-width action button |
| Product card | 438px → **320px** (swatch cards) or **152px** (category cards, two rows deep via `.rail-2row`, cart action becomes a "в корзину" pill) |
| Наши салоны | dealer panel + peach backdrop → title block + 320px map with a centred "Где купить" button |
| Bottom nav | — → fixed `nav-bar` (Figma 1739:218804), 72px, `shadow-navbar`; the page reserves `max-md:pb-[72px]` |
| Burger menu | — → full-screen drill-down panel (see below) |

### Burger menu

[`src/components/mobile-menu.js`](src/components/mobile-menu.js), from the Figma
section **`menu catalog / menu burger` 1997:254993** — four frames describing one
panel: `burger-menu` 1997:254994 (root "Меню"), `burger-menu-step-2` 1997:255072
and `catalog-menu` 1997:255145 ("Каталог"), `catalog-menu-step-2` 1997:255219
(one category → "По коллекциям").

- **`max-md:` only.** The root is `fixed inset-0 z-50 md:hidden`, so above `md`
  it never renders and the desktop mega-menu (`data-catalog-toggle`) is
  untouched. `z-50` is what lets it cover the `z-40` nav-bar — the panel is
  full-bleed, so the scrim behind it is only a fallback.
- **Structure.** 48px header (`chevron-left.svg` back · `text-m-h2` title ·
  `icon-close-s.svg`), 44px search pill, a `.mobile-menu-item` list, and — root
  view only — the social row pinned to the bottom by `justify-between`.
- **Drill-down as a stack.** `stack` holds the views and `render()` paints the
  top one; the back button is `hidden` at depth 1, which is what makes the
  bottom-nav "Каталог" entry (`data-mobile-catalog`, opens straight at the
  catalog view) match Figma's back-arrow-less `catalog-menu` frame for free.
- **One catalog tree.** `categories` is exported from `catalog-menu.js` and
  reused here, so the drill-down and the desktop mega-menu can never diverge.
  The mobile mock lists a slightly different catalog (no "Мебельная фурнитура",
  a longer collection list) — the shared tree wins on purpose; do **not** fork a
  mobile copy. Fixing the data fixes both surfaces.
- **A11y.** Focus trap on Tab, Esc + scrim close, `overflow-hidden` on `<html>`
  while open, `aria-expanded` on both triggers, focus restored to the trigger on
  close and pulled back into the panel after each drill-down re-render.
  Focus *rings* inside the panel are deliberately transparent
  (`[data-mm-panel] :focus` in `app.css`) — the outline still exists, only the
  paint is gone, so focus order and the trap are unaffected.
- Crossing the breakpoint with the panel open closes it — otherwise the document
  scroll lock would survive on desktop.

### Sliders

- **Card gallery** (`[data-card-track]`) slides by translating the track — not a
  cross-fade. Dots jump straight to an index.
- **One element per gesture.** A drag moves the gallery by exactly one image,
  however far it travels; the gesture is then spent (`handedOff`) until the
  pointer lifts. Without this a single long pull flies through the whole gallery.
- **End-of-gallery hand-off.** When a gesture has no inner image left in that
  direction, it advances the *surrounding* carousel instead
  (`advanceOuterCarousel`): scrolls the rail on mobile, clicks the arrow on
  desktop.
- **Drag the whole card, not just the picture.** Mobile rails scroll natively
  under a finger, but a mouse drag does nothing — so `enableDragScroll` gives
  pointer devices grab-and-pull anywhere on the rail (card text, chips, promo
  captions). It skips `pointerType === "touch"` (native scrolling already
  works), skips `[data-card-gallery]` (that runs its own slider), takes pointer
  capture so a flick past the rail edge keeps going, and swallows the click that
  ends a drag so the card doesn't navigate. Bails out above `md`, where the
  arrows own the track.
- **Snap must stand down during a drag.** `scroll-snap` re-snaps after every
  assignment to `scrollLeft`, so a short pull never escapes the point it started
  from. `enableDragScroll` sets `scroll-snap-type: none` on pointerdown and
  restores it on release — which is also what produces the settle.
- **Gentle settle.** Mobile rails use `snap-x snap-proximity` + `scroll-pl-4`,
  never `snap-mandatory` — the rail should ease onto a card, not fight the
  finger.
- **Kill the native image drag.** Every slider here is drag-driven, and the
  browser's "drag the image out of the page" gesture hijacks it — the picture
  peels off instead of the slide moving. `img, video { -webkit-user-drag: none }`
  in `@layer base` covers Chrome/Safari; Firefox also needs `draggable="false"`
  on media inside a slider.
- **Promo parking.** Desktop centres the promo row so both edge tiles clip.
  A rail can't centre, so `initPromoOffset` parks it one tile in — the leftmost
  tile starts out of view (matching the 360px frame's 16 / 348 / 680 tiles) and
  is still reachable by scrolling back.
- **Equal heights.** The card description is a *fixed* two-line box (`h-12`
  desktop, `h-10` mobile), not `max-h-*` — otherwise a one-line title lifts the
  footer and the row stops aligning (Figma 2237:99636).

### Gotchas

- **Layers.** A hand-written `.class` in `@layer components` **loses** to a Tailwind
  utility on the same element (`utilities` sorts after `components`). `.rail-2row`
  has to beat `flex`, so it lives in `@layer utilities`.
- **Backticks in JS templates.** Don't write `` `md` `` inside an HTML comment in a
  template literal — it terminates the string. Put the note in a `//` comment above.
- **Per-breakpoint media crops.** Category tile videos carry both boxes as custom
  properties (`--l/--t/--w/--h` desktop, `--ml/--mt/--mw/--mh` mobile); `.cat-media`
  picks one.
- Fixed heights taken from Figma are a trap where text reflows — the alert bar is
  `min-h-12`, not `h-12`, because Onest wraps it to three lines at 360px.
- **`translate` composes ahead of `scale`.** The `.scroll-progress` thumb is a
  full-width bar squashed by `scale`, so its offset is expressed in the track's
  *unscaled* width: `pos * (1 - frac)`, not `pos * (1/frac - 1)`. Getting this
  backwards parks the thumb at the far end.
