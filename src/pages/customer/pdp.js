import "../../styles/app.css";
import { mountCarousel } from "../../components/carousel.js";
import { renderReviews } from "../../components/review-card.js";
import {
  initSummary,
  initSpecTabs,
  initSectionNav,
  initStickyPrice,
  initPhotoRail,
} from "../../components/pdp.js";
import { enableDragScroll } from "../../components/carousel.js";
import { renderStoresMap, setBases as setStoresMapBases } from "../../components/stores-map.js";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { stores } from "../../data/stores.js";
import { HOME, ICON } from "../../data/asset-base.js";
import { product, modules, addToCart, reviews, collection } from "../../data/pdp.js";
import { initModals } from "../../components/modals.js";
import { initCitySelect } from "../../components/city-select.js";

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

initSummary(product);
initStickyPrice(product);
initPhotoRail();
// Mobile rails scroll natively under a finger; a mouse drag on a narrow desktop
// window needs the explicit handler (SOLUTIONS.md › native scroll rails).
enableDragScroll(document.querySelector("[data-photo-rail]"));
enableDragScroll(document.querySelector("[data-spec-tabs]"));

// =============================================================================
// Характеристики — the four designed panels (Figma 1686:58453 / 922:126723 /
// 942:34310)
// =============================================================================
// `specs` is two arrays because the design lays the table out as two column
// groups, not as one list reflowed into columns.
initSpecTabs({
  specs: [
    [
      { label: "Размер (В*Ш*Г), мм:", value: "2140*1100*600" },
      { label: "Цвет каркасов:", value: "Белый" },
      { label: "Материал каркасов:", value: "ЛДСП" },
      { label: "Цвет фасадов:", value: "Angel/Gallant" },
      { label: "Материал фасадов:", value: "МДФ" },
      { label: "Отделка фасадов:", value: "Акрилит" },
    ],
    [
      { label: "Толщина кромки, мм:", value: "1" },
      { label: "Цвет столешницы:", value: "Пирит светлый" },
      { label: "Толщина столешницы, мм", value: "38" },
      { label: "Масса брутто, кг:", value: "123.79" },
      { label: "Объем, куб.м:", value: "0.2131" },
    ],
  ],

  // Комплектация. The mock's middle column repeats the spec table's values
  // verbatim (a placeholder in the design); the column holds each module's
  // dimensions, which is what its first row actually shows.
  package: [
    { name: "Шкаф нижний с 2-мя дверцами Евро", value: "820*600*500", qty: "1 шт." },
    { name: "Шкаф нижний с 2-мя дверцами и ящиком Фьюжн", value: "820*800*500", qty: "1 шт." },
    { name: "Шкаф верхний с 2-мя дверцами Фьюжн", value: "720*600*300", qty: "1 шт." },
    { name: "Шкаф верхний с 1-ой дверцей Фьюжн", value: "720*400*300", qty: "1 шт." },
    { name: "Столешница Hard-38U Прямая (упак.)", value: "2170*600*38", qty: "1 шт." },
  ],

});

// =============================================================================
// Rails
// =============================================================================
mountCarousel(
  document.querySelector('[data-section="modules"]'),
  {
    id: "modules",
    title: "Модули",
    action: "Все модули Фьюжн",
    variant: "modul",
    arrowTop: 97, // centred on the card's 242px image box
  },
  modules
);

mountCarousel(
  document.querySelector('[data-section="add-to-cart"]'),
  {
    title: "Добавьте в корзину",
    tabs: ["Все сразу", "Столешницы", "Бытовая техника", "Системы выдвижения", "Мойки", "Смесители"],
    variant: "other-s",
    // The desktop title-block's `buttons` frame is empty, but the mobile
    // `other-row` (1997:315101) does carry the full-width "В раздел" action —
    // the two breakpoints genuinely differ here.
    desktopAction: false,
    arrowTop: 97,
    endpoint: "/product/fusion-05/addons", // tab seam target
  },
  addToCart
);

mountCarousel(
  document.querySelector('[data-section="reviews"]'),
  {
    id: "reviews",
    title: "Отзывы",
    count: reviews.length, // the mock prints the count beside the title, muted
    render: renderReviews,
    // The reviews rail is the one section with no action at either breakpoint:
    // `catalog-items` is the bare rail in both frames (1686:58686 / 1997:315105),
    // where every other rail carries a scroll bar and a button below `md`.
    desktopAction: false,
    mobileAction: false,
    mobileProgress: false,
    arrowTop: 124, // centred on the 296px card
  },
  reviews
);

mountCarousel(
  document.querySelector('[data-section="collection"]'),
  { title: "Вся коллекция Фьюжн", action: "В раздел" },
  collection
);

// The anchor bar resolves its targets by id, and two of them (#modules,
// #reviews) are sections the rails above emit — so it is wired last, not with
// the rest of the page's chrome.
initSectionNav();

// ---- Где купить (the home page's stores block, under this page's heading) --
const storesAnchor = document.querySelector('[data-section="salony"]');
if (storesAnchor) {
  setStoresMapBases({ home: HOME });
  renderStoresMap(storesAnchor, {
    stores,
    title: "Где купить",
    description:
      "Купить Кухня Фьюжн-05 вы можете в наших фирменных магазинах и в дилерских центрах",
    apiKey: import.meta.env?.VITE_YANDEX_MAPS_KEY || "73abf802-7fa6-4da1-bc36-7dd3457e4673",
  });
}

// ---- зелёная полоса: у PDP свой заголовок -----------------------------------
// Тело полосы общее с каталогом и «Акциями», отличается только заголовок:
// у листингов «Кухни VIVAT — сочетание стиля и функциональности», у обоих PDP
// (914:103460 и 1686:63240) — эта строка. Оттого их полоса 716, а не 680.
document.querySelector("[data-seo-title]").textContent =
  "Подберите полезные товары, которые идеально дополнят вашу кухню VIVAT.";

initModals();
initCitySelect();
