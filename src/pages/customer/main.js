import "../../styles/app.css";
import {
  mountCarousel,
  setCarouselIconBase,
  enableDragScroll,
  initScrollProgress,
} from "../../components/carousel.js";
import { renderPromoTiles } from "../../components/promo-card.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initHeroSlider } from "../../components/hero-slider.js";
import { renderStoresMap, setBases as setStoresMapBases } from "../../components/stores-map.js";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { stores } from "../../data/stores.js";

// This page lives at dist/pages/customer/main.html — assets sit two levels up.
const ASSET_ROOT = "../../assets";
const HOME = `${ASSET_ROOT}/home`;
const ICON = `${ASSET_ROOT}/header`;
setCarouselIconBase(ICON);

// ---- hero slider ------------------------------------------------------------
// The Figma hero shows 3 dots. Slide 1 is the designed one — its video box
// ("chair2 1", 607:29176) sits at left -1 / top -130, 1441x811 inside the
// 1440x640 banner, so it is reproduced verbatim rather than object-cover'd.
// Slides 2-3 are mock collections (only slide 1 exists in Figma).
const HERO_VIDEO_FRAME = { left: -1, top: -130, width: 1441, height: 811 };

const heroSlides = [
  {
    video: `${HOME}/hero-fusion.mp4`,
    poster: `${HOME}/hero-fusion-poster.jpg`,
    frame: HERO_VIDEO_FRAME,
    sound: true,
    title: "Кухня Фьюжн<br>от 43 335₽",
    subtitle: "Самый темный графит",
    cta: { label: "Смотреть коллекцию", href: "#" },
  },
  {
    image: `${HOME}/hero-placeholder.svg`,
    title: "Кухня Мальмо<br>от 58 900₽",
    subtitle: "Скандинавский дуб",
    cta: { label: "Смотреть коллекцию", href: "#" },
  },
  {
    video: `${HOME}/hero-fusion.mp4`,
    poster: `${HOME}/hero-fusion-poster.jpg`,
    frame: HERO_VIDEO_FRAME,
    sound: true,
    title: "Кухня Ривьера<br>от 71 200₽",
    subtitle: "Матовый терракот",
    cta: { label: "Смотреть коллекцию", href: "#" },
  },
];

const heroEl = document.querySelector("[data-hero]");
if (heroEl) initHeroSlider(heroEl, heroSlides, { iconBase: ICON });

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

// ---- shared product-card data ------------------------------------------------
const KITCHEN_TITLE = "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм";
const SWATCHES = [{ img: `${HOME}/swatch-1-src.png` }, { color: "#d9d9d9" }, { color: "#ffffff" }];

// Stamp a stable id on each product — the cart seam prints it as data-product-id
// (the payload the server will get). Blade prints the model's real id here.
const withId = (prefix, arr) => arr.map((p, i) => ({ id: `${prefix}-${i}`, ...p }));

const modularItems = [
  { image: `${HOME}/prod-mod-1-src.png`, price: "450 010₽" },
  { image: `${HOME}/prod-mod-2-src.png`, price: "11 430₽" },
  { image: `${HOME}/prod-mod-3-src.png`, price: "32 544₽" },
  { image: `${HOME}/prod-mod-4-src.png`, price: "22 991₽" },
].map((p, i) => ({
  id: `mod-${i}`,
  ...p,
  title: KITCHEN_TITLE,
  badges: [
    { text: "new", tone: "new" },
    { text: "хит", tone: "hit" },
  ],
  swatches: SWATCHES,
  more: "+5",
  comments: 2,
}));

