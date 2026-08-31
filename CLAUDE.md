# VIVAT — customer site

Static marketing site built from a Figma design. Vite + Tailwind v4, vanilla JS,
no framework. Each page builds to a single self-contained HTML file.

```
npm run dev       # vite dev server → /pages/customer/main.html
npm run build     # one vite build per page → dist/ (inlines all JS/CSS)
npm run build:php # → dist-php/, the folder handed to the PHP developer
npm run shot      # screenshots of dist/ at 1440 and 390 → .shots/
npm run crop      # one block of one page, with --click for open states
npm run audit     # ordered text diff: a Figma instance vs the rendered page
```

Two builds, two audiences. `dist/` is for **showing the client**: one
self-contained minified HTML per page that opens by double-click. `dist-php/` is
the **hand-off** — the source tree with partials spliced in and each splice
wrapped in the `@include(...)` it becomes, JS copied file-for-file, CSS compiled
once, nothing minified. It needs a local web server (ES modules don't load over
`file://`) and it carries `docs/PORTING.md`, which is the document the PHP
developer actually works from. See `scripts/build-handoff.mjs`.

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

The page's own body is three partials — `catalog-settings` (funnel, pills,
sort, chips), `catalog-grid` (the card `<template>` + the grid + the empty
state) and `pagination` — and all of its behaviour is
`src/components/catalog-listing.js`. Both catalog pages, customer and dealer,
are assembled from them; the page scripts are wiring only.

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

- The Характеристики bar is **two panels and one anchor**: Описание /
  Комплектация switch the panel, Где купить scrolls to the section below.
  Клиент сократил ряд 31.08.2026 по новой версии блока (2567:158700): «Состав»
  убран совсем, «Документы» и «Отзывы» ушли из ряда, «Модули» переименованы в
  «Комплектация» — содержимое той панели и было списком комплектации. Сам
  панель «Комплектация» переделана по нему же в таблицу пяти колонок —
  517/120/100/100/32 при зазоре 8, строки 44, снизу «Итого». Итоги считаются из
  строк, а не хранятся: в макете они не сходятся с собственными числами
  (см. BACKLOG.md).
- `PDP-package` underlines **Модули**, and that is the tab its комплектация list
  belongs to, even though the frame's name says otherwise. The Модули *carousel*
  further down the page is a separate section.

One deliberate deviation: the mobile frame titles the stores block **"Наши
салоны"** while desktop titles it **"Где купить"**. Both pages use "Где купить"
— the desktop frame overrides the title on purpose and the tab bar has a label
pointing at it, whereas the mobile instance only overrides the *description*,
which reads as a component that was never re-titled. Say so if it comes up.

`src/pages/customer/pdp-module.html` — страница модуля. Три ширины сразу:
1440 (Figma `PDP module` 2488:127146), 768 (2488:136015) и 360 (2488:128722);
широкого фрейма нет, выше 1440 всё тянется до 1900 по общему правилу.

Это **не состояние кухонной PDP**, а более короткая страница, и различий
ровно четыре:

- одно фото вместо трёх — `media` 671 против 2041, поэтому колонка снимков
  здесь не рельс, а один кадр;
- **своя сводка без цены** (`partials/pdp-module-summary.html`): сегменты
  «Комплектация, мм.» вместо геометрии, ДВЕ группы образцов — «Каркас» и
  «Фасад», у каждой своя подпись, — и вместо блока цены ссылка «Получить
  оптовую цену» под кнопкой;
- ровно один рельс, «Модули композиции …». Второй блок с рельсами, отзывами и
  картой салонов в макете есть, но скрыт (2488:127174), то есть не рендерится;
- нижнего бара CTA нет ни в одном фрейме: кнопка живёт в сводке на всех
  ширинах, поэтому снизу резервируется только тапбар.

Блок характеристик — тот же партиал, что у кухни; у модуля вкладок четыре, и
«Документы» с «Отзывами» снимает `dropSpecTabs()`, а не второй партиал.

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

