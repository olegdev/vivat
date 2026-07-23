import "../../styles/app.css";
// Inlined rather than <img src>: the hover animation transforms the three
// triangle clusters individually, which only CSS-in-the-document can reach.
// It lives in src/ (not public/) so Vite resolves and inlines it — same reason
// the social glyphs do, see app.css.
import CORAL_SVG from "../../components/promo-coral.svg?raw";
import { setIconBase } from "../../components/product-card.js";
import {
  mountCarousel,
  setCarouselIconBase,
  enableDragScroll,
  initScrollProgress,
} from "../../components/carousel.js";
import { initSearch } from "../../components/search.js";
import { initHeroSlider } from "../../components/hero-slider.js";
import { renderStoresMap, setBases as setStoresMapBases } from "../../components/stores-map.js";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu, setMobileMenuBases } from "../../components/mobile-menu.js";

// This page lives at dist/pages/customer/main.html — assets sit two levels up.
const ASSET_ROOT = "../../assets";
const HOME = `${ASSET_ROOT}/home`;
const ICON = `${ASSET_ROOT}/header`;
setIconBase(ICON);
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
setMobileMenuBases({ icons: ICON });
initMobileMenu(document.querySelector("[data-mobile-menu-root]"), {
  toggle: document.querySelector("[data-mobile-menu]"),
  catalogToggle: document.querySelector("[data-mobile-catalog]"),
});

// ---- header search (query contract + suggest seam) --------------------------
initSearch();

// ---- shared product-card data ------------------------------------------------
const KITCHEN_TITLE = "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм";
const SWATCHES = [{ img: `${HOME}/swatch-1-src.png` }, { color: "#d9d9d9" }, { color: "#ffffff" }];

