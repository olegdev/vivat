// ============================================================================
// MOCK DATA — product page (pages/customer/pdp.html)
//
// PORTING NOTE (PHP / Blade)
// `product` is the shape a controller hands the view; the four rails below are
// separate queries (related modules, add-ons, reviews, the rest of the
// collection). Delete this file and pass the same shapes:
//
//   product     → @include('partials.pdp-summary', ['product' => $product])
//                 and partials/sticky-price.html, which reads the same fields
//   modules     → @include('partials.carousel-section', ['items' => $modules])
//   addToCart   → ditto; `tab` is the filter column the tab request keys on
//   reviews     → ditto, rendered with partials/review-card.html
//   collection  → ditto
// ============================================================================
import { HOME, PDP } from "./asset-base.js";

// =============================================================================
// The product (Figma summary 2238:153498)
// =============================================================================
// The shape a Blade controller would hand the view. Four colours, the second
// one chosen — that is the swatch the mock draws with a ring.
export const product = {
  // Идентификатор для корзины: «Сформировать заказ» кладёт товар тем же швом,
  // что и карточки (components/cart.js). Тот же ключ уже стоит в endpoint
  // рельса «Добавьте в корзину».
  id: "fusion-05",
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


const withId = (prefix, arr) => arr.map((p, i) => ({ id: `${prefix}-${i}`, ...p }));

const SWATCHES = [
  { img: `${PDP}/swatch-wood-src.png` },
  { img: `${PDP}/swatch-grey-src.png` },
  { img: `${HOME}/swatch-1-src.png` },
];

// ---- Модули (Figma catalog-row 914:103437, cards-modul 322px) --------------
export const modules = withId(
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


// ---- Добавьте в корзину (Figma other-row 1686:68154, cards-other size=s) ---
// Same tab seam as the home and Акции rails: a chip is a query parameter and
// one function loads its products (see carousel.js › initTabs).
export const addToCart = withId("atc", [
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


// ---- Отзывы (Figma catalog-items 1686:58686, review-card 437px) ------------
// The same rail shell, filled with review cards instead of products.
export const reviews = [
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


// ---- Вся коллекция Фьюжн (Figma kitchen-row 1686:58695, cards-kitchen 438) -
export const collection = withId("col", [
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

