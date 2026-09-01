import "../../styles/app.css";
import { mountCarousel } from "../../components/carousel.js";
import { renderPromoTiles } from "../../components/promo-card.js";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { ICON } from "../../data/asset-base.js";
import { promos, actionItems } from "../../data/action.js";
import { initModals } from "../../components/modals.js";
import { initCitySelect } from "../../components/city-select.js";

// ---- shared chrome (header mega-menu + burger), same wiring as main.js ------
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

renderPromoTiles(document.querySelector("[data-promo-grid]"), promos);

// =============================================================================
// Популярные товары на акции (Figma other-row 2248:97231 / 2248:112872)
// =============================================================================
// The same rail the home and catalog pages mount, with two differences read off
// the design: the title-block's `buttons` frame is empty (no desktop action),
// and below `md` the cards are the 320px `cards-other` tile in a single row
// rather than the 152px two-row layout — hence `mobileCard: "l"`.
//
// Every product here is discounted (it is the Акции page): `oldPrice` + a
// discount badge. `tab` is the segment the item belongs to — the tab seam
// filters on it, see carousel.js › initTabs().
mountCarousel(
  document.querySelector('[data-section="popular-action"]'),
  {
    title: "Популярные товары на акции",
    desc: "Подберите полезные товары, которые идеально дополнят вашу кухню VIVAT.",
    tabs: ["Все сразу", "Столешницы", "Бытовая техника", "Системы выдвижения", "Мойки", "Смесители"],
    desktopAction: false, // the Figma title-block's `buttons` frame is empty
    href: "catalog.html",
    mobileCard: "l",
    endpoint: "/action/popular", // tab seam target (see carousel.js initTabs)
  },
  actionItems
);

initModals();
initCitySelect();
