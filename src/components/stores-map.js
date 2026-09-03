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
  ["[data-panel-head]", [], ["max-md:border-0", "max-md:px-4", "max-md:pb-2", "max-md:pt-2"]],
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
  document.body.classList.toggle("overflow-hidden", on);
}

function enterSelectMode(anchor) {
  const q = (sel) => anchor.querySelector(sel);
  // Pages mount the partial either directly or inside a wrapper (main.js hands
  // in `[data-section="salony"]`), so find the section rather than assume it.
  const section = anchor.matches("[data-stores-section]")
    ? anchor
    : anchor.querySelector("[data-stores-section]");

  section.classList.add("stores-select");
  swap(section, ["bg-surface-accent", "pb-16", "max-md:pb-10"], [
    "bg-bg-page",
    "pb-16",
    "max-md:fixed",
    "max-md:inset-0",
    "max-md:z-40",
    "max-md:pb-0",
  ]);

  // the step's own heading sits above the block on mobile, in the modal header
  q("[data-stores-head]")?.classList.add("max-md:hidden");
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
  swap(q("[data-panel-head]"), [], ["max-md:border-0", "max-md:px-4", "max-md:pb-2", "max-md:pt-2"]);
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

  swap(section, ["bg-surface-accent", "pb-16", "max-md:bg-bg-page", "max-md:pb-10"], ["bg-bg-page"]);
  q("[data-stores-head]")?.classList.add("hidden");

  // Шапка панели здесь — только «Москва» с пином: тумблер «Только фирменные
  // магазины» в дереве есть, но на рендере варианта его нет.
  q("[data-panel-head]")?.parentElement
    ?.querySelector("[data-brand-only]")
    ?.closest("div.flex.items-center")
    ?.classList.add("hidden");
  swap(q("[data-panel-head]"), ["pl-10", "pr-6", "pt-6", "pb-4"], ["px-6", "py-6"]);

  q("[data-store-list]")?.classList.add("hidden");
  swap(q("[data-store-detail]"), ["hidden"], ["flex"]);
  // Слот сегментов под шапкой панели — он существует только на 360.
  q("[data-store-audience]")?.classList.remove("hidden");

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
      const a = line("text-body-s text-text-primary", "a");
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
      ...(d.hours?.rows || []).map(([l]) => span("text-body-s text-text-secondary", l))
    );
    values.replaceChildren(
      ...(d.hours?.rows || []).map(([, v]) => span("text-body-s text-text-primary", v))
    );
  }
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
    description,
    selectable = false,
    onSelect,
    contactPage = false,
    detail,
    center = [55.7558, 37.6173], // 2.1 takes [lat, lon]
    zoom = 9,
  } = opts;

  if (title) anchor.querySelector("[data-stores-title]").textContent = title;
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
      head?.classList.toggle("max-md:gap-1", on);
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

  if (!selectable && !contactPage) {
    let sheet = null;
    const closeBtn = anchor.querySelector("[data-map-close]");
    const open = (on) => {
      setFullMap(anchor, on);
      if (on) {
        sheet =
          sheet ||
          initStoreSheet({
            sheet: anchor.querySelector("[data-store-panel]"),
            track: anchor.querySelector("[data-map-frame]"),
            grip: anchor.querySelector("[data-sheet-grip]"),
            snaps: FULLMAP_SNAPS,
          });
        // Дорожка до раскрытия имела нулевую высоту — лист надо перемерить,
        // ровно та же причина, по которой `sync` публичен для шага 1 заказа.
        sheet?.collapse?.();
        sheet?.sync?.();
      }
      // Полотно меняет размер — карте надо пересчитаться, иначе она остаётся
      // с прежними границами и метки уезжают за край.
      requestAnimationFrame(() => map?.container?.fitToViewport?.());
    };
    // Лист, растянутый на весь экран, сворачивается кликом по карте — иначе
    // из раскрытого состояния можно выйти только ручкой.
    // Ловим `pointerdown` в фазе перехвата, а не `click`: полотно Яндекса
    // обрабатывает указатель само и click до нас не доходит вовсе — проверено,
    // до документа не долетает даже перехватывающий слушатель. Побочный эффект
    // осознанный: не только тап, но и начало панорамирования карты сворачивает
    // лист — это то же «пользователь пошёл в карту».
    anchor.querySelector("[data-map-pane]")?.addEventListener(
      "pointerdown",
      (e) => {
        if (e.target.closest("[data-map-cta], [data-map-close], [data-zoom]")) return;
        sheet?.collapse?.();
      },
      true
    );

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
  let map = null;
  let currentZoom = zoom;
  const marks = new Map(); // store id -> { placemark, attached }

  // Clone the card template and fill it — the future @foreach body.
  function buildStoreCard(s) {
    const node = cardTpl.content.firstElementChild.cloneNode(true);
    node.dataset.store = s.id;
    node.querySelector("[data-store-name]").textContent = s.name;
    node.querySelector("[data-store-address]").textContent = s.address;
    const fillSchedule = (el, schedule) => {
      if (!el || !schedule) return;
      el.replaceChildren(
        ...Object.values(schedule).map((v) => {
          const span = document.createElement("span");
          span.textContent = v;
          return span;
        })
      );
    };
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
      const chev = node.querySelector("[data-chevron]");
      if (chev) {
        chev.classList.add("max-xl:hidden", "max-md:block", "max-md:-rotate-90");
        chev.dataset.storeOpen = "";
      }
      // «Выбрать магазин» — только на 1440: в мобильной карточке её нет.
      const pick = node.querySelector("[data-store-pick]");
      pick?.classList.remove("hidden");
      pick?.classList.add("md:inline-flex");
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
      const on = card.dataset.store === selectedId;
      card.setAttribute("aria-current", String(on));
      // Выбор дилера карточку не разворачивает — в макете шеврон у выбранной
      // смотрит вниз, как у всех (946:122008).
      card.setAttribute("aria-expanded", String(on && !selectable));
      // Picking a dealer doesn't unfold hours/phone — the sheet's card has no
      // detail row and no chevron; reading the list still expands.
      card.querySelector("[data-details]").hidden = selectable || !on;
      const dot = card.querySelector("[data-store-radio] > span");
      if (dot) {
        dot.classList.toggle("border-components-strong", on);
        dot.classList.toggle("border-8", on);
      }
      // Кнопка карточки меняет и подпись, и цвет (946:134818 → 953:55451).
      const pick = card.querySelector("[data-store-pick]");
      if (pick) {
        pick.classList.toggle("bg-components-subtle", !on);
        pick.classList.toggle("text-text-primary", !on);
        pick.classList.toggle("bg-components-active-muted", on);
        pick.classList.toggle("text-text-inverse-primary", on);
        pick.querySelector("[data-store-pick-label]").textContent = on
          ? "Магазин выбран"
          : "Выбрать магазин";
        pick.querySelector("[data-store-pick-icon]").classList.toggle("hidden", !on);
      }
      if (on && scroll) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    for (const [id, entry] of marks) {
      entry.placemark.properties.set("selected", id === selectedId);
    }
  }

  function select(id, { fly = false, scroll = false } = {}) {
    // Reading the list, a second click on the open card closes it. Picking a
    // dealer for an order it must stick — you can change the choice, not unmake
    // it, because the step can't continue without one.
    selectedId = !selectable && selectedId === id ? null : id;
    applySelection({ scroll });
    if (selectable) onSelect?.(items.find((s) => s.id === selectedId) || null);
    if (fly && selectedId && map) {
      const store = items.find((s) => s.id === selectedId);
      currentZoom = Math.max(currentZoom, 13);
      map.setCenter(store.ll, currentZoom, { duration: 450 });
    }
  }

  listEl.addEventListener("click", (e) => {
    const card = e.target.closest("[data-store]");
    if (card) select(card.dataset.store, { fly: true });
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
    placemark.events.add("click", () => select(store.id, { scroll: true }));
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
      showDetailStep = wireStoreDetail(sheetApi);
      listEl?.addEventListener(
        "click",
        (e) => {
          const chev = e.target.closest("[data-store-open]");
          if (!chev) return;
          e.preventDefault();
          e.stopPropagation();
          const card = chev.closest("[data-store]");
          const item = items.find((x) => x.id === card?.dataset.store) || items[0];
          fillDetail(anchor, {
            // имя печатается в шапке листа, в теле его гасим пустой строкой
            name: "",
            address: item.address,
            metro: (item.metro || []).join(", "),
            routeLabel: "Проложить маршрут",
            // У салона из фикстуры есть одна строка часов и один телефон —
            // двух колонок «Консультация / Самовывоз» и почт там нет.
            dept: { title: "Телефон", phones: item.phone ? [item.phone] : [] },
            hours: { title: "Часы работы", rows: item.hours ? [["", item.hours]] : [] },
          });
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