// ---- promo tiles section (А как вам вот такое) ------------------------------
// Per the Figma design this is NOT a slider (no arrows): a static row of 5 square
// tiles, centered so the middle three are fully visible and the edge two peek.
// The tiles themselves are the shared `news-card` unit — markup in
// partials/promo-card.html, filled by renderPromoTiles(); this section only
// supplies the shell around them. The rail sizes its own children (the two
// clipped edge tiles bleed off the 1440 canvas; the 360px frame 1968:71551
// carries three whole tiles instead), so the tile unit carries no width.
function promoSection({ title, action = "Все акции" }) {
  return `
  <section class="flex flex-col">
    <div class="px-10 max-md:px-4">
      <div class="h-20 max-md:h-10"></div>
      <div class="flex items-start justify-between">
        <h2 class="text-h2 text-text-primary max-md:text-m-h2">${title}</h2>
        <a href="#" class="btn btn-m btn-secondary max-md:hidden">
          <span>${action}</span>
          <img src="${ICON}/arrow-right-24.svg" alt="" class="size-6" />
        </a>
      </div>
      <div class="h-6 max-md:h-3"></div>
    </div>
    <div class="w-[1440px] overflow-hidden max-md:scroll-rail max-md:w-full max-md:snap-x max-md:snap-proximity max-md:scroll-pl-4 max-md:overflow-x-auto max-md:px-4" data-viewport>
      <div
        class="flex justify-center gap-6 *:w-[437px] *:shrink-0 max-md:justify-start max-md:gap-3 max-md:*:w-[320px] max-md:*:snap-start"
        data-promo-track
      ></div>
    </div>
    <div class="hidden max-md:block">
      <div class="scroll-progress" data-progress><span><i></i></span></div>
      <div class="px-4 pt-2">
        <a href="#" class="btn btn-m btn-secondary w-full">
          <span>В раздел</span>
          <img src="${ICON}/arrow-right-24.svg" alt="" class="size-6" />
        </a>
      </div>
    </div>
  </section>`;
}

// The 5 Figma tiles, left→right (Figma `news` 878:103592 — animation, image,
// image, animation, image). The coral tiles are the "animation" variant; the
// middle + right tiles share promo-chair.mp4, the right one offset in time so
// the two play out of sync.
// Crop of the photo fill, read off the Figma news-card (635:5427): the image box
// is 169.05% x 225.4% of the 437 square, offset by -12.67% / -39.82%.
const PROMO_PHOTO_CROP = { left: "-12.67%", top: "-39.82%", width: "169.05%", height: "225.4%" };

const promoTiles = [
  { type: "coral", desktopOnly: true, caption: "Столешница в подарок к кухне!" },
  { img: `${HOME}/promo-1-src.png`, crop: PROMO_PHOTO_CROP, caption: "Столешница в подарок к кухне!" },
  {
    video: `${HOME}/promo-chair.mp4`,
    poster: `${HOME}/promo-chair-poster.jpg`,
    caption: "Скидка в 20% на каждый пятый стул",
  },
  { type: "coral", caption: "Столешница в подарок к кухне!" },
  {
    video: `${HOME}/promo-chair.mp4`,
    poster: `${HOME}/promo-chair-poster.jpg`,
    offset: 3,
    desktopOnly: true,
    caption: "Скидка в 20% на каждый пятый стул",
  },
];

