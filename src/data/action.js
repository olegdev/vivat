// ============================================================================
// MOCK DATA — Акции page (pages/customer/action.html)
//
// PORTING NOTE (PHP / Blade)
//   promos      → @foreach over partials/promo-card.html (the grid sizes its
//                 own cells, so the tile carries no width)
//   actionItems → @include('partials.carousel-section', ['items' => $products])
// ============================================================================
import { HOME, ACTION } from "./asset-base.js";

// =============================================================================
// Promo tiles (Figma products 2248:97196) — five `news-card`s, left→right
// =============================================================================
// Same unit and same hover as the home page's promo row: the caption greys and
// the photo zooms 5%. `crop` is the image fill's box in Figma as % of the square
// (SOLUTIONS.md › faithful-to-Figma media); the two tiles without one are plain
// covers in the design.
export const promos = [
  {
    // The same photo the home page's promo row uses, at the same crop.
    img: `${HOME}/promo-1-src.png`,
    crop: { left: "-12.67%", top: "-39.82%", width: "169.05%", height: "225.4%" },
    caption: "Столешница в подарок к кухне!",
  },
  { img: `${ACTION}/promo-tech-src.png`, caption: "Скидка на бытовую технику" },
  {
    img: `${ACTION}/promo-facades-src.png`,
    crop: { left: "-29.05%", top: "-9.31%", width: "165.07%", height: "138.54%" },
    caption: "Фасады премиум — без доплаты",
  },
  { img: `${ACTION}/promo-hardware-src.png`, caption: "Комплект фурнитуры в подарок" },
  {
    img: `${ACTION}/promo-assembly-src.png`,
    crop: { left: "-105.87%", top: "0%", width: "228.35%", height: "152.33%" },
    caption: "Сборка в подарок",
  },
];


const withId = (prefix, arr) => arr.map((p, i) => ({ id: `${prefix}-${i}`, ...p }));

export const actionItems = withId("action", [
  {
    image: `${HOME}/prod-pop-1-src.png`,
    price: "22 991₽",
    oldPrice: "43 335₽",
    badges: [{ text: "- 10%", tone: "discount" }],
    title: "Столешница Hard-38 кромка с 4-х сторон Прямая",
    category: { label: "Столешницы", count: 31 },
    tab: "Столешницы",
  },
  {
    image: `${HOME}/prod-pop-2-src.png`,
    price: "19 908₽",
    oldPrice: "22 120₽",
    badges: [{ text: "хит", tone: "hit" }, { text: "- 10%", tone: "discount" }],
    title: "Электрический духовой шкаф EDM 045 BBL",
    category: { label: "Духовые шкафы", count: 12 },
    tab: "Бытовая техника",
  },
  {
    image: `${HOME}/prod-pop-3-src.png`,
    price: "189₽",
    oldPrice: "210₽",
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
    tab: "Мойки",
  },
  {
    image: `${HOME}/prod-mod-3-src.png`,
    price: "2 870₽",
    oldPrice: "4 100₽",
    badges: [{ text: "- 30%", tone: "discount" }],
    title: "Смеситель для кухни VIVAT SM-11, хром",
    category: { label: "Смесители", count: 18 },
    tab: "Смесители",
  },
  {
    image: `${HOME}/prod-mod-4-src.png`,
    price: "12 512₽",
    oldPrice: "15 640₽",
    badges: [{ text: "- 20%", tone: "discount" }],
    title: "Система выдвижения Tandembox, полное выдвижение",
    category: { label: "Системы выдвижения", count: 9 },
    tab: "Системы выдвижения",
  },
  {
    image: `${HOME}/prod-pop-1-src.png`,
    price: "4 193₽",
    oldPrice: "5 991₽",
    badges: [{ text: "- 30%", tone: "discount" }],
    title: "Столешница Hard-38 кромка с 2-х сторон Угловая",
    category: { label: "Столешницы", count: 31 },
    tab: "Столешницы",
  },
  {
    image: `${HOME}/prod-pop-2-src.png`,
    price: "17 990₽",
    oldPrice: "22 490₽",
    badges: [{ text: "- 20%", tone: "discount" }],
    title: "Варочная панель индукционная EIP 640 BL",
    category: { label: "Варочные панели", count: 24 },
    tab: "Бытовая техника",
  },
]);

