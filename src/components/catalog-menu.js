// Catalog mega-menu — from Figma `menu` frames (882:119365 collapsed,
// 912:85445 expanded). Opened by the header "Весь каталог" button, it is a
// flyout that dims the page (scrim) and shows a white panel of up to three
// 300px columns: categories → subcategories + chips → collections.
//
// Data-driven: only "Кухни" is fully designed in Figma, so only it carries
// `sub` / `chips` / `collections`. Fill the other categories the same way as
// their designs land — the render/interaction layer already handles them.

import { categories } from "../data/catalog-menu.js";
import { catalogHref } from "./links.js";
export { categories };

let ICON = "../../assets/header";
export function setCatalogIconBase(base) {
  ICON = base;
}


// ---- template helpers -------------------------------------------------------
// The menu-item / chip units are clean HTML <template>s in the partial; this
// clones and fills them (the future @foreach body).
const clone = (sel) => document.querySelector(sel).content.firstElementChild.cloneNode(true);

// Каждая строка меню — запрос к каталогу: рубрика, коллекция или фильтр.
// В прототипе фильтровать нечем, но параметр пишется настоящий — это тот же
// шов, что у фильтров каталога и у вкладок рельсов (docs/LINK-MAP.md §4.7).
function buildItem(label, { active = false, param = "category" } = {}) {
  const el = clone("[data-menu-item]");
  el.querySelector("[data-label]").textContent = label;
  el.href = catalogHref(param, label);
  if (active) el.setAttribute("aria-current", "true");
  return el;
}

function buildChip({ label, filter }) {
  const el = clone("[data-menu-chip]");
  el.textContent = label;
  el.href = filter ? `catalog.html?${filter}` : "catalog.html";
  return el;
}

// ---- init -------------------------------------------------------------------
// The overlay/scrim/three-column shell + item templates are static markup in
// src/partials/catalog-menu.html. This only fills the columns (col1 from
// `categories`, col2/col3 swapped on hover) and drives open/close.
export function initCatalogMenu(anchor, { toggle } = {}) {
  if (!anchor) return;

  const overlay = anchor.querySelector("[data-catalog-overlay]");
  const scrim = anchor.querySelector("[data-catalog-scrim]");
  const col1 = anchor.querySelector("[data-cat-col1]");
  const col2 = anchor.querySelector("[data-cat-col2]");
  const col3 = anchor.querySelector("[data-cat-col3]");
  const col2Sub = col2.querySelector("[data-col2-sub]");
  const col2Chips = col2.querySelector("[data-col2-chips]");
  const toggleIcon = toggle?.querySelector("[data-catalog-icon]");

  // column 1 — categories (default active = first with detail data)
  const defaultIndex = categories.findIndex((c) => c.sub || c.collections);
  col1.replaceChildren(
    ...categories.map((c, i) => buildItem(c.name, { active: i === defaultIndex }))
  );
  const col1Items = [...col1.children];

  function hideCol3() {
    col3.classList.add("hidden");
    col3.classList.remove("flex");
    col3.replaceChildren();
  }

  // col1 → col2 only. col3 (collections) opens one level further, from a col2
  // sub-item (`showsCollections`), not alongside col2 — one column at a time.
  function activate(index) {
    col1Items.forEach((el, i) => {
      if (i === index) el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
    });
    const cat = categories[index];

    // column 2 — sub-tabs + chips, nothing pre-selected
    const subItems = (cat.sub || []).map((s) => buildItem(s.label, { param: "view" }));
    col2Sub.replaceChildren(...subItems);
    col2Chips.replaceChildren(...(cat.chips || []).map(buildChip));
    const hasCol2 = !!(cat.sub?.length || cat.chips?.length);
    col2.classList.toggle("hidden", !hasCol2);
    col2.classList.toggle("flex", hasCol2);
    hideCol3();

    (cat.sub || []).forEach((s, i) => {
      const el = subItems[i];
      const showSub = () => {
        subItems.forEach((x, j) => x.toggleAttribute("aria-current", j === i));
        if (s.showsCollections && cat.collections?.length) {
          col3.replaceChildren(...cat.collections.map((c) => buildItem(c, { param: "collection" })));
          col3.classList.remove("hidden");
          col3.classList.add("flex");
        } else {
          hideCol3();
        }
      };
      el.addEventListener("mouseenter", showSub);
      el.addEventListener("click", (e) => {
        e.preventDefault();
        showSub();
      });
    });
  }

  // hover or click a category to expand it
  col1Items.forEach((el, i) => {
    el.addEventListener("mouseenter", () => activate(i));
    el.addEventListener("click", (e) => {
      e.preventDefault();
      activate(i);
    });
  });
  // open / close --------------------------------------------------------------
  // col2/col3 start hidden (912:80439's collapsed frame draws only column 1)
  // and expand on the first real hover/click, not on open itself — and every
  // close resets back to that same collapsed state for the next open.
  function setOpen(open) {
    overlay.classList.toggle("hidden", !open);
    toggle?.setAttribute("aria-expanded", String(open));
    document.documentElement.classList.toggle("overflow-hidden", open);
    if (toggleIcon) {
      toggleIcon.src = `${ICON}/${open ? "icon-close" : "icon-burger"}.svg`;
    }
    if (!open) {
      col2.classList.add("hidden");
      col2.classList.remove("flex");
      hideCol3();
    }
  }
  const isOpen = () => !overlay.classList.contains("hidden");

  toggle?.addEventListener("click", (e) => {
    e.preventDefault();
    setOpen(!isOpen());
  });
  scrim.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) setOpen(false);
  });
}
