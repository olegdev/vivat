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
import { WAREHOUSE, WHOLESALE_CITIES, EMPLOYEES, WAREHOUSE_PHOTOS } from "../../data/contacts.js";
import { RETAIL_REGIONS, ALL_CITIES } from "../../data/contacts-retail.js";

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
// сегментов доставки на дилерском заказе.
//
// Что меняется: в опте панель показывает карточку склада, в рознице —
// список магазинов выбранного города. Прототипа у сегментов в макете нет, и
// поведение взято с живого сайта (см. BACKLOG).
const segTpl = document.querySelector("[data-audience-segments]");
for (const sel of ["[data-audience-desktop] > div", "[data-store-audience]"]) {
  const slot = document.querySelector(sel);
  if (slot) slot.replaceChildren(segTpl.content.cloneNode(true));
}
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-audience-mode]");
  if (btn) setAudience(btn.dataset.audienceMode);
});

// ---- карта в режиме contactPage ---------------------------------------------
setBases({ home: HOME });
const map = renderStoresMap(document.querySelector('[data-section="map"]'), {
  stores: [WAREHOUSE],
  detail: WAREHOUSE,
  contactPage: true,
  apiKey: import.meta.env?.VITE_YANDEX_MAPS_KEY || "73abf802-7fa6-4da1-bc36-7dd3457e4673",
  center: [WAREHOUSE.coords[1], WAREHOUSE.coords[0]],
  zoom: 11,
});


// ---- селекторы места --------------------------------------------------------
// Опт: город (пять городов, как на сайте-источнике; склад там один — московский).
// Розница: область и город, а список магазинов панели меняется вместе с ними.
// Оба селектора — это подпись в шапке панели, по клику открывающая меню.
const head = document.querySelector("[data-panel-head]");
const cityBtn = head.querySelector("[data-city-toggle]");
const cityLabel = head.querySelector("[data-panel-city]");
const regionBtn = head.querySelector("[data-region-toggle]");
const regionLabel = head.querySelector("[data-panel-region]");
const menu = head.querySelector("[data-place-menu]");
const optionTpl = document.querySelector("[data-place-option]");
const empty = document.querySelector("[data-store-empty]");

// По умолчанию — как на сайте: Московская область и «Все города».
let audience = "opt";
let region = RETAIL_REGIONS[0];
let retailCity = ALL_CITIES;
let optCity = WHOLESALE_CITIES[0];

// Магазины показанного места: либо весь регион, либо один город. Город
// дописываем в карточку — по нему геокодер карты находит адрес.
function shopsOf() {
  const cities =
    retailCity === ALL_CITIES ? region.cities : region.cities.filter((c) => c.city === retailCity);
  return cities.flatMap((c) => c.shops.map((shop) => ({ ...shop, city: c.city })));
}

function placeCenter() {
  if (retailCity === ALL_CITIES) return { center: region.center, zoom: region.zoom };
  const city = region.cities.find((c) => c.city === retailCity);
  return { center: city?.center, zoom: 11 };
}

function closeMenu() {
  menu.classList.add("hidden");
}

function openMenu(options, current, onPick) {
  menu.replaceChildren(
    ...options.map((label) => {
      const item = optionTpl.content.firstElementChild.cloneNode(true);
      item.textContent = label;
      item.setAttribute("aria-current", String(label === current));
      item.addEventListener("click", () => {
        closeMenu();
        onPick(label);
      });
      return item;
    })
  );
  menu.classList.remove("hidden");
}

function paintPlace() {
  const retail = audience === "retail";
  regionBtn.classList.toggle("hidden", !retail);
  regionBtn.classList.toggle("flex", retail);
  cityLabel.textContent = retail ? retailCity : optCity.city;
  regionLabel.textContent = region.region;
}

function applyPlace() {
  paintPlace();
  if (audience === "retail") {
    const shops = shopsOf();
    map.setPanel("list");
    map.setStores(shops, placeCenter());
    // Магазины регионов, кроме Московской области, отдаёт бэк — пока список
    // пуст, панель говорит об этом словами каталога.
    empty.classList.toggle("hidden", shops.length > 0);
  } else {
    map.setPanel("detail");
    map.showDetail(optCity.detail);
    empty.classList.add("hidden");
  }
}

function setAudience(mode) {
  audience = mode;
  document.body.dataset.audience = mode;
  applyPlace();
}

cityBtn.addEventListener("click", () => {
  if (!menu.classList.contains("hidden")) return closeMenu();
  if (audience === "retail") {
    openMenu([ALL_CITIES, ...region.cities.map((c) => c.city)], retailCity, (label) => {
      retailCity = label;
      applyPlace();
    });
  } else {
    openMenu(
      WHOLESALE_CITIES.map((c) => c.city),
      optCity.city,
      (label) => {
        optCity = WHOLESALE_CITIES.find((c) => c.city === label);
        applyPlace();
      }
    );
  }
});

regionBtn.addEventListener("click", () => {
  if (!menu.classList.contains("hidden")) return closeMenu();
  openMenu(
    RETAIL_REGIONS.map((r) => r.region),
    region.region,
    (label) => {
      region = RETAIL_REGIONS.find((r) => r.region === label);
      retailCity = ALL_CITIES;
      applyPlace();
    }
  );
});

document.addEventListener("click", (e) => {
  if (!head.contains(e.target)) closeMenu();
});

setAudience("opt");

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
