import "../../styles/app.css";
import { mountCarousel } from "../../components/carousel.js";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initDealerPriceControls } from "../../components/price-mode.js";
import { initCatalogListing } from "../../components/catalog-listing.js";
import { ICON } from "../../data/asset-base.js";
import { PRODUCTS, rub, popularItems } from "../../data/catalog.js";
import { dealerMenuSections } from "../../data/dealer-home.js";
import { initModals } from "../../components/modals.js";

// Дилерский каталог — та же проводка, что у покупательского, плюс дилерская
// обвязка: полоска с прайс-листом в шапке и дилерский набор ссылок в бургере.
// Товары те же (data/catalog.js) — у дилера отличается только показ цены.

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

// ---- сетка + фильтры + сортировка + чипсы + «Только модули» + URL ------------
initCatalogListing({ products: PRODUCTS, rub });

// ---- Популярные товары ------------------------------------------------------
mountCarousel(
  document.querySelector('[data-section="popular"]'),
  {
    title: "Популярные товары для кухни",
    desc: "Подберите полезные товары, которые идеально дополнят вашу кухню VIVAT.",
    tabs: ["Все сразу", "Столешницы", "Бытовая техника", "Системы выдвижения", "Мойки", "Смесители"],
    endpoint: "/catalog/popular", // tab seam target (see carousel.js initTabs)
    // У title-block этого рельса пустой `buttons` (758:57416, 2338:254297), а
    // на 360 за карточками сразу идёт отбивка — кнопок нет ни там, ни там.
    desktopAction: false,
    mobileAction: false,
  },
  popularItems
);

initModals();
