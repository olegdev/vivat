import "../../styles/app.css";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initDealerPriceControls } from "../../components/price-mode.js";
import { initModals } from "../../components/modals.js";
import { renderStoresMap, setBases } from "../../components/stores-map.js";
import { initCarousel } from "../../components/carousel.js";
import { HOME, ICON } from "../../data/asset-base.js";
import { dealerMenuSections } from "../../data/dealer-home.js";
import { WAREHOUSE, EMPLOYEES, WAREHOUSE_PHOTOS } from "../../data/contacts.js";

// Контакты — контентная страница дилерского раздела. Скрипт только проводка.

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

// ---- мобильная шапка раздела ------------------------------------------------
// У этой страницы нет левого меню, поэтому и селектора в шапке нет: остаётся
// один заголовок, и он несёт имя страницы, а не раздела (2225:104778, 46).
const fbh = document.querySelector("[data-for-business-header]");
if (fbh) {
  fbh.dataset.fbh = "title-only";
  fbh.querySelector("[data-fbh-title]").textContent = "Контакты";
}

// ---- «Опт / Розница» --------------------------------------------------------
// Один <template> клонируется в два места: над картой на 1440 (фрейм `city`)
// и внутрь панели карты на 360 (2225:107318). Состояние живёт на
// <body data-audience>, кнопки своего класса не носят — тот же приём, что у
// сегментов доставки на дилерском заказе. Что именно переключается, макет не
// говорит: прототипа на сегментах нет (см. BACKLOG).
const segTpl = document.querySelector("[data-audience-segments]");
for (const sel of ["[data-audience-desktop] > div", "[data-store-audience]"]) {
  const slot = document.querySelector(sel);
  if (slot) slot.replaceChildren(segTpl.content.cloneNode(true));
}
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-audience-mode]");
  if (btn) document.body.dataset.audience = btn.dataset.audienceMode;
});

// ---- карта в режиме contactPage ---------------------------------------------
setBases({ home: HOME });
renderStoresMap(document.querySelector('[data-section="map"]'), {
  stores: [WAREHOUSE],
  detail: WAREHOUSE,
  contactPage: true,
  apiKey: import.meta.env?.VITE_YANDEX_MAPS_KEY || "73abf802-7fa6-4da1-bc36-7dd3457e4673",
  center: [WAREHOUSE.coords[1], WAREHOUSE.coords[0]],
  zoom: 11,
});

// ---- сотрудники -------------------------------------------------------------
const cardTpl = document.querySelector("[data-employee-card]");
document.querySelector("[data-employees]").replaceChildren(
  ...EMPLOYEES.map((e) => {
    const node = cardTpl.content.cloneNode(true).firstElementChild;
    node.querySelector("[data-employee-name]").textContent = e.name;
    node.querySelector("[data-employee-role]").textContent = e.role;
    return node;
  })
);

// ---- рельс «Наш склад» ------------------------------------------------------
const photoTpl = document.querySelector("[data-warehouse-photo]");
document.querySelector("[data-gallery-section] [data-track]").replaceChildren(
  ...WAREHOUSE_PHOTOS.map((src) => {
    const img = photoTpl.content.cloneNode(true).firstElementChild;
    img.src = src;
    return img;
  })
);
initCarousel(document.querySelector("[data-gallery-section]"));

initModals();
