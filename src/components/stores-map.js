// "Наши салоны" — dealer list + live Yandex Maps (JS API 2.1).
// Transcribed from Figma customer/Main › map-general (878:103602).
//
// The Figma frame ships a flat screenshot for the map area; everything else
// (left panel, header, dealer cards, scrollbar) is real component spec and is
// reproduced 1:1 here. The map itself is a real ymaps instance wired both ways:
// card ⇄ marker selection, and the "только фирменные" toggle filters both.
//
// API note: we target 2.1 (not v3) because that's what the project's Yandex key
// is provisioned for — v3 returns "Invalid api key" for the same key. Store
// coordinates below are authored as [lon, lat] (natural GeoJSON order); 2.1
// wants [lat, lon], so we flip once when building placemarks.

// Relative to the consuming page; set once via setBases() before rendering.
// Only the map pin still needs a base (its glyphs live under HOME); every other
// asset URL now lives in partials/stores.html.
let HOME = "../../assets/home";
export function setBases({ home }) {
  if (home) HOME = home;
}

// ---- ymaps loader (single shared script tag, whatever the call count) --------
let ymapsPromise;
function loadYmaps(apiKey) {
  if (ymapsPromise) return ymapsPromise;
  ymapsPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error("script load failed"));
    document.head.append(s);
  }).then(
    () =>
      new Promise((resolve) => {
        window.ymaps.ready(() => resolve(window.ymaps));
      })
  );
  return ymapsPromise;
}

// ---- «выбор магазина» mode ---------------------------------------------------
// The order page's шаг 1 mounts the same block to PICK a dealer (Figma
// map-general 942:110251 / mobile 2032:158435). Three things change, and all
// three are re-dressing, not a second component:
//
//   · the green surface goes white — the step owns the heading above it;
//   · a picked card carries the ring the dealer-card component already has;
//   · below `md` the block becomes a full-screen map with a bottom sheet, so
//     the panel that is `max-md:hidden` for reading comes back as the sheet.
//
// The classes are flipped from here rather than written into partials/stores.html
// because two other pages mount that partial for reading and must not carry
// them. Tailwind sees these literals when it scans src/**.
const swap = (el, off, on) => {
  if (!el) return;
  el.classList.remove(...off);
  el.classList.add(...on);
};

import { initStoreSheet } from "./store-sheet.js";
import { fillCityRows, isMobileCity } from "./city-select.js";
import { setScrollLock } from "./scroll-lock.js";

// Полноэкранная карта на мобиле для ЧИТАЮЩИХ страниц (главная, PDP): Figma
// `state=ordinary-min` 1859:334569 и `-max` 1859:334571. Та же трансформация,
// что у шага 1 заказа, только включается не при монтировании, а по кнопке
// «Где купить» — и снимается крестиком, поэтому список правок описан таблицей
// и проигрывается в обе стороны.
//
// Лист прилипает к 402 и 80 из 812 (доли 0.495 и 0.0985 — это верхний край
// листа в долях экрана, ровно как их считает store-sheet.js).
const FULLMAP_SNAPS = [0.495, 0.0985];

// z-50, а не z-40 как у шага 1 заказа: во фреймах `ordinary-*` тапбара нет
// вовсе — лист доходит до нижнего края экрана (402 + 410 = 812), — а тапбар
// живёт на z-40, поэтому карта должна лечь поверх него.
// Шапка листа (`header` 1821:331970, одна на все состояния набора): ручка 20,
// зазор 4, город (text-action 32) и строка тумблера вплотную (gap 0), потом
// content-поле 6 + зазор 4 до поиска, под ним 16 — те два последних несёт
// само поле (`data-sheet-search`), шапка снизу без поля.
const SHEET_HEAD = ["max-md:border-0", "max-md:px-4", "max-md:pb-0", "max-md:pt-1", "max-md:gap-0"];

const FULLMAP = [
  // Заливку не трогаем вовсе: ниже `md` секция и так белая своим
  // `max-md:bg-bg-page` из разметки. Раньше этот класс стоял в списке
  // добавляемых — и закрытие карты его снимало, оголяя коралловый.
  ["[data-stores-section]", ["max-md:pb-10"], ["max-md:fixed", "max-md:inset-0", "max-md:z-50", "max-md:overflow-hidden"]],
  ["[data-stores-head]", [], ["max-md:hidden"]],
  ["[data-map-wrap]", [], ["max-md:h-full", "max-md:px-0"]],
  ["[data-map-frame]", [], ["max-md:h-full", "max-md:rounded-none"]],
  ["[data-map-pane]", ["max-md:h-80"], ["max-md:absolute", "max-md:inset-0", "max-md:h-full"]],
  ["[data-map-cta]", [], ["max-md:hidden"]],
  ["[data-map-close]", ["hidden"], ["max-md:flex"]],
  ["[data-store-panel]", ["max-md:hidden"], ["max-md:absolute", "max-md:inset-x-0", "max-md:bottom-0", "max-md:z-20", "max-md:w-full", "max-md:rounded-t-xl", "max-md:shadow-dropdown"]],
  ["[data-sheet-grip]", [], ["max-md:flex"]],
  ["[data-sheet-search]", [], ["max-md:flex"]],
  ["[data-panel-head]", [], SHEET_HEAD],
];

function setFullMap(anchor, on) {
  const section = anchor.matches("[data-stores-section]")
    ? anchor
    : anchor.querySelector("[data-stores-section]");
  for (const [sel, off, add] of FULLMAP) {
    const el = sel === "[data-stores-section]" ? section : anchor.querySelector(sel);
    if (!el) continue;
    el.classList.remove(...(on ? off : add));
    el.classList.add(...(on ? add : off));
  }
  // Страница под раскрытой картой скроллиться не должна.
  setScrollLock("stores-map", on);
}

