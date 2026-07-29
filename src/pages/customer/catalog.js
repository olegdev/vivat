import "../../styles/app.css";
import { mountCarousel } from "../../components/carousel.js";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { fillGallery, initProductCards } from "../../components/product-card.js";
import { ICON } from "../../data/asset-base.js";
import { PRODUCTS, rub, popularItems } from "../../data/catalog.js";

// ---- shared chrome (header mega-menu + burger), same wiring as main.js ------
setCatalogIconBase(ICON);
initCatalogMenu(document.querySelector("[data-catalog]"), {
  toggle: document.querySelector("[data-catalog-toggle]"),
});
initMobileMenu(document.querySelector("[data-mobile-menu-root]"), {
  toggle: document.querySelector("[data-mobile-menu]"),
  catalogToggle: document.querySelector("[data-mobile-catalog]"),
});
initSearch();
initCart();

// =============================================================================
// Grid render — clone the page <template> per product (the future @foreach)
// =============================================================================
const grid = document.querySelector("[data-grid]");
const tpl = document.querySelector("[data-card-tpl]");

function badgeEl(b) {
  const tone = { new: "badge-new", hit: "badge-hit", discount: "badge-discount" }[b.tone] || "badge-new";
  const span = document.createElement("span");
  span.className = `badge badge-l ${tone}`;
  span.textContent = b.text;
  return span;
}
function swatchEl(s) {
  const wrap = document.createElement("span");
  wrap.className = "size-7 overflow-hidden rounded-full border border-alpha-default max-md:size-[18px]";
  if (s.img) {
    const img = document.createElement("img");
    img.src = s.img;
    img.alt = "";
    img.className = "size-full rounded-full object-cover";
    wrap.append(img);
  } else {
    const dot = document.createElement("span");
    dot.className = "block size-full rounded-full";
    dot.style.background = s.color;
    wrap.append(dot);
  }
  return wrap;
}

function buildCard(p) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  // Attributes the filters key on — printed straight onto the unit, as Blade
  // would print them from the model.
  node.dataset.collection = p.collection;
  node.dataset.facade = p.facade;
  node.dataset.form = p.form;
  node.dataset.color = p.color;
  node.dataset.style = p.style;
  node.dataset.price = String(p.price);
  // Two add-to-cart hooks per card (desktop icon-btn + mobile pill); both need
  // the id so the cart seam works at either breakpoint.
  node.querySelectorAll("[data-add-to-cart]").forEach((b) => (b.dataset.productId = p.id));

  // Same gallery as every other card on the site (photos + hover zones + dots),
  // filled by the shared component; only the unit around it is this page's own.
  fillGallery(node, p, { smallDots: true });
  node.querySelector("[data-card-price]").textContent = rub(p.price);
  node.querySelector("[data-card-oldprice]").textContent = p.oldPrice ? rub(p.oldPrice) : "";
  node.querySelector("[data-card-title]").textContent = p.title;
  node.querySelector("[data-card-comments]").textContent = String(p.comments);
  node.querySelector("[data-card-more]").textContent = p.more || "";

  const badges = node.querySelector("[data-card-badges]");
  (p.badges || []).forEach((b) => badges.append(badgeEl(b)));
  const swatches = node.querySelector("[data-card-swatches]");
  (p.swatches || []).forEach((s) => swatches.append(swatchEl(s)));
  return node;
}

// Keep a live handle on each card + its product so filtering/sorting is a DOM
// reshuffle, not a re-render.
const cards = PRODUCTS.map((p) => {
  const el = buildCard(p);
  grid.append(el);
  return { p, el };
});
// Filtering reshuffles these nodes rather than re-rendering them, so the gallery
// is wired once, here, over the whole grid.
initProductCards(grid);

