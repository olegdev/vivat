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
- **A theme token whose name collides with a built-in *side* utility loses
  silently.** `--radius-l` reads as `rounded-l`, which is also Tailwind's
  left-side radius: both rules are emitted and the built-in wins on the left, so
  every `rounded-l` box was 8px on the right and 4px on the left. It looks like a
  rendering quirk, not a class bug. Write such tokens explicitly —
  `rounded-[var(--radius-l)]` — for any token named after a side (`l r t b s e`).
  Ref: the socials block, the sort dropdown, the stores card, `.store-pin__popup`.
- **`group-data-[…]` outranks `max-md:` — a media query does not "win" over a
  class.** `max-md:hidden group-data-[user=dealer]:inline-flex` reads like
  "dealer only, and only above `md`", and it is not: the group variant compiles
  to `.group[data-user="dealer"] &` (two classes, 0-2-0) while `max-md:hidden`
  is one class inside `@media` (0-1-0), so the element shows below `md` too.
  Nothing errors; the block simply appears where the frame doesn't draw it.
  **Scope the branch, don't try to cancel it:** write
  `md:group-data-[user=dealer]:inline-flex` when the dealer branch is
  desktop-only, `max-md:group-data-[user=dealer]:hidden` when it is
  mobile-only. Same for any two-condition rule — a `data-*` state plus a
  breakpoint always needs both conditions on the *same* declaration.
  Ref: «Редактировать модули» and «Очистить корзину» on the dealer order page.

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

## Mobile chrome: every page carries the bottom nav

- **Every customer page includes the bottom nav below `md`** — it's the primary
  mobile navigation (Каталог / Контакты / Акции / Корзина / Кабинет), pinned to
  the viewport, not a per-page decision. Splice `partials/bottom-nav.html` right
  before the footer, and reserve its height on the page container with
  `max-md:pb-[72px]` so the last section isn't hidden behind it. Its "Каталог"
  item opens the burger menu, wired via `data-mobile-catalog` (pass it as
  `catalogToggle` to `initMobileMenu`). Ref: `main.html`, `catalog.html`.

- **Never take pointer capture on `pointerdown` — take it on the first real
  move.** With capture live, the browser dispatches the following `click` on the
  *capturing* element, so nothing inside the rail ever sees its own click: the
  tab chips were dead for every mouse user below `md` (a real finger was fine —
  the handler skips `pointerType === "touch"`), and it looked like a filter bug,
  not a gesture bug. Capture is only needed once a drag is actually under way, to
  keep a flick alive past the edge of the element, so move it into the branch
  where the pointer has passed the threshold. Ref: `enableDragScroll()`,
  `carousel.js`.

## One component, two mobile shapes

- **When the design gives a component a second mobile layout, add a second
  `<template>` — don't rewrite classes from JS.** The compact product card is a
  152px tile in the home/catalog two-row rail and a 320px tile in the Акции
  single-row rail (Figma `cards-other` device=mobile size=s / size=l): same
  desktop card, different `max-md:` sizes and a cart icon instead of the
  full-width pill. Each shape is its own template in the owning partial, picked
  by one option (`mobileCard: "l"` → `renderCarousel(el, items, { mobile })`).
  Class surgery in JS would have hidden the difference from the markup and from
  the Blade port, and moving the 152px specifics into a `.rail-2row` CSS scope
  would have contradicted "mobile lives at the call site".
- The same option gates the layout that goes with the shape: `.rail-2row` is
  applied only for the 152px tile, because the 320px one is a plain flex rail.
- **The same holds on the desktop axis.** The PDP rails use `cards-other
  size=s` (322px, 242px image) where the home page uses `size=m` (438px, 327px
  image), and `cards-modul` adds a labelled size line no other card has. Those
  are separate `<template>`s picked by one `variant` option — not the 438px card
  with its width overridden, which would have left the image box wrong.
- **Fill the hooks the chosen template has, don't branch on the variant.**
  `buildCard()` asks `node.querySelector("[data-card-…]")` and fills what it
  finds, so a new template can gain or drop a field without a new `if`. The
  earlier `if (compact) … else …` had to be rewritten for every new shape.

## When mobile re-orders a block: `order-*` over a second copy

The PDP summary panel reads title → colours → size → geometry → price on
desktop and title → size → geometry → colours → price on mobile. Two copies of
the panel behind `md:hidden` / `max-md:hidden` would have been two things to
keep in step, and two Blade partials at the port. Instead the DOM is authored in
**desktop** order and `max-md:order-*` re-sequences it.

Two things make that work:

- **The wrapper has to get out of the way.** The blocks sat in an inner padded
  `div`, so their `order` only sorted them against each other — never against
  the price block, which is the panel's other child. `max-md:contents` drops the
  wrapper's box below `md` so all five become siblings in one flex context; its
  padding moves onto each block, since a `contents` element has none.
- **Author the DOM in the breakpoint that has NO order classes.** Written the
  other way round (mobile order in the DOM, `md:order-*` for desktop) it works
  too — but the first version here was authored in mobile order *and* only
  carried `max-md:order-*`, so desktop silently rendered the mobile sequence.
  The default order is whatever the DOM says; make that the face you didn't
  write classes for.

**The same `max-md:contents` also splits a desktop group across mobile rows.**
The dealer catalog's settings bar pins «Только модули» + сортировка to the right
as one 32-gap group on 1440, while on 360 the switch stays on the funnel's row
and the sort takes a full row of its own. Grouping them in a wrapper and giving
it `max-md:contents` makes both true at once: on desktop it is a real flex box
that `justify-between` can push right; below `md` its box disappears and the two
children become direct items of the bar, so `flex-wrap` + a full-width sort
breaks the line exactly where the frame does. No `order-*`, no second copy, and
the DOM still reads in design order. Ref: `partials/catalog-settings.html`.

## Touch gestures

- **Swipe needs `touch-action` set** (`touch-pan-y` for a horizontal swipe) or
  the browser claims the gesture and fires `pointercancel`.
- **Commit on `pointermove` past a threshold, not on `pointerup`** — a
  release-only handler never runs when touch cancels mid-gesture. Ref: hero swipe,
  `hero-slider.js`.

## Two inputs, one slider: hover zones next to the swipe

The product card's gallery is scrubbed with a mouse (N invisible strips over the
photo, one per frame — the Ozon/WB convention) and swiped with a finger.
`product-card.js` runs both; four things make them coexist.

- **Gate on the input device, not the viewport.** `(hover: hover) and (pointer:
  fine)` — a touch laptop is wide and still has no hover, and a hybrid switches
  mid-session, so the check is `e.pointerType === "mouse" && FINE_POINTER.matches`
  at event time rather than a branch taken once at init. The zones' own
  `pointer-events` are gated by the same query in CSS (`.card-zones`), so on
  touch they are inert and the swipe keeps the image.
- **Scrub on `pointermove`, never on the zones' `enter`.** The outer carousel
  slides cards sideways under a still cursor: with `pointerenter` alone, every
  card that passes beneath the pointer flips its image, un-asked. Requiring real
  pointer movement makes that impossible — the zones stay as hit targets
  (`e.target.closest("[data-card-zone]")`), which beats `offsetX` math that has
  to re-read the box on every move.
- **A scrub can't be animated.** The 300ms track transition lags a zone or two
  behind the cursor; `show()` takes an `instant` flag that zeroes
  `transitionDuration` for hover and leaves it for dots and swipes.