`src/pages/dealer/main.html` — the dealer home page. Desktop (Figma dealer/Main
882:107882) and mobile are both done, but the mobile half has **no frame of its
own** — 882:107882 has no 360 counterpart. Where it came from matters:

- **The chrome is designed, just filed elsewhere.** The dealer catalog's mobile
  frame (2225:160540) draws the whole dealer header — a 38px strip with «Москва»
  and the phone, a 40px dark row carrying the price-list trigger and the
  «Показать цену» switch, then the usual 60px logo row — and a bottom nav whose
  third item is «Бизнесу», not «Акции». Both are built from it.
- **The dealer header's menu row is not the customer's.** `menu-items` is a
  variant, not shared copy: b2c (604:23352) reads Кухни / Акции / Где купить,
  b2b (607:27488) reads **Конструктор / Контакты**. «Весь каталог» is common.
  Neither page instance overrides those labels, so reading the header off the
  page's own instance shows the master and hides the difference — read the
  variant that the `type=b2b` header points at.
- **Three things are ours, by decision** (recorded in `BACKLOG.md`): the news
  block below `md` (a rail of 320px cards, its two buttons stacked because
  «Подписаться на рассылку» does not fit beside «Все новости» at 360), the
  burger menu's dealer rows («Мой кабинет», «Выход» instead of «Стать дилером»),
  and the mobile footer's dealer branches.

**The price list is a real component, not a placeholder.** `dropdown-header`
(607:26932) has four variants and the open one — `desktop/condition=open`
1299:49518 — draws the whole panel: 328×144, three 320×44 rows, the selected one
on `#eeeeee` with a check. Its mobile twin is the «Наценка» sheet, two states at
2225:163666 / 2225:164865. Three modes, and their labels only exist in the
instances (the master says «Оптовая цена» three times): **Оптовая цена /
Рекомендованная цена / Своя наценка**, the last with a `%` field, a 50% minimum
and an «Применить» button that the other two don't have.

`partials/price-mode.html` holds the row `<template>` and the mobile sheet; the
desktop panel sits in the dealer strip in `partials/header.html` because it is
positioned off the trigger. `components/price-mode.js` (which absorbed the old
`dealer-header.js`) drives both and owns the single request seam,
`applyPriceMode({mode, markup, enabled})` — localStorage plus a recompute of
every `[data-card-price]` from the `data-price-base` the card carries.

`src/pages/dealer/catalog.html` — the dealer catalog. Desktop (Figma
Catalog-default 953:121911) and mobile (catalog 2225:160540) are both done, and
the frame is the customer catalog node for node: same `cards-kitchen size=m`
grid, same pagination, same Популярные rail, same green SEO band. Four things
differ and nothing else:

- the chrome is the dealer's (`data-user="dealer"` — header strip, «Бизнесу» in
  the bottom nav, dealer footer branches);
- the settings bar is `catalog-settings type=dealer`, which adds a **«Только
  модули» switch** — 1440: text+toggle 168 then a 32 gap then the 280 sort;
  360: the switch joins the funnel on row 1 and the sort drops to a full-width
  row 2, so the bar grows 116 → 164. The right-hand group is
  `max-md:contents`, which is what re-flows it without a single `order-*`;
- prices lose the «от» and are recomputed by the price list;
- **below `md` there are no breadcrumbs and no H1** — the 360 frame simply
  doesn't draw them, though the dealer 1440 and the customer 360 both do. Built
  to the frame; the question is in `BACKLOG.md`.

The «Показать цену» switch **hides nothing** — it is the apply switch for that
selector: off means the wholesale price whatever the list says, on means the
selected mode. The design carries no prototype on it; this is the client's
answer.

`src/pages/dealer/pdp.html` — the dealer product page. Desktop is Figma PDP
953:122180 plus its two tab panels (1686:59341 «Модули», 1686:59383
«Документы»); **none of the three has a 360 frame**. The frame is the customer
PDP node for node — same anchor bar, same 900×2041 photo column, the whole
Характеристики block and both panels identical to 922:126723 / 942:34310, the
same four rails with the same copy, the same stores block and green band.
Exactly five things differ, and four of them are chrome:

