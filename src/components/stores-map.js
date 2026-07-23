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

// ---- component --------------------------------------------------------------
// The section shell + the dealer-card / metro-chip <template>s live in
// partials/stores.html (spliced into the page); this only queries and fills
// them. `opts.title/description/city` are now static content in the partial.
export function renderStoresMap(anchor, opts) {
  const {
    stores,
    apiKey,
    center = [55.7558, 37.6173], // 2.1 takes [lat, lon]
    zoom = 9,
  } = opts;

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
    listEl.replaceChildren(...visible.map(buildStoreCard));
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

  // -- filter (request seam) -------------------------------------------------
  // "Только фирменные магазины" — same method as the catalog filters
  // (SOLUTIONS.md › "Filters: form + request seam"). Today loadStores() filters
  // the in-memory list; later its body becomes fetch(`/stores?brand=${…}`) →
  // rebuild the list from the response. The `brand` flag lives in the URL so the
  // state survives refresh/share (replaceState — a minor control, no history
  // entry). Nothing above this changes when the fetch lands.
  function loadStores({ brandOnly }) {
    visible = brandOnly ? items.filter((s) => s.brand) : items;
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