- **Reset to frame 0 on leave, and listen on the media box, not the gallery.**
  The dots and badges overlay the gallery without being *inside* it, so hovering
  a dot fires `pointerleave` on the gallery — the parent is the real boundary.

**A gallery needs a gallery's worth of photos.** The fixtures carry one photo per
product, and the first version padded that to three by repeating it — dots and
scrub both moved, and nothing on screen changed, which reads as "broken", not as
"one photo". `data/product-photos.js` pads out of the asset set instead, staying
inside the product's category (a kitchen card never shows a worktop) and starting
each card at its own photo so neighbours don't march in step. Placeholder media
still has to *demonstrate* the behaviour it stands in for.

The gallery's parts are filled in one place, `fillGallery()` — the catalog grid
keeps its own card unit (the filter attributes ride on it) but calls the same
function. Its three dots used to be static decoration under a single `<img>`;
the design draws dots because there is a gallery behind them.

Two side effects worth keeping: frames 2..n are `loading="lazy"` and promoted to
`eager` by the first pointer that reaches the card (both inputs are one event
away from the frame they reveal), and the mouse drag on the gallery is gone —
scrub and drag would fight, and a drag would land on whatever zone it was
released over.

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
- **The bar has a second face once anything is selected** (Figma
  `Catalog-selected-parameters`): the chip row stops being the shortcut list and
  becomes the *selected parameters* — only the active chips (grey fill + ×,
  click to release) plus "Очистить все"; each named pill with a selection takes
  the `condition=active` border and a muted count; the funnel flips to the dark
  `icon-button` with a white badge. All of it is derived in `syncChips()` /
  `syncPills()` from the same state object — no extra flags.

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
- **A frame named after a *state* is a second face of a block you already
  built** — open it before calling the block done. `Catalog-selected-parameters`
  defines what the settings bar looks like with filters applied; without it we
  had invented a dark "selected" chip, when the component set already carries
  `condition=active` (fill `#eeeeee`, text stays `#808080`, × icon swapped in
  for the `···`). Read the variant set, don't design the state yourself.

## A "sticky bar" can be two different components at two breakpoints

The PDP has a bottom bar at both widths, and the reflex is to build one and
restyle it. They are not the same control:

| | desktop `sticky-price` | mobile `modal-button-container` |
|---|---|---|
| trigger | revealed once the summary's order button scrolls past | **always visible** |
| contents | two links + title + price + dark button | one link + red CTA carrying the price |
| position | bottom of the viewport | stacked on top of the 72px bottom nav |

The reason mobile's is permanent is structural: **the mobile summary has no
order button at all** — the design moved it into the bar, so the bar is the only
way to order. Reveal-on-scroll would hide the page's primary action.

Two consequences worth copying: the page reserves `72 + 60` at the bottom, not
72; and the price text is filled across *both* bars
(`querySelectorAll("[data-sticky-price-value]")`) while only the desktop one
gets the IntersectionObserver. The observer's anchor is `max-md:hidden`, so it
never fires below `md` — which is correct, not a bug to work around.

## A mobile table that wraps drops its dotted leader

The комплектация rows are `name · dotted leader · value · qty`. At 360 the
module names need two lines, so the mobile frame gives the name a fixed 170px
column that wraps — **and removes the leader**, because there is no longer a gap
to lead across. Carrying the desktop row over with just smaller type pushed the
value and quantity off-screen; carrying it over with a wrapping name *and* a
leader would have drawn dots next to a two-line label, which the design never
does. Check whether a leader still has a job before keeping it.

(The spec table next door keeps its leader on mobile — its labels fit one line.
Same component, different answer, because the content differs.)

## Anchor navigation: wire it after whatever emits its targets

The PDP's bar over the photos (Фото / Характеристики / Модули / Отзывы / Где
купить) resolves each link to `document.querySelector(a.getAttribute("href"))`
once, at init. Two of those sections — `#modules`, `#reviews` — are emitted by
`mountCarousel()` further down the page script, so calling `initSectionNav()`
with the rest of the page's chrome silently dropped them: the bar worked, and
the highlight simply stopped moving past Характеристики. Nothing threw.

**The rule: anything that resolves selectors at init runs after the code that
creates those elements.** If that ordering is easy to get wrong again, say so at
the call site — `initSectionNav()` sits at the bottom of `pdp.js` with a comment
explaining why, not next to the other `init*` calls.

The related habit: **derive the active state from scroll position, not from the
click.** The highlight then follows a plain wheel scroll too, and a click needs
no special case.

## Figma padding is not always symmetric — check the child, not `padH`

`fig.mjs tree` prints one `padH` per frame, which reads as "40px on both sides".
The PDP's spec table sits in `container 941x312 [padH=40]` whose only child is
`table-container 901x312 @40,0` — 40 + 901 = 941, so there is **no right
padding**, and the table runs to the same right edge as the 900px photo column
above it. Building it as `px-10` made the block 40px narrower than the photos,
which looks like a sloppy margin rather than a bug.

**Check `child.x + child.width` against `parent.width` before trusting `padH`.**
Here it meant `pl-10` with no `pr`.

## A hairline needs a dot big enough to paint

Figma's `line-dotted` (766:14631) is a 1px stroke with `dashPattern [0.5, 3]` —
a mark every 3.5px, finer than `border-dotted`'s ~3px pitch. Reproducing it as a
`radial-gradient(circle, … 0.25px, transparent 0.3px)` on a 1px-tall element
produced a 0.5px dot that antialiased to nothing: the leader lines were simply
absent, with no error and no visible cause. `linear-gradient(to right, … 1px,
transparent 1px)` at `background-size: 3.5px 1px` gives the same pitch and a
mark the rasteriser can actually draw. **Sub-pixel gradient stops are a silent
no-op; keep the painted part ≥ 1px.**

## A tab bar can be part panels, part anchors — read which labels have frames

The PDP's Характеристики bar draws six labels but Figma only carries panels for
three of them, and two of the remaining labels name sections that already exist
further down the page. Building all six as panels would have invented three
screens; building only three would have dropped labels the design draws.

**Before wiring a tab set, check each label for a frame of its own.** Labels
with one are panels; labels that match an existing section are anchors; a label
with neither is a question for the client, not a decision to make quietly (this
one produced a `Состав` panel in Описание's row shape, marked TODO in the
markup). And when two frames disagree — `PDP-package`'s *name* says "состав"
while its *render* underlines "Модули" — **the render is what the client
approved**; ask, then follow it.

## Badges are layout, not overlay (negative `stackSpacing`)

The catalog funnel's count badge was built as `absolute -right-1 -top-1` — the
reflex any "badge on a button" triggers in CSS. It was wrong on every axis, and
the reason is one Figma fact nobody looked up: **`icon-button` (881:51240) is a
horizontal auto-layout row `[circle 44][badge 20]` with `stackSpacing: -12`**.
The badge is a *sibling that occupies width*, not an overlay:

- it sits at x=32, y=**0** — flush with the circle's top, overhanging 8px right;
  the guessed offsets floated it 4px above and only 4px out;
- the whole control is therefore **52 wide, not 44** — with the badge shown the
  pills after it shift right by 8. An absolutely-positioned badge reserves
  nothing, so the badge collided with the next pill;
- the variant is `badge-number design=outline` (881:24493) — white fill **plus a
  1px `#414141` border**, which the eyeballed version dropped entirely.

