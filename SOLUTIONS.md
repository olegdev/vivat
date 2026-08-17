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
