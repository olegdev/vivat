import "../../styles/app.css";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initSession } from "../../components/session.js";
import { initDealerPriceControls } from "../../components/price-mode.js";
import { initModals } from "../../components/modals.js";
import { initPhoneMask } from "../../components/phone-mask.js";
import { initConsentGate } from "../../components/consent-gate.js";
import { initCitySelect } from "../../components/city-select.js";
import { initBlogFeed } from "../../components/blog-feed.js";
import { ICON } from "../../data/asset-base.js";
import { dealerMenuSections } from "../../data/dealer-home.js";
import { RUBRICS, PERIODS, LATEST, ARTICLES } from "../../data/blog.js";

// «Блог» — лента статей.

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

// ---- лента ------------------------------------------------------------------
initBlogFeed({ rubrics: RUBRICS, periods: PERIODS, latest: LATEST, articles: ARTICLES });

// Постраничка: «Показать еще 12 статей из 40», страниц две (3072:149838).
document.querySelector("[data-grid-step]").textContent = "12";
document.querySelector("[data-grid-noun]").textContent = "статей";
document.querySelector("[data-grid-total]").textContent = "40";
document.querySelector("[data-pagination]").dataset.pages = "2";

initModals();
initPhoneMask();
initConsentGate();
initCitySelect();