**The rule: a negative `stackSpacing` on a Figma frame means the overlap is
layout.** Check `stackMode` / `stackSpacing` on the parent (`fig.mjs raw <id>
stackMode,stackSpacing` — the `tree` output prints it as `gap=-12`) before
reaching for `absolute`. Reproduce it as a flex row with a negative margin
(`-ml-3`) and `self-start`, so the overhang still takes up width and hiding the
badge collapses the control back to its bare size — which is exactly the
default/selected width delta the mock shows.

**But `absolute` isn't always wrong — the same badge is placed two ways, and
both are in the file.** On `nav-item` (1739:218769, the bottom-nav cart) the
32px icon box is fixed and the badge *is* an absolutely-positioned child at
(20, 0), precisely so the icon doesn't shift. So the rule isn't "never absolute",
it's **read the parent's layout instead of guessing which one it is**.

The tell that nobody had: the same 20px badge appeared three times with three
hand-picked offsets (`-right-0.5 -top-0.5` header, `-right-2 top-0` bottom-nav,
`-right-1 -top-1` catalog). Re-derived, one of the three happened to be right —
which is what guessing gets you. Two were not: the catalog funnel as above, and
the header cart, which was also the wrong *variant* — `design=dark` (#292929 on
white text), not red; red belongs to the bottom-nav instance only.

All three now share `.badge-number` (+ `--dark` / `--red` / `--outline`, the
Figma `design` prop), which carries shape and colour only. **Placement stays at
the call site** because it genuinely differs per host. Hiding is a plain
`hidden`: the utilities layer beats the components layer, so the control
collapses back to its bare width — the 52 → 44 delta the mock encodes.

Same lesson, smaller: don't hand-draw an icon that exists in the file. The
funnel glyph was redrawn from memory as two strokes + circles and came out
mirrored (knobs on the wrong rows) at the wrong weight. `download_assets` with
`defaultFormat: "svg"` returns the real path data; inline it with
`fill="currentColor"` so it inverts with its host instead of shipping two files.

## The .fig export shows component defaults where the live file shows overrides

The order page's confirmation button reads **"56 моделей"** in `fig.mjs` and
**"Продолжить покупки"** in the live render. The same thing happened to the
mobile cart header's "Удалить" and to the sheet CTA's left link: present in the
tree, absent on screen.

`canvas.fig` gives you the node graph; a text override can live on a node the
dump doesn't attribute it to, so what you read is the component's *default*.
That default is often obvious filler ("56 моделей" on a button that has nothing
to do with models) — **treat obvious filler as a signal to screenshot the frame,
not as a gap in the design**. Reporting it as "the design doesn't say" cost a
round-trip here: a decision was asked for and made on a question the design had
already answered.

Same family as the stale-colour rule in CLAUDE.md, one step further: the
snapshot lags the live file on **colour and on copy and on visibility**. Numbers
(sizes, gaps, positions) have been reliable; anything a designer types or toggles
has not. `get_screenshot` is cheap — use it before asking a question.

**But try `raw` first — the overrides are usually right there.** `tree` renders
the master's children, so it prints the default; the instance's own text sits in
`symbolData.symbolOverrides[].textData.characters`, which `fig.mjs raw <id>`
dumps in full. Reading the dealer home page's section titles this way gave
"Наши салоны", "Модульные кухни. Хиты продаж", "Акции и скидки" — where `tree`
showed the same filler master text on every one of them. Offline, exact, no MCP
round-trip. A one-off loop over the page's title-blocks recovers the whole
page's copy in a single pass:

```js
const j = JSON.parse(execFileSync('node', ['scripts/fig.mjs', 'raw', id]));
for (const o of j.symbolData?.symbolOverrides ?? [])
  if (o.textData?.characters) console.log(o.textData.characters);
```

Fall back to a screenshot when `raw` comes back empty — that means the node
genuinely postdates the snapshot (as the four b2b modal panels do), which is a
different problem from reading the wrong layer.

## An INSTANCE is not its master — read `derivedSymbolData`, not `tree`

**This one trap produced every wrong pixel in the dealer header and footer.**
`fig.mjs tree` cannot show an instance's own content: an INSTANCE has no
children, so `walk()` hops to the master component and prints *the master's*
sizes, copy and visibility. All three are routinely contradicted by the
instance, and nothing in the output says so.

What it cost, all in one page:

| read from `tree` | what the instance actually renders |
|---|---|
| `left-icon` / `right-icon` `visible:false` | absent — correct by luck |
| two news buttons `visible:false` | **both on screen**, 161×44 and 264×44 |
| strip 1193 wide (master) | **1013** |
| right-hand label "56 моделей" | **«Выход»** — the derived text box is 43×18 |
| footer button label "56 моделей" + a 14×12 glyph | **«Личный кабинет»** + a trailing 24px arrow |

Figma stores the computed instance in **`derivedSymbolData`**: one entry per node
whose layout the instance recomputed, each with its real size. Text lives in
`symbolData.symbolOverrides`. `fig.mjs inst <id>` joins the two:

```
$ node scripts/fig.mjs inst 882:109468
  752:64207            161x44  buttons
  752:64207.585:22316   97x24  text  "Все новости"
  882:113046           264x44  buttons
  882:113046.585:22325 200x24  text  "подписаться на рассылку"
```

**Rule: the moment a node is an `<INSTANCE>`, switch to `inst`.** `tree` now
prints a warning when you point it at one, and its `⃠hidden-in-master` marker is
named to stop anyone concluding absence from it. Use `tree` for the frame
structure of a page; use `inst` for anything a component renders.

**Read the asymmetry correctly.** Presence in `derivedSymbolData` proves a node
renders — that is what exposed the two "hidden" news buttons. Absence proves
nothing on its own: it usually just means the instance did not resize the node.
To decide a doubtful case, compare the *container's* derived height with the
master's. The news title-block's `text-container` comes out 783×44 against the
master's 783×74 — the missing 30px is a description this variant drops, and no
flag anywhere says so.

Show/hide is often a **component property**, not a visibility flag. The dealer
rows set `цена-"от"` (632:3, BOOL, default true) to false on every card, which is
the entire difference between the customer's «от 450 010₽» and the dealer's
«450 010₽». Property names live in `componentPropDefs` on the component set;
assignments live in the instance's `symbolOverrides` as
`componentPropAssignments`. Neither shows up in `tree`.

A derived size is also the honest way to identify unreadable copy: a 43×18 text
box is five characters, not "56 моделей". Measure before you guess — and if it
is still ambiguous, ask, do not fill it in.

**Then diff it mechanically: `npm run audit <page> <selector> <instance-id>`.**
It walks the instance the way described above and prints its text against the
page's, in order. Missing element, extra element and wrong order all surface as
a row mismatch. Every copy defect reported on the dealer page would have been
caught by it, and none of them were caught by looking.

## Pairing a section's desktop and mobile frames: sort by X, ignore the names

The `dealer` and `B2b additional` sections are ~50 frames and almost every
360-wide one is named `catalog` or `menu` — the same two names, a dozen times
each. The names carry no information; the **layout does**. The designer places
each mobile frame immediately to the right of its 1440 parent, so sorting a
section's direct children by `x` restores the pairs exactly, and a gap in the
sequence is a genuinely missing mobile frame rather than a naming accident.