- the header is `type=b2b` and the footer `user=Dealer` — both by `data-user`;
- the summary is the **`Customer=b2b` variant** (953:142727). It is 392 tall
  against the customer's 441, and the whole difference is four hidden elements:
  the «от», the struck-through old price, the discount badge and the notice line
  under the button. They are four `group-data-[user=dealer]:hidden` rules in
  `partials/pdp-summary.html` — no second partial;
- the Отзывы → Вся коллекция region sits on **`#f8f8f8`** (1686:63218) where the
  customer's is white, and the frame puts an extra 80px spacer before it;
- prices lose the «от» — including in the rails, which the frame itself draws
  *with* «от» (a copied customer instance; the client chose the dealer rule, see
  `BACKLOG.md`);
- the product's own price follows the price list, like every card price. That is
  why `price-mode.js` reprices `[data-price-base]` rather than
  `[data-card-price]` — the summary and both bottom bars carry the same
  `data-price-raw`/`data-price-base` pair, set by `setPrice()` in `pdp.js`.

Below `md` the body is the customer's mobile PDP (1997:305719 and its panels)
under dealer chrome from 2225:160540. Three things are ours by decision and are
written down in `BACKLOG.md`: the mobile summary in dealer dress (there is no
`device=mobile, Customer=b2b` variant), the order button's label without «от»,
and the grey band at 360. The two bottom bars have no dealer frame at all and
are reused as they are — without them the 360 page would have no CTA, since the
mobile summary carries none by design.

`src/pages/dealer/order.html` — дилерское оформление заказа. Desktop (Figma
Order 1209:95219 and Order-b2b-delivery 1415:67609) and mobile (catalog
2225:167283) are both done. **It has no step machinery.** Where the customer's
order page accumulates шаг 0/1/2, the two dealer 1440 frames are one screen in
two states: only the «Доставка» card's body changes (264 → 616), so the state
is `data-delivery="pickup|delivery"` on that card and every difference is a
`group-data-[delivery=…]` rule. Below `md` the whole thing — cart, summary,
form — is one scroll; there are no screens there either.

Its own part is `partials/order-forms.html`, four cards under «Внесите ваши
данные»: Контактные данные (ФИО / E-mail / ИНН / Телефон, two columns that go
`max-md:contents` to flow in the 360 frame's order), Оплата (one select whose
options the design never names — see `BACKLOG.md`), Доставка (the segment
control, the pickup address or the delivery form with its two surcharge badges
and the coral alert) and Комментарий к заказу. Everything else is the customer
page's parts under dealer branches:

- **the cart card is the same `<template>`** (`customer=b2b` is a variant of
  the same Figma component): specs hidden on 1440, [stepper][price] instead of
  price-over-stepper, «Редактировать модули» under the colour — a round pencil
  at 360 — and the expanded state's module list. The rows live in
  `partials/order-modules.html`, which also owns the 360 bottom sheet the same
  list opens in (2225:201034);
- **the summary is the same partial**: `Способ оплаты` instead of «Итого» on
  1440 (the 360 frame keeps «Итого»), a «Доставка» row, a different notice, no
  button below `md` — which is why this page's sticky bar is always on rather
  than revealed by scroll — and «Очистить корзину» under the 1440 button;
- **the confirmation overlay is now `partials/order-done.html`**, shared with
  the customer page. The dealer section has no frame of its own for it; the
  designer's are 2241:158412 / 2241:158297.

**Two things about the shared cart card are easy to get backwards**, and both
were shipped wrong once:

- **The stepper's trash is a `size=l` state, not a `count=1` state.** The
  component set has no `size=s, count=1` variant, and 360 cards take the small
  stepper — so every 360 order card draws the minus beside a 1. Both glyphs
  live in the template and `data-count` + a `md:` variant choose; never a `src`
  swap from JS, which cannot follow a resize. The 360 minus at 1 therefore does
  nothing; that the design offers no way to drop a line from a phone is in
  `BACKLOG.md`.
