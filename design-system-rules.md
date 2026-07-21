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

Figma variables `gap/8`, `gap/16` → Tailwind default scale `gap-2`, `gap-4` (4px base).
Layout dims (widths, paddings) are literal in Figma — read them from
`get_design_context` and use arbitrary values where no scale step matches
(e.g. `w-[1440px]`, content max width `max-w-[1360px]` with `px-10`).

---

## 4. Components (built on tokens, no framework)

Interactive elements from the Figma UI SYSTEM (button, chips, tabs, badge, toggle,
card, alert, modal, …) are composed directly from the token utilities — there is no
component library to lean on. Two patterns are already extracted:

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
- Mobile variants exist at **360px** — build responsive later, desktop-first for now.
- No inline hex in markup — always a token utility. If a color is missing, add it to
  `@theme` in `app.css` first, then use it.
- Keep class lists readable; extract repeated blocks (cards, tiles) into a documented
  pattern rather than copy-paste drift.
