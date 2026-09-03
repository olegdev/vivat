import "../../styles/app.css";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initSession } from "../../components/session.js";
import { initDealerPriceControls } from "../../components/price-mode.js";
import { initModals } from "../../components/modals.js";
import { initCitySelect } from "../../components/city-select.js";
import { renderMenuB2b } from "../../components/menu-b2b.js";
import { renderBenefitTiles } from "../../components/benefit-tile.js";
import { renderAccordions } from "../../components/accordion.js";
import { ICON } from "../../data/asset-base.js";
import { dealerMenuSections } from "../../data/dealer-home.js";
import { MENU_B2B } from "../../data/menu-b2b.js";
import { DELIVERY_TILES, DELIVERY_FAQ } from "../../data/delivery.js";

// Доставка — контентная страница дилерского раздела. Скрипт только проводка:
// обвязка та же, что у остальных дилерских страниц, плюс меню раздела.

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

// ---- меню раздела -----------------------------------------------------------
renderMenuB2b(MENU_B2B, { current: "delivery.html" });

// ---- плитки преимуществ -----------------------------------------------------
renderBenefitTiles(document.querySelector("[data-benefit-tiles]"), DELIVERY_TILES);

// ---- FAQ --------------------------------------------------------------------
renderAccordions(document.querySelector("[data-faq]"), DELIVERY_FAQ);

initModals();
initCitySelect();
