import "../../styles/app.css";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initSession } from "../../components/session.js";
import { initDealerPriceControls } from "../../components/price-mode.js";
import { initOrderCart, initOrderBar } from "../../components/order-cart.js";
import { initOrderModules } from "../../components/order-modules.js";
import { initOrderForms } from "../../components/order-forms.js";
import { ICON } from "../../data/asset-base.js";
import { rub } from "../../data/catalog.js";
import { dealerMenuSections } from "../../data/dealer-home.js";
import { LINES, DELIVERY } from "../../data/dealer-order.js";
import { initModals } from "../../components/modals.js";
import { initPhoneMask } from "../../components/phone-mask.js";
import { initConsentGate } from "../../components/consent-gate.js";
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
initSession();

// The order screens are the only ones in the design with an active bottom-nav
// item, and it is always «Корзина» (2225:167296, 2225:201809, 2238:157471).
document.querySelector("[data-nav-cart]")?.setAttribute("aria-current", "page");

const page = document.querySelector("[data-order]");

// ---- корзина ----------------------------------------------------------------
const cart = initOrderCart(page, { lines: LINES });

// ---- модули строки ----------------------------------------------------------
// Правка комплектации меняет цену кухни, а кухня без модулей уходит из заказа
// (решение клиента 16.09). `state` корзины держит те же массивы `modules`, что
// и фикстура, поэтому шторке и раскрытой карточке достаточно сказать, какую
// строку пересчитать.
const modules = initOrderModules(page, {
  lines: LINES,
  money: rub,
  onChange: (line) => cart?.repriceLine(line.id),
});
modules?.expand("shale"); // the frame draws «Шале» open (953:152360)

// Мобильный бар отдаёт очередь кнопке сводки, как только до неё доскроллили.
initOrderBar(page);

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

// Кнопка сводки стоит вне формы (панель 322 — её сосед), поэтому связываем её
// атрибутом, как уже связан мобильный бар. Тогда это настоящий submit: браузер
// сам покажет незаполненное поле, а галочку согласия сторожит одно правило на
// обе кнопки (components/consent-gate.js), а не отдельная ветка на десктоп.
// В Blade это атрибут в разметке — `form="dealer-order-form"` на кнопке сводки.
const summarySubmit = page.querySelector("[data-order-summary] [data-order-submit]");
if (summarySubmit && forms) {
  summarySubmit.setAttribute("form", forms.form.id);
  summarySubmit.setAttribute("type", "submit");
}

initModals();
initPhoneMask();
initConsentGate();
initCitySelect();