// =============================================================================
// FILTERS — form + request seam
// =============================================================================
// The one place that "runs a search". Today it filters the rendered cards
// client-side and writes the URL. In the Blade build this whole function body
// becomes a request:
//
//     const res = await fetch(`/catalog?${params}`, { headers: { ... } });
//     grid.innerHTML = await res.text();            // server-rendered cards
//     count = Number(res.headers.get("X-Total"));   // or a JSON envelope
//
// Everything else — the form markup, the field names, the drawer wiring — stays
// exactly as-is. `params` below is already the query string the server will get.
// See SOLUTIONS.md › "Filters: form + request seam".
const form = document.querySelector("[data-filter-form]");
const drawer = document.querySelector("[data-filter-drawer]");
const countEl = document.querySelector("[data-filter-count]");
const badge = document.querySelector("[data-filter-badge]");
const totalEl = document.querySelector("[data-grid-total]");
const emptyEl = document.querySelector("[data-grid-empty]");

const MULTI = ["collection", "facade", "form", "color", "style"];

// Read the form into a plain state object: { collection:[…], facade:[…], …,
// price_min, price_max, price, sort }.
function readState() {
  const fd = new FormData(form);
  const state = {};
  for (const key of MULTI) state[key] = fd.getAll(`${key}[]`);
  state.price_min = (fd.get("price_min") || "").toString().replace(/\s/g, "");
  state.price_max = (fd.get("price_max") || "").toString().replace(/\s/g, "");
  state.price = fd.get("price") || "any";
  state.sort = currentSort;
  return state;
}

// Resolve the effective [min, max] price window from the radio preset and the
// two inputs (inputs win when filled).
function priceWindow(state) {
  let min = 0;
  let max = Infinity;
  if (state.price && state.price !== "any") {
    const [a, b] = state.price.split("-").map(Number);
    min = a || 0;
    max = b || Infinity;
  }
  if (state.price_min) min = Number(state.price_min);
  if (state.price_max) max = Number(state.price_max);
  return [min, max];
}

function matches(product, state, [min, max]) {
  for (const key of MULTI) {
    const sel = state[key];
    if (sel.length && !sel.includes(product[key])) return false;
  }
  if (product.price < min || product.price > max) return false;
  return true;
}

// Build the query string — the server-ready payload, and the browser URL.
function toParams(state) {
  const params = new URLSearchParams();
  for (const key of MULTI) if (state[key].length) params.set(key, state[key].join(","));
  if (state.price_min) params.set("price_min", state.price_min);
  if (state.price_max) params.set("price_max", state.price_max);
  if (state.price && state.price !== "any") params.set("price", state.price);
  if (state.sort && state.sort !== "popular") params.set("sort", state.sort);
  return params;
}

const SORTERS = {
  popular: null,
  cheap: (a, b) => a.p.price - b.p.price,
  expensive: (a, b) => b.p.price - a.p.price,
  new: (a, b) => Number(hasBadge(b, "new")) - Number(hasBadge(a, "new")),
  discount: (a, b) => (b.p.oldPrice ? b.p.oldPrice - b.p.price : 0) - (a.p.oldPrice ? a.p.oldPrice - a.p.price : 0),
};
const hasBadge = (c, tone) => (c.p.badges || []).some((x) => x.tone === tone);

// THE SEAM. Called on every filter/sort/chip change.
function applyFilters({ pushURL = true } = {}) {
  const state = readState();
  const win = priceWindow(state);

  // --- client-side stand-in for the server response -------------------------
  let visible = 0;
  for (const c of cards) {
    const ok = matches(c.p, state, win);
    c.el.classList.toggle("hidden", !ok);
    if (ok) visible += 1;
  }
  // sort: reorder the DOM (server would return them ordered)
  const sorter = SORTERS[state.sort];
  if (sorter) [...cards].sort(sorter).forEach((c) => grid.append(c.el));
  // --------------------------------------------------------------------------

  // count of active filter *groups* (drives the badge on the funnel button)
  const activeGroups =
    MULTI.filter((k) => state[k].length).length +
    (state.price !== "any" || state.price_min || state.price_max ? 1 : 0);

  countEl.textContent = String(visible);
  totalEl.textContent = String(visible);
  emptyEl.classList.toggle("hidden", visible > 0);
  grid.classList.toggle("hidden", visible === 0);
  badge.textContent = String(activeGroups);
  badge.classList.toggle("hidden", activeGroups === 0);
  funnel.classList.toggle("is-active", activeGroups > 0);

  syncChips(state, activeGroups > 0);
  syncPills(state);

  const params = toParams(state);
  if (pushURL) {
    const qs = params.toString();
    history.pushState(null, "", qs ? `?${qs}` : location.pathname);
  }
  return params;
}