function enterSelectMode(anchor) {
  const q = (sel) => anchor.querySelector(sel);
  // Pages mount the partial either directly or inside a wrapper (main.js hands
  // in `[data-section="salony"]`), so find the section rather than assume it.
  const section = anchor.matches("[data-stores-section]")
    ? anchor
    : anchor.querySelector("[data-stores-section]");

  section.classList.add("stores-select");
  // `max-xl:pb-0` снимается: на читающих страницах за картой на планшете
  // сразу следующий блок, а здесь под ней плашка «Вы выбрали…» — без
  // отступа она прилипает к рамке. Планшетного кадра у заказа нет, поэтому
  // поле такое же, как на 1440 (64).
  // Снимать надо настоящий `pb-[72px]` партиала: раньше здесь стоял `pb-16`,
  // которого у секции нет, и 72 оставались поверх 64 — шаг 1 выходил на 8
  // выше кадра (map-general 942:110251).
  swap(section, ["bg-surface-accent", "pb-[72px]", "max-md:pb-10", "max-xl:pb-0"], [
    "bg-bg-page",
    "pb-16",
    "max-md:fixed",
    "max-md:inset-0",
    "max-md:z-40",
    "max-md:pb-0",
  ]);

  // the step's own heading sits above the block on mobile, in the modal header
  q("[data-stores-head]")?.classList.add("max-md:hidden");
  // Над заголовком шага поле 64, а не 80 читающих страниц: text-container
  // 953:115274 с padV 64 сразу под плашкой.
  const headGap = q("[data-stores-head]")?.firstElementChild;
  if (headGap) swap(headGap, ["h-20"], ["h-16"]);
  // Подзаголовок шага — 20/32 (953:120993), а не 16/22 читающих страниц.
  swap(q("[data-stores-desc]"), ["text-body-n-accent"], ["text-body-l"]);

  // full-bleed, full-height map area below `md`
  swap(q("[data-map-wrap]"), ["max-md:px-4"], ["max-md:h-full", "max-md:px-0"]);
  swap(q("[data-map-frame]"), [], ["max-md:h-full", "max-md:rounded-none"]);
  swap(q("[data-map-pane]"), ["max-md:h-80"], ["max-md:absolute", "max-md:inset-0", "max-md:h-full"]);
  q("[data-map-cta]")?.classList.add("max-md:hidden");

  // the reading panel becomes the sheet; its height is set by store-sheet.js
  swap(q("[data-store-panel]"), ["max-md:hidden"], [
    "max-md:absolute",
    "max-md:inset-x-0",
    "max-md:bottom-0",
    "max-md:z-20",
    "max-md:w-full",
    "max-md:rounded-t-xl",
    "max-md:shadow-dropdown",
  ]);
  // `hidden` stays and `max-md:flex` overrides it below `md` — the variant is
  // emitted after the plain utility, so it wins where it applies. Removing
  // `hidden` instead would leak the element onto the desktop panel.
  q("[data-sheet-grip]")?.classList.add("max-md:flex");
  q("[data-sheet-search]")?.classList.add("max-md:flex");
  // the city + toggle block keeps its content at both widths, only the desktop
  // panel's generous gutters shrink to the sheet's 16
  swap(q("[data-panel-head]"), [], SHEET_HEAD);
}

// Вариант `type=contact page` (1456:56787) — четвёртый режим того же блока.
// Рамка, шапка панели, полотно карты и зум те же; меняется тело панели: вместо
// списка салонов одна карточка адреса. Плюс блок теряет заголовок и подложку —
// на Контактах над картой стоит переключатель «Опт / Розница», а не title-block.
function enterContactPageMode(anchor, detail) {
  const q = (sel) => anchor.querySelector(sel);
  const section = anchor.matches("[data-stores-section]")
    ? anchor
    : anchor.querySelector("[data-stores-section]");

  // Нижняя отбивка блока — зелёной плашки главной, а не Контактов: тут карта
  // 1440×680 стоит вплотную к «Нашим сотрудникам» (map 1456:54411 кончается на
  // 952, employees 1462:56243 там же и начинается — свои 80 он приносит сам).
  // Класс в партиале однажды сменился с `pb-16` на `pb-[72px]`, а этот список
  // остался прежним, и 72 жили под картой как лишний воздух.
  swap(section, ["bg-surface-accent", "pb-[72px]", "max-xl:pb-0", "max-md:bg-bg-page", "max-md:pb-10"], ["bg-bg-page"]);
  q("[data-stores-head]")?.classList.add("hidden");

  // Шапка панели здесь — только «Москва» с пином: тумблер «Только фирменные
  // магазины» в дереве есть, но на рендере варианта его нет.
  q("[data-panel-head]")?.parentElement
    ?.querySelector("[data-brand-only]")
    ?.closest("div.flex.items-center")
    ?.classList.add("hidden");
  // Шапка `header` 2225:105841: поля 24, снизу 16 (stackPaddingBottom), линия
  // под ней. На 360 (2225:107435) — 16/16 по вертикали, слева 24, справа 16,
  // и линии нет: у шапки независимые толщины обводки, и все они нулевые.
  swap(q("[data-panel-head]"), ["pl-10", "pr-6"], ["px-6", "max-md:border-0", "max-md:py-4", "max-md:pr-4"]);

  q("[data-store-list]")?.classList.add("hidden");
  // Карточка адреса на 360 — dealer-card 2225:107632: обводки не крашены,
  // так что и над ней линии нет; её padV 12 вместе с padV 12 внутреннего
  // контейнера дают 24 до названия, а снизу 16 + 12 = 28 под кнопкой.
  swap(q("[data-store-detail]"), ["hidden"], ["flex", "max-md:pt-3", "max-md:pb-7"]);
  // Кегли карточки на 360 — по её собственному кадру (description
  // 2225:107635), а не по десктопному мастеру: название 22/26, адрес 14/20,
  // метро 12/16. Только здесь: тот же блок на шаге выбора магазина в заказе
  // печатает имя в шапке листа, а адрес — как в 2225:106827.
  swap(q("[data-detail-name]"), ["max-md:text-h5"], ["max-md:text-m-h2"]);
  swap(q("[data-detail-address]"), ["max-md:text-m-body-l"], ["max-md:text-m-body-n"]);
  q("[data-detail-metro-name]")?.classList.add("max-md:text-m-body-s");
  // и зазоры того же `description`: название → адрес 8 (не 16 колонки),
  // адрес → метро 8 (не 6, как на 1440)
  swap(q("[data-detail-address]")?.parentElement, ["max-md:gap-1.5"], ["max-md:-mt-2", "max-md:gap-2"]);
  // Слот сегментов под шапкой панели — он существует только на 360. В кадре
  // (2225:107318) ряд ровно 44: без своих вертикальных полей и без линий.
  swap(q("[data-store-audience]"), ["hidden", "py-2"], []);

  // На 360 (вариант 2225:106894, 360×902) блок перестаёт быть «панель слева,
  // карта справа»: полотно 360 сверху, панель во всю ширину под ним, и панель
  // наезжает на карту на 8 скруглённым верхом. Карта здесь во всю ширину.
  swap(q("[data-map-wrap]"), ["max-md:px-4"], ["max-md:px-0"]);
  // Панель в разметке идёт перед картой (слева на 1440), а на 360 она под
  // ней, поэтому колонка перевёрнутая.
  swap(q("[data-map-frame]"), [], ["max-md:flex-col-reverse", "max-md:rounded-none"]);
  // flex-1 в колонке даёт нулевую базу, поэтому полотну нужен flex-none
  swap(q("[data-map-pane]"), ["max-md:h-80"], ["max-md:h-[360px]", "max-md:flex-none"]);
  q("[data-map-cta]")?.classList.add("max-md:hidden");
  swap(q("[data-store-panel]"), ["max-md:hidden"], [
    "max-md:relative",
    "max-md:z-10",
    "max-md:-mt-2",
    "max-md:h-auto",
    "max-md:w-full",
    "max-md:rounded-t-[var(--radius-l)]",
  ]);

  fillDetail(anchor, detail);
}

