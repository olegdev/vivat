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

// ---- markup helpers ---------------------------------------------------------
const chevron = () =>
  `<img src="${ICON}/chevron-right.svg" alt="" class="size-6 shrink-0" />`;

function menuItem(label, { active = false } = {}) {
  return `<a href="#" class="catalog-menu-item"${active ? ' aria-current="true"' : ""}>
    <span class="min-w-0 flex-1 text-body-n-accent text-text-primary">${label}</span>
    ${chevron()}
  </a>`;
}

function chip(label) {
  return `<a href="#" class="catalog-chip">${label}</a>`;
}

function panelHTML() {
  return `
  <div data-catalog-overlay class="fixed inset-x-0 bottom-0 top-[116px] z-40 hidden">
    <div data-catalog-scrim class="absolute inset-0 bg-overlay-middle"></div>
    <div class="pointer-events-none absolute inset-y-0 left-1/2 w-[1440px] -translate-x-1/2">
      <div class="pointer-events-auto flex h-full w-fit bg-bg-page shadow-dropdown">
        <nav data-cat-col1 class="w-[300px] shrink-0 overflow-y-auto pb-6 pl-6 pr-3 pt-4"></nav>
        <div data-cat-col2 class="hidden w-[300px] shrink-0 flex-col gap-10 overflow-y-auto px-3 pb-10 pt-4"></div>
        <div data-cat-col3 class="hidden w-[300px] shrink-0 flex-col overflow-y-auto px-3 pb-10 pt-4"></div>
      </div>
    </div>
  </div>`;
}

// ---- init -------------------------------------------------------------------
export function initCatalogMenu(anchor, { toggle } = {}) {
  if (!anchor) return;
  anchor.innerHTML = panelHTML();

  const overlay = anchor.querySelector("[data-catalog-overlay]");
  const scrim = anchor.querySelector("[data-catalog-scrim]");
  const col1 = anchor.querySelector("[data-cat-col1]");
  const col2 = anchor.querySelector("[data-cat-col2]");
  const col3 = anchor.querySelector("[data-cat-col3]");
  const toggleIcon = toggle?.querySelector("[data-catalog-icon]");

  // column 1 — categories (default active = first with detail data)
  const defaultIndex = categories.findIndex((c) => c.sub || c.collections);
  col1.innerHTML = categories
    .map((c, i) => menuItem(c.name, { active: i === defaultIndex }))
    .join("");
  const col1Items = [...col1.children];

  function activate(index) {
    col1Items.forEach((el, i) => {
      if (i === index) el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
    });
    const cat = categories[index];

    // column 2 — sub-tabs + chips
    const hasCol2 = cat.sub?.length || cat.chips?.length;
    if (hasCol2) {
      col2.innerHTML = `
        ${cat.sub?.length ? `<div class="flex flex-col">${cat.sub.map((s) => menuItem(s.label, { active: s.active })).join("")}</div>` : ""}
        ${cat.chips?.length ? `<div class="flex flex-wrap gap-2">${cat.chips.map(chip).join("")}</div>` : ""}`;
    }
    col2.classList.toggle("hidden", !hasCol2);
    col2.classList.toggle("flex", !!hasCol2);

    // column 3 — collections
    const hasCol3 = cat.collections?.length;
    if (hasCol3) {
      col3.innerHTML = cat.collections.map((c) => menuItem(c)).join("");
    }
    col3.classList.toggle("hidden", !hasCol3);
    col3.classList.toggle("flex", !!hasCol3);
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