That is how the dealer home page was shown to have no 360 counterpart while the
catalog and order pages have several — a claim worth making precisely, because
"the design doesn't cover mobile here" is a question for the designer and
guessing wrong either invents a screen or stalls the build.

```bash
node scripts/fig.mjs tree <section-id> 2   # then sort the depth-1 rows by @x
```

Identify an unnamed frame by its child list, not its name: `header |
order-container` is the order page, `site-header | breadcrumbs | main container`
is a content page. And when a desktop frame is unreadable (the four b2b modals
are just page + scrim in the export), its mobile twin often still carries the
copy — that is what named them.

The finished pass lives in `docs/FIGMA-MAP.md`; redo it there rather than
re-deriving it per session.

## «В макете этого нет» — сначала перечисли варианты компонента

Выпадающий список прайс-листов дилера полгода числился выдуманным: в раскладке
инстанса действительно только триггер 132×24, и по нему был сделан вывод, что
списка в дизайне нет. Список был. У `dropdown-header` четыре варианта, и
открытое состояние — отдельный из них:

```bash
node scripts/fig.mjs node 607:26640
#   607:26640  device=desktop, condition=pressed
#   606:25482  device=desktop, condition=default     ← его и нашли
#   1299:49518 device=desktop, condition=open        ← а список здесь
#   1739:219531 device=mobile, condition=default
```

`node` на любом варианте печатает **весь набор**: `siblings` набора вариантов —
это и есть список состояний компонента. Состояние, которого «нет на экране»,
почти всегда лежит вариантом рядом, а не отсутствует.

Отсюда правило: прежде чем записать что-то в «дизайн не покрывает», сделать
`node` по мастеру и прочитать имена вариантов. Стоимость — одна команда;
альтернатива — выдуманный компонент или пустой слот там, где всё нарисовано.

Тот же приём отвечает и на вопрос «а какие в списке пункты»: строки мастера
подписаны одинаково («Оптовая цена» трижды), реальные подписи живут в
инстансах — `inst` по каждой строке, см. «An INSTANCE is not its master».

## Клиентский пересчёт цепляется к событию рендера, а не к порядку вызовов

Дилерский прайс-лист пересчитывает цены во всех карточках. Первая версия делала
это один раз при инициализации шапки — и не работала дважды:

- карточки рисуются **позже** шапки (`mountCarousel` идёт ниже по `main.js`),
  так что пересчитывать было нечего;
- вкладки «Популярных товаров» перерисовывают трек, и свежие карточки приходили
  с исходными ценами.

Лечится не перестановкой вызовов — она чинит только первый случай. `renderCarousel`
шлёт `cards:rendered`, а прайс-лист на него подписан:

```js
document.addEventListener("cards:rendered", (e) => {
  if (applied) reprice(applied, e.detail?.root ?? document);
});
```

Общее правило для этого прототипа: любая доработка уже отрисованной разметки
(цены, бейджи, состояния) подписывается на событие «разметка обновилась», а не
угадывает, кто отработал раньше. В Blade всё это исчезнет — сервер отдаст цены
сразу в нужном режиме, — но до тех пор порядок вызовов не контракт.

**И ищет он данные, а не компонент.** Селектор пересчёта сначала был
`[data-card-price]` — «цены живут в карточках». На дилерском PDP по прайс-листу
пошла ещё и цена самого товара: в сводке и в нижней панели, а это не карточки.
Селектором стало `[data-price-base]` — то самое поле, от которого пересчёт и
считает. Карточки под него подпадают (атрибут им ставит `product-card.js`),
поведение не изменилось, а каждый новый носитель цены подключается одной
строчкой `setPrice()` вместо правки селектора. Шов, который перечисляет своих
клиентов по имени компонента, придётся править на каждой следующей странице.

## Клик «мимо панели» ловится на перехвате, а не на всплытии

Закрытие выпадашки по клику вне неё обычно пишут так:

```js
document.addEventListener("click", (e) => {
  if (!e.target.closest("[data-panel]")) close();       // ← закроется на своём же клике
});
```

Если обработчик внутри панели **перерисовывает** её содержимое (выбор строки
пересобирает список), то к моменту, когда событие доходит до `document`,
нажатый узел уже вынут из DOM. `closest()` у оторванного узла возвращает `null`
— и панель закрывается на собственном клике. Симптом ровно такой: пункт
выбирается, но панель исчезает и «Применить» нажать нечем.

Проверять принадлежность надо до того, как её успели порвать — на фазе
перехвата:

```js
document.addEventListener("click", (e) => { … }, true);
```

## У флага один владелец — иначе его вернёт обработчик со старым снимком

Тумблер «Показать цену» и список прайс-листов пишут в одно состояние. Первая
версия хранила его дважды: модуль держал последнее применённое в `applied`, а
`initPriceMode` — свой `state`, снятый на загрузке. Тумблер обновлял первое,
выбор режима применял второе.

Ошибка проявлялась не сразу, а только в такой последовательности: страница
загружена с выключённым тумблером (состояние из `localStorage`) → тумблер
включили → выбрали режим. Выбор применялся вместе с `enabled: false` из
снимка, сделанного до нажатия: тумблер визуально включён, а подпись серая и
цены оптовые. При чистом `localStorage` та же самая последовательность
проходила без единого расхождения — оба значения были `true`, и разойтись им
было негде.

Лечится не синхронизацией двух копий, а тем, что у поля остаётся один
владелец. Локальный `state` носит только режим и наценку, а `enabled` при
каждом применении берётся у того, кто им управляет:

```js
const commit = () => applyPriceMode({ ...state, enabled: (applied ?? state).enabled !== false });
```

Симптом, по которому это узнаётся в следующий раз: «работает, пока не
перезагрузишь страницу в нетронутом состоянии». Значит, где-то живёт снимок,
сделанный раньше действия пользователя, и тестировать надо не с чистого листа,
а с сохранённого.

## Вторая страница пары — это и есть повод вынести первую в партиалы

Дилерский каталог отличается от покупательского обвязкой, ценами и одним
тумблером. Всё остальное — панель фильтров, шаблон карточки, сетка, пагинация,
423 строки механики — совпадает. Копия страницы обошлась бы в полдня и разошлась
бы на первой же правке фильтров, а PHP-разработчик получил бы два почти
одинаковых шаблона вместо одного `@include`.

Порядок, который сработал и который стоит повторить на дилерских PDP и заказе:

1. **Снять эталон до правки** — `npm run shot` первой страницы на обеих
   ширинах, PNG в сторону.
2. **Вынести тело в партиалы, ничего в нём не меняя.** Разрез идёт по будущим
   Blade-партиалам, а не «по удобству»: панель настроек в Figma и есть один
   компонент с вариантом `type=dealer`, поэтому дилерская добавка живёт в нём
   одном под `group-data-[user=dealer]`.
3. **Механику — в `components/`,** страничный скрипт оставить проводкой.
4. **Доказать, что первая страница не поехала:** тот же шот и попиксельное
   сравнение с эталоном, а не чтение диффа.
5. Только после этого собирать вторую страницу и добавлять её отличия.

Ловушка на шаге 4: полностраничный шот **флапает** на ленивых картинках — один
прогон из трёх разошёлся на одной карточке карусели, полоса та же, состав
случайный. Отличие в одну карточку с целыми боксами вокруг — это гонка загрузки,
а не регрессия; отличие в геометрии повторяется прогон за прогоном. Прогонять
шот трижды и смотреть, повторяется ли полоса.

