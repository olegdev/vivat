import "../../styles/app.css";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initOrderCart, initOrderBar } from "../../components/order-cart.js";
import { renderStoresMap, setBases as setStoresBases } from "../../components/stores-map.js";
import { initStoreSheet } from "../../components/store-sheet.js";
import { stores } from "../../data/stores.js";
import { HOME, ICON } from "../../data/asset-base.js";
import { LINES } from "../../data/order.js";

// ---- shared chrome (header mega-menu + burger), same wiring as action.js ----
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

const page = document.querySelector("[data-order]");
initOrderCart(page, { lines: LINES });
initOrderBar(page);

// The order screens are the only ones in the design with an active bottom-nav
// item, and it is always «Корзина» (2029:126838, 2084:145507, 2241:158297).
// In Blade this is a parameter on the include, not a line of script.
document.querySelector("[data-nav-cart]")?.setAttribute("aria-current", "page");

// ---- the three steps --------------------------------------------------------
// Figma draws Order-step0/1/2 as separate frames, but each is the previous one
// with a section appended — so this is one page and `data-step` gates what has
// been revealed. Sections are additive: reaching шаг 2 leaves шаг 1 on screen.
const STEP_TITLES = [
  { title: "Оформление заказа", sub: "" },
  {
    title: "Выбор магазина",
    sub: "Выберите магазин, который получит заказ и свяжется с вами для подтверждения.",
  },
  { title: "Контактные данные", sub: "" },
];

const mTitle = page.querySelector("[data-order-mtitle]");
const mSub = page.querySelector("[data-order-msub]");
const stepBars = {
  1: page.querySelector("[data-step1-bar]"),
  2: page.querySelector("[data-step2-bar]"),
};

const isMobile = () => window.matchMedia("(max-width: 47.99rem)").matches;
const storesSection = page.querySelector("[data-stores-section]");
let step = 0;

function setStep(n, { scroll = true } = {}) {
  step = n;
  page.dataset.step = String(n);

  // Desktop is additive — the frames stack the steps on one scroll, so the cart
  // stays in view under шаг 1 and шаг 2. Mobile is not: each frame there is a
  // whole screen (2029:126838 → 2032:158435 → 2082:145162), so below `md` only
  // the current step shows.
  page.querySelectorAll("[data-step-section]").forEach((el) => {
    const i = Number(el.dataset.stepSection);
    el.hidden = i > n;
    el.classList.toggle("max-md:hidden", i !== n);
  });

  // Below `md` each step owns the screen: the modal header names it and only
  // that step's CTA bar is on. Шаг 1 is a full-screen map, so the cart's bar
  // and the bottom nav step aside for it.
  mTitle.textContent = STEP_TITLES[n].title;
  mSub.textContent = STEP_TITLES[n].sub;
  Object.entries(stepBars).forEach(([k, bar]) => bar?.classList.toggle("max-md:hidden", Number(k) !== n));
  page.querySelector("[data-order-bar]")?.classList.toggle("max-md:hidden", n !== 0);
  // шаг 1 is a full-screen map below `md`; the page behind it must not scroll
  document.body.classList.toggle("overflow-hidden", n === 1 && isMobile());
  if (n === 1) {
    // Below `md` шаг 1 covers the viewport, but not the header naming it — the
    // frames (2032:158435) put the map under a 78px bar, and that bar is 48px
    // on the steps with no subtitle, so it is measured, not hard-coded.
    const head = page.querySelector("[data-order-mheader]");
    storesSection.style.top = isMobile() ? `${Math.round(head.getBoundingClientRect().height)}px` : "";
    // both were laid out while their section was hidden and measured zero
    map?.refresh();
    sheet?.sync();
  }

  if (scroll && n > 0 && !isMobile()) {
    page.querySelector(`[data-step-section="${n}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// шаг 0 → 1: both the summary button and the mobile bar carry the same hook
page.querySelectorAll("[data-order-submit]").forEach((b) =>
  b.addEventListener("click", () => setStep(1))
);

// ---- шаг 1: pick a dealer ---------------------------------------------------
let picked = null;
const pickDone = page.querySelector("[data-pick-done]");
const pickedLabel = page.querySelector("[data-picked-store]");

setStoresBases({ home: HOME });
const map = renderStoresMap(page.querySelector("[data-step-section='1']"), {
  stores,
  apiKey: import.meta.env?.VITE_YANDEX_MAPS_KEY || "73abf802-7fa6-4da1-bc36-7dd3457e4673",
  title: "Шаг 1 из 2. Выбрать ближайший магазин.",
  description:
    "Пожалуйста, выберите магазин нашего партнера, в который вам удобнее сделать заказ. " +
    "Менеджер партнера свяжется с вами для подтверждения заказа, консультации или корректировки.",
  selectable: true,
  onSelect(store) {
    picked = store;
    if (pickDone) {
      pickDone.disabled = !store;
      pickDone.textContent = store ? "Далее" : "Выберите дилера";
    }
    if (pickedLabel && store) pickedLabel.textContent = `${store.name} ${store.address}`;
    // Desktop has no "далее" control — the pick itself opens шаг 2, which is
    // what the frames show (Order-step2 differs from step1 only by that block).
    if (store && !isMobile()) setStep(2);
  },
});

const sheet = initStoreSheet({
  sheet: page.querySelector("[data-store-panel]"),
  track: page.querySelector("[data-map-frame]"),
  grip: page.querySelector("[data-sheet-grip]"),
});

pickDone?.addEventListener("click", () => picked && setStep(2));
page.querySelector("[data-change-store]")?.addEventListener("click", () => setStep(1));
page.querySelector("[data-alert-close]")?.addEventListener("click", (e) =>
  e.target.closest("[data-alert]").remove()
);

// ---- шаг 2 → «Ваш заказ отправлен» ------------------------------------------
// THE SEAM: submitOrder() is the one place the server call lands. Today it just
// reveals the confirmation; in Blade its body becomes a POST and the overlay is
// shown on the response.
const done = page.querySelector("[data-order-done]");

function submitOrder(payload) {
  void payload; // (the prototype has nowhere to send it)
  done.classList.remove("hidden");
  done.classList.add("flex");
  document.body.classList.add("overflow-hidden");
}

page.querySelector("[data-order-form]")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  if (!form.reportValidity()) return;
  submitOrder({
    ...Object.fromEntries(new FormData(form)),
    dealer: picked?.name,
    lines: LINES.map(({ id }) => id),
  });
});

setStep(0, { scroll: false });
