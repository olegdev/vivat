import "../../styles/app.css";
import { mountCarousel, enableDragScroll, initScrollProgress } from "../../components/carousel.js";
import { renderPromoTiles } from "../../components/promo-card.js";
import { renderNewsCards } from "../../components/news-card.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initAlert } from "../../components/alert.js";
import { initHeroSlider } from "../../components/hero-slider.js";
import { initDealerHeader } from "../../components/dealer-header.js";
import { renderStoresMap, setBases as setStoresMapBases } from "../../components/stores-map.js";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { stores } from "../../data/stores.js";
import { HOME, ICON } from "../../data/asset-base.js";
import { heroSlides, modularItems, popularItems, akciiItems, promoTiles } from "../../data/home.js";
import { newsItems } from "../../data/dealer-home.js";

// The dealer home page is the customer home page's sections plus the dealer
// chrome — the rails, hero, tiles and promo row are the same fixtures, so this
// script is wiring only. Desktop only for now: no 360 frame exists, so there is
// no mobile menu or bottom nav to mount (see docs/FIGMA-MAP.md).

// ---- dealer strip in the header (price switch) ------------------------------
initDealerHeader();

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

// ---- header search (query contract + suggest seam) --------------------------
initSearch();

// ---- add to cart (badge + POST /cart seam) ----------------------------------
initCart();

const sections = {
  modular: {
    cfg: { title: "Модульные кухни. Хиты продаж", desc: "Покупая модульную кухню, вы получаете самые выгодные цены!" },
    items: modularItems,
  },
  popular: {
    cfg: {
      title: "Популярные товары для кухни",
      desc: "Подберите полезные товары, которые идеально дополнят вашу кухню VIVAT.",
      tabs: ["Все сразу", "Столешницы", "Бытовая техника", "Системы выдвижения", "Мойки", "Смесители"],
      endpoint: "/catalog/popular",
    },
    items: popularItems,
  },
  akcii: {
    cfg: { title: "Акции и скидки", desc: "Успейте купить любимые товары по специальной цене.", action: "В каталог" },
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
renderNewsCards(document.querySelector("[data-news-track]"), newsItems);

// ---- Наши салоны (Yandex Maps) ----------------------------------------------
const storesAnchor = document.querySelector('[data-section="salony"]');
if (storesAnchor) {
  setStoresMapBases({ home: HOME });
  renderStoresMap(storesAnchor, {
    stores,
    apiKey: import.meta.env?.VITE_YANDEX_MAPS_KEY || "73abf802-7fa6-4da1-bc36-7dd3457e4673",
  });
}
