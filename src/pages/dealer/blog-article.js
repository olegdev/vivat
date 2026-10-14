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
import { mountCarousel } from "../../components/carousel.js";
import { renderArticles } from "../../components/article-card.js";
import { ICON } from "../../data/asset-base.js";
import { dealerMenuSections } from "../../data/dealer-home.js";
import { RELATED } from "../../data/blog.js";

// Статья блога.

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

// ---- «Читайте также» --------------------------------------------------------
// Оболочка товарного рельса с карточками статей вместо товаров, как отзывы на
// PDP. Кнопок нет ни на одной ширине (`buttons` в title-block пуст, на 360
// `button-container` скрыт), полоса прокрутки ниже md — есть.
mountCarousel(
  document.querySelector('[data-section="related"]'),
  {
    title: "Читайте также",
    render: renderArticles,
    desktopAction: false,
    mobileAction: false,
    mobileDescGap: false,
  },
  RELATED
);

initModals();
initPhoneMask();
initConsentGate();
initCitySelect();