- **The dealer's expanded card is a column, not a row with an appendix.** In
  Figma the module list is a sibling of the [text][stepper] row *inside* the
  740 column, so it starts where the text ends (88) while the 110px photo runs
  on past it. The list clears the photo with `pl-[204px]` and its overhang with
  `md:-mt-[22px]`; its own 278 box is what puts the module minus exactly under
  the card's trash.

Three links on these pages are **dotted**, not solid — «Редактировать модули»,
«не выбран» in the summary and «персональной информации» in the consent line.
The `link-dotted` utility is the whole of it; why it is invisible in `tree` is
in SOLUTIONS.md › "Имя текстового стиля несёт то, чего в Figma нет".

**The bottom nav has an active item, and exactly one.** `nav-item
condition=active` fills the 32px icon box `#292929`, whitens the glyph and
lifts the label to `#808080`. In the whole design it is only ever «Корзина»,
and only on order screens — customer and dealer alike; the catalog, PDP, home
and search frames carry no active item. Pages set `aria-current="page"`;
`.nav-item[aria-current]` in `app.css` does the rest.

There are no stubs left in `src/pages/` — every file there is a finished page,
and **`B2b additional` is now built out**: the four modals plus Доставка,
Контакты, Для интернет-магазинов, Как с нами работать, Сертификаты, Схемы
сборки, Техническая информация, Каталог декоров, Новости and Каталог
3D-моделей. What is left is what the design does not draw — «Методические
пособия» and four other menu entries have no frames. See `BACKLOG.md`.

Three of those pages share **`partials/doc-tree.html`** — a recursive tree of
document groups (four levels deep on Схемы сборки). Two more share the
catalog-shaped grid. Their fixtures are not typed by hand: `scripts/
fig-doc-tree.mjs` and `scripts/fig-table.mjs` read the copy straight out of the
export, because a cell's text lives in an instance override and is only visible
through `inst` — and calling `raw` per node re-inflates the .fig every time (an
hour against five seconds).

**Search is not a page — it is an overlay every page carries.** Figma's `search`
section (2324:120596) holds four frames: 2337:156356 / 2338:235809 (nothing
typed) and 2338:101329 / 2338:237972 (query "Стол"), desktop and mobile. They
are two states of one panel that drops over the site header while the page stays
put under a 90% scrim — the designer builds it by *hiding* the header's logo,
menu and cart (2337:159619 is `visible:false`, the utility row is opacity 0) so
only the field and a close × remain.

