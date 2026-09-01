import "../../styles/app.css";
import { mountCarousel, enableDragScroll, initScrollProgress } from "../../components/carousel.js";
import { renderPromoTiles } from "../../components/promo-card.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initHeroSlider } from "../../components/hero-slider.js";
import { renderStoresMap, setBases as setStoresMapBases } from "../../components/stores-map.js";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { stores } from "../../data/stores.js";
import { HOME, ICON } from "../../data/asset-base.js";
import { heroSlides, modularItems, popularItems, akciiItems, promoTiles } from "../../data/home.js";
import { initModals } from "../../components/modals.js";
import { initCitySelect } from "../../components/city-select.js";

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
});

// ---- header search (query contract + suggest seam) --------------------------
initSearch();

// ---- add to cart (badge + POST /cart seam) ----------------------------------
initCart();

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
      endpoint: "/catalog/popular", // tab seam target (see carousel.js initTabs)
      href: "catalog.html",
    },
    items: popularItems,
  },
  akcii: {
    cfg: {
      title: "Акции и скидки",
      desc: "Успейте купить любимые товары по специальной цене.",
      action: "В каталог",
      // на 360 у этой кнопки своя копия (buttons 1968:150249)
      actionMobile: "В раздел",
      href: "action.html",
    },
    items: akciiItems,
  },
};

for (const [name, { cfg, items }] of Object.entries(sections)) {
  mountCarousel(document.querySelector(`[data-section="${name}"]`), cfg, items);
}

// promo tiles (distinct layout — the shell is markup in main.html, not a rail)
const promoAnchor = document.querySelector('[data-section="promo"]');
if (promoAnchor) {
  renderPromoTiles(promoAnchor.querySelector("[data-promo-track]"), promoTiles);
  initScrollProgress(promoAnchor);
  enableDragScroll(promoAnchor.querySelector("[data-viewport]"));
}

// ---- Наши салоны (Yandex Maps) ----------------------------------------------
const storesAnchor = document.querySelector('[data-section="salony"]');
if (storesAnchor) {
  setStoresMapBases({ home: HOME });
  // title/description/city are now static content in partials/stores.html.
  renderStoresMap(storesAnchor, {
    stores,
    apiKey: import.meta.env?.VITE_YANDEX_MAPS_KEY || "73abf802-7fa6-4da1-bc36-7dd3457e4673",
  });
}

initModals();
initCitySelect();
