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
- PDP's «Состав» tab has no Figma frame — `partials/pdp-specs.html` holds
  placeholder rows there. Replace when the design lands.

## Дилерский раздел — ждём ответа дизайнера

Полная карта b2b-секций и все вопросы: `docs/FIGMA-MAP.md`. Здесь только то,
что уже уперлось в вёрстку.

- **Мобильной дилерской главной нет.** `dealer/main.html` свёрстана только на
  1440 и намеренно не тянет нижнюю навигацию и бургер-меню. Как придёт
  360-фрейм — дописать `max-md:` и вернуть мобильную обвязку.
- **Правый край тёмной полосы в шапке** — `text-action` 63px (607:27603),
  видимый, но подпись в экспорте филлерная («56 моделей»). Слот в
  `partials/header.html` зарезервирован пустым, чтобы держать ширину 1013px;
  заполнить, когда дизайнер назовёт элемент. Сейчас справа виден зазор.
- **Кнопка в дилерском подвале** (`buttons` 752:51003, тёмная, с конвертом) —
  подпись тоже филлер. Стоит «Подписаться на новости», выведено из иконки и из
  того, что такая модалка есть (1003:169259). Подтвердить или поправить.
- **Прайс-листы** (607:26932) — список рисует три строки, все подписаны
  «Оптовая цена». Реальная только выбранная; две другие в `data/dealer-home.js`
  стоят заглушками.
- **Дропдаун прайс-листов раскрыт в макете.** `value` 328×144 у мастера
  `visible: true`, инстанс это не переопределяет. Сделан закрытым как вменяемое
  состояние по умолчанию — подтвердить глазами в Figma.
- **Отступ полоски.** Инстанс говорит `padH=12`, мастер — 24, дочерний фрейм
  стоит на x=24. Взято 24: при 12 тумблер залезает в скругление 32px.
- **Тумблер «Показывать цену»** прототипа не имеет. Сейчас только переключает
  своё состояние и шлёт событие `dealer:price-visibility`; ничего не скрывает.
- **Блок «Производство»**: у дилерского фрейма затемнение `#111111/0.8`, у нас
  `overlay-middle` (0.6) — как было на покупательской. Уточнить, какое верно.
- **Полоса alert** на покупательской главной — старая инлайновая копия без
  иконки и крестика, предшествует `partials/alert.html`. Свести к партиалу,
  когда дизайнер подтвердит, что иконка и × нужны и там.

## Seams to wire (form + request seam pattern — see SOLUTIONS.md)

Places that will be a server round-trip in the Blade build. Done so far: catalog
filter drawer, popular-carousel tabs, site search (overlay + suggest),
add-to-cart, stores filter.

The JS-string structure debt is unwound: every repeated unit is now a clean HTML
`<template>` in its partial that the component clones (product-card, catalog-menu,
mobile-menu, stores). What stays in JS is only the mock *data* arrays
(`categories`, `stores`, the product lists) — in Blade those come from the model
and are printed into the same templates; nothing structural remains to convert.

- Search suggest is a seam in one function, `searchSuggest()` in
  components/search.js — it returns `{ hints, chips, items }`, exactly the shape
  a `/search/suggest?q=…` response should have. Its mock corpus is
  `src/data/search.js`; both go away when the endpoint lands. The overlay's own
  `<form action="/search" name="q">` already submits the real query.
- The designer re-cut `cards-other size=s` (Figma 632:27760): it now carries a
  swatch + comments row above the category tag, 322×410 instead of 386. The
  search card (`data-pcard-search`) is built to the new shape; the PDP's
  "Добавьте в корзину" rail still uses the old `data-pcard-other-s` template. No
  visible difference today — that rail's fixtures carry no swatches — but the
  two templates should be folded into one when someone next touches the PDP.

## Not started

- The remaining `src/pages/` stubs (PDP, order flow). The .fig has full designs —
  `fig.mjs find PDP` / `find Order`. Catalog (desktop) is done; its mobile canvas
  is the next iteration.