## Имя текстового стиля несёт то, чего в Figma нет

У Figma одно подчёркивание: `textDecoration: UNDERLINE`. Пунктирного нет. Свою
пунктирную ссылку дизайн-система держит **в имени стиля** — `Desktop/Link M
dotted` (629:25681) и вся семья рядом с ним (S/XS/L плюс мобильные близнецы).
В узле не остаётся ничего, кроме `styleIdForText`, и `tree` не показывает даже
его: он печатает цвет и размер, а стиль молчит.

Так были потеряны три подчёркивания сразу — «не выбран» в сводке, «персональной
информации» в согласии и «Редактировать модули» на карточке: все три сверстаны
сплошной линией, потому что и рендер, и `tree` говорили просто «подчёркнуто».

**Увидел подчёркивание — вытащи `styleIdForText` и прочитай `name` стиля**, а не
только его `textDecoration`:

```bash
node scripts/fig.mjs raw <text-node> | python3 -c "…print(d['styleIdForText'])"
node scripts/fig.mjs raw <style-id>  | python3 -c "…print(d['name'])"
```

Для куска строки стиль лежит в `textData.styleOverrideTable` инстанса, а не на
узле: `characterStyleIDs` размечает символы, а таблица говорит, чем именно.
Проверить можно и по пикселям: сплошная линия даёт сплошной прогон, пунктир —
чередование через пиксель (`.scan.mjs` по строке под текстом).

Утилита одна на проект — `link-dotted` в `app.css`.

## Оси варианта не перемножаются — половины набора может просто не быть

`quantity-stepper` переключает левую кнопку по оси `count`: единица — мусорка,
два и больше — минус. Казалось бы, дальше дело за данными. Но у компонента две
оси, `size` и `count`, и заполнены не все клетки:

```
desktop, size=l, count=1            943:79876    мусорка
desktop, size=l, count=2-and-more   943:108036   минус
desktop, size=s, count=2-and-more   953:152593   минус
mobile,  size=l, count=1            2029:129538  мусорка
mobile,  size=l, count=2-and-more   2029:129542  минус
mobile,  size=s, count=2-and-more   2029:129546  минус
```

**`size=s` существует только в `count=2-and-more`** — ни на desktop, ни на
mobile у маленького степпера состояния «единица» нет вовсе. А карточки заказа
на 360 берут именно его (152×40, `2029:129546`), тогда как на 1440 стоит
большой `size=l, count=1` (168×48). Отсюда и правило: мусорка — состояние
крупного степпера, то есть 1440, а на 360 её взять неоткуда.

Первая догадка была другой — «дизайнер выбрал не тот вариант в инстансе», и она
уехала в комментарий к партиалу и прожила до правок от клиента. Пересчёт
инстансов её не опроверг бы: их девять и все с минусом, но девять одинаковых
инстансов — это всё ещё довод «по большинству».

**Довод даёт не перепись инстансов, а список вариантов компонента:**
`fig.mjs node <любой-вариант>` печатает весь набор соседей. Пустая клетка в
наборе — это ответ, а не улика.

Из этого следует и разметка: раз глиф зависит и от данных, и от ширины, оба
лежат в `<template>`, а выбирает CSS —

```html
<img … class="hidden size-6 md:group-data-[count=one]/step:block" data-step-down-trash />
<img … class="block  size-6 md:group-data-[count=one]/step:hidden" data-step-down-minus />
```

— скрипт пишет один `data-count`. Подменять `src` из JS нельзя: media query в
JS не живёт, и на ресайзе картинка осталась бы от прошлой ширины.

## Имя фрейма не определяет страницу — читать нужно H1

`docs/FIGMA-MAP.md` был построен обходом секции по именам фреймов, и две строки
в нём оказались неверны: фреймы `metodicheskie-posobiya` (1488:127306 и
1488:69674) на самом деле **«Каталог декоров»** в двух состояниях, а
«Методических пособий» в макете нет вовсе. Ошибка прожила до того момента, пока
заказчик не прислал ссылку на «каталог декоров», ведущую на «методические
пособия».

Имя фрейма — это то, как его когда-то назвали; заголовок — то, что видит
пользователь. Расходятся они молча.

```bash
# right-container → первый title-text-page → его инстанс
node scripts/fig.mjs tree <frame-id> 3 | grep -m1 right-container
node scripts/fig.mjs inst <h1-id> | grep -oE '"[^"]{3,}"'
```

То же и в мелочи: фрейм `city` на Контактах (1462:56195) содержит сегменты
**«Опт» / «Розница»**, а не города.

## Кегль мастера не переживает инстанс — считать по боксу

Плитка `benefit` (1058:177646) объявляет текст **20/32**, а рисуется **16/24**.
Поймать это на глаз нельзя, зато арифметика ловит сразу: бокс текста 250×72
держит ровно три строки по 24, а при 20px первая же строка требует 299px из 250
доступных.

Два независимых признака, и оба дешёвые:

- **высота бокса делится на интерлиньяж без остатка** — 72/24 = 3, а 72/32 нет;
- **ширина строки помещается**: измерить в браузере, а не прикидывать по
  средней ширине символа (прикидка «66 символов ≈ 2 строки» дважды соврала —
  реальные переносы дали три).

```js
const c = document.createElement("canvas").getContext("2d");
c.font = "400 20px Onest";
c.measureText("Экономия на аренде складских").width; // 299 → в 250 не лезет
```

Тот же приём разводит и отбивки: у персиковой врезки на Доставке Figma
объявляет `padV=8`, а фактический отступ 16 — высота секции фиксированная
(316) и содержимое (284) в ней центрируется.

**Ни `tree`, ни `inst` не печатают шрифт вообще** — ни кегль, ни начертание. У
переопределённого текста они лежат в самом оверрайде: `raw` по инстансу, поля
`fontSize` и `fontName.style` внутри `textData`. Отсюда же второй, совсем
дешёвый признак — **высота бокса это интерлиньяж**: 28 → 24/28, 22 → 16/22,
24 → 16/24 или 20/24. Ряд табов «Для интернет-магазинов» был сверстан 16/24
при боксе 28 — арифметика ловила это без единого запроса, а на глаз 16 против
24 в сером ряду не читается.

## Обводка в Figma внутренняя, `border-b` — внешняя

Разделитель у аккордеона задан `strokeWeight: 1`, и высота блока (72) его уже
включает. `border-b` в Tailwind добавляет пиксель **сверх** содержимого, так что
каждый блок стал 73, а пять блоков сдвинули колонку на 5px против макета.

Линия, которая не занимает места:

```html
<div class="py-4 shadow-[inset_0_-1px_0_var(--color-border-subtle)]">
```

Проверяется это только замером: на скриншоте пиксель не виден, а на пятом блоке
уже видно.

## Инстанс молчит о том, чего не менял

`inst` печатает только то, что инстанс пересчитал. Узел без оверрайда текста
выходит строкой без кавычек — и дважды на «Для интернет-магазинов» это было
прочитано как «тут филлер мастера, значит пусто»:

```
759:86865.759:86810   128x28  Фото      ← ничего не переопределено
1686:58167.759:86810  128x28  Фото      ← тоже
```

