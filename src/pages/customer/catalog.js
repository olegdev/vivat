import "../../styles/app.css";
import { mountCarousel } from "../../components/carousel.js";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initCatalogListing } from "../../components/catalog-listing.js";
import { ICON } from "../../data/asset-base.js";
import { PRODUCTS, rub, popularItems } from "../../data/catalog.js";
import { initModals } from "../../components/modals.js";
import { initCitySelect } from "../../components/city-select.js";

// Страница каталога — обвязка. Сетка, фильтры, сортировка, чипсы и шов
// applyFilters живут в components/catalog-listing.js: та же механика работает на
// дилерской странице (pages/dealer/catalog.html).

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

// ---- сетка + фильтры + сортировка + чипсы + URL -----------------------------
initCatalogListing({ products: PRODUCTS, rub });

// ---- Популярные товары ------------------------------------------------------
mountCarousel(
  document.querySelector('[data-section="popular"]'),
  {
    title: "Популярные товары для кухни",
    desc: "Подберите полезные товары, которые идеально дополнят вашу кухню VIVAT.",
    tabs: ["Все сразу", "Столешницы", "Бытовая техника", "Системы выдвижения", "Мойки", "Смесители"],
    endpoint: "/catalog/popular", // tab seam target (see carousel.js initTabs)
    // У title-block этого рельса пустой `buttons` (758:57416, 2338:254297) —
    // на 1440 кнопки рядом с заголовком нет. А вот ПОД рельсом на 360 она
    // есть: мастер `other-row device=mobile size=L` (1968:150250) это
    // rows 360 + scroll 32 + button-container 52 с кнопкой «В раздел».
    desktopAction: false,
    action: "В раздел",
    href: "catalog.html",
    // На 360 карточки идут одним рядом по 320 (cards-other 1968:237927), а не
    // двумя рядами по 152, как в рельсах главной.
    mobileCard: "l",
  },
  popularItems
);

initModals();
initCitySelect();
