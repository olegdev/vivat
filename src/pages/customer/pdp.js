import "../../styles/app.css";
import { mountCarousel, setCarouselIconBase } from "../../components/carousel.js";
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

// This page lives at dist/pages/customer/pdp.html — assets sit two levels up.
const ASSET_ROOT = "../../assets";
const HOME = `${ASSET_ROOT}/home`;
const PDP = `${ASSET_ROOT}/pdp`;
const ICON = `${ASSET_ROOT}/header`;
setCarouselIconBase(ICON);

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

// =============================================================================
// The product (Figma summary 2238:153498)
// =============================================================================
// The shape a Blade controller would hand the view. Four colours, the second
// one chosen — that is the swatch the mock draws with a ring.
const product = {
  title: "Кухня Фьюжн-05",
  size: "В*Ш*Г 2000 х 2170 х 600 мм, Материал МДФ",
  price: "43 335₽",
  oldPrice: "43 335₽",
  discount: "- 10%",
  selectedColor: 1,
  // Three flat `color` fills and one image, sampled off the mock.
  colors: [
    { name: "Silky Cream", color: "#f0f0e6" },
    { name: "Silky White/Silky Light Grey", img: `${PDP}/swatch-grey-src.png` },
    { name: "Silky Light Blue", color: "#e6eef0" },
    { name: "Silky Wenge", color: "#5c3428" },
  ],
};

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

  // TODO: Состав has no Figma frame (see partials/pdp-specs.html). Placeholder
  // rows in Описание's shape so the tab the design draws is not dropped.
  sostav: [
    [
      { label: "Корпус:", value: "ЛДСП 16 мм" },
      { label: "Фасады:", value: "МДФ 16 мм" },
      { label: "Кромка:", value: "ПВХ" },
    ],
    [
      { label: "Задняя стенка:", value: "ХДФ 3 мм" },
      { label: "Фурнитура:", value: "Blum" },
      { label: "Столешница:", value: "ЛДСП 38 мм" },
    ],
  ],

  docs: [
    { name: "Кухни. Схема высоты кухонного гарнитура (без учета шкафов-пеналов).", href: "#" },
    { name: "Фьюжн-05", href: "#" },
  ],
});

// =============================================================================
// Rails
// =============================================================================
const withId = (prefix, arr) => arr.map((p, i) => ({ id: `${prefix}-${i}`, ...p }));

const SWATCHES = [
  { img: `${PDP}/swatch-wood-src.png` },
  { img: `${PDP}/swatch-grey-src.png` },
  { img: `${HOME}/swatch-1-src.png` },
];

// ---- Модули (Figma catalog-row 914:103437, cards-modul 322px) --------------
const modules = withId(
  "mod",
  [
    ["Шкаф нижний с 2-мя дверцами Фьюжн", "820*600*500", `${PDP}/module-base-2door-src.png`],
    ["Шкаф нижний с 3-мя ящиками Фьюжн", "820*400*500", `${PDP}/module-base-3drawer-src.png`],
    ["Шкаф верхний с 2-мя дверцами Фьюжн", "720*600*300", `${PDP}/module-wall-2door-src.png`],
    ["Шкаф верхний со стеклом Фьюжн", "720*800*300", `${PDP}/module-wall-glass-src.png`],
    ["Шкаф верхний с 1-ой дверцей Фьюжн", "720*400*300", `${PDP}/module-wall-1door-src.png`],
    ["Шкаф нижний с 1-ой дверцей Фьюжн", "816*500*480", `${PDP}/module-base-2door-src.png`],
  ].map(([title, size, image]) => ({
    image,
    price: "43 335₽",
    title,
    spec: { label: "Размер (В*Ш*Г), мм:", value: size },
    swatches: SWATCHES,
    more: "+5",
    comments: 2,
  }))
);

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