Обе строки — таб **«Где купить»**: подпись стоит в мастере (`raw 1686:58167` →
`characters: "Где купить"`), и инстанс её рисует, потому что менять её незачем.
Так же пропал номер «1» у первого пункта «Особенностей»: у второго оверрайд
«2» есть, у первого нет — и весь список уехал в маркированный буллит, которого
в дизайне нет вовсе (узел называется `number-container`).

**Не переопределено ≠ пусто.** Не переопределено = рисуется значение мастера, и
прочитать его можно только `raw` по узлу мастера. Раздел «An INSTANCE is not
its master» говорит это про размеры («absence proves nothing»); про копию это
верно ровно так же.

Обратный признак работает в ту же сторону: у соседнего таба стоит явный
`"visible": false`. Один из двух дизайнер убрал руками — значит оставшийся
оставлен намеренно. **Явно скрытый сосед — это подпись под тем, что рядом**, а
не шум.

## Вопрос в бэклоге не отменяет отрисовку

Тот же таб был замечен при первой сборке, признан бессмысленным на странице про
фиды — и **не отрисован**, с записью в `BACKLOG.md` «нужен ответ, убирать или
это что-то значит». Клиент прислал его вторым пунктом списка правок.

Пропуск — это тоже решение, и принимается оно молча. Нарисованное строим,
вопрос задаём рядом: запись в бэклоге, строка в ответе, отсутствие поведения у
элемента. Пустой слот виден и обсуждаем; отсутствующий элемент не виден никому,
кроме клиента, который держит макет открытым рядом со страницей. Правило
«не выдумывать» симметрично: выдуманный элемент и убранный элемент — одна и та
же ошибка.

И проверка №2 из CLAUDE.md ловит это механически, без спора о смысле:

```
$ npm run audit dealer/online-shops '[data-formats]' 1167:74240
  5 строк в макете, 4 на странице, расхождений 2      ← до правки
```

Расхождение по количеству строк — это и есть «элемент потерян». Проверка не
была запущена по этому блоку.

## Порядок внутри блока задают координаты, а не список детей

`tree` печатает детей в порядке документа, и он произвольный. На той же
странице ряд табов вышел `CSV, XML, JSON, YML`, а таблица адресов на 360 —
`right-side` первым, `left-side` вторым:

```
2209:104257  right-side 106x200 @0,0     ← «правая» колонка стоит слева
2209:104263  left-side  206x200 @122,0
```

Города на 360 идут **первыми**, ссылки вторыми: имена остались от десктопа, где
всё наоборот. Сверстано было по именам, то есть задом наперёд — и это тот
дефект, который не ловится ни `audit` (копия та же), ни беглым взглядом на
скриншот (обе колонки на месте).

