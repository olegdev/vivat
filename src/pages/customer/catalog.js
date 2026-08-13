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
  },
  popularItems
);

initModals();