// Ten items, because the 360px frames lay the 152px "other" cards out as two
// rows of five (Figma `rows` 1968:150236). With fewer, the mobile rail has
// nothing to scroll while still showing a scroll indicator, and the bottom row
// ends up half empty.
const akciiItems = withId("akcii", [
  {
    image: `${HOME}/prod-pop-1-src.png`,
    price: "22 991₽",
    oldPrice: "43 335₽",
    badges: [{ text: "- 10%", tone: "discount" }],
    title: "Столешница Hard-38 кромка с 4-х сторон Прямая",
    category: { label: "Столешницы", count: 31 },
  },
  {
    image: `${HOME}/prod-pop-2-src.png`,
    price: "210₽",
    oldPrice: "43 335₽",
    badges: [{ text: "хит", tone: "hit" }, { text: "- 10%", tone: "discount" }],
    title: "Электрический духовой шкаф EDM 045 BBL",
    category: { label: "Духовые шкафы", count: 12 },
  },
  {
    image: `${HOME}/prod-pop-3-src.png`,
    price: "210₽",
    oldPrice: "43 335₽",
    badges: [{ text: "- 10%", tone: "discount" }],
    title: "Табурет CHICO (SL1)",
    category: { label: "Уплотнитель для столешниц", count: 31 },
  },
  {
    image: `${HOME}/prod-mod-2-src.png`,
    price: "6 780₽",
    oldPrice: "8 470₽",
    badges: [{ text: "- 20%", tone: "discount" }],
    title: "Мойка Vivat Granite GR-52, кварц, песочный",
    category: { label: "Мойки", count: 22 },
  },
  {
    image: `${HOME}/prod-mod-3-src.png`,
    price: "2 870₽",
    oldPrice: "4 100₽",
    badges: [{ text: "- 30%", tone: "discount" }],
    title: "Смеситель для кухни VIVAT SM-11, хром",
    category: { label: "Смесители", count: 18 },
  },
  {
    image: `${HOME}/prod-mod-4-src.png`,
    price: "12 512₽",
    oldPrice: "15 640₽",
    badges: [{ text: "- 20%", tone: "discount" }],
    title: "Система выдвижения Tandembox, полное выдвижение",
    category: { label: "Системы выдвижения", count: 9 },
  },
  {
    image: `${HOME}/prod-mod-1-src.png`,
    price: "382 508₽",
    oldPrice: "450 010₽",
    badges: [{ text: "хит", tone: "hit" }, { text: "- 15%", tone: "discount" }],
    title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм",
    category: { label: "Модульные кухни", count: 321 },
  },
  {
    image: `${HOME}/prod-pop-1-src.png`,
    price: "4 193₽",
    oldPrice: "5 991₽",
    badges: [{ text: "- 30%", tone: "discount" }],
    title: "Столешница Hard-38 кромка с 2-х сторон Угловая",
    category: { label: "Столешницы", count: 31 },
  },
  {
    image: `${HOME}/prod-pop-3-src.png`,
    price: "3 990₽",
    oldPrice: "5 700₽",
    badges: [{ text: "- 30%", tone: "discount" }],
    title: "Стул VERONA, велюр, тёмно-серый",
    category: { label: "Стулья", count: 16 },
  },
  {
    image: `${HOME}/prod-pop-2-src.png`,
    price: "17 990₽",
    oldPrice: "22 490₽",
    badges: [{ text: "- 20%", tone: "discount" }],
    title: "Варочная панель индукционная EIP 640 BL",
    category: { label: "Варочные панели", count: 24 },
  },
]);

// ---- hydrate anchors --------------------------------------------------------
// `tab` = which carousel tab (below) the item belongs to; items without one show
// only under "Все сразу". The carousel tab seam filters on it — see initTabs().
const popularItems = withId("pop", [
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
    title: "Электрический духовой шкаф EDM 045 BBL",
    category: { label: "Духовые шкафы", count: 12 },
    tab: "Бытовая техника",
  },
  {
    image: `${HOME}/prod-pop-3-src.png`,
    price: "210₽",
    oldPrice: "43 335₽",
    badges: [{ text: "- 10%", tone: "discount" }],
    title: "Табурет CHICO (SL1)",
    category: { label: "Уплотнитель для столешниц", count: 31 },
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
    price: "3 190₽",
    oldPrice: "4 100₽",
    badges: [{ text: "хит", tone: "hit" }],
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
  {
    image: `${HOME}/prod-pop-1-src.png`,
    price: "7 250₽",
    title: "Столешница Hard-38 кромка с 2-х сторон Угловая",
    category: { label: "Столешницы", count: 31 },
    tab: "Столешницы",
  },
  {
    image: `${HOME}/prod-pop-3-src.png`,
    price: "5 700₽",
    badges: [{ text: "new", tone: "new" }],
    title: "Стул VERONA, велюр, тёмно-серый",
    category: { label: "Стулья", count: 16 },
  },
  {
    image: `${HOME}/prod-pop-2-src.png`,
    price: "22 490₽",
    title: "Варочная панель индукционная EIP 640 BL",
    category: { label: "Варочные панели", count: 24 },
    tab: "Бытовая техника",
  },
  {
    image: `${HOME}/prod-mod-1-src.png`,
    price: "1 890₽",
    title: "Сушилка для посуды в шкаф, нержавеющая сталь",
    category: { label: "Аксессуары", count: 47 },
  },
]);

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
      endpoint: "/catalog/popular", // tab seam target (see carousel.js initTabs)
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

// promo tiles (distinct layout)
const promoAnchor = document.querySelector('[data-section="promo"]');
if (promoAnchor) {
  promoAnchor.innerHTML = promoSection({ title: "А как вам вот такое" });
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
