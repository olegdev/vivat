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

- **Дилерская главная на 360 собрана без своего фрейма.** 360-фрейма у
  882:107882 по-прежнему нет. Шапка, нижняя навигация и выбор прайс-листа взяты
  из дилерского каталога 2225:160540 — это макет. А вот **новости рельсом,
  бургер-меню и дилерские ветки мобильного подвала** не нарисованы нигде и
  выведены нами: новости — 320-е карточки, как у мобильных «Акций», и две
  кнопки друг под другом (в ряд не влезают); меню — покупательский набор с
  «Мой кабинет» и «Выход» вместо «Стать дилером»; подвал — те же две ветки, что
  у десктопного. Показать дизайнеру.
- **Откуда берётся «Рекомендованная цена».** Пересчёт работает, но множителя в
  дизайне нет: в `data/dealer-home.js` стоит заглушка `RRP_FACTOR = 2`. Нужно
  поле у товара или правило.
- **Раскрытая «Своя наценка» на 1440 не нарисована.** Вариант
  `dropdown-header desktop/open` (1299:49518) рисует три строки по 44 и всё.
  Поле ввода и «Применить» перенесены с мобильной шторки 2225:164865.
- **Опечатка в макете: «Рекомендованая цена»** (одна «н») — рендерим
  «Рекомендованная». Поправить в исходнике, тогда `npm run audit` по строкам
  списка снова сойдётся.
- **Подпись «Минимальная наценка 50%»** у дизайнера 11/14 — размера, которого
  нет в шкале. Взят ближайший токен `body-xs` (12/16).
- **Отступ полоски.** Инстанс говорит `padH=12`, мастер — 24, дочерний фрейм
  стоит на x=24. Взято 24: при 12 тумблер залезает в скругление 32px.
- **Тумблер «Показывать цену»** прототипа не имеет; поведение задал заказчик:
  это выключатель применения выбранного прайс-листа. Выключен — цены оптовые,
  включён — выбранный в списке режим. Ничего не скрывает. Открытым остаётся
  одно: выбор режима при выключенном тумблере сейчас **не** включает его
  автоматически — цены не меняются, пока тумблер не вернут. Подтвердить.
- **Соцсети в подвале**: на десктопе шесть (с MAX), на мобильном пять.
  Расхождение досталось от покупательских фреймов, у дилерских своего 360 нет.
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