// Тело карточки адреса. Листовые строки (телефоны, почта, часы) создаются
// здесь, а не шаблонами: это отдельные текстовые узлы, а не единицы вёрстки, —
// тот же приём, что у ссылки внутри ответа в components/accordion.js.
//
// Кегль строк — 16/24, а не 14/18: в мастере они набраны BodyS, но экземпляр
// `type=contact page` (1456:54411) переопределяет им СТИЛЬ на 44:85 — тот же
// Desktop/BodyN, что у адреса. Видно только по symbolOverrides и по ширине
// уложенной строки (телефон 145 против 127 у мастера). Ниже `md` остаётся
// 14/18: мобильный вариант карточки — нетронутая копия мастера, без
// собственного набора.
function fillDetail(anchor, d) {
  if (!d) return;
  const q = (sel) => anchor.querySelector(sel);
  const text = (sel, v) => {
    const el = q(sel);
    if (el) el.textContent = v;
  };

  text("[data-detail-name]", d.name);
  text("[data-detail-address]", d.address);
  text("[data-detail-metro-name]", d.metro || "");
  // toggle, а не add: карточка перерисовывается при смене режима «Опт /
  // Розница», и у второго адреса метро может быть, когда у первого его нет.
  q("[data-detail-metro]")?.classList.toggle("hidden", !d.metro);
  text("[data-detail-route-label]", d.routeLabel);
  // Карточку заполняют два разных источника: у Контактов это подробная запись
  // склада, у шага «Выбор магазина» — обычный салон из data/stores.js, где
  // ни двух колонок часов, ни почт нет. Поэтому всё необязательное — через
  // `?.`, а пустые блоки просто не заполняются (см. BACKLOG.md).
  text("[data-detail-dept-title]", d.dept?.title || "");
  text("[data-detail-hours-title]", d.hours?.title || "");

  const rows = q("[data-detail-dept-rows]");
  if (rows) {
    const line = (cls, tag = "p") => {
      const el = document.createElement(tag);
      el.className = cls;
      return el;
    };
    const nodes = (d.dept?.phones || []).map((p) => {
      const a = line("text-body-n text-text-primary max-md:text-body-s", "a");
      a.href = `tel:${p.replace(/[^\d+]/g, "")}`;
      a.textContent = p;
      return a;
    });
    if (d.dept?.email) {
      const mail = line("text-body-n text-text-primary underline", "a");
      mail.href = `mailto:${d.dept.email}`;
      mail.textContent = d.dept.email;
      nodes.push(mail);
    }
    rows.replaceChildren(...nodes);
  }

  const labels = q("[data-detail-hours-labels]");
  const values = q("[data-detail-hours-values]");
  if (labels && values) {
    const span = (cls, v) => {
      const el = document.createElement("span");
      el.className = cls;
      el.textContent = v;
      return el;
    };
    labels.replaceChildren(
      // строки графика на 360 — 14/20 (2225:107652), не 14/18, как телефоны
      ...(d.hours?.rows || []).map(([l]) => span("text-body-n text-text-secondary max-md:text-m-body-n", l))
    );
    values.replaceChildren(
      ...(d.hours?.rows || []).map(([, v]) => span("text-body-n text-text-primary max-md:text-m-body-n", v))
    );
  }
}

// Консультация/Самовывоз столбцы — общие для карточки в списке
// (buildStoreCard) и раскрытой карточки шага «Выбор магазина»
// (wireStoreDetail): один салон из data/stores.js, две одинаковые формы.
function fillSchedule(el, schedule) {
  if (!el || !schedule) return;
  el.replaceChildren(
    ...Object.values(schedule).map((v) => {
      const span = document.createElement("span");
      span.textContent = v;
      return span;
    })
  );
}