`partials/search-overlay.html` is that panel and `components/search.js` drives
it. The state machine is one attribute: `data-state="empty|query"` on the panel,
and every difference between the two frames is a `group-data-[state=…]` rule at
the call site — the same technique as the order page's `data-step`. Empty draws
"Рекомендуем" + a rail; query draws the hint list (aligned under the field, the
matched run in primary ink and the rest muted), a row of section chips, and the
results. Its cards are `data-pcard-search`, the designer's re-cut `cards-other
size=s` (632:27760, now 322×410 — it gained a swatch + comments row): both
footer rows collapse when the data is absent, which is exactly how one card
serves a recommendation (348 tall) and a result (410).

Below `md` the panel is the whole screen and the results change layout, not just
width: the empty state is the site's usual two-row 152px rail, the query state is
a two-up grid with no scroll indicator. Entry points are the desktop header's
field and the burger menu's — the mobile header has no search of its own, which
is why the menu's field is the way in.

**Four modal windows are the first built piece of `B2b additional`** (Figma
section 1334:57242, the column at X = 134). They belong to no page: their
triggers live in the header, the footer and the dealer home page's news block,
so every page carries all four — «Стать дилером» (1003:160435 / 2209:213755),
«Войти в режим дилера» (1003:166631 / 2209:216011), «Подписаться на новости»
(1003:169259 / 2225:96576) and «Сообщение директору» (1534:65836 /
2225:97387).

One shell serves all of them and lives in `app.css`, not in a partial:
`.modal-scrim` + `.modal-panel` is a 485-wide centred card above `md` (all four
frames put it at x=478 = (1440−485)/2) and a **bottom sheet** below it, the same
shape as the order page's modules sheet. `partials/order-done.html` uses the
same two classes — it was the fourth copy of that card before they were pulled
out. Because `hidden` now lives inside `.modal-scrim`, showing an overlay means
adding `.is-open`, not removing a class.

Four things about them are easy to get wrong:

- **The panel's header carries no title** — `modal-header/desktop` (1003:166613)
  is one 24px close glyph at the right edge. Every title is the first block of
  the body. The mobile header of three windows out of four reads «Войти в режим
  дилера»; that is a copied instance, not copy.
- **There is one button, full width.** The master `modal-button-container` draws
  a grey «Отмена» beside the coloured one, and every instance hides it — `inst`
  does not return it in the layout. Its colour is not uniform either: заявка and
  директор are coral, вход and подписка dark.
- **The consent line is not one size.** Заявка and подписка draw it 12/16 in a
  44px box, директор 14/18 in a 76px one — two variants of `control+text`. The
  link inside it is «Link … dotted», i.e. `link-dotted`.
- **Nothing is drawn for "sent".** All four forms just close; the login also
  navigates to the dealer home, which is our decision, not the design's. Both
  are in `BACKLOG.md`.

`partials/modals.html` is a hub of four `#include`s rather than a container —
the include plugin recurses, so a page mounts everything with one line while
`dist-php/` still gets four separate `@include('partials.modal-…')`.
`components/modals.js` drives all of them and holds the four seams; what is
open is read off the DOM (`[data-modal].is-open`) rather than kept in a
variable, so a panel shown by other means still closes on Esc, the × and a
click outside.

`src/pages/dealer/delivery.html` and `src/pages/dealer/contacts.html` are the
**first two content pages of `B2b additional`** — Доставка (Figma 1167:79692 /
2225:132262) and Контакты (1415:68377 / 2225:104774). Nine more remain, and they
are the reason these two were built as a template rather than as two pages: ten
of the eleven frames share one shell.

```
site-header        1440×116
title-block        1442×92    type=H1
general-container  1440×N     40 + menu-b2b 298 + 40 + right-container 1022 + 40
spacing            1440×96
group              1440×595   ← это подвал, а не блок «Производство»
```

Five things about that shell are easy to get wrong, and every one of them cost
time here:

- **The top block is the heading, not breadcrumbs.** There are no breadcrumbs on
  these pages at either width. On the pages that carry the menu the heading is
  **«Для бизнеса»** — the section's name — and the page's own name is the first
  line of the right column; Контакты, which has no menu, puts «Контакты» there
  directly. The block's `buttons` frame renders empty: `inst` finds a «В раздел»
  button in it and the render does not, exactly like the catalog title.
- **The shell is not a partial.** `<!--#include -->` is a flat splice — it cannot
  wrap a page body, and there are no slots. Expressing the shell would mean
  either paired open/close partials or a new layout mechanism in the include
  plugin; both were rejected because the shell is six lines and all the real
  bulk is the menu. The page writes the wrapper itself. See
  `docs/superpowers/specs/2026-08-17-b2b-content-pages-design.md`.
- **`menu-b2b` (298) is on eight pages of nine.** Контакты is the only one
  without it, and its blocks run full width. The menu's copy lives in the
  **master**, not the instances — a page overrides exactly one row, the active
  one — so read it with `raw` per `menu-item`, never off the page's instance.
  There is no `condition=active` variant in the set: the designer marks the
  current page with the **hover** variant (`#eeeeee`), so hover and current
  share their styling.
- **Below `md` the menu is replaced, not narrowed.** `for-business-header`
  («Для бизнеса» + a pill naming the current page) opens the section menu as a
  sheet on the shared `.modal-scrim` / `.modal-panel` shell. One set of
  `<template>`s serves both: the aside is hidden below `md` and the sheet above
  it, so `h-10 max-md:h-11` is the whole of the 40 → 44 row change.
