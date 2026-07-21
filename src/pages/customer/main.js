import "../../styles/app.css";
import { renderCarousel, setIconBase } from "../../components/product-card.js";
import { initHeroSlider } from "../../components/hero-slider.js";

// This page lives at dist/pages/customer/main.html — assets sit two levels up.
const ASSET_ROOT = "../../assets";
const HOME = `${ASSET_ROOT}/home`;
const ICON = `${ASSET_ROOT}/header`;
setIconBase(ICON);

// ---- hero slider ------------------------------------------------------------
// Only one hero slide is designed in Figma (the 3 dots there are a static mock).
// Its background is a VIDEO fill, sourced from VIVAT_SOURCES. Add entries here to
// make the slider rotate — the mechanics (autoplay/arrows/dots/swipe) are ready.
const heroSlides = [
  {
    video: `${HOME}/hero-fusion.mp4`,
    poster: `${HOME}/hero-fusion-poster.jpg`,
    objectPosition: "center 32%",
    title: "Кухня Фьюжн<br>от 43 335₽",
    subtitle: "Самый темный графит",
    cta: { label: "Смотреть коллекцию", href: "#" },
  },
];

const heroEl = document.querySelector("[data-hero]");
if (heroEl) initHeroSlider(heroEl, heroSlides, { iconBase: ICON, interval: 6000 });

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

// ---- tab chips (Популярные товары) ------------------------------------------
function chips(tabs = []) {
  if (!tabs.length) return "";
  const items = tabs
    .map((t, i) =>
      i === 0
        ? `<button class="flex h-10 items-center rounded-[24px] bg-surface-strong px-4 text-button-m text-text-inverse-primary">${t}</button>`
        : `<button class="flex h-10 items-center rounded-[24px] bg-components-subtle px-4 text-button-m text-text-primary">${t}</button>`
    )
    .join("");
  const more = `<button class="flex h-10 items-center gap-1 rounded-[24px] border border-border-light bg-bg-page px-4 text-button-m text-text-muted">еще <span class="tracking-widest">···</span></button>`;
  return `<div class="flex items-center gap-2 pt-6">${items}${more}</div>`;
}

// ---- carousel section shell (title-block + arrows + track) ------------------
function carouselSection({ title, desc, action = "В раздел", tabs }) {
  return `
  <section class="flex flex-col">
    <div class="px-10">
      <div class="h-20"></div>
      <div class="flex items-start justify-between">
        <div class="flex w-[783px] flex-col">
          <div class="flex min-h-11 items-center">
            <h2 class="text-h2 text-text-primary">${title}</h2>
          </div>
          <div class="h-2"></div>
          <p class="text-[16px] font-medium leading-[22px] text-text-primary">${desc}</p>
        </div>
        <div class="flex h-11 items-start px-2">
          <a href="#" class="flex h-11 items-center gap-2 rounded-[24px] bg-components-subtle px-4">
            <span class="text-button-m text-text-primary">${action}</span>
            <img src="${ICON}/arrow-right-24.svg" alt="" class="size-6" />
          </a>
        </div>
      </div>
      ${chips(tabs)}
      <div class="h-6"></div>
    </div>
    <div class="relative w-[1440px] px-10">
      <div class="flex gap-6 overflow-hidden" data-track></div>
      <button class="absolute left-4 top-[139px] flex size-12 items-center justify-center rounded-[24px] border border-border-default bg-components-subtle">
        <img src="${ICON}/chevron-left.svg" alt="Назад" class="size-6" />
      </button>
      <button class="absolute right-4 top-[139px] flex size-12 items-center justify-center rounded-[24px] border border-border-default bg-components-subtle">
        <img src="${ICON}/chevron-right.svg" alt="Вперёд" class="size-6" />
      </button>
    </div>
  </section>`;
}

// ---- promo tiles section (А как вам вот такое) ------------------------------
function promoSection({ title, action = "Все акции", tiles }) {
  const items = tiles
    .map((t) => {
      const media = t.video
        ? `<video class="size-full object-cover" src="${t.video}" ${
            t.poster ? `poster="${t.poster}"` : ""
          } autoplay muted loop playsinline></video>`
        : `<img src="${t.img}" alt="${t.caption}" class="size-full object-cover" ${
            t.objectPosition ? `style="object-position:${t.objectPosition}"` : ""
          } />`;
      return `
      <div class="flex w-[438px] shrink-0 flex-col gap-3">
        <div class="h-[440px] w-full overflow-hidden rounded-[4px]">${media}</div>
        <p class="text-body-xl text-text-primary">${t.caption}</p>
      </div>`;
    })
    .join("");
  return `
  <section class="flex flex-col">
    <div class="px-10">
      <div class="h-20"></div>
      <div class="flex items-start justify-between">
        <h2 class="text-h2 text-text-primary">${title}</h2>
        <a href="#" class="flex h-11 items-center gap-2 rounded-[24px] bg-components-subtle px-4">
          <span class="text-button-m text-text-primary">${action}</span>
          <img src="${ICON}/arrow-right-24.svg" alt="" class="size-6" />
        </a>
      </div>
      <div class="h-6"></div>
    </div>
    <div class="relative w-[1440px] px-10">
      <div class="flex gap-6 overflow-hidden">${items}</div>
      <button class="absolute left-4 top-[196px] flex size-12 items-center justify-center rounded-[24px] border border-border-default bg-components-subtle">
        <img src="${ICON}/chevron-left.svg" alt="Назад" class="size-6" />
      </button>
      <button class="absolute right-4 top-[196px] flex size-12 items-center justify-center rounded-[24px] border border-border-default bg-components-subtle">
        <img src="${ICON}/chevron-right.svg" alt="Вперёд" class="size-6" />
      </button>
    </div>
  </section>`;
}

// Tile 2 is a VIDEO fill in Figma; tile 3 is a vector graphic (coral fill +
// triangles) exported as SVG — neither has a raster source in VIVAT_SOURCES.
const promoTiles = [
  { img: `${HOME}/promo-1-src.png`, objectPosition: "center 40%", caption: "Столешница в подарок к кухне!" },
  {
    video: `${HOME}/promo-chair.mp4`,
    poster: `${HOME}/promo-chair-poster.jpg`,
    caption: "Скидка в 20% на каждый пятый стул",
  },
  { img: `${HOME}/promo-3.svg`, caption: "Столешница в подарок к кухне!" },
];

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
];

// ---- hydrate anchors --------------------------------------------------------
const popularItems = [
  {
    image: `${HOME}/prod-pop-1-src.png`,
    price: "5 991₽",
    title: "Столешница Hard-38 кромка с 4-х сторон Прямая",
    category: { label: "Столешницы", count: 31 },
  },
  {
    image: `${HOME}/prod-pop-2-src.png`,
    price: "22 120₽",
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
    },
    items: popularItems,
  },
  akcii: {
    cfg: { title: "Акции и скидки", desc: "Успейте купить любимые товары по специальной цене.", action: "В каталог" },
    items: akciiItems,
  },
};

for (const [name, { cfg, items }] of Object.entries(sections)) {
  const anchor = document.querySelector(`[data-section="${name}"]`);
  if (!anchor) continue;
  anchor.innerHTML = carouselSection(cfg);
  renderCarousel(anchor.querySelector("[data-track]"), items);
}

// promo tiles (distinct layout)
const promoAnchor = document.querySelector('[data-section="promo"]');
if (promoAnchor) {
  promoAnchor.innerHTML = promoSection({ title: "А как вам вот такое", tiles: promoTiles });
}
