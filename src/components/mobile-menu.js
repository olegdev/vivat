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

// ---- data -------------------------------------------------------------------
// Root level of the burger menu (Figma 1997:255059 "menu-main-block"). The
// dealer site passes its own set — same rows, dealer links at the bottom; see
// src/data/dealer-home.js.
const defaultRootSections = [
  { label: "Каталог", view: "catalog" },
  { label: "Где купить", href: "#" },
  { label: "Компания", href: "#" },
  { label: "Полезная информация", href: "#" },
  { label: "Для бизнеса", href: "#" },
  { label: "Стать дилером", href: "#" },
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

// ---- template helpers -------------------------------------------------------
// The three row shapes (link / drill button / caption) are clean HTML
// <template>s in the partial; this clones and fills them (the future @foreach).
const clone = (sel) => document.querySelector(sel).content.firstElementChild.cloneNode(true);

function buildRow(item, index) {
  if (item.caption) {
    const el = clone("[data-mm-caption]");
    el.textContent = item.label;
    return el;
  }
  const drill = item.items || item.view;
  const el = clone(drill ? "[data-mm-button]" : "[data-mm-link]");
  el.querySelector("[data-label]").textContent = item.label;
  el.dataset.menuIndex = String(index);
  if (!drill) el.href = item.href || "#";
  return el;
}

// ---- init -------------------------------------------------------------------
// The panel shell (header, search, list slot, social row) + row templates are
// static markup in src/partials/mobile-menu.html. This only fills the drill-down
// list (data-mm-list) from the view stack and runs the open/close + focus-trap.
export function initMobileMenu(anchor, { toggle, catalogToggle, rootSections = defaultRootSections } = {}) {
  if (!anchor) return;

  // Бургеров в шапке ДВА — в мобильном ряду и в планшетном (site-header
  // device=tablet 2477:180969), и виден в каждый момент ровно один. Страница
  // передаёт первый попавшийся, поэтому здесь добираем все: иначе на планшете
  // кнопка есть, а обработчик висит на скрытой мобильной.
  const toggles = [...document.querySelectorAll("[data-mobile-menu]")];
  if (toggle && !toggles.includes(toggle)) toggles.push(toggle);

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
    listEl.replaceChildren(...view.items.map(buildRow));
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
    toggles.forEach((t) => t.setAttribute("aria-expanded", String(open)));
    catalogToggle?.setAttribute("aria-expanded", String(open));
    document.documentElement.classList.toggle("overflow-hidden", open);
    if (open) focusables()[0]?.focus();
    else lastFocused?.focus?.();
  }

  toggles.forEach((t) =>
    t.addEventListener("click", (e) => {
      e.preventDefault();
      setOpen(!isOpen());
    })
  );
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