- **Контакты' map is the fourth mode of `partials/stores.html`**, not a new
  block: variant `type=contact page` (1456:56787). Frame, panel header, canvas
  and zoom are shared; only the panel's body changes — one address card instead
  of the dealer list — and below `md` the block turns into canvas-on-top /
  panel-under, which is why the frame gets `flex-col-reverse` there.

  The page drives that body from the «Опт / Розница» segments: **опт** keeps the
  single address card (the warehouse), **розница** switches the panel back to the
  store list and fills it from `data/contacts-retail.js` — region → city →
  shops (32 regions, 118 cities, 210 shops **with coordinates**), scraped off
  the live site because the design draws no retail state; the default is
  «Московская область» + «Все города», as there. The
  city in the panel header is the selector (region is a second line under it),
  and the map API grew `setStores` / `setPanel` / `showDetail` for it.

Their own parts are `partials/benefit-tile.html` (the Figma component is called
`benefit`; its numeral is Onest **Thin**, a weight no other page loads) and
`partials/accordion.html` (plus/minus, never a chevron; the expanded question
greys to `#808080`). Everything else is reuse.

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
  clones and fills; it never builds markup from strings. This was finished in
  the hand-off pass: the carousel section shell (9 mounts), the hero and the
  home page's promo row were the last four string builders, and moving them out
  is what made `dist-php/` legible — before it, the authored HTML had *empty
  divs* where the page's main sections belong.
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
`catalog-filters` (её же берут «3D-модели»), `catalog-settings`,
`catalog-grid`, `decor-filters`, `pagination`,
`chip-close`, `stores`, `hero`, `carousel-section`,
`product-card`, `promo-card`, `review-card`, `pdp-summary`, `pdp-specs`,
`pdp-photo-overlay`, `sticky-price`, `seo-kitchens`, `cart-card`,
`order-summary`, `order-forms`, `order-modules`, `order-done`,
`search-overlay`, `price-mode`, `modals` (хаб) and the four it pulls in —
`modal-dealer-request`, `modal-dealer-login`, `modal-subscribe`,
`modal-director`, and the content-page trio `menu-b2b`, `for-business-header`
(which also carries the section-menu sheet) and `accordion`, plus
`benefit-tile`.
Several carry both a static shell and the `<template>` unit(s) their component
clones (`catalog-menu`, `mobile-menu`, `stores`, `pdp-summary`, `pdp-specs`,
`search-overlay`, `price-mode`, `order-modules`);
`hero`, `carousel-section`, `product-card`, `promo-card` and `review-card` are
templates only, and `seo-kitchens` is shared content with one hook: its body is
the same on all five pages that mount it, but the heading differs — the listings
read «Кухни VIVAT — сочетание стиля и функциональности», both PDPs «Подберите
полезные товары…», so the `<h2>` carries `data-seo-title` and the page script
overrides it (the same call-site-copy pattern as `stores`). The matching
`src/components/*.js` queries the shell and clones the templates — it never
builds markup.

The same plugin takes `markers: true` for the hand-off build, which wraps every
splice in the `@include(...)` it becomes and re-indents the partial to the
include's own depth. Nothing else in the pipeline changes.

**Fixtures live in `src/data/`, one module per page — never in a page script or
a component.** `asset-base.js` is the single place a media URL gets its prefix
(it was duplicated in seven files before). Page scripts are pure wiring now:
`main.js` went from 371 lines to 77. Section titles and descriptions are *not*
fixtures — they are design copy and stay at the call site.

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

Then read **`BACKLOG.md`** — what is open, what is deliberately unfinished, and
what is blocked on an answer from the designer or the client. Check it before
starting anything and again before calling something done: half of what looks
like a bug in this prototype is a known debt already written down, and a page
you are about to touch may be waiting on a decision.

**Debts go in `BACKLOG.md`, never in a code comment.** A TODO buried in a
partial is invisible on the day the answer finally arrives, and it ships — the
comment travels into `dist-php/` (by design) and used to travel into `dist/`,
the build shown to the client, until the client build started stripping
comments (`stripHtmlComments` in `scripts/build.mjs`). Keep comments in markup
to the short "which Figma node is this" anchor the partials already use; put
open questions, guessed copy and deliberate omissions in the backlog.

