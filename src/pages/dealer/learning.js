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
import { ICON } from "../../data/asset-base.js";
import { dealerMenuSections } from "../../data/dealer-home.js";
import { MENU_B2B } from "../../data/menu-b2b.js";
import { LEARNING_VIDEOS } from "../../data/learning.js";

// «Обучающие материалы» — контентная страница дилерского раздела. Скрипт
// только проводка: обвязка та же, что у соседних страниц, плюс сетка карточек.

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
initSession();

renderMenuB2b(MENU_B2B, { current: "learning.html" });

// ---- сетка видеокарточек ----------------------------------------------------
const grid = document.querySelector("[data-learning-grid]");
const tpl = document.querySelector("[data-learning-card]");
grid.append(
  ...LEARNING_VIDEOS.map((v) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector("[data-card-img]").src = v.img;
    node.querySelector("[data-card-img]").alt = v.title;
    node.querySelector("[data-card-title]").textContent = v.title;
    return node;
  })
);

initModals();
initCitySelect();
