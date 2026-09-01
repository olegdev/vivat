import "../../styles/app.css";
import { mountCarousel, enableDragScroll } from "../../components/carousel.js";
import { initSpecTabs, initSectionNav, initStickyPrice, initPdpOrder } from "../../components/pdp.js";
import { renderReviews } from "../../components/review-card.js";
import { renderStoresMap, setBases as setStoresMapBases } from "../../components/stores-map.js";
import { initModuleSummary } from "../../components/pdp-module.js";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initModals } from "../../components/modals.js";
import { initCitySelect } from "../../components/city-select.js";
import { ICON, HOME } from "../../data/asset-base.js";
import { stores } from "../../data/stores.js";
import { reviews } from "../../data/pdp.js";
import { product, specs, modules, railTitle, railAction } from "../../data/pdp-module.js";

// ---- общий chrome, та же обвязка, что у остальных страниц -------------------
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

initModuleSummary(product);

// ---- Характеристики ---------------------------------------------------------
// Таблица у модуля своей копии в макете не получила (см. data/pdp-module.js).
// Ярлыков в блоке теперь три на всех страницах — «Описание», «Комплектация»,
// «Где купить», — поэтому снимать здесь больше нечего.
initSpecTabs({ specs, package: [] });
enableDragScroll(document.querySelector("[data-spec-tabs]"));

// ---- рельс «Модули композиции …» ---------------------------------------------
mountCarousel(
  document.querySelector('[data-section="modules"]'),
  {
    title: railTitle,
    // Кнопка справа от заголовка в макете ЕСТЬ: `button-container` 216x44 с
    // «Все модули Фьюжн» (2488:127168). Я её ошибочно снял, прочитав пустой
    // `buttons` у кухонной PDP.
    action: railAction,
    // Каталог с фильтром «только модули», как у рельса «Модули» на кухонной
    // PDP (docs/LINK-MAP.md §4.16).
    href: "catalog.html?modules=1",
    // `cards-modul` — отдельный компонент, а не размер общей карточки,
    // поэтому это `variant`, как и в кухонной PDP.
    variant: "modul",
    arrowTop: 97, // по центру 242-й коробки снимка
    id: "modules",
  },
  modules
);

// ---- Отзывы и «Где купить» ---------------------------------------------------
// В макете модуля этот блок скрыт, но якорный бар на него ссылается — блоки
// взяты с кухонной PDP по решению клиента (BACKLOG.md).
mountCarousel(
  document.querySelector('[data-section="reviews"]'),
  {
    id: "reviews",
    title: "Отзывы",
    count: reviews.length,
    render: renderReviews,
    desktopAction: false,
    mobileAction: false,
    mobileProgress: false,
    arrowTop: 124,
  },
  reviews
);

const storesAnchor = document.querySelector('[data-section="salony"]');
if (storesAnchor) {
  setStoresMapBases({ home: HOME });
  renderStoresMap(storesAnchor, {
    stores,
    title: "Где купить",
    description:
      "Купить этот модуль вы можете в наших фирменных магазинах и в дилерских центрах",
    apiKey: import.meta.env?.VITE_YANDEX_MAPS_KEY || "73abf802-7fa6-4da1-bc36-7dd3457e4673",
  });
}

// Якорный бар разрешает цели по id, а два из них рождаются рельсами выше,
// поэтому он подключается последним.
initSectionNav();

// Бар с ценой — тоже добавка клиента; ведёт себя как у кухонной PDP.
initStickyPrice(product);

initModals();
initCitySelect();

// «Сформировать заказ»: в корзину и на оформление (LINK-MAP §4.1).
initPdpOrder(product);
