import "../../styles/app.css";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initDealerPriceControls } from "../../components/price-mode.js";
import { initOrderCart } from "../../components/order-cart.js";
import { initOrderModules } from "../../components/order-modules.js";
import { initOrderForms } from "../../components/order-forms.js";
import { ICON } from "../../data/asset-base.js";
import { rub } from "../../data/catalog.js";
import { dealerMenuSections } from "../../data/dealer-home.js";
import { LINES, DELIVERY } from "../../data/dealer-order.js";
import { initModals } from "../../components/modals.js";
import { initCitySelect } from "../../components/city-select.js";

// Дилерский заказ — та же корзина и та же сводка, что у покупателя, плюс
// модули строки и форма из четырёх карточек. Шагов нет: оба фрейма на 1440 —
// одна страница, у которой меняется только карточка «Доставка».

// ---- dealer strip: price list + «Показать цену» -----------------------------
initDealerPriceControls();

// ---- shared chrome (header mega-menu + burger) ------------------------------
setCatalogIconBase(ICON);
initCatalogMenu(document.querySelector("[data-catalog]"), {
  toggle: document.querySelector("[data-catalog-toggle]"),
});
initMobileMenu(document.querySelector("[data-mobile-menu-root]"), {
  toggle: document.querySelector("[data-mobile-menu]"),
  catalogToggle: document.querySelector("[data-mobile-catalog]"),
  rootSections: dealerMenuSections,
});
initSearch();
initCart();

// The order screens are the only ones in the design with an active bottom-nav
// item, and it is always «Корзина» (2225:167296, 2225:201809, 2238:157471).
document.querySelector("[data-nav-cart]")?.setAttribute("aria-current", "page");

const page = document.querySelector("[data-order]");

// ---- корзина ----------------------------------------------------------------
initOrderCart(page, { lines: LINES });

// ---- модули строки ----------------------------------------------------------
const modules = initOrderModules(page, { lines: LINES, money: rub });
modules?.expand("shale"); // the frame draws «Шале» open (953:152360)

// ---- форма ------------------------------------------------------------------
// THE SEAM: submitOrder() is the one place the order is sent. Today it reveals
// the confirmation overlay; in Blade its body becomes a POST.
const done = page.querySelector("[data-order-done]");
const deliveryOut = page.querySelector("[data-summary-delivery]");

function submitOrder(payload) {
  void payload; // (the prototype has nowhere to send it)
  done.classList.add("is-open"); // `.modal-scrim` держит `hidden`, показывает `.is-open`
  document.body.classList.add("overflow-hidden");
}

const forms = initOrderForms(page, {
  delivery: DELIVERY,
  money: rub,
  onDelivery: ({ label }) => {
    if (deliveryOut) deliveryOut.textContent = label;
  },
  onSubmit: (values) => submitOrder({ ...values, lines: LINES.map(({ id }) => id) }),
});

// The summary's own button sits outside the form (the 322 panel is a sibling
// of it), so it submits by hand; the mobile bar's button uses `form=`.
// Native validation focuses the first invalid field, but doesn't reliably
// scroll it into view when the button that triggered submit lives outside
// the form (Safari especially) — so do that ourselves before handing off.
page.querySelector("[data-order-summary] [data-order-submit]")?.addEventListener("click", () => {
  if (forms && !forms.form.checkValidity()) {
    forms.form.querySelector(":invalid")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  forms?.form.requestSubmit();
});

initModals();
initCitySelect();