// ---- component --------------------------------------------------------------
// The section shell + the dealer-card / metro-chip <template>s live in
// partials/stores.html (spliced into the page); this only queries and fills
// them. `opts.city` is static content in the partial; `title`/`description`
// override the partial's defaults for a page that mounts the block under a
// different heading (the PDP's "Где купить").
export function renderStoresMap(anchor, opts) {
  const {
    stores,
    apiKey,
    title,
    titleMobile,
    description,
    selectable = false,
    onSelect,
    contactPage = false,
    detail,
    center = [55.7558, 37.6173], // 2.1 takes [lat, lon]
    zoom = 9,
    // Коралловое поле под картой у каждой страницы своё: 80 на обеих PDP
    // (map-general 1686:63231 — 938 при содержимом 858), 72 на главных
    // (878:103602 — 952 при 880). Значение по умолчанию — главная.
    padBottom = 72,
  } = opts;

  // Значение кладём в атрибут, а не собираем класс строкой: Tailwind видит
  // только то, что написано в исходниках, и `pb-[80px]`, склеенный в рантайме,
  // не попадает в сборку — отступ просто обнуляется. Правило живёт в app.css.
  if (padBottom !== 72) {
    const section = anchor.querySelector("[data-stores-section]");
    if (section) section.dataset.padBottom = String(padBottom);
  }

  if (title) {
    anchor.querySelector("[data-stores-title]").textContent = title;
    const mobileTitleEl = anchor.querySelector("[data-stores-title-mobile]");
    if (mobileTitleEl) mobileTitleEl.textContent = titleMobile || title;
  }
  if (description) anchor.querySelector("[data-stores-desc]").textContent = description;
  if (selectable) enterSelectMode(anchor);
  if (contactPage) enterContactPageMode(anchor, detail);

  // Читающие страницы: коралловая «Где купить» посреди карты раскрывает её на
  // весь экран с листом, крестик сворачивает обратно. Выбирающий режим этого не
  // получает — он и так раскрыт, а на Контактах кнопки нет.
  // ---- селектор города в шапке панели ---------------------------------------
  // Один и тот же список городов и на читающих страницах, и на шаге выбора
  // магазина: ниже `md` он подменяет тело панели (Figma `type=city`
  // 1859:335134), в шапке появляется стрелка назад. Раньше это работало только
  // в читающем режиме, и «Москва» на шаге заказа не нажималась.
  function wireCitySelector() {
    const cityBtn = anchor.querySelector("[data-city-toggle]");
    if (!cityBtn) return null;
    // Контакты ведут этот триггер сами (свой опт/розница выбор региона и
    // города в contacts.js, через data-place-menu) — общий city-select.js не
    // должен вешать на него ещё один обработчик, иначе по клику открываются
    // оба меню разом, одно поверх другого со смещением.
    if (contactPage) return null;
    cityBtn.querySelector("[data-panel-city]")?.setAttribute("data-city-label", "");

    const cityPanel = anchor.querySelector("[data-city-panel]");
    const backBtn = anchor.querySelector("[data-panel-back]");
    const head = anchor.querySelector("[data-panel-head]");
    const search = anchor.querySelector("[data-sheet-search]");
    const hideForCity = [
      anchor.querySelector("[data-store-list]"),
      anchor.querySelector("[data-brand-only]")?.closest("div.flex.items-center"),
    ];

    const showCities = (on) => {
      cityOpen = on;
      fillCityRows(cityPanel, document);
      cityPanel?.classList.toggle("hidden", !on);
      cityPanel?.classList.toggle("flex", on);
      backBtn?.classList.toggle("hidden", !on);
      backBtn?.classList.toggle("flex", on);
      hideForCity.forEach((el) => el?.classList.toggle("hidden", on));
      search?.classList.toggle("max-md:flex", !on);
      head?.classList.toggle("max-md:flex-row", on);
      head?.classList.toggle("max-md:items-center", on);
      head?.classList.toggle("max-md:justify-between", on);
      head?.classList.toggle("max-md:border-0", !on);
    };

    cityBtn.setAttribute("data-city-open", "");
    cityBtn.addEventListener("click", () => {
      if (isMobileCity()) showCities(true);
    });
    backBtn?.addEventListener("click", () => showCities(false));
    document.addEventListener("city:change", () => showCities(false));
    return showCities;
  }

  let cityOpen = false;
  let showDetailStep = null;
  const showCities = wireCitySelector();

  // ---- шаг «карточка магазина» на выборе дилера ------------------------------
  // В макете это отдельный экран визарда (2397:152957): тап по строке магазина
  // подменяет тело листа его карточкой, в шапке появляется стрелка назад, а сам
  // лист поднимается выше обеих обычных точек — полоса карты остаётся 50.
  let detailOpen = false;

  function wireStoreDetail(sheetApi) {
    const backBtn = anchor.querySelector("[data-panel-back]");
    const detail = anchor.querySelector("[data-store-detail]");
    const list = anchor.querySelector("[data-store-list]");
    const head = anchor.querySelector("[data-panel-head]");
    const search = anchor.querySelector("[data-sheet-search]");

    const cityBtn = anchor.querySelector("[data-city-toggle]");
    const title = anchor.querySelector("[data-panel-title]");
    const brandRow = anchor.querySelector("[data-brand-only]")?.closest("div.flex.items-center");
    // Контакты показывают склад (dept/hours общего вида), шаг «Выбор
    // магазина» — тот же салон, что и в списке (Консультация/Самовывоз,
    // соцсети, почта): два разных тела в одном слоте, переключаются раз и
    // навсегда по `selectable`, см. stores.html.
    anchor.querySelector("[data-store-detail-contact]")?.classList.toggle("hidden", selectable);
    anchor.querySelector("[data-store-detail-contact]")?.classList.toggle("flex", !selectable);
    anchor.querySelector("[data-store-detail-order]")?.classList.toggle("hidden", !selectable);
    anchor.querySelector("[data-store-detail-order]")?.classList.toggle("flex", selectable);

    const show = (on, store, { snap = true } = {}) => {
      detail?.classList.toggle("hidden", !on);
      detail?.classList.toggle("flex", on);
      list?.classList.toggle("hidden", on);
      search?.classList.toggle("max-md:flex", !on);
      backBtn?.classList.toggle("hidden", !on);
      backBtn?.classList.toggle("flex", on);
      // Город и тумблер на этом шаге уходят, вместо города — имя магазина.
      cityBtn?.classList.toggle("hidden", on);
      brandRow?.classList.toggle("hidden", on);
      if (title) {
        title.classList.toggle("hidden", !on);
        title.classList.toggle("flex", on);
        if (on && store) title.textContent = store.name;
      }
      head?.classList.toggle("max-md:flex-row", on);
      head?.classList.toggle("max-md:items-center", on);
      // Ряд «стрелка + имя» 40 идёт сразу за ручкой (header 1859:336834
      // @20), без зазора 4, который есть у списка перед городом (`max-md:pt-1`
      // из SHEET_HEAD; один `pt-0` его не перебил бы — в CSS он раньше).
      head?.classList.toggle("max-md:pt-1", !on);
      head?.classList.toggle("max-md:pt-0", on);
      // …а снизу у неё 4 до линии (header 360×64 = 20 + 40 + 4); у списка
      // нижнее поле несёт поле поиска, поэтому там `pb-0`.
      head?.classList.toggle("max-md:pb-1", on);
      // Шапка `shop-step-2` (1859:336659) отделена от карточки чертой 1px
      // `#e7e7e7` снизу — как и в списке городов; у списка магазинов черты нет.
      head?.classList.toggle("max-md:border-0", !on);
      detailOpen = on;
      if (!snap) return;
      if (on) sheetApi?.peak?.(0.058);
      else sheetApi?.expand?.();
    };

    backBtn?.addEventListener("click", () => show(false));
    // Крестик над картой сворачивает лист целиком — и карточку магазина вместе
    // с ним, иначе она осталась бы «открытой» под свёрнутой панелью.
    sheetApi?.closeBtn?.addEventListener("click", () => {
      if (detailOpen) show(false, null, { snap: false });
      sheetApi.collapse?.();
    });
    return show;
  }

  // ---- лист ниже `md`: общее поведение всех хозяев --------------------------
  // Лист создаётся по-разному — читающие страницы строят его по «Где купить»,
  // шаг 1 заказа отдаёт свой через attachSheet(), — но ведёт себя одинаково:
  //
  //   · фокус в «Найти по адресу» раскрывает его — иначе клавиатура закрывает
  //     и без того короткий свёрнутый список;
  //   · тап по карте сворачивает — иначе из раскрытого состояния можно выйти
  //     только ручкой. Ловим `pointerdown` в фазе перехвата, а не `click`:
  //     полотно Яндекса обрабатывает указатель само и click до нас не доходит
  //     вовсе — до документа не долетает даже перехватывающий слушатель.
  //     Побочный эффект осознанный: начало панорамирования тоже сворачивает
  //     лист — это то же «пользователь пошёл в карту». Метка — исключение:
  //     тап по ней выбирает магазин, и лист со списком должен остаться;
  //   · высота листа — это поле карты снизу: полёт к магазину целится в
  //     видимую полосу, а не под лист (см. flyTo).
  let sheet = null;
  function wireSheet(api) {
    if (!api) return;
    sheet = api;
    anchor.querySelector("[data-store-search]")?.addEventListener("focus", () => {
      if (isMobileCity()) api.expand?.();
    });
    anchor.querySelector("[data-map-pane]")?.addEventListener(
      "pointerdown",
      (e) => {
        if (e.target.closest("[data-map-cta], [data-map-close], [data-zoom], .store-pin")) return;
        api.collapse?.();
      },
      true
    );
  }

  // Полноэкранная карта — единственное состояние ниже `md`, где полотно
  // тянется одним пальцем. В потоке страницы (320 на читающих, 360 на
  // Контактах) перетаскивание выключено: иначе свайп по карте перехватывает
  // прокрутку страницы и на ней «застреваешь». Двумя пальцами (multiTouch)
  // карту по-прежнему можно двигать и масштабировать. Колесо выключено на всех
  // ширинах — для масштаба есть свои «+»/«−», а колесо над картой посреди
  // страницы должно листать страницу.
  let fullscreen = selectable;
  function syncBehaviors() {
    if (!map) return;
    map.behaviors.disable("scrollZoom");
    if (isMobileCity() && !fullscreen) map.behaviors.disable("drag");
    else map.behaviors.enable("drag");
  }
  window.matchMedia("(max-width: 47.99rem)").addEventListener("change", syncBehaviors);

  if (!selectable && !contactPage) {
    const closeBtn = anchor.querySelector("[data-map-close]");
    const open = (on) => {
      setFullMap(anchor, on);
      fullscreen = on;
      if (on) {
        if (!sheet) {
          wireSheet(
            initStoreSheet({
              sheet: anchor.querySelector("[data-store-panel]"),
              track: anchor.querySelector("[data-map-frame]"),
              grip: anchor.querySelector("[data-sheet-grip]"),
              handles: [anchor.querySelector("[data-panel-head]")],
              snaps: FULLMAP_SNAPS,
            })
          );
        }
        // Дорожка до раскрытия имела нулевую высоту — лист надо перемерить,
        // ровно та же причина, по которой `sync` публичен для шага 1 заказа.
        sheet?.collapse?.();
        sheet?.sync?.();
      }
      syncBehaviors();
      // Полотно меняет размер — карте надо пересчитаться, иначе она остаётся
      // с прежними границами и метки уезжают за край.
      requestAnimationFrame(() => map?.container?.fitToViewport?.());
    };

    anchor.querySelector("[data-map-cta]")?.addEventListener("click", (e) => {
      e.preventDefault();
      open(true);
    });
    closeBtn?.addEventListener("click", () => open(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && closeBtn && !closeBtn.classList.contains("hidden")) open(false);
    });
  }

  // id + [lat, lon] (flip from the [lon, lat] authored in the data).
  // Координат может не быть — тогда карточка живёт в списке без метки.
  const withIds = (list) =>
    list.map((s, i) => ({ ...s, id: String(i), ll: s.coords ? [s.coords[1], s.coords[0]] : null }));
  let items = withIds(stores);

  const listEl = anchor.querySelector("[data-store-list]");
  const mapEl = anchor.querySelector("[data-map]");
  const toggleEl = anchor.querySelector("[data-brand-only]");
  const cardTpl = anchor.querySelector("[data-store-card]");
  const metroTpl = anchor.querySelector("[data-metro-chip]");

  let visible = items;
  let selectedId = null;
  // Раскрытая карточка и выбранный дилер — не одно и то же на десктопе: клик
  // по «Выбрать магазин» выбирает, клик по остальной части карточки
  // раскрывает/сворачивает, независимо друг от друга (946:121438/946:122008 —
  // разные condition). На читающих страницах раскрытия своего понятия выбора
  // нет вовсе, там это по-прежнему один и тот же клик — см. applySelection.
  let expandedId = null;
  let map = null;
  let currentZoom = zoom;
  const marks = new Map(); // store id -> { placemark, attached }

  // Clone the card template and fill it — the future @foreach body.
  function buildStoreCard(s) {
    const node = cardTpl.content.firstElementChild.cloneNode(true);
    node.dataset.store = s.id;
    node.querySelector("[data-store-name]").textContent = s.name;
    node.querySelector("[data-store-address]").textContent = s.address;
    fillSchedule(node.querySelector("[data-store-consult]"), s.consultation);
    fillSchedule(node.querySelector("[data-store-pickup]"), s.pickup);
    node.querySelector("[data-store-detail-phone]").textContent = s.phone;
    node.querySelector("[data-store-email]").textContent = s.email;
    node.querySelector("[data-store-website]").textContent = s.website;
    if (selectable) {
      // The sheet's card is the radio-and-ring variant; the desktop step-1 list
      // reuses the plain reading card, so both only differ below `md`.
      node.querySelector("[data-store-radio]")?.classList.add("max-md:flex");
      // Ниже `md` шеврон не прячется, а поворачивается вправо и становится
      // входом в карточку магазина — отдельный шаг визарда (2397:152957).
      // На 1440 и 768 он раскрывает карточку, как на читающих страницах
      // (service-icons в шапке 946:121407 и 2477:169218).
      const chev = node.querySelector("[data-chevron]");
      if (chev) {
        chev.classList.add("max-md:-rotate-90");
        chev.dataset.storeOpen = "";
      }
      // «Выбрать магазин» — только на 1440: в мобильной карточке её нет.
      // `hidden` остаётся в базовом классе — снимать его нельзя, иначе кнопка
      // видна на всех ширинах ещё до срабатывания md:inline-flex.
      node.querySelector("[data-store-pick]")?.classList.add("md:inline-flex");
    }
    const metroWrap = node.querySelector("[data-store-metro]");
    (s.metro || []).forEach((name) => {
      const chip = metroTpl.content.firstElementChild.cloneNode(true);
      chip.querySelector("[data-metro-name]").textContent = name;
      metroWrap.append(chip);
    });
    return node;
  }

  // -- list ------------------------------------------------------------------
  function renderList() {
    listEl.replaceChildren(...visible.map(buildStoreCard));
    applySelection({ scroll: false });
  }

  function paintList() {
    // В режиме contactPage списка при загрузке нет — панель занимает карточка
    // адреса. Маркеры при этом строятся как обычно, из тех же items. Список
    // всё же появляется, когда Контакты переключаются в розницу: там его
    // рисует setStores() напрямую.
    if (contactPage) return;
    renderList();
  }

  function applySelection({ scroll = false } = {}) {
    for (const card of listEl.querySelectorAll("[data-store]")) {
      const picked = card.dataset.store === selectedId;
      card.setAttribute("aria-current", String(picked));
      // На десктопе раскрытие карточки (клик по ней самой) независимо от
      // выбора дилера (клик по «Выбрать магазин») — те же content-раскрытие,
      // что на читающих страницах, просто с добавленной кнопкой (946:121438
      // condition=pressed vs 946:122008 condition=selected). На читающих
      // страницах такого понятия выбора нет вовсе, там раскрытие и есть тот
      // же клик — expanded совпадает с picked. На мобиле у листа своя
      // раскрытая карточка магазина (2397:152957), отдельный шаг визарда, не
      // этот блок.
      const mobileSelect = selectable && isMobileCity();
      const expanded = selectable ? card.dataset.store === expandedId && !mobileSelect : picked;
      card.setAttribute("aria-expanded", String(expanded));
      card.querySelector("[data-details]").hidden = !expanded;
      const dot = card.querySelector("[data-store-radio] > span");
      if (dot) {
        dot.classList.toggle("border-components-strong", picked);
        dot.classList.toggle("border-8", picked);
      }
      // Кнопка карточки меняет и подпись, и цвет (946:134818 → 953:55451).
      const pick = card.querySelector("[data-store-pick]");
      if (pick) {
        pick.classList.toggle("bg-components-subtle", !picked);
        pick.classList.toggle("text-text-primary", !picked);
        pick.classList.toggle("bg-components-active-muted", picked);
        pick.classList.toggle("text-text-inverse-primary", picked);
        pick.querySelector("[data-store-pick-label]").textContent = picked
          ? "Магазин выбран"
          : "Выбрать магазин";
        pick.querySelector("[data-store-pick-icon]").classList.toggle("hidden", !picked);
      }
      // С метки на мобиле карточку ставим первой строкой списка: в свёрнутом
      // листе видна одна-две строки, и «ближайшая» позиция оставила бы её за
      // краем. На десктопе список высокий, там достаточно «nearest».
      if (picked && scroll) {
        card.scrollIntoView({ block: sheet && isMobileCity() ? "start" : "nearest", behavior: "smooth" });
      }
    }
    for (const [id, entry] of marks) {
      const on = id === selectedId;
      entry.placemark.properties.set("selected", on);
      // Всплывашка живёт внутри слоя метки, а слои Яндекс раскладывает по
      // `zIndex` метки — без него подсказку выбранной точки перекрывали
      // соседние булавки, лежащие в DOM позже. Выбранная метка поднимается
      // над всеми, снятая возвращает значение по умолчанию.
      if (on) entry.placemark.options.set("zIndex", 1000);
      else entry.placemark.options.unset("zIndex");
    }
  }

  function select(id, { fly = false, scroll = false } = {}) {
    // Reading the list, a second click on the open card closes it. Picking a
    // dealer for an order it must stick — you can change the choice, not unmake
    // it, because the step can't continue without one.
    selectedId = !selectable && selectedId === id ? null : id;
    if (!selectable) expandedId = selectedId;
    applySelection({ scroll });
    if (selectable) onSelect?.(items.find((s) => s.id === selectedId) || null);
    if (fly && selectedId && map) {
      const store = items.find((s) => s.id === selectedId);
      currentZoom = Math.max(currentZoom, 13);
      flyTo(store.ll, currentZoom);
    }
  }

  // Полёт к точке. Ниже `md` лист закрывает низ полотна, а setCenter целится
  // в геометрический центр — метка приезжала под лист. `useMapMargin` сдвигает
  // цель в видимую часть: поле снизу — текущая высота листа.
  function flyTo(ll, z) {
    if (!ll || !map) return;
    map.margin.setDefaultMargin([0, 0, sheet?.height?.() ?? 0, 0]);
    map.setCenter(ll, z, { duration: 450, useMapMargin: true });
  }

  // Десктоп, режим выбора: раскрытие — свой клик, не проходит через select().
  function toggleExpand(id, { scroll = false } = {}) {
    expandedId = expandedId === id ? null : id;
    applySelection({ scroll: false });
    if (scroll && expandedId) {
      listEl
        .querySelector(`[data-store="${expandedId}"]`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  listEl.addEventListener("click", (e) => {
    const card = e.target.closest("[data-store]");
    if (!card) return;
    if (selectable && !isMobileCity() && e.target.closest("[data-store-pick]")) {
      select(card.dataset.store, { fly: true });
    } else if (selectable && !isMobileCity()) {
      toggleExpand(card.dataset.store);
    } else {
      select(card.dataset.store, { fly: true });
    }
  });

  // -- filter (request seam) -------------------------------------------------
  // "Только фирменные магазины" — same method as the catalog filters
  // (SOLUTIONS.md › "Filters: form + request seam"). Today loadStores() filters
  // the in-memory list; later its body becomes fetch(`/stores?brand=${…}`) →
  // rebuild the list from the response. The `brand` flag lives in the URL so the
  // state survives refresh/share (replaceState — a minor control, no history
  // entry). Nothing above this changes when the fetch lands.
  // `query` is the sheet's address search (2209:210691), which only exists in
  // select mode; it narrows the same list the toggle does, through the same seam.
  let query = "";
  function loadStores({ brandOnly }) {
    const needle = query.trim().toLowerCase();
    visible = items.filter(
      (s) =>
        (!brandOnly || s.brand) &&
        (!needle || `${s.name} ${s.address}`.toLowerCase().includes(needle))
    );
    if (selectedId && !visible.some((s) => s.id === selectedId)) selectedId = null;
    paintList();
    syncMarkers();
    // Пустая выдача — «Ничего не найдено», а не пустая панель. Контакты
    // ведут свою панель сами (contacts.js), их не трогаем.
    if (!contactPage) anchor.querySelector("[data-store-empty]")?.classList.toggle("hidden", visible.length > 0);
  }
  function writeURL(brandOnly) {
    const params = new URLSearchParams(location.search);
    if (brandOnly) params.set("brand", "1");
    else params.delete("brand");
    const qs = params.toString();
    history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
  }
  toggleEl.addEventListener("change", () => {
    loadStores({ brandOnly: toggleEl.checked });
    writeURL(toggleEl.checked);
  });

  anchor.querySelector("[data-store-search]")?.addEventListener("input", (e) => {
    query = e.target.value;
    loadStores({ brandOnly: toggleEl.checked });
  });

  function syncMarkers() {
    if (!map) return;
    const shown = new Set(visible.map((s) => s.id));
    for (const [id, entry] of marks) {
      const on = shown.has(id);
      if (on === entry.attached) continue;
      if (on) map.geoObjects.add(entry.placemark);
      else map.geoObjects.remove(entry.placemark);
      entry.attached = on;
    }
  }

  // Hydrate the filter from the URL (?brand=1) so refresh/share restores it.
  if (new URLSearchParams(location.search).get("brand") === "1") {
    toggleEl.checked = true;
    visible = items.filter((s) => s.brand);
  }
  paintList();

  // -- zoom controls ---------------------------------------------------------
  anchor.querySelectorAll("[data-zoom]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!map) return;
      currentZoom = Math.min(21, Math.max(0, currentZoom + Number(btn.dataset.zoom)));
      map.setZoom(currentZoom, { duration: 250 });
    });
  });

  // -- map -------------------------------------------------------------------
  // Markup is the [data-map-failed] <template> in partials/stores.html.
  function mapFailed() {
    const tpl = document.querySelector("[data-map-failed]");
    if (tpl) mapEl.replaceChildren(tpl.content.cloneNode(true));
  }

  let ymapsApi = null;
  let PinLayout = null;

  function addMarker(store) {
    const placemark = new ymapsApi.Placemark(
      store.ll,
      { selected: false, storeName: store.name, storeAddress: store.address },
      {
        iconLayout: PinLayout,
        iconShape: { type: "Rectangle", coordinates: [[-10, -45], [18, 0]] },
        hideIconOnBalloonOpen: false,
      }
    );
    // На шаге выбора дилера (1440/768) метка — то же, что клик по карточке:
    // раскрывает её и подкручивает список, а выбор остаётся за «Выбрать
    // магазин» — иначе тап по метке сразу открывал шаг 2.
    placemark.events.add("click", () =>
      selectable && !isMobileCity()
        ? toggleExpand(store.id, { scroll: true })
        : select(store.id, { scroll: true })
    );
    marks.set(store.id, { placemark, attached: true });
    map.geoObjects.add(placemark);
  }

  // Метки строятся по текущему `items` — и при первой загрузке, и когда список
  // заменили (переключение города в рознице).
  function buildMarkers() {
    if (!ymapsApi || !map) return;
    for (const { placemark } of marks.values()) map.geoObjects.remove(placemark);
    marks.clear();
    for (const store of items) if (store.ll) addMarker(store);
    syncMarkers();
  }

  loadYmaps(apiKey)
    .then((ymaps) => {
      ymapsApi = ymaps;
      map = new ymaps.Map(
        mapEl,
        { center, zoom, controls: [] },
        { suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true }
      );

      // Pin matches the Figma mock: blue Yandex-style teardrop with a hollow
      // white centre; the selected one turns VIVAT-red. aria-selected drives
      // the swap + balloon, exactly like the list cards (see app.css).
      PinLayout = ymaps.templateLayoutFactory.createClass(
        `<div class="store-pin" aria-selected="{{ properties.selected }}">
           <img class="store-pin__img" src="${HOME}/pin-store.svg" alt="" />
           <img class="store-pin__img store-pin__img--active" src="${HOME}/pin-store-active.svg" alt="" />
           <span class="store-pin__popup">
             <span class="block text-h5 text-text-primary">{{ properties.storeName }}</span>
             <span class="block pt-1 text-body-s text-text-secondary">{{ properties.storeAddress }}</span>
           </span>
         </div>`
      );

      map.events.add("boundschange", () => {
        currentZoom = map.getZoom();
      });

      syncBehaviors();
      buildMarkers();
    })
    .catch(mapFailed);

  return {
    select,
    // Стрелка в модальной шапке заказа сначала закрывает подэкран листа —
    // список городов или карточку магазина — и только потом уходит на
    // предыдущий шаг. Возвращает true, если было что закрыть.
    closeSubPanel() {
      if (detailOpen) {
        showDetailStep?.(false);
        return true;
      }
      if (cityOpen) {
        showCities?.(false);
        return true;
      }
      return false;
    },
    // The order page lays this block out while its step is still hidden, so
    // ymaps measures a zero-height container. Call this when the step opens.
    refresh() {
      map?.container.fitToViewport();
    },
    // Розничный режим Контактов заменяет весь список: другой город — другие
    // магазины, свои метки и своя точка карты.
    setStores(next, { center: c, zoom: z } = {}) {
      items = withIds(next);
      visible = items;
      selectedId = null;
      renderList();
      buildMarkers();
      if (c) map?.setCenter(c, z ?? currentZoom, { duration: 450 });
    },
    // Лист создаёт страница (у него своя дорожка и свои точки прилипания),
    // поэтому она же его сюда и отдаёт: без листа шеврону некуда поднимать
    // карточку магазина.
    attachSheet(sheetApi) {
      if (!selectable) return;
      wireSheet(sheetApi);
      showDetailStep = wireStoreDetail(sheetApi);
      listEl?.addEventListener(
        "click",
        (e) => {
          const chev = e.target.closest("[data-store-open]");
          if (!chev || !isMobileCity()) return;
          e.preventDefault();
          e.stopPropagation();
          const card = chev.closest("[data-store]");
          const item = items.find((x) => x.id === card?.dataset.store) || items[0];
          // Открытая карточка — это уже выбранный магазин: в 2397:152957 кнопка
          // «Выберите дилера» активна, а в списке (2059:169141) — disabled.
          // Карта под листом остаётся на месте, лететь к метке незачем.
          select(item.id);
          fillDetail(anchor, {
            // имя печатается в шапке листа, в теле его гасим пустой строкой
            name: "",
            address: item.address,
            metro: (item.metro || []).join(", "),
            routeLabel: "Проложить маршрут",
          });
          fillSchedule(anchor.querySelector("[data-detail-order-consult]"), item.consultation);
          fillSchedule(anchor.querySelector("[data-detail-order-pickup]"), item.pickup);
          const orderText = (sel, v) => {
            const el = anchor.querySelector(sel);
            if (el) el.textContent = v || "";
          };
          orderText("[data-detail-order-phone]", item.phone);
          orderText("[data-detail-order-email]", item.email);
          orderText("[data-detail-order-website]", item.website);
          showDetailStep(true, item);
        },
        true
      );
    },
    // Панель показывает либо одну карточку адреса (опт), либо список магазинов
    // (розница) — это те же два тела, что у режимов `contact page` и обычного.
    setPanel(mode) {
      anchor.querySelector("[data-store-list]")?.classList.toggle("hidden", mode !== "list");
      const detail = anchor.querySelector("[data-store-detail]");
      detail?.classList.toggle("hidden", mode !== "detail");
      detail?.classList.toggle("flex", mode === "detail");
    },
    // Режим `contact page` показывает один адрес, и Контакты переключают его
    // сегментами «Опт / Розница»: карточка перезаполняется, на карте остаётся
    // одна метка — та, что соответствует адресу, — и карта едет к ней.
    showDetail(store) {
      const item = items.find((s) => s.name === store.name) || items[0];
      fillDetail(anchor, store);
      visible = items.filter((s) => s.id === item.id);
      syncMarkers();
      map?.setCenter(item.ll, currentZoom, { duration: 450 });
    },
  };
}
