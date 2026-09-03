import "../../styles/app.css";
import { mountCarousel } from "../../components/carousel.js";
import { renderReviews } from "../../components/review-card.js";
import { initSummary, initSpecTabs, initSectionNav, initStickyPrice, initPhotoRail, initPdpOrder } from "../../components/pdp.js";
import { enableDragScroll } from "../../components/carousel.js";
import { renderStoresMap, setBases as setStoresMapBases } from "../../components/stores-map.js";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initDealerPriceControls } from "../../components/price-mode.js";
import { stores } from "../../data/stores.js";
import { HOME, ICON } from "../../data/asset-base.js";
import { dealerMenuSections } from "../../data/dealer-home.js";
import { product, modules, addToCart, reviews, collection } from "../../data/pdp.js";
import { initModals } from "../../components/modals.js";
import { initCitySelect } from "../../components/city-select.js";

// Дилерский PDP — та же проводка, что у покупательского (фреймы совпадают нода
// в ноду), плюс дилерская обвязка: полоска с прайс-листом в шапке и дилерский
// набор строк в бургере. Товар тот же (data/pdp.js): у дилера отличается только
// показ цены, не данные.

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

initSummary(product);
initStickyPrice(product);
initPhotoRail();
// Mobile rails scroll natively under a finger; a mouse drag on a narrow desktop
// window needs the explicit handler (SOLUTIONS.md › native scroll rails).
enableDragScroll(document.querySelector("[data-photo-rail]"));
enableDragScroll(document.querySelector("[data-spec-tabs]"));

// =============================================================================
// Характеристики — четыре панели (Figma 1686:59210 / 1686:59341 / 1686:59383).
// Обе панели дилерского фрейма совпадают с покупательскими до размеров боксов,
// поэтому данные те же.
// =============================================================================
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

  package: [
    { name: "Шкаф нижний с 2-мя дверцами Евро", size: "816*800*478", weight: "27.064", volume: "0.04715", qty: "1" },
    { name: "Шкаф нижний с 1-ой дверцей и ящиком Евро", size: "816*400*478", weight: "19.009", volume: "0.03206", qty: "1" },
    { name: "Шкаф нижний с 1-ой дверцей Евро", size: "716*800*318", weight: "17.032", volume: "0.03232", qty: "2" },
    { name: "Шкаф верхний с 1-ой дверцей Евро Лайн", size: "716*800*318", weight: "22.064", volume: "0.03828", qty: "1" },
    { name: "Столешница Hard-38U Прямая (упак.)", size: "38*3050*600", weight: "46", volume: "0.0695", qty: "1" },
  ],

});

// =============================================================================
// Rails — те же четыре, что у покупателя: копия title-block'ов дилерского
// фрейма совпадает с покупательской строка в строку.
// =============================================================================
mountCarousel(
  document.querySelector('[data-section="modules"]'),
  {
    id: "modules",
    title: "Модули",
    action: "Все модули Фьюжн",
    // Каталог с фильтром «только модули» — тем же, что несёт переключателем
    // дилерский каталог (docs/LINK-MAP.md §4.16).
    href: "catalog.html?modules=1",
    // Страница модуля одна на весь сайт и лежит у покупателя: дилерского
    // фрейма у неё нет вовсе (CLAUDE.md). Поэтому карточки этого рельса —
    // единственные, чей адрес приходится задавать явно.
    cardHref: "../customer/pdp-module.html",
    variant: "modul",
    arrowTop: 53, // 914:103437 carousel-controls y=53 — NOT centred on the 242px image
  },
  modules
);

mountCarousel(
  document.querySelector('[data-section="add-to-cart"]'),
  {
    title: "Добавьте в корзину",
    tabs: ["Все сразу", "Столешницы", "Бытовая техника", "Системы выдвижения", "Мойки", "Смесители"],
    variant: "other-s",
    desktopAction: false,
    href: "catalog.html",
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
    count: reviews.length,
    render: renderReviews,
    desktopAction: false,
    mobileAction: false,
    mobileProgress: false,
    arrowTop: 136, // 1686:58686 carousel-controls y=136 — not the card's own centre (148)
  },
  reviews
);

mountCarousel(
  document.querySelector('[data-section="collection"]'),
  { title: "Вся коллекция Фьюжн", action: "В раздел", href: "catalog.html?collection=Фьюжн" },
  collection
);

// The anchor bar resolves its targets by id, and two of them (#modules,
// #reviews) are sections the rails above emit — so it is wired last, not with
// the rest of the page's chrome.
initSectionNav();

// ---- Где купить (блок салонов с главной, под заголовком этой страницы) ------
const storesAnchor = document.querySelector('[data-section="salony"]');
if (storesAnchor) {
  setStoresMapBases({ home: HOME });
  renderStoresMap(storesAnchor, {
    stores,
    title: "Где купить",
    titleMobile: "Наши салоны",
    description:
      "Купить Кухня Фьюжн-05 вы можете в наших фирменных магазинах и в дилерских центрах",
    apiKey: import.meta.env?.VITE_YANDEX_MAPS_KEY || "73abf802-7fa6-4da1-bc36-7dd3457e4673",
  });
}

// ---- дилерская полоска: прайс-лист + «Показать цену» ------------------------
// Идёт последней, а не первой, как в dealer/catalog.js: её инициализация сразу
// применяет сохранённый режим и пересчитывает всё, у чего есть базовая цена.
// Здесь это не только карточки рельсов, но и цена в сводке и в нижней панели,
// поэтому пересчёт должен застать их уже отрисованными.
initDealerPriceControls();

// ---- зелёная полоса: у PDP свой заголовок -----------------------------------
// Тело полосы общее с каталогом и «Акциями», отличается только заголовок:
// у листингов «Кухни VIVAT — сочетание стиля и функциональности», у обоих PDP
// (914:103460 и 1686:63240) — эта строка. Оттого их полоса 716, а не 680.
document.querySelector("[data-seo-title]").textContent =
  "Подберите полезные товары, которые идеально дополнят вашу кухню VIVAT.";

initModals();
initCitySelect();

// «Сформировать заказ»: в корзину и на оформление (LINK-MAP §4.1).
initPdpOrder(product);
