import "../../styles/app.css";
import { mountCarousel, enableDragScroll } from "../../components/carousel.js";
import { initSpecTabs, initSectionNav } from "../../components/pdp.js";
import { initModuleSummary, dropSpecTabs } from "../../components/pdp-module.js";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initModals } from "../../components/modals.js";
import { initCitySelect } from "../../components/city-select.js";
import { ICON } from "../../data/asset-base.js";
import { product, specs, modules, railTitle, railAction } from "../../data/pdp-module.js";

// ---- общий chrome, та же обвязка, что у остальных страниц -------------------
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

initModuleSummary(product);

// ---- Характеристики ---------------------------------------------------------
// Таблица у модуля своей копии в макете не получила (см. data/pdp-module.js),
// «Модули» и «Состав» тоже: панели общие с кухонной PDP. Убираем только те две
// вкладки, которых во фрейме нет.
initSpecTabs({
  specs,
  sostav: [[], []],
  package: [],
  docs: [],
});
dropSpecTabs(["dokumenty", "reviews"]);
enableDragScroll(document.querySelector("[data-spec-tabs]"));
initSectionNav();

// ---- рельс «Модули композиции …» ---------------------------------------------
mountCarousel(
  document.querySelector('[data-section="modules"]'),
  {
    title: railTitle,
    action: railAction,
    href: "catalog.html",
    // `cards-modul` — отдельный компонент, а не размер общей карточки,
    // поэтому это `variant`, как и в кухонной PDP.
    variant: "modul",
    arrowTop: 97, // по центру 242-й коробки снимка
    id: "modules",
  },
  modules
);

initModals();
initCitySelect();
