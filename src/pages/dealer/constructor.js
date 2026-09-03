import "../../styles/app.css";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initDealerPriceControls } from "../../components/price-mode.js";
import { initModals } from "../../components/modals.js";
import { initCitySelect } from "../../components/city-select.js";
import { ICON } from "../../data/asset-base.js";
import { dealerMenuSections } from "../../data/dealer-home.js";
import { CONSTRUCTOR_SRC, CONSTRUCTOR_DOWNLOAD } from "../../data/constructor.js";

// Страница конструктора. Скрипт — проводка: обвязка та же, что у соседних
// дилерских страниц, плюс адреса приложения и оффлайн-версии из фикстуры.

initDealerPriceControls();

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

// ---- встроенное приложение --------------------------------------------------
// `src` ставится из JS, а не в разметке: в Blade это собранный на сервере
// адрес с сеансом пользователя, и шов должен быть один.
const frame = document.querySelector("[data-constructor-frame]");
const placeholder = document.querySelector("[data-constructor-placeholder]");
frame.addEventListener("load", () => placeholder?.remove());
frame.src = CONSTRUCTOR_SRC;

document.querySelector("[data-constructor-download]").href = CONSTRUCTOR_DOWNLOAD;

initModals();
initCitySelect();
