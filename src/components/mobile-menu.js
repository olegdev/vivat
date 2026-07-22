// Mobile burger menu — Figma section "menu catalog / menu burger" (1997:254993).
// Four frames describe one drill-down panel:
//   burger-menu         1997:254994 — root "Меню" + socials
//   burger-menu-step-2  1997:255072 — "Каталог" (reached from the root)
//   catalog-menu        1997:255145 — "Каталог" opened directly (bottom nav)
//   catalog-menu-step-2 1997:255219 — one category, "По коллекциям"
//
// Below md the panel covers the whole viewport (it has to sit above the fixed
// 72px nav-bar, hence z-50): 48px header with back / title / close, a search
// field, a list of 44px rows, and — on the root view only — the social row
// pinned to the bottom. Above md it never renders.
//
// Data-driven and stack-based: `stack` holds the views, `render()` paints the
// top one. State is expressed through ARIA / hidden, not class juggling.

import { categories } from "./catalog-menu.js";

let ICON = "../../assets/header";
export function setMobileMenuBases({ icons } = {}) {
  if (icons) ICON = icons;
}

// ---- data -------------------------------------------------------------------
// Root level of the burger menu (Figma 1997:255059 "menu-main-block").
const rootSections = [
  { label: "Каталог", view: "catalog" },
  { label: "Где купить", href: "#" },
  { label: "Компания", href: "#" },
  { label: "Полезная информация", href: "#" },
  { label: "Для бизнеса", href: "#" },
  { label: "Стать дилером", href: "#" },
];

const socials = [
  { name: "zen", label: "Дзен" },
  { name: "vk", label: "ВКонтакте" },
  { name: "tg", label: "Telegram" },
  { name: "yt", label: "YouTube" },
  { name: "rt", label: "Rutube" },
];

// A category becomes drillable only when the shared catalog tree actually has
// something below it — "Все кухни" plus the "По коллекциям" caption and list.
function categoryChildren(cat) {
  const items = [];
  if (cat.sub?.[0]) items.push({ label: cat.sub[0].label, href: "#" });
  if (cat.collections?.length) {
    items.push({ label: "По коллекциям", caption: true });
    items.push(...cat.collections.map((name) => ({ label: name, href: "#" })));
  }
  return items;
}

const catalogItems = categories.map((cat) => {
  const children = categoryChildren(cat);
  return children.length
    ? { label: cat.name, title: cat.name, items: children }
    : { label: cat.name, href: "#" };
});

// ---- markup helpers ---------------------------------------------------------
function row(item, index) {
  if (item.caption) {
    return `<p class="mobile-menu-item text-m-body-n-accent text-text-muted">${item.label}</p>`;
  }
  const inner = `<span class="min-w-0 flex-1 text-m-body-n-accent text-text-primary">${item.label}</span>
    <img src="${ICON}/chevron-right-s.svg" alt="" class="size-6 shrink-0" />`;
  if (item.items || item.view) {
    return `<button type="button" class="mobile-menu-item" data-menu-index="${index}" aria-haspopup="true">${inner}</button>`;
  }
  return `<a href="${item.href || "#"}" class="mobile-menu-item" data-menu-index="${index}">${inner}</a>`;
}

function socialHTML() {
  return socials
    .map(
      (s) =>
        `<a href="#" aria-label="${s.label}" class="social-icon size-10"><span class="size-8 social-${s.name}"></span></a>`,
    )
    .join("");
}

function panelHTML() {
  return `
  <div data-mm-overlay class="fixed inset-0 z-50 hidden md:hidden">
    <div data-mm-scrim class="absolute inset-0 bg-overlay-middle"></div>
    <div data-mm-panel class="absolute inset-0 flex flex-col bg-bg-page" role="dialog" aria-modal="true" aria-label="Меню">
      <div class="flex h-12 shrink-0 flex-col border-b border-divider-light bg-surface-inverted px-4 pt-1">
        <div class="flex h-10 items-center">
          <button type="button" data-mm-back class="hidden size-10 shrink-0 items-center" aria-label="Назад">
            <img src="${ICON}/chevron-left.svg" alt="" class="size-6" />
          </button>
          <span data-mm-title class="min-w-0 flex-1 truncate text-m-h2 text-text-primary"></span>
          <button type="button" data-mm-close class="flex size-10 shrink-0 items-center justify-end" aria-label="Закрыть меню">
            <img src="${ICON}/icon-close-s.svg" alt="" class="size-6" />
          </button>
        </div>
      </div>

      <div data-mm-body class="flex min-h-0 flex-1 flex-col overflow-y-auto pb-10">
        <div class="px-4 pt-4">
          <form class="flex h-11 items-center gap-4 rounded-pill bg-components-subtle px-4" role="search" onsubmit="return false">
            <input
              type="search"
              placeholder="Найти на сайте"
              aria-label="Найти на сайте"
              class="min-w-0 flex-1 bg-transparent text-body-s-accent text-text-primary outline-none placeholder:text-text-muted"
            />
            <img src="${ICON}/icon-search.svg" alt="" class="size-6 shrink-0" />
          </form>
        </div>
        <div class="mt-8 flex flex-1 flex-col justify-between px-4">
          <nav data-mm-list class="flex flex-col"></nav>
          <div data-mm-social class="mt-8 flex shrink-0 items-center gap-2">${socialHTML()}</div>
        </div>
      </div>
    </div>
  </div>`;
}