const modularItems = [
  { image: `${HOME}/prod-mod-1-src.png`, price: "450 010₽" },
  { image: `${HOME}/prod-mod-2-src.png`, price: "11 430₽" },
  { image: `${HOME}/prod-mod-3-src.png`, price: "32 544₽" },
  { image: `${HOME}/prod-mod-4-src.png`, price: "22 991₽" },
].map((p) => ({
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

// Restarts a tile's video when the pointer enters it, the way the prototype
// replays the clip on hover. Touch never fires this, so mobile keeps the plain
// autoplay loop.
function initPromoHoverVideo(sectionEl) {
  sectionEl.querySelectorAll("video[data-restart]").forEach((v) => {
    const tile = v.closest(".group");
    tile?.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch") return;
      v.currentTime = 0;
      v.play().catch(() => {});
    });
  });
}

// ---- promo tiles section (А как вам вот такое) ------------------------------
// Per the Figma design this is NOT a slider (no arrows): a static row of 5 square
// tiles, centered so the middle three are fully visible and the edge two peek.
// Every tile is the same Figma `news-card`, whose hover variant (635:5551 /
// 637:18208) greys the caption to #808080 and either zooms the media 5% or, on
// the coral "animation" type, drifts the triangle clusters (see .promo-coral).
function promoTile(t) {
  let media;
  if (t.type === "coral") {
    // The coral tile's SVG carries its own overlay rect, so it needs no extra.
    media = CORAL_SVG;
  } else if (t.video) {
    // Figma fills the 437 square with the video. `data-restart` rewinds it on
    // hover, matching the prototype's replay-from-the-top behaviour.
    media = `<video class="size-full object-cover"
      src="${t.video}" ${t.poster ? `poster="${t.poster}"` : ""} ${
      t.offset ? `data-offset="${t.offset}"` : ""
    } data-restart autoplay muted loop playsinline></video>`;
  } else {
    // `crop` is the image fill's box in Figma, as % of the 437 square.
    const c = t.crop;
    media = `<img src="${t.img}" alt="${t.caption}" class="absolute max-w-none" draggable="false"
      style="left:${c.left};top:${c.top};width:${c.width};height:${c.height}" />`;
  }
  // Every news-card variant sits under a constant 10% #141414 wash (the
  // `overlay` rect, e.g. 634:5416) — it is not a hover state, it is always on.
  const overlay =
    t.type === "coral"
      ? ""
      : `<span class="pointer-events-none absolute inset-0 bg-overlay-light"></span>`;
  const box =
    t.type === "coral" ? "promo-coral" : t.zoom || t.video ? "promo-zoom" : "";
  // The two clipped edge tiles exist only to bleed off the 1440 canvas; the
  // 360px frame (1968:71551) carries three whole tiles instead.
  const scope = t.desktopOnly ? " max-md:hidden" : "";
  return `
    <div class="group flex w-[437px] shrink-0 flex-col gap-4 max-md:w-[320px] max-md:snap-start max-md:gap-3${scope}">
      <div class="${box} relative aspect-square w-full overflow-hidden rounded-n bg-bg-subtle">${media}${overlay}</div>
      <p class="text-center text-body-xl text-text-primary transition-colors group-hover:text-text-secondary max-md:text-m-body-xl">${t.caption}</p>
    </div>`;
}

// Desktop centres the row so the edge tiles peek; mobile scrolls the same tiles
// as a rail with a progress bar and a full-width action underneath
// (Figma section / А как вам 1968:71549).
function promoSection({ title, action = "Все акции", tiles }) {
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
      <div class="flex justify-center gap-6 max-md:justify-start max-md:gap-3" data-promo-track>${tiles
        .map(promoTile)
        .join("")}</div>
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
  { img: `${HOME}/promo-1-src.png`, crop: PROMO_PHOTO_CROP, zoom: true, caption: "Столешница в подарок к кухне!" },
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
const akciiItems = [
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
];

// ---- hydrate anchors --------------------------------------------------------
// `tab` = which carousel tab (below) the item belongs to; items without one show
// only under "Все сразу". The carousel tab seam filters on it — see initTabs().
const popularItems = [
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
];

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
  promoAnchor.innerHTML = promoSection({ title: "А как вам вот такое", tiles: promoTiles });
  initScrollProgress(promoAnchor);
  initPromoHoverVideo(promoAnchor);
  enableDragScroll(promoAnchor.querySelector("[data-viewport]"));
  // Offset the reused video so it plays out of sync with the middle one.
  promoAnchor.querySelectorAll("video[data-offset]").forEach((v) => {
    const seek = () => {
      if (v.duration) v.currentTime = Number(v.dataset.offset) % v.duration;
    };
    v.readyState >= 1 ? seek() : v.addEventListener("loadedmetadata", seek, { once: true });
  });
}

// ---- Наши салоны (Yandex Maps) ----------------------------------------------
// Mock dealer network — 10 points around Moscow. `coords` is [lon, lat], the
// order ymaps3 expects. `brand: true` = own VIVAT store, false = dealer centre;
// the "Только фирменные магазины" toggle filters on it.
const stores = [
  {
    name: "Фирменный магазин VIVAT",
    brand: true,
    address: "16-й км МКАД, 50 метров от внешней стороны, ул. Энергетиков, д. 22, корп. 3",
    metro: ["Жулебино", "Котельники"],
    coords: [37.8567, 55.6588],
    hours: "Ежедневно, 10:00 — 21:00",
    phone: "+7 (495) 120-45-01",
  },
  {
    name: "Фирменный магазин VIVAT",
    brand: true,
    address: "г. Химки, Ленинградское ш., 5, ТЦ «Гранд», 2-й этаж",
    metro: ["Планерная"],
    coords: [37.4102, 55.8792],
    hours: "Ежедневно, 10:00 — 22:00",
    phone: "+7 (495) 120-45-02",
  },
  {
    name: "Фирменный магазин VIVAT",
    brand: true,
    address: "Каширское ш., 61Г, ТЦ «Москворечье», 1-й этаж",
    metro: ["Каширская", "Кантемировская"],
    coords: [37.6510, 55.6432],
    hours: "Ежедневно, 10:00 — 21:00",
    phone: "+7 (495) 120-45-03",
  },
  {
    name: "Дилерский центр «Мебель-Град»",
    brand: false,
    address: "Дмитровское ш., 163А, ТЦ «РИО», 3-й этаж",
    metro: ["Алтуфьево"],
    coords: [37.5661, 55.8891],
    hours: "Пн — Вс, 10:00 — 22:00",
    phone: "+7 (495) 771-16-40",
  },
  {
    name: "Фирменный магазин VIVAT",
    brand: true,
    address: "Ленинградское ш., 16А, стр. 4, БЦ «Метрополис»",
    metro: ["Войковская", "Сокол"],
    coords: [37.4991, 55.8199],
    hours: "Ежедневно, 10:00 — 21:00",
    phone: "+7 (495) 120-45-05",
  },
  {
    name: "Дилерский центр «Кухни Плюс»",
    brand: false,
    address: "ул. Профсоюзная, 61А, ТЦ «Калужский», 4-й этаж",
    metro: ["Новые Черёмушки"],
    coords: [37.5405, 55.6708],
    hours: "Пн — Сб, 10:00 — 21:00 · Вс, 11:00 — 20:00",
    phone: "+7 (495) 334-72-18",
  },
  {
    name: "Фирменный магазин VIVAT",
    brand: true,
    address: "Варшавское ш., 87Б, ТЦ «Варшавский», 2-й этаж",
    metro: ["Варшавская", "Нагатинская"],
    coords: [37.6180, 55.6620],
    hours: "Ежедневно, 10:00 — 21:00",
    phone: "+7 (495) 120-45-07",
  },
  {
    name: "Дилерский центр «ДомМебель»",
    brand: false,
    address: "Рязанский пр-т, 2, корп. 2, ТЦ «Город», 1-й этаж",
    metro: ["Нижегородская"],
    coords: [37.7350, 55.7280],
    hours: "Пн — Вс, 10:00 — 22:00",
    phone: "+7 (495) 660-09-33",
  },
  {
    name: "Фирменный магазин VIVAT",
    brand: true,
    address: "Новорижское ш., 5-й км, МКЦ «Гранд», павильон 214",
    metro: ["Мякинино"],
    coords: [37.3893, 55.8258],
    hours: "Ежедневно, 10:00 — 21:00",
    phone: "+7 (495) 120-45-09",
  },
  {
    name: "Дилерский центр «Интерьер-Холл»",
    brand: false,
    address: "г. Мытищи, Осташковское ш., 1, ТЦ «Красный Кит», 3-й этаж",
    metro: ["Медведково"],
    coords: [37.7370, 55.9040],
    hours: "Пн — Вс, 10:00 — 21:00",
    phone: "+7 (495) 419-55-06",
  },
];

const storesAnchor = document.querySelector('[data-section="salony"]');
if (storesAnchor) {
  setStoresMapBases({ icon: ICON, home: HOME });
  renderStoresMap(storesAnchor, {
    stores,
    apiKey: import.meta.env?.VITE_YANDEX_MAPS_KEY || "73abf802-7fa6-4da1-bc36-7dd3457e4673",
    description:
      "Наша продукция продается в сотнях городов России в наших официальных магазинах и дилерских центрах.",
  });
}
