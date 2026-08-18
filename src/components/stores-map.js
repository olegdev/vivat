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
  if (!d.metro) q("[data-detail-metro]")?.classList.add("hidden");
  text("[data-detail-route-label]", d.routeLabel);
  text("[data-detail-dept-title]", d.dept.title);
  text("[data-detail-hours-title]", d.hours.title);

  const rows = q("[data-detail-dept-rows]");
  if (rows) {
    const line = (cls, tag = "p") => {
      const el = document.createElement(tag);
      el.className = cls;
      return el;
    };
    const nodes = d.dept.phones.map((p) => {
      const a = line("text-body-s text-text-primary", "a");
      a.href = `tel:${p.replace(/[^\d+]/g, "")}`;
      a.textContent = p;
      return a;
    });
    const mail = line("text-body-n text-text-primary underline", "a");
    mail.href = `mailto:${d.dept.email}`;
    mail.textContent = d.dept.email;
    nodes.push(mail);
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
      ...d.hours.rows.map(([l]) => span("text-body-s text-text-secondary", l))
    );
    values.replaceChildren(
      ...d.hours.rows.map(([, v]) => span("text-body-s text-text-primary", v))
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

  // id + [lat, lon] (flip from the [lon, lat] authored in the data).
  const items = stores.map((s, i) => ({
    ...s,
    id: String(i),
    ll: [s.coords[1], s.coords[0]],
  }));

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
    node.querySelector("[data-store-hours]").textContent = s.hours;
    node.querySelector("[data-store-phone]").textContent = s.phone;
    if (selectable) {
      // The sheet's card is the radio-and-ring variant; the desktop step-1 list
      // reuses the plain reading card, so both only differ below `md`.
      node.querySelector("[data-store-radio]")?.classList.add("max-md:flex");
      node.querySelector("[data-chevron]")?.classList.add("max-md:hidden");
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
  function paintList() {
    // В режиме contactPage списка нет — панель занимает карточка адреса.
    // Маркеры при этом строятся как обычно, из тех же items.
    if (contactPage) return;
    listEl.replaceChildren(...visible.map(buildStoreCard));
    applySelection({ scroll: false });
  }

  function applySelection({ scroll = false } = {}) {
    for (const card of listEl.querySelectorAll("[data-store]")) {
      const on = card.dataset.store === selectedId;
      card.setAttribute("aria-current", String(on));
      card.setAttribute("aria-expanded", String(on));
      // Picking a dealer doesn't unfold hours/phone — the sheet's card has no
      // detail row and no chevron; reading the list still expands.
      card.querySelector("[data-details]").hidden = selectable || !on;
      const dot = card.querySelector("[data-store-radio] > span");
      if (dot) {
        dot.classList.toggle("border-components-strong", on);
        dot.classList.toggle("border-8", on);
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

  loadYmaps(apiKey)
    .then((ymaps) => {
      map = new ymaps.Map(
        mapEl,
        { center, zoom, controls: [] },
        { suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true }
      );

      // Pin matches the Figma mock: blue Yandex-style teardrop with a hollow
      // white centre; the selected one turns VIVAT-red. aria-selected drives
      // the swap + balloon, exactly like the list cards (see app.css).
      const PinLayout = ymaps.templateLayoutFactory.createClass(
        `<div class="store-pin" aria-selected="{{ properties.selected }}">
           <img class="store-pin__img" src="${HOME}/pin-store.svg" alt="" />
           <img class="store-pin__img store-pin__img--active" src="${HOME}/pin-store-active.svg" alt="" />
           <span class="store-pin__popup">
             <span class="block text-h5 text-text-primary">{{ properties.storeName }}</span>
             <span class="block pt-1 text-body-s text-text-secondary">{{ properties.storeAddress }}</span>
           </span>
         </div>`
      );

      for (const store of items) {
        const placemark = new ymaps.Placemark(
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

      map.events.add("boundschange", () => {
        currentZoom = map.getZoom();
      });

      syncMarkers();
    })
    .catch(mapFailed);

  return {
    select,
    // The order page lays this block out while its step is still hidden, so
    // ymaps measures a zero-height container. Call this when the step opens.
    refresh() {
      map?.container.fitToViewport();
    },
  };
}