// ---- init -------------------------------------------------------------------
export function initMobileMenu(anchor, { toggle, catalogToggle } = {}) {
  if (!anchor) return;
  anchor.innerHTML = panelHTML();

  const overlay = anchor.querySelector("[data-mm-overlay]");
  const scrim = anchor.querySelector("[data-mm-scrim]");
  const panel = anchor.querySelector("[data-mm-panel]");
  const body = anchor.querySelector("[data-mm-body]");
  const backBtn = anchor.querySelector("[data-mm-back]");
  const closeBtn = anchor.querySelector("[data-mm-close]");
  const titleEl = anchor.querySelector("[data-mm-title]");
  const listEl = anchor.querySelector("[data-mm-list]");
  const socialEl = anchor.querySelector("[data-mm-social]");

  const ROOT_VIEW = { title: "Меню", items: rootSections, social: true };
  const CATALOG_VIEW = { title: "Каталог", items: catalogItems };

  let stack = [ROOT_VIEW];
  let lastFocused = null;

  function show(el, visible) {
    el.classList.toggle("hidden", !visible);
    el.classList.toggle("flex", visible);
  }

  function render() {
    const view = stack[stack.length - 1];
    titleEl.textContent = view.title;
    show(backBtn, stack.length > 1);
    show(socialEl, !!view.social);
    listEl.innerHTML = view.items.map(row).join("");
    body.scrollTop = 0;
    // the row that triggered the drill-down is gone — keep focus inside
    if (isOpen() && !panel.contains(document.activeElement)) focusables()[0]?.focus();
  }

  listEl.addEventListener("click", (e) => {
    const el = e.target.closest("[data-menu-index]");
    if (!el) return;
    const item = stack[stack.length - 1].items[Number(el.dataset.menuIndex)];
    if (!item) return;
    if (item.view === "catalog") {
      e.preventDefault();
      stack.push(CATALOG_VIEW);
      render();
    } else if (item.items) {
      e.preventDefault();
      stack.push({ title: item.title || item.label, items: item.items });
      render();
    }
    // plain links keep their default navigation
  });

  backBtn.addEventListener("click", () => {
    if (stack.length > 1) stack.pop();
    render();
  });

  // ---- open / close ---------------------------------------------------------
  const isOpen = () => !overlay.classList.contains("hidden");

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function focusables() {
    return [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
  }

  function setOpen(open, view) {
    if (open) {
      lastFocused = document.activeElement;
      stack = [view === "catalog" ? CATALOG_VIEW : ROOT_VIEW];
      render();
    }
    overlay.classList.toggle("hidden", !open);
    toggle?.setAttribute("aria-expanded", String(open));
    catalogToggle?.setAttribute("aria-expanded", String(open));
    document.documentElement.classList.toggle("overflow-hidden", open);
    if (open) focusables()[0]?.focus();
    else lastFocused?.focus?.();
  }

  toggle?.addEventListener("click", (e) => {
    e.preventDefault();
    setOpen(!isOpen());
  });
  catalogToggle?.addEventListener("click", (e) => {
    e.preventDefault();
    setOpen(!isOpen(), "catalog");
  });
  closeBtn.addEventListener("click", () => setOpen(false));
  scrim.addEventListener("click", () => setOpen(false));

  document.addEventListener("keydown", (e) => {
    if (!isOpen()) return;
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key !== "Tab") return;
    // focus trap — Tab cycles inside the panel while it is open
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    } else if (!panel.contains(document.activeElement)) {
      e.preventDefault();
      first.focus();
    }
  });

  // The panel only exists below md — collapsing the window past the breakpoint
  // with it open would otherwise leave the document scroll locked.
  const desktop = window.matchMedia("(min-width: 48rem)");
  desktop.addEventListener("change", (e) => {
    if (e.matches && isOpen()) setOpen(false);
  });
}
