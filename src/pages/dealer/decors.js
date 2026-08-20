import "../../styles/app.css";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initDealerPriceControls } from "../../components/price-mode.js";
import { initModals } from "../../components/modals.js";
import { renderMenuB2b } from "../../components/menu-b2b.js";
import { ICON } from "../../data/asset-base.js";
import { dealerMenuSections } from "../../data/dealer-home.js";
import { MENU_B2B } from "../../data/menu-b2b.js";
import { initDecorFilters } from "../../components/decor-filters.js";
import { DECORS } from "../../data/decors.js";

// «Каталог декоров» — контентная страница дилерского раздела.
// Швов у страницы нет: фильтры макет для неё не раскрывает (см. BACKLOG).

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

// ---- меню раздела -----------------------------------------------------------
renderMenuB2b(MENU_B2B, { current: "decors.html" });

// ---- сетка образцов ---------------------------------------------------------
const tpl = document.querySelector("[data-decor-card]");
document.querySelector("[data-decors]").replaceChildren(
  ...DECORS.map((d) => {
    const node = tpl.content.cloneNode(true).firstElementChild;
    const img = node.querySelector("[data-decor-img]");
    img.src = d.img;
    img.alt = d.name;
    node.querySelector("[data-decor-name]").textContent = d.name;
    return node;
  })
);

// ---- фильтры ----------------------------------------------------------------
// Панель, шторка и единственный шов applyDecorFilters(); сетку он сегодня не
// трогает — признаков у образцов в макете нет, состав придёт с сервера.
initDecorFilters();

// Постраничка у этой страницы на три страницы, а не на семь (1488:127364).
document.querySelector("[data-pagination]").dataset.pages = "3";

initModals();