Сортировать по `@x` в строке и по `@y` в колонке — правило уже записано для пар
кадров («Pairing a section's desktop and mobile frames»); внутри блока оно ровно
то же. В вёрстке разворот одной строки стоит `max-md:flex-row-reverse` и
никакого второго DOM.

## Ритм на 360 складывается из двух отбивок

Мобильный кадр — не десктопный с другими числами. Его колонка `content` это
auto-layout с `gap=12`, и **каждый блок внутри несёт ещё свою верхнюю
`spacing`**: у заголовков 24, у таблиц 0. Отбивка над «Особенности JSON» на 360
равна 12 + 24 = 36, а над таблицей адресов — 12 + 0 = 12.

В нашем DOM колонка плоская, без `gap`, и отбивку несёт сам блок — значит два
числа надо складывать руками:

| блок | gap контейнера | своя spacing | `max-md:` |
|---|---|---|---|
| лид | — (первый) | 24 | `pt-6` |
| таблица адресов | 12 | 0 | `pt-3` |
| «Особенности JSON» | 12 | 24 | `pt-9` |
| «Описание формата» | 12 | 24 | `pt-9` |

Проверяется одним замером — `getBoundingClientRect().top` каждого блока против
Y-координат детей `content` в кадре. На глаз 36 против 32 не видны, а к низу
страницы расходится всё.

## Кадр начинается со списка детей, а не с содержимого

Две страницы секции `B2b additional` ушли к клиенту с **потерянными блоками
целиком**: на «Каталоге декоров» не было постранички (1488:127364), на
«Каталоге 3D-моделей» — рельса «Популярные товары для кухни» (2338:254296, 791
пикселей вместе с отбивкой). Ни одна проверка их не поймала: и `audit`, и глаз
работают внутри блока, который уже есть.

Ловит их один дешёвый проход — перечислить **прямых детей кадра по Y** и
сверить с блоками страницы:

```bash
node scripts/fig.mjs tree <frame-id> 1   # затем отсортировать строки по @y
```

```
y=    0  site-header       1440x116
y=  116  breadcrumbs       1442x56
y=  172  title-block       1442x44     ← «3D модели», а не «Для бизнеса»
y=  216  catalog-settings  1440x92
y=  308  products          1442x3512
y= 3820  pagination        1440x232
y= 4052  H2                1442x791    ← рельса, которой на странице не было
```

Тот же список ловит и лишнее: на «3D-моделях» стоял заголовок «Для бизнеса»,
которого в кадре нет вовсе, — его принесли из соседней страницы вместе с
оболочкой.

Оттуда же читается **верхняя отбивка заголовка**, и она у каждой страницы своя:
`title-text-page` — 862×68 на «Сертификатах» (32 + 36) и 862×36 на «Как с нами
работать», «Каталоге декоров» и «Новостях» (без отбивки вовсе, зато у «Новостей»
96 отдельной строкой перед всей колонкой). Копировать `pt-8` с предыдущей
страницы нельзя — высота инстанса говорит прямо.

## Совпавшая высота — не доказательство

Финальная строка «Как с нами работать» была свёрстана как заголовок: `pt-8` и
24/28 SemiBold. В макете там отбивка 24 и 24/32 **Medium** — оба числа другие, а
блок сходится в те же 88: 32 + 2×28 = 24 + 2×32. Проверка «высота совпала»
пропустила и кегль, и начертание, и отбивку разом.

Поэтому высота блока — проверка **последняя**, а не первая: сначала `raw` по
тексту (`fontSize`, `fontName.style`), потом состав (из чего сложилась высота),
и только потом сумма. Совпадение суммы при разном составе — обычное дело, когда
одно число больше, а другое меньше.

Для абзацного шага есть точный инструмент — **базовые линии**:

```bash
node scripts/fig.mjs raw <text-node> | python3 -c "…derivedTextData['baselines']…"
```

Шаг между соседними базовыми линиями внутри абзаца равен интерлиньяжу, между
абзацами — интерлиньяж плюс `paragraphSpacing`. На «Как с нами работать» это
24 и 32 (то есть 8), на 360 — ровно 20 везде, то есть отбивки между абзацами
там нет. Ни в `tree`, ни в `inst` этого не видно, а разница набегает страницей.

## Последний шаг рельса — не шаг, а остаток

Стрелка «вперёд» гасла на клик позже, чем нужно: лента доезжала до края, а
кнопка оставалась активной, и последний клик сдвигал её на два пикселя. Клиент
приносил это несколько раз подряд — и каждый раз это одна и та же арифметика.

Шаг рельса — карточка плюс зазор (462), а переполнение почти никогда не
делится на него нацело (3236). `Math.ceil(3236 / 462)` даёт **восемь** шагов,
из которых седьмой доезжает до 3234, а восьмой добирает оставшиеся два
пикселя. Формально всё верно, на экране — мёртвый клик.

Лечится двумя строчками:

```js
// конец достигнут, если до него осталось меньше порога
const maxIndex = () => Math.max(0, Math.ceil((maxOffset() - SCROLL_EPSILON) / step()));
// на последнем шаге едем ровно в конец, а не на index * step
const offset = index >= maxIndex() ? maxOffset() : Math.min(index * step(), maxOffset());
```

Первая убирает лишний шаг, вторая ставит ленту вплотную к краю — иначе на
последнем шаге остаётся хвост в те же два пикселя, только теперь без кнопки,
которой его добрать.

Проверять это надо не глазом, а прогоном: кликать «вперёд» до `disabled` и
печатать длину каждого шага. Все шаги должны быть равны шагу карточки, а
последний — не меньше его половины; ноль или пара пикселей в конце и есть тот
самый баг.

```js
while (!next.disabled) { const before = x(); next.click(); await pause(620); steps.push(x() - before); }
```

Пауза обязательна: у ленты переход 500 мс, и замер сразу после клика читает
промежуточное значение (первые прогоны показывали «шаги» 0, 171, 321 — это
были кадры анимации, а не шаги).


## Нарисованная обводка ещё не значит, что она видна

У `map` (2395:105929 у покупателя, 953:120995 у дилера, 2477:114285 на планшете)
в JSON лежит нормальный `strokePaints: [#cbcbcb]` — и рамка была собрана по
нему. Клиент вернул это как ошибку дважды. Рядом с краской стоит

```json
"strokeWeight": 0
```

то есть обводки нет вовсе: видно только радиус 8 и тень внутреннего контейнера
946:117282. Проверять надо **пару** «краска + вес», а не одну краску, и заодно
`borderTopWeight`/`borderBottomWeight` — при `borderStrokeWeightsIndependent`
общий `strokeWeight` не значит, что обведены все четыре стороны (у карточки
дилера `condition=default` это только низ, у `condition=selected` — все).

То же самое с эффектами: `styleIdForEffect` в узле без `effects` — ссылка на
стиль, и значение придётся смотреть у мастера. У 2477:168699 оно развёрнуто:
`DROP_SHADOW 0 4 17.6 rgba(0,0,0,.14)` — это ровно токен `--shadow-dropdown`,
уже заведённый в проекте.

Наоборот тоже бывает: у «Магазин выбран» (953:55452) ширина инстанса 158 при
тексте 112 — 12 + 112 + 6 + 16 + 12, то есть иконка есть; у «Выбрать магазин»
141 = 12 + 117 + 12, иконки нет. Если `inst` перечисляет оба слота, а решить
надо, какой рисуется, — считайте ширину, она не врёт.

## Вертикальный зазор между блоками — считать по видимому тексту, не по рамкам

Каталожный заголовок (`title-block` 752:64208) сидел на `pt-2`, дал 8px до
крошек вместо 16 — и первая попытка исправить это добавила `pt-4` прямо на
обёртку H1. Оказалось неверно: `get_design_context` на сам `title-block`
показывает `padV=0` **везде**, и по мобильному двойнику (1997:267659) тоже.
Весь видимый зазор даёт нижний паддинг **крошек** (`py-4` у `<nav>`), а не
верхний паддинг заголовка — pt-4 не чинил дыру, а удваивал её (лишь
незаметно, потому что сам блок пустой сверху и разница не бросается в
глаза на глаз).

Ошибка была не в цифре, а в единице измерения: `tree`/`raw` на мастере
показывали «spacing»-инстансы (629:25466, 766:28344) высотой 24 — это
именно ТЕ вставки-распорки, которые в реальном инстансе схлопываются в 0,
но `tree` всегда печатает мастер, и по этой мелочи разница между «рамка
блока подросла» и «сосед снизу дал паддинг» не видна вообще. Мерить нужно
не высоту рамки блока (она может остаться «верной» и при удвоенном
паддинге, если внизу того же блока есть компенсирующий слэк — здесь его
давала пустая кнопка `buttons` 44 высотой, держащая всю строку), а
реальный зазор между ВИДИМЫМ низом одного текста и ВИДИМЫМ верхом
следующего.

**Правило: любой «отступ между блоком A и блоком B» — это `get_design_context`
на оба, сложение их собственных паддингов/высот от текста до края рамки,
а не чтение одной высоты одного блока и вера, что вся разница — его.**
`fig.mjs` для этого недостаточно точен (`tree` — мастер, `inst` не всегда
переопределяет схлопнутые auto-layout-распорки) — здесь понадобился
авторизованный Figma MCP (`get_design_context`), который возвращает уже
посчитанные классы с реальных инстансов.

## Иконка снимается файлом, а не глазами по силуэту

Воронка фильтров каталога была вписана как ручной inline-SVG — кто-то
скопировал путь по совпадению названия слоя («filter, 24 Thin»,
2214:190873), не проверив, какой символ реально стоит в
`componentPropAssignments`/`symbolOverrides` инстанса кнопки (768:28902).
Реальный override указывал на `filter, 24 Bold` (963:37179) — и это не
«та же воронка потолще», а другая пиктограмма целиком (две горизонтальные
шкалы с ползунками, не воронка). `fig.mjs raw` отдаёт геометрию вектора
как `commandsBlob`/`vectorNetworkBlob` — ссылки в бинарный блок, которые
он не декодирует, так что подобрать точный path локально нельзя даже
имея правильный id.

Верный путь — `get_design_context` (или прямой asset-экспорт) на сам
символ, скачать файл и закоммитить его байты, как требует навык
`figma-design-to-code`: «never hand-write or inline svg… anything you
draw is wrong». Если это интерактивная иконка (меняет цвет в активном
состоянии), currentColor работать не будет — `<img>`-загруженный SVG не
наследует цвет текста; берите приём соседнего `nav-item`
(`filter: brightness(0) invert(1)` на самом `<img>`), а не переписывайте
файл на `currentColor` и не оставляйте его инлайновым ради этого.

## Семантический тег приносит поведение, которого никто не рисовал

Ящик фильтров собран из `<details>`/`<summary>` на каждую группу —
разумный выбор ради бесплатной семантики и тривиального Blade-порта
(CLAUDE.md сам это одобряет). Но у `<summary>` есть встроенное
поведение — клик по ней нативно сворачивает/разворачивает `<details>` —
и это поведение приехало в разметку бесплатно, никем не заказанное. В
макете ровно два состояния входа в шторку (913:86593 — одна группа
открыта по клику на именную пилюлю, остальные схлопнуты; 759:69866 —
воронка открывает все) — оба ставятся программно, через `.open`, и
кликабельного шеврона, сворачивающего группу вручную, в макете нет
вовсе. Написанный код при этом выглядел полностью обоснованным: JS
честно ставил `.open` в нужное состояние при входе — баг был не в
логике входа, а в том, что нативный `<summary>` слушает клики
самостоятельно и молча меняет то же самое свойство в обход этой логики.

**Правило: выбор тега ради семантики — это ещё не выбор его умолчаний.**
`<details>` даёт бесплатную доступность и (что здесь и подкупило)
Blade-тривиальность, но вместе с этим — поведение по клику, которое
никто не рисовал и не просил. Если состояние элемента должно быть
целиком программным, поведение по умолчанию нужно глушить явно
(`summary.addEventListener('click', e => e.preventDefault())`), а не
полагаться на то, что оно случайно совпадёт с макетом. Тот же вопрос
стоит задавать при любом другом семантическом теге с собственным
поведением — `<dialog>`, `<input type="checkbox">` вне формы,
`<a>` без реальной навигации.

## Trailing scroll space on mobile rails: `padding-right` is not trustworthy

Every mobile carousel (`overflow-x-auto`, snap) needs the same last-card
inset the first card gets from `scroll-padding-left` — swipe to the end,
the last item should sit off the screen edge by the same logical gap, not
touch it. The obvious `padding-right` on the scrolling element does not
reliably become part of `scrollWidth` in Chromium for a flex or grid
child — measured directly: expected `scrollWidth` including the padding,
got exactly `scrollWidth − padding`, confirmed by scrolling to
`scrollLeft = scrollWidth` and finding the last card flush against the
edge. This is a real, long-standing Chromium quirk, not a mistake in the
padding value.

**Fix: a genuine trailing element always counts, because it's real
content, not padding.** Two shapes, because flex and grid need different
handling:

- **Flex track** (one big card per view, e.g. "Модульные кухни"): a
  `[data-track]::after { content: ""; flex: none; width: … }` pseudo-element
  is a real flex child and always gets included in `scrollWidth`.
- **CSS Grid track** (`.rail-2row`, two rows of small cards): a pseudo-element
  here would auto-place as a real grid cell and silently eat a card slot.
  Give it an actual DOM node instead (appended once after the cards, in the
  same JS that sets `--cols`), placed in its own explicit trailing column —
  `grid-column: calc(var(--cols) + 1); grid-row: 1 / span 2;` — with
  `grid-auto-columns` on the container sizing that implicit column. CSS Grid
  places explicitly-positioned items *before* auto-placed ones regardless of
  DOM order (spec, "Placing Grid Items"), so the real cards correctly flow
  around the reserved column even though the spacer is last in the DOM.

**Both are flex/grid children, so the track's own `gap` lands before them
too** — the real trailing space is `gap + spacer width`, not the spacer
width alone. Size the spacer as `(desired inset) − (track's own mobile
gap)`, not the desired inset itself, or the right edge ends up visibly
wider than the left. Different tracks with different `gap` values need
different spacer widths even for the same target inset.

**Snap type matters too.** `scroll-snap-type: … proximity` does not pull
the scroll position back to the last real snap point if a fast swipe
carries past it into the new trailing space — proximity only snaps when
the scroll already stops near a snap point, and empty trailing space has
none. `mandatory` always resolves to a valid snap point after the
gesture ends, which is what makes the trailing space actually reachable
by touch and not just by script.

## An unconditional `leading-*` silently wins over a media-scoped `text-*` token

The breadcrumb nav across seven pages carried `text-body-n-accent leading-6
… max-md:text-m-body-s` — a desktop text token, an explicit line-height
override for it, and a mobile text token meant to replace both at `max-md`.
Below `md` the font-size switched correctly (12px) but the line-height stayed
at 24px instead of the mobile token's own 16px, even though the `max-md:`
rule compiles after the base rule in the stylesheet and both match.

The reason: Tailwind's font-size utilities set `line-height` through a shared
custom property — `line-height: var(--tw-leading, var(--text-*--line-height))`.
An explicit `leading-6` sets `--tw-leading` directly, and it does so
*unconditionally* — no `md:` prefix — so that value wins at every breakpoint
regardless of which font-size token is active or how the cascade orders the
two font-size rules. Source order between the two `text-*` rules stopped
mattering the moment a bare `leading-*` utility entered the mix.

**Fix: gate the override to the breakpoint it's actually for** —
`leading-6` → `md:leading-6` — rather than trusting that a later
`max-md:text-*` rule will override it. The general rule: once a `leading-*`
utility is mixed with a `text-*` token that bundles its own line-height, they
are no longer independent — the unscoped one has to be scoped too, or it
overrides the token at every width the token is used, not just the one it
was written for.

This same nav also carried a second, independent bug worth noting together:
the real Figma breadcrumb component is a **fixed-height row with centered
content** below `md` (`stackPrimarySizing: FIXED`, `stackCounterAlignItems:
CENTER`, resolved via `raw`/`derivedSymbolData` transforms, not `tree`) — its
declared `padV: 2` is a minimum, not the value that produces the box's real
40px height. Five real instances agreed on 40px against a content height of
16px, i.e. ~12px effective margin, nowhere close to what `py-0.5` (the
literal padV value) would produce. `max-md:h-10` (matching the fixed height)
plus the row's existing `items-center` reproduces it exactly — a reminder
that a small `padV` number next to a much larger declared box size means
"fixed height, centered content," not "this padding is wrong until it makes
the numbers add up."

## Checking a spacing value against a class name is not checking it — checked `getComputedStyle` catches what reading the source can't

Caught myself doing this twice in the same session, on the same class of
bug, minutes apart. Both times the check was: read the Figma number, read
the Tailwind class name on the element, see they match, call it correct.
Both times the actual rendered page did not match, because a **second**
utility on the same element — or the same property set at a different
breakpoint — won the cascade. Comparing labels instead of measuring the
live page is the root cause common to:

- the breadcrumb's `leading-6` silently beating `max-md:text-m-body-s`'s own
  line-height at every width (documented above);
- `seo-kitchens.html`'s outer wrapper carrying both `page-x` (which bakes in
  `max-md:px-4`) *and* an ad-hoc `max-xl:px-10` added for the tablet case —
  the real inset was 40px on mobile, not the 16px `page-x` alone would give,
  because `max-xl:` is not "1280 down to 768," it is "1280 and everything
  narrower," so it's still active at 390px too, and it happened to compile
  after `page-x`'s own rule.