// ---- Добавьте в корзину (Figma other-row 1686:68154, cards-other size=s) ---
// Same tab seam as the home and Акции rails: a chip is a query parameter and
// one function loads its products (see carousel.js › initTabs).
const addToCart = withId("atc", [
  {
    image: `${HOME}/prod-pop-1-src.png`,
    price: "5 991₽",
    title: "Столешница Hard-38 кромка с 4-х сторон Прямая",
    category: { label: "Столешницы", count: 31 },
    tab: "Столешницы",
  },
  {
    image: `${HOME}/prod-pop-2-src.png`,
    price: "22 120₽",
    title: "Столешница Hard-38 кромка с 4-х сторон Прямая",
    category: { label: "Духовые шкафы", count: 12 },
    tab: "Бытовая техника",
  },
  {
    image: `${HOME}/prod-pop-3-src.png`,
    price: "210₽",
    oldPrice: "43 335₽",
    badges: [{ text: "- 10%", tone: "discount" }],
    title: "Универсальный гибкий уплотнитель АР-632",
    category: { label: "Уплотнитель для столешниц", count: 31 },
  },
  {
    image: `${HOME}/prod-mod-1-src.png`,
    price: "1440₽",
    title: "Табурет CHICO (SL1)",
    category: { label: "Стулья", count: 36 },
  },
  {
    image: `${HOME}/prod-mod-2-src.png`,
    price: "8 470₽",
    title: "Мойка Vivat Granite GR-52, кварц, песочный",
    category: { label: "Мойки", count: 22 },
    tab: "Мойки",
  },
  {
    image: `${HOME}/prod-mod-3-src.png`,
    price: "4 100₽",
    title: "Смеситель для кухни VIVAT SM-11, хром",
    category: { label: "Смесители", count: 18 },
    tab: "Смесители",
  },
  {
    image: `${HOME}/prod-mod-4-src.png`,
    price: "15 640₽",
    title: "Система выдвижения Tandembox, полное выдвижение",
    category: { label: "Системы выдвижения", count: 9 },
    tab: "Системы выдвижения",
  },
]);

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

// ---- Отзывы (Figma catalog-items 1686:58686, review-card 437px) ------------
// The same rail shell, filled with review cards instead of products.
const reviews = [
  {
    text: "Брал для новой квартиры. Понравилось, что можно было самому выбрать встраиваемую технику прямо в заказе — не пришлось бегать по другим магазинам",
    name: "Марина Соколова",
    date: "4 января 2025",
  },
  {
    text: "Фьюжн-05 стоит у нас уже три месяца. Выбирала долго — смотрела и других производителей, но здесь подкупило сочетание цены и внешнего вида. Единственный момент — хотелось бы побольше вариантов цвета фартука, но в итоге нашла подходящий. Рекомендую.",
    name: "Валентин",
    date: "21 августа 2025",
  },
  {
    text: "Брал для новой квартиры. Понравилось, что можно было самому выбрать встраиваемую технику прямо в заказе — не пришлось бегать по другим магазинам",
    name: "Алла",
    date: "3 мая 2026",
  },
  {
    text: "Заказывала кухню впервые через сайт — честно говоря, немного переживала, что без онлайн-оплаты будет неудобно. Но менеджер позвонил буквально через час, всё подробно объяснил. Фьюжн-05 в цвете капучино — просто мечта, фасады смотрятся дорого, столешница под мрамор держит удар уже полгода. Очень довольна.",
    name: "Марина Соколова",
    date: "4 января 2025",
  },
];

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

// ---- Вся коллекция Фьюжн (Figma kitchen-row 1686:58695, cards-kitchen 438) -
const collection = withId("col", [
  {
    image: `${PDP}/kitchen-1-src.png`,
    price: "450 010₽",
    badges: [{ text: "new", tone: "new" }, { text: "хит", tone: "hit" }],
    title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм",
    swatches: SWATCHES,
    more: "+5",
    comments: 2,
  },
  {
    image: `${PDP}/kitchen-2-src.png`,
    price: "11 430₽",
    badges: [{ text: "new", tone: "new" }, { text: "хит", tone: "hit" }],
    title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм",
    swatches: SWATCHES,
    more: "+5",
    comments: 2,
  },
  {
    image: `${PDP}/kitchen-3-src.png`,
    price: "32 544₽",
    badges: [{ text: "new", tone: "new" }, { text: "хит", tone: "hit" }],
    title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм",
    swatches: SWATCHES,
    more: "+5",
    comments: 2,
  },
  {
    image: `${PDP}/photo-1-src.png`,
    price: "58 900₽",
    title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм",
    swatches: SWATCHES,
    more: "+5",
    comments: 2,
  },
]);

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