// =============================================================================
// Drawer open / close
// =============================================================================
// A filter pill carries the section it opens (data-filter-open="price"); the
// funnel button and "Больше" chip open with no section (scroll to top).
function openDrawer(section) {
  drawer.classList.add("is-open");
  document.body.classList.add("overflow-hidden");
  const target = section && form.querySelector(`[data-filter-section="${section}"]`);
  if (target) {
    // panel is visible immediately (visibility, not display) — jump the form to
    // the requested group rather than always landing at the top.
    requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
  } else {
    form.scrollTop = 0;
  }
}
function closeDrawer() {
  drawer.classList.remove("is-open");
  document.body.classList.remove("overflow-hidden");
}
document.querySelectorAll("[data-filter-open]").forEach((b) =>
  b.addEventListener("click", () => openDrawer(b.dataset.filterOpen || null))
);
document.querySelector("[data-filter-close]").addEventListener("click", closeDrawer);
document.querySelector("[data-filter-dismiss]").addEventListener("click", closeDrawer);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer();
});

// Apply button just closes — filtering already ran live on every change. (When
// this becomes an AJAX call you may prefer to defer applyFilters() to here.)
document.querySelector("[data-filter-apply]").addEventListener("click", closeDrawer);

// Live-apply on any input change inside the form.
form.addEventListener("change", () => applyFilters());

// Per-group "очистить" (inside <summary>): must not toggle the <details>.
document.querySelectorAll("[data-filter-clear-group]").forEach((btn) =>
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const group = btn.dataset.filterClearGroup;
    form.querySelectorAll(`input[name="${group}[]"]`).forEach((i) => (i.checked = false));
    applyFilters();
  })
);

// Clear-all (drawer footer + empty-state button).
function clearAll() {
  form.reset();
  currentSort = "popular";
  syncSortLabel();
  applyFilters();
}
document.querySelectorAll("[data-filter-clear]").forEach((b) => b.addEventListener("click", clearAll));

// =============================================================================
// Quick-filter chips — shortcuts that toggle a single drawer field, then apply
// =============================================================================
// The row has two faces (Figma Catalog-default 882:89752 vs
// Catalog-selected-parameters 882:88832 / 1806:237553):
//
//   nothing selected → the full shortcut list, last chip "Больше ···"
//   something on     → *only* the active chips (grey fill + ×, click to
//                      release) followed by "Очистить все"
//
// so the row always reads as "the parameters you have selected". Chips cover
// the shortcut set only; groups picked inside the drawer surface as the count
// on their pill, not as a chip.
const chipRow = document.querySelector("[data-chips]");
const chipMore = document.querySelector("[data-chip-more]");
const chipClear = document.querySelector("[data-chip-clear]");

function inputFor(param, value) {
  return form.querySelector(`input[name="${param}[]"][value="${value}"]`);
}
document.querySelectorAll("[data-quickfilter]").forEach((chip) => {
  const [param, value] = chip.dataset.quickfilter.split("=");
  chip.addEventListener("click", () => {
    const input = inputFor(param, value);
    if (!input) return;
    input.checked = !input.checked;
    applyFilters();
  });
});

// Reflect form state back onto the chips (also covers URL hydration).
// `anyFilter` — not just "a shortcut is on" — decides which face to show, so a
// drawer-only selection still gets its "Очистить все".
function syncChips(state, anyFilter) {
  document.querySelectorAll("[data-quickfilter]").forEach((chip) => {
    const [param, value] = chip.dataset.quickfilter.split("=");
    const on = (state[param] || []).includes(value);
    chip.classList.toggle("catalog-chip--active", on);
    chip.classList.toggle("hidden", anyFilter && !on);
  });
  chipMore.classList.toggle("hidden", anyFilter);
  chipClear.classList.toggle("hidden", !anyFilter);
  // the selected row wraps on mobile; the shortcut list stays a scroll rail
  chipRow.toggleAttribute("data-selected", anyFilter);
}