**The general trap: every `max-<bp>:` Tailwind variant means "at this
width *and every width below it*," not "in this range."** Two `max-*:`
utilities that touch the same CSS property on the same element are not
"the narrower one wins" — whichever rule is *later in the compiled
stylesheet* wins, at any width where both conditions hold, and Tailwind's
own emission order is not something to eyeball from the class list in the
markup. Anywhere a page adds a second breakpoint override on top of a
shared utility class (`page-x`, `link-dotted`, any bundled `text-*`
token), assume the two can collide below the narrower one's threshold
until proven otherwise.

**Two fixes, pick by intent:**
- Want the override to apply *only* in one range (e.g. tablet, not mobile)?
  Use a **compound variant** — `md:max-xl:px-0`, not `max-xl:px-0` — so the
  rule's own selector excludes the narrower width instead of relying on
  emission order. `stores.html`'s map wrapper already does this correctly
  (`page-x md:max-xl:px-0`); `seo-kitchens.html` didn't, and that was the bug.
- Want the shared utility's own narrower value back? **Re-assert it
  explicitly**, after the override, in the same class list —
  `max-xl:px-10 max-md:px-4` — the same pattern already used correctly in
  `dealer/delivery.html` and its siblings (`max-xl:px-6 max-md:px-4` on
  `[data-content-column]`).

**The actual process fix, not just the CSS one: a spacing/typography check
is not done until `getComputedStyle` at the target viewport says the
number, in a real headless browser** — not until the Tailwind class name
next to the Figma number *looks* like it should produce that number. Read
the class, form a hypothesis, then run exactly the Playwright snippet used
everywhere else in this file to confirm it, every time, even when the
class name looks obviously right — *especially* then, since that's
precisely when the check gets skipped.
