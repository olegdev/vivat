// Catalog mega-menu — from Figma `menu` frames (882:119365 collapsed,
// 912:85445 expanded). Opened by the header "Весь каталог" button, it is a
// flyout that dims the page (scrim) and shows a white panel of up to three
// 300px columns: categories → subcategories + chips → collections.
//
// Data-driven: only "Кухни" is fully designed in Figma, so only it carries
// `sub` / `chips` / `collections`. Fill the other categories the same way as
// their designs land — the render/interaction layer already handles them.

let ICON = "../../assets/header";
export function setCatalogIconBase(base) {
  ICON = base;
}

// ---- catalog data -----------------------------------------------------------
// Exported so the mobile burger menu (mobile-menu.js) drills into the same tree
// instead of keeping a second copy of it. Where the mobile mock lists a slightly
// different catalog, this tree wins — one source, both surfaces.
export const categories = [
  {
    name: "Кухни",
    // second-column sub-tabs; the active one drives the collections column
    sub: [{ label: "Все кухни" }, { label: "Коллекции", active: true }],
    chips: [
      "Прямые кухни",
      "Угловые кухни",
      "Фрезированые фасады",
      "Плоские фасады",
      "Стекло",
      "Мультицвет",
      "Белые",
      "Недорогие",
      "Популярные",
      "Для встраивоемой техники",
      "Под дерево",
    ],
    collections: [
      "Фьюжн",
      "Фрейм",
      "Нео",
      "Флэт",
      "Сканди",
      "Лофт",
      "Шале",
      "Барселона",
      "Квадро",
      "Дублин",
      "Евро",
      "Ницца",
      "Глетчер",
      "Прага",
      "Глетчер",
    ],
  },
  { name: "Техника для кухни" },
  { name: "Столешницы и фартуки" },
  { name: "Мойки и смесители" },
  { name: "Мебельная фурнитура" },
  { name: "Аксессуары для кухонь" },
  { name: "Столы и стулья" },
  { name: "Прихожие" },
  { name: "Для продавцов" },
];

// ---- template helpers -------------------------------------------------------
// The menu-item / chip units are clean HTML <template>s in the partial; this
// clones and fills them (the future @foreach body).
const clone = (sel) => document.querySelector(sel).content.firstElementChild.cloneNode(true);

function buildItem(label, { active = false } = {}) {
  const el = clone("[data-menu-item]");
  el.querySelector("[data-label]").textContent = label;
  if (active) el.setAttribute("aria-current", "true");
  return el;
}

function buildChip(label) {
  const el = clone("[data-menu-chip]");
  el.textContent = label;
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

  function activate(index) {
    col1Items.forEach((el, i) => {
      if (i === index) el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
    });
    const cat = categories[index];

    // column 2 — sub-tabs + chips
    col2Sub.replaceChildren(...(cat.sub || []).map((s) => buildItem(s.label, { active: s.active })));
    col2Chips.replaceChildren(...(cat.chips || []).map(buildChip));
    const hasCol2 = !!(cat.sub?.length || cat.chips?.length);
    col2.classList.toggle("hidden", !hasCol2);
    col2.classList.toggle("flex", hasCol2);

    // column 3 — collections
    const hasCol3 = !!cat.collections?.length;
    col3.replaceChildren(...(cat.collections || []).map((c) => buildItem(c)));
    col3.classList.toggle("hidden", !hasCol3);
    col3.classList.toggle("flex", hasCol3);
  }

  // hover or click a category to expand it
  col1Items.forEach((el, i) => {
    el.addEventListener("mouseenter", () => activate(i));
    el.addEventListener("click", (e) => {
      e.preventDefault();
      activate(i);
    });
  });
  if (defaultIndex >= 0) activate(defaultIndex);

  // open / close --------------------------------------------------------------
  function setOpen(open) {
    overlay.classList.toggle("hidden", !open);
    toggle?.setAttribute("aria-expanded", String(open));
    document.documentElement.classList.toggle("overflow-hidden", open);
    if (toggleIcon) {
      toggleIcon.src = `${ICON}/${open ? "icon-close" : "icon-burger"}.svg`;
    }
    if (open && defaultIndex >= 0) activate(defaultIndex);
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
