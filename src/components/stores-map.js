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
let ICON = "../../assets/header";
let HOME = "../../assets/home";
export function setBases({ icon, home }) {
  if (icon) ICON = icon;
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

// ---- markup -----------------------------------------------------------------
function metro(name) {
  return `
    <span class="flex items-center gap-0.5">
      <img src="${HOME}/icon-metro.svg" alt="" class="size-4 shrink-0" />
      <span class="text-body-s text-text-secondary">${name}</span>
    </span>`;
}

function storeCard(s) {
  const metros = (s.metro || []).map(metro).join("");
  return `
  <button type="button" data-store="${s.id}" aria-expanded="false" class="store-card">
    <div class="flex w-full flex-col gap-1">
      <div class="flex w-full items-start justify-between gap-2">
        <p class="pr-6 text-h5 text-text-primary">${s.name}</p>
        <img src="${ICON}/chevron-down.svg" alt="" data-chevron class="size-6 shrink-0" />
      </div>
      <div class="flex flex-col gap-1.5">
        <p class="text-body-n text-text-primary">${s.address}</p>
        ${metros ? `<div class="flex flex-wrap gap-2">${metros}</div>` : ""}
      </div>
    </div>
    <div data-details hidden class="flex flex-col gap-1 pt-3">
      <span class="text-body-s text-text-secondary">${s.hours}</span>
      <span class="text-body-s text-text-primary">${s.phone}</span>
    </div>
  </button>`;
}

// Below the md breakpoint the section keeps only the title block and a 320px
// map with a centred "Где купить" call to action (Figma section / Наши салоны
// 1968:71568): no dealer panel, no peach backdrop, no zoom controls.
function shell({ title, description, city }) {
  return `
  <section class="flex w-[1440px] flex-col bg-surface-accent pb-16 max-md:w-full max-md:bg-bg-page max-md:pb-10">
    <div class="px-10 max-md:px-4">
      <div class="h-20 max-md:h-10"></div>
      <div class="flex w-[783px] flex-col max-md:w-full">
        <div class="flex min-h-11 items-center max-md:min-h-6">
          <h2 class="text-h2 text-text-primary max-md:text-m-h2">${title}</h2>
        </div>
        <div class="h-2 max-md:h-1"></div>
        <p class="text-body-n-accent text-text-primary max-md:text-m-body-n">${description}</p>
      </div>
      <div class="h-6 max-md:h-3"></div>
    </div>

    <div class="px-10 max-md:px-4">
      <div class="flex overflow-hidden rounded-l shadow-dropdown max-md:shadow-none">
        <!-- left panel -->
        <aside class="flex h-[680px] w-[440px] shrink-0 flex-col bg-surface-inverted max-md:hidden">
          <div class="flex flex-col gap-2 border-b border-divider-light pb-4 pl-10 pr-6 pt-6">
            <div class="flex h-8 items-center gap-1">
              <span class="text-h3 text-text-primary underline decoration-dotted underline-offset-4">${city}</span>
              <img src="${ICON}/icon-pin.svg" alt="" class="size-6" />
            </div>
            <div class="flex items-center gap-2">
              <span class="text-body-n text-text-primary">Только фирменные магазины</span>
              <label class="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" data-brand-only class="peer sr-only" />
                <span class="block h-6 w-10 rounded-full bg-components-disabled transition-colors peer-checked:bg-components-red"></span>
                <span class="pointer-events-none absolute left-0.5 top-0.5 size-5 rounded-full bg-surface-inverted transition-transform peer-checked:translate-x-4"></span>
              </label>
            </div>
          </div>
          <div data-store-list class="stores-scroll h-[580px] overflow-y-auto pl-4"></div>
        </aside>

        <!-- map -->
        <div class="relative h-[680px] flex-1 max-md:h-80">
          <div data-map class="size-full"></div>
          <div class="pointer-events-none absolute inset-x-0 top-0 z-10 hidden h-10 bg-linear-to-b from-alpha-black-100 to-transparent max-md:block"></div>
          <a href="#" class="btn btn-m btn-accent absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 px-6 max-md:flex">Где купить</a>
          <div class="absolute bottom-6 right-6 z-10 flex flex-col gap-2 max-md:hidden">
            <button type="button" data-zoom="1" class="map-ctrl" aria-label="Приблизить">+</button>
            <button type="button" data-zoom="-1" class="map-ctrl" aria-label="Отдалить">−</button>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

// ---- component --------------------------------------------------------------
export function renderStoresMap(anchor, opts) {
  const {
    stores,
    apiKey,
    title = "Наши салоны",
    description = "",
    city = "Москва",
    center = [55.7558, 37.6173], // 2.1 takes [lat, lon]
    zoom = 9,
  } = opts;

  // id + [lat, lon] (flip from the [lon, lat] authored in the data).
  const items = stores.map((s, i) => ({
    ...s,
    id: String(i),
    ll: [s.coords[1], s.coords[0]],
  }));

  anchor.innerHTML = shell({ title, description, city });
  const listEl = anchor.querySelector("[data-store-list]");
  const mapEl = anchor.querySelector("[data-map]");
  const toggleEl = anchor.querySelector("[data-brand-only]");

  let visible = items;
  let selectedId = null;
  let map = null;
  let currentZoom = zoom;
  const marks = new Map(); // store id -> { placemark, attached }

  // -- list ------------------------------------------------------------------
  function paintList() {
    listEl.innerHTML = visible.map(storeCard).join("");
    applySelection({ scroll: false });
  }

  function applySelection({ scroll = false } = {}) {
    for (const card of listEl.querySelectorAll("[data-store]")) {
      const on = card.dataset.store === selectedId;
      card.setAttribute("aria-current", String(on));
      card.setAttribute("aria-expanded", String(on));
      card.querySelector("[data-details]").hidden = !on;
      if (on && scroll) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    for (const [id, entry] of marks) {
      entry.placemark.properties.set("selected", id === selectedId);
    }
  }

  function select(id, { fly = false, scroll = false } = {}) {
    selectedId = selectedId === id ? null : id;
    applySelection({ scroll });
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

  // -- filter ----------------------------------------------------------------
  toggleEl.addEventListener("change", () => {
    visible = toggleEl.checked ? items.filter((s) => s.brand) : items;
    if (selectedId && !visible.some((s) => s.id === selectedId)) selectedId = null;
    paintList();
    syncMarkers();
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
  function mapFailed() {
    mapEl.innerHTML = `
      <div class="flex size-full flex-col items-center justify-center gap-2 bg-surface-default px-10 text-center">
        <p class="text-h5 text-text-primary">Карта временно недоступна</p>
        <p class="text-body-s text-text-secondary">Список салонов рядом — актуален.</p>
      </div>`;
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
}