// Pills + funnel: a group with a selection gets the dark-bordered pill and a
// muted count; the funnel goes dark with a white badge (Figma 882:88362).
const funnel = document.querySelector(".filter-funnel");
function syncPills(state) {
  document.querySelectorAll("[data-filter-pill]").forEach((pill) => {
    const group = pill.dataset.filterPill;
    const n =
      group === "price"
        ? Number(state.price !== "any" || !!state.price_min || !!state.price_max)
        : (state[group] || []).length;
    const countEl = pill.querySelector("[data-pill-count]");
    pill.classList.toggle("is-active", n > 0);
    countEl.textContent = n > 0 ? String(n) : "";
    countEl.classList.toggle("hidden", n === 0);
  });
}

// =============================================================================
// Sort dropdown
// =============================================================================
let currentSort = "popular";
const sortWrap = document.querySelector("[data-sort]");
const sortToggle = sortWrap.querySelector("[data-sort-toggle]");
const sortMenu = sortWrap.querySelector("[data-sort-menu]");
const sortLabel = sortWrap.querySelector("[data-sort-label]");
const sortChevron = sortWrap.querySelector("[data-sort-chevron]");
const SORT_LABELS = {
  popular: "Сначала популярные",
  cheap: "Сначала дешёвые",
  expensive: "Сначала дорогие",
  new: "По новизне",
  discount: "По размеру скидки",
};

function toggleSortMenu(open) {
  const show = open ?? sortMenu.classList.contains("hidden");
  sortMenu.classList.toggle("hidden", !show);
  sortToggle.setAttribute("aria-expanded", String(show));
  sortChevron.classList.toggle("rotate-180", show);
}
function syncSortLabel() {
  sortLabel.textContent = SORT_LABELS[currentSort];
  sortMenu.querySelectorAll("[data-sort-value]").forEach((o) =>
    o.setAttribute("aria-current", String(o.dataset.sortValue === currentSort))
  );
}
sortToggle.addEventListener("click", () => toggleSortMenu());
sortMenu.querySelectorAll("[data-sort-value]").forEach((opt) =>
  opt.addEventListener("click", () => {
    currentSort = opt.dataset.sortValue;
    syncSortLabel();
    toggleSortMenu(false);
    applyFilters();
  })
);
document.addEventListener("click", (e) => {
  if (!sortWrap.contains(e.target)) toggleSortMenu(false);
});

// =============================================================================
// URL hydration — read query on load so refresh/share restores the state
// =============================================================================
function hydrateFromURL() {
  const params = new URLSearchParams(location.search);
  for (const key of MULTI) {
    const raw = params.get(key);
    if (!raw) continue;
    raw.split(",").forEach((v) => {
      const input = inputFor(key, v);
      if (input) input.checked = true;
    });
  }
  const pmin = params.get("price_min");
  const pmax = params.get("price_max");
  if (pmin) form.querySelector('input[name="price_min"]').value = pmin;
  if (pmax) form.querySelector('input[name="price_max"]').value = pmax;
  const price = params.get("price");
  if (price) {
    const r = form.querySelector(`input[name="price"][value="${price}"]`);
    if (r) r.checked = true;
  }
  const sort = params.get("sort");
  if (sort && SORT_LABELS[sort]) currentSort = sort;
  syncSortLabel();
}

hydrateFromURL();
applyFilters({ pushURL: false });
window.addEventListener("popstate", () => {
  form.reset();
  currentSort = "popular";
  hydrateFromURL();
  applyFilters({ pushURL: false });
});

mountCarousel(
  document.querySelector('[data-section="popular"]'),
  {
    title: "Популярные товары для кухни",
    desc: "Подберите полезные товары, которые идеально дополнят вашу кухню VIVAT.",
    tabs: ["Все сразу", "Столешницы", "Бытовая техника", "Системы выдвижения", "Мойки", "Смесители"],
    endpoint: "/catalog/popular", // tab seam target (see carousel.js initTabs)
  },
  popularItems
);