**Keep it current.** Whenever you come back to fix or rework something the first
version got wrong — a separate task, not the original build — and the fix
carries a lesson that generalises, add it to `SOLUTIONS.md`. That doc exists
because these traps cost real time the first time; a fix that isn't written down
gets re-hit on the next page.

## Reading the design

The canonical Figma file is **`nFfeXrx9LR1B5kEY4nXKGI`**
(https://www.figma.com/design/nFfeXrx9LR1B5kEY4nXKGI/VIVAT) — pass this fileKey
to the MCP tools. Top-level pages: `Design` (189:10790), `UI SYSTEM`
(922:83156). Older copies `locvXJpmVZqIMVwPoumae3`, `t7qJcR7KNgLigitQwv3V5T`,
`odPx3t2xUNTnIx09J9DpIS`, `9d9EunlGqwIMf5hPZI3kmf` and `J5GoY36VJIg79HSzfDVn3f`
also exist — ignore them. Node ids are unchanged across each move, so ids
quoted anywhere in these docs still resolve. Ключ менялся дважды, и ссылки,
которые присылает клиент, могут вести на старую копию — MCP тогда отвечает
«нет доступа на редактирование». В этом случае берите ключ отсюда, а не из
ссылки.

Two sources. **Reach for the local export first, fall back to the Figma MCP
server for whatever it doesn't have.**

```
node scripts/fig.mjs find <regex> [TYPE]   # search layer names
node scripts/fig.mjs tree <id> [depth]     # dump a subtree
node scripts/fig.mjs node <id>             # parent, siblings, master component
node scripts/fig.mjs raw  <id> [k1,k2]     # full node JSON, for fields the index drops
```

ids take either form: `1968:71551` or the `1968-71551` in Figma URLs.

**For the b2b half of the design, start from `docs/FIGMA-MAP.md`** — a linked
index of the `dealer` (882:90262) and `B2b additional` (1334:57242) sections:
every frame with its node id, its desktop↔mobile pair, what it reuses from the
customer build, and the open questions for the designer. Those two sections are
~50 frames and most of the mobile ones are named just `catalog` or `menu`, so
the map is the difference between reading the section and re-deriving it. It
also records the two techniques the sections require: pairing desktop to mobile
by X-coordinate, and reading instance copy out of `symbolOverrides` via `raw`
(`tree` shows the master's text, not the instance's). Refresh it whenever
`canvas.fig` is re-exported.

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
Since it's gitignored, the dev copy on `market` needs a manual sync after any
re-export:

```bash
rsync -avz VIVAT_SOURCES/ market:/srv/vivat/dev/VIVAT_SOURCES/
ssh market "chown -R dev:dev /srv/vivat/dev/VIVAT_SOURCES && chmod -R u+rwX,go+rX /srv/vivat/dev/VIVAT_SOURCES"
```

The chown/chmod step is not optional — the Mac's `rsync` is `openrsync`, which
has no working `--chown`, so a sync alone leaves the tree owned by the Mac's
numeric UID and unreadable by `dev` (see `docs/DEV_SERVER.md` › «Грабли» #7).

Format note: block 0 is the kiwi schema (raw deflate), block 1 is the document
(**ZSTD** in current exports). Off-the-shelf .fig parsers assume deflate for both
and fail here; node's `zlib` handles both, so `kiwi-schema` is the only dep.

## Rules

- **NEVER invent. Not a label, not an icon, not a size, not a behaviour.**
  This is absolute. If the design does not state it, you do not know it, and a
  plausible guess is worse than an empty slot because it ships looking finished.
  Every invented thing so far was reported as a defect by the client, never
  noticed as a helpful default:
  - an arrow icon next to «Мой кабинет» — the slots are not rendered;
  - a mail glyph and the label «Подписаться на новости» on the dealer footer
    button — it is «Личный кабинет» with a trailing arrow;
  - «Все новости» styled as the only button — there are two;
  - a strip sized to its content instead of the design's 1013px.

  When a value is unreadable: **measure it, then ask.** A derived text box of
  43×18 is five characters — that is enough to rule out "56 моделей" and to
  frame a precise question. Put the question in `BACKLOG.md`, tell the user in
  the reply, and leave the slot empty. Do not fill it "for now".

- **For anything inside a component, run `fig.mjs inst <id>` — never `tree`.**
  An INSTANCE has no children of its own, so `tree` prints the *master's* sizes,
  copy and visibility, and the instance contradicts all three routinely. `inst`
  reads `derivedSymbolData`, which is the layout actually rendered. Misreading
  this produced every wrong pixel in the dealer header and footer at once; see
  SOLUTIONS.md › "An INSTANCE is not its master". `tree` warns when you point it
  at an instance — do not ignore the warning.

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
- **Fix spelling mistakes — do not reproduce them.** The "never invent" rule
  covers *what* the design says, not its typos. When Figma copy has a clear
  spelling error, ship the correct spelling, and write the divergence down in
  `BACKLOG.md` so the designer can fix the source (`npm run audit` will report
  it as a mismatch, which is the point — it is a known one). Live example: the
  dealer price list is drawn as «Рекомендованая цена» and rendered as
  «Рекомендованная». This applies to our own text too — comments, docs, commit
  messages: correct a typo when you pass one.
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
- **Nothing is done until it has been through the three checks below.** Reading
  your own diff is not one of them.

## Before calling a block done

Three checks, in this order. Each one caught defects the other two missed, so
none of them is optional and none substitutes for another.

**1 — Read the instance, not the master.**

```bash
node scripts/fig.mjs tree <page-frame-id> 2     # find the INSTANCE you built
node scripts/fig.mjs inst <instance-id>         # its REAL layout and copy
```

`tree` on an instance prints the master component: master sizes, master copy,
master visibility. All three are routinely contradicted. `inst` reads
`derivedSymbolData` — the layout Figma actually computed. Also check
`componentPropAssignments` in the instance's overrides: booleans like
`цена-"от"` switch whole elements on and off and appear in neither dump.

**2 — Diff the copy mechanically.**

```bash
npm run audit <page> <selector> <instance-id>
# worked example — the dealer home page's news title block:
npm run audit dealer/main '[data-section="news"] > div:nth-child(2)' 882:109468
```

Two columns, line by line: what the instance renders, what the page renders.
A missing element, an extra one and a **wrong order** each show up as a
mismatched row — the three defects eyes are worst at and that kept shipping.

- `<page>` is the path under `dist/pages/` without the extension.
- `<selector>` is the smallest element that wraps the block; quote it and escape
  Tailwind brackets (`'.rounded-l-\[32px\]'`).
- `<instance-id>` is the `<INSTANCE>` in the Figma frame that corresponds to it.

Exit code is non-zero on any mismatch. It is exact where the designer overrode
the copy (title blocks, button rows, menus); where an instance has no overrides
it can only show the master's filler — there, fall back to check 1 and read the
derived box size (a 43×18 text box is five characters, not "56 моделей").

**3 — Look at it.**

```bash
npm run shot <page>          # 1440 and 390 → .shots/, warns on x-overflow
```

Then **actually open the PNGs**, and crop into the block you changed rather than
glancing at the whole page — a strip 350px narrow and an invented icon both
survived every structural check and were caught only by eye. `npm run shot`
with no argument does every page.

Chromium is per-user (`npx playwright install chromium`, no root); its system
libraries need root (`sudo npx playwright install-deps chromium`). If a launch
fails on a fresh machine, that is why.

## Layout facts worth not rediscovering

- The desktop promo row is centred and overflows its 1360 frame, so the two edge
  tiles are clipped to slivers on purpose. Mobile shows three whole tiles.
- Compact "other" cards (152px) lay out as two rows of five on mobile
  (`.rail-2row`, column count handed in as `--cols`).
- Category tiles and the hero reproduce their Figma media box verbatim via CSS
  custom properties, with a separate box per breakpoint — they are not
  `object-cover`.
