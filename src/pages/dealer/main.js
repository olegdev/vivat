import "../../styles/app.css";
import { mountCarousel, enableDragScroll, initScrollProgress } from "../../components/carousel.js";
import { renderPromoTiles } from "../../components/promo-card.js";
import { renderNewsCards } from "../../components/news-card.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initSession } from "../../components/session.js";
import { initAlert } from "../../components/alert.js";
import { initHeroSlider } from "../../components/hero-slider.js";
import { initDealerPriceControls } from "../../components/price-mode.js";
import { renderStoresMap, setBases as setStoresMapBases } from "../../components/stores-map.js";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initModals } from "../../components/modals.js";
import { initCitySelect } from "../../components/city-select.js";
import { stores } from "../../data/stores.js";
import { HOME, ICON } from "../../data/asset-base.js";
import { heroSlides, modularItems, popularItems, akciiItems, promoTiles } from "../../data/home.js";
import { newsItems, dealerMenuSections } from "../../data/dealer-home.js";

// The dealer home page is the customer home page's sections plus the dealer
// chrome — the rails, hero, tiles and promo row are the same fixtures, so this
// script is wiring only. Below `md` the chrome is the dealer one: header strip
// with the price list, bottom nav with «Бизнесу», burger menu with the dealer
// links (see docs/FIGMA-MAP.md).

// ---- dealer strip: price list + «Показать цену» ------------------------------
initDealerPriceControls();

// ---- dismissible alert band -------------------------------------------------
initAlert();

// ---- hero slider ------------------------------------------------------------
const heroEl = document.querySelector("[data-hero]");
if (heroEl) initHeroSlider(heroEl, heroSlides);

// ---- catalog mega-menu ("Весь каталог") -------------------------------------
setCatalogIconBase(ICON);
initCatalogMenu(document.querySelector("[data-catalog]"), {
  toggle: document.querySelector("[data-catalog-toggle]"),
});

// ---- mobile burger menu (max-md only) ---------------------------------------
initMobileMenu(document.querySelector("[data-mobile-menu-root]"), {
  toggle: document.querySelector("[data-mobile-menu]"),
  catalogToggle: document.querySelector("[data-mobile-catalog]"),
  rootSections: dealerMenuSections,
});

// ---- header search (query contract + suggest seam) --------------------------
initSearch();

// ---- add to cart (badge + POST /cart seam) ----------------------------------
initCart();
initSession();
initModals();
initCitySelect();

const sections = {
  modular: {
    cfg: {
      title: "Модульные кухни. Хиты продаж",
      desc: "Покупая модульную кухню, вы получаете самые выгодные цены!",
      href: "catalog.html",
    },
    items: modularItems,
  },
  popular: {
    cfg: {
      title: "Популярные товары для кухни",
      desc: "Подберите полезные товары, которые идеально дополнят вашу кухню VIVAT.",
      tabs: ["Все сразу", "Столешницы", "Бытовая техника", "Системы выдвижения", "Мойки", "Смесители"],
      endpoint: "/catalog/popular",
      href: "catalog.html",
    },
    items: popularItems,
  },
  akcii: {
    cfg: {
      title: "Акции и скидки",
      desc: "Успейте купить любимые товары по специальной цене.",
      action: "В каталог",
      // Дилерской страницы «Акций» нет — она одна на весь сайт (LINK-MAP §4.12).
      href: "../customer/action.html",
    },
    items: akciiItems,
  },
};

for (const [name, { cfg, items }] of Object.entries(sections)) {
  mountCarousel(document.querySelector(`[data-section="${name}"]`), cfg, items);
}

// ---- promo tiles (static centred row, not a rail) ---------------------------
const promoAnchor = document.querySelector('[data-section="promo"]');
if (promoAnchor) {
  renderPromoTiles(promoAnchor.querySelector("[data-promo-track]"), promoTiles);
  initScrollProgress(promoAnchor);
  enableDragScroll(promoAnchor.querySelector("[data-viewport]"));
}

// ---- Новости ----------------------------------------------------------------
// Ниже md блок — рельс, поэтому ему нужны те же индикатор и драг, что каруселям.
const newsAnchor = document.querySelector('[data-section="news"]');
if (newsAnchor) {
  renderNewsCards(newsAnchor.querySelector("[data-news-track]"), newsItems);
  initScrollProgress(newsAnchor);
  enableDragScroll(newsAnchor.querySelector("[data-viewport]"));
}

// ---- Наши салоны (Yandex Maps) ----------------------------------------------
const storesAnchor = document.querySelector('[data-section="salony"]');
if (storesAnchor) {
  setStoresMapBases({ home: HOME });
  renderStoresMap(storesAnchor, {
    stores,
    apiKey: import.meta.env?.VITE_YANDEX_MAPS_KEY || "73abf802-7fa6-4da1-bc36-7dd3457e4673",
  });
}
