import "../../styles/app.css";
import { mountCarousel } from "../../components/carousel.js";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initSession } from "../../components/session.js";
import { initDealerPriceControls } from "../../components/price-mode.js";
import { initCatalogListing } from "../../components/catalog-listing.js";
import { ICON } from "../../data/asset-base.js";
import { PRODUCTS, rub, popularItems } from "../../data/catalog.js";
import { dealerMenuSections } from "../../data/dealer-home.js";
import { initModals } from "../../components/modals.js";
import { initPhoneMask } from "../../components/phone-mask.js";
import { initConsentGate } from "../../components/consent-gate.js";
import { initCitySelect } from "../../components/city-select.js";

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
initSession();

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
    // Тот же вариант, что у покупательского каталога (1997:267695) — решение
    // клиента 15.09: на 360 один ряд плиток 320 и кнопка «В раздел» под
    // рельсом (other-row size=L 1968:150250: ряд 360 + скролл 32 + кнопка 52).
    // Своего дилерского кадра рельс не менял — у 2225:160540 были две строки
    // по 152 без кнопки. На 1440 у title-block кнопки нет, как и прежде.
    desktopAction: false,
    action: "В раздел",
    href: "catalog.html",
    mobileCard: "l",
  },
  popularItems
);

initModals();
initPhoneMask();
initConsentGate();
initCitySelect();
