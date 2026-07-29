// Search fixtures — the mock corpus the prototype's overlay searches.
//
// The overlay is shared chrome (every page mounts partials/search-overlay.html),
// so its data can't live in a page script the way the rails' fixtures do. In the
// Blade build this file goes away entirely: `searchSuggest()` in
// components/search.js becomes one fetch and the server answers with the same
// three lists.
//
// Paths are relative to the including page; every customer page sits at
// src/pages/customer/, so `../../assets/...` is uniform (same rule as partials).
const HOME = "../../assets/home";

// ---- suggestions (Figma search 2338:101329 › hints) -------------------------
// Plain query strings. The overlay bolds the part of each one that matched.
export const SUGGESTIONS = [
  "Столешница угловая",
  "Столешница Hard-38",
  "Кромка для столешницы",
  "Стол Uni-Form",
  "Плинтус для столешницы Модерн",
  "Стулья для кухни",
  "Кухня Фьюжн",
  "Кухня угловая МДФ",
  "Мойка врезная",
  "Духовой шкаф встраиваемый",
];

// ---- category chips (Figma search 2338:192474) ------------------------------
// Sections the query also hits. A chip is a search, not a filter: clicking one
// runs it as the new query.
//
// `match` is the prototype's stand-in for relevance — the server decides which
// sections a query touches; here a chip shows when the query is a prefix of one
// of its own words.
export const CHIPS = [
  { label: "Столы", match: ["стол", "столы", "кухня"] },
  { label: "Стулья", match: ["стул", "стулья", "стол", "кухня"] },
  { label: "Комплектующие", match: ["стол", "кромка", "плинтус", "комплектующие"] },
  { label: "Кухни", match: ["кухня", "кухни", "фьюжн", "мдф"] },
];

// ---- "Рекомендуем" (Figma search 2337:156356) -------------------------------
// What the empty overlay shows before anything is typed: plain kitchen cards,
// no category tag and no swatch row — both rows collapse on the search card.
export const RECOMMENDED = [
  {
    id: "rec-1",
    image: `${HOME}/prod-mod-1-src.png`,
    price: "450 010₽",
    title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм",
    badges: [
      { text: "new", tone: "new" },
      { text: "хит", tone: "hit" },
    ],
  },
  {
    id: "rec-2",
    image: `${HOME}/prod-mod-2-src.png`,
    price: "11 430₽",
    title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм",
    badges: [
      { text: "new", tone: "new" },
      { text: "хит", tone: "hit" },
    ],
  },
  {
    id: "rec-3",
    image: `${HOME}/prod-mod-3-src.png`,
    price: "32 544₽",
    title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм",
    badges: [
      { text: "new", tone: "new" },
      { text: "хит", tone: "hit" },
    ],
  },
  {
    id: "rec-4",
    image: `${HOME}/prod-mod-4-src.png`,
    price: "22 991₽",
    title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм",
    badges: [
      { text: "new", tone: "new" },
      { text: "хит", tone: "hit" },
    ],
  },
  {
    id: "rec-5",
    image: `${HOME}/prod-mod-1-src.png`,
    price: "46 310₽",
    title: "Кухня Фьюжн-2, МДФ, 3200 х 2170 х 600 мм",
    badges: [{ text: "хит", tone: "hit" }],
  },
  {
    id: "rec-6",
    image: `${HOME}/prod-mod-2-src.png`,
    price: "38 700₽",
    title: "Кухня Фьюжн-1, МДФ, 2600 х 2170 х 600 мм",
    badges: [{ text: "new", tone: "new" }],
  },
];

// ---- the searchable catalogue ----------------------------------------------
// Result cards carry both optional rows the recommendations don't: the swatch +
// comments line and the underlined category tag with its count.
const SWATCHES = [
  { img: `${HOME}/swatch-1-src.png` },
  { img: `${HOME}/swatch-1-src.png` },
  { img: `${HOME}/swatch-1-src.png` },
];

export const CATALOGUE = [
  {
    id: "res-1",
    image: `${HOME}/prod-pop-1-src.png`,
    price: "46 310₽",
    title: "Столешница Hard-38 кромка с 4-х сторон Прямая",
    category: { label: "Уплотнитель для столешниц", count: 31 },
    swatches: SWATCHES,
    more: "+5",
    comments: 2,
  },
  {
    id: "res-2",
    image: `${HOME}/prod-mod-4-src.png`,
    price: "44 200₽",
    title: "Стол Uni-Form-S2.2B",
    category: { label: "Столы", count: 31 },
    swatches: SWATCHES,
    more: "+5",
    comments: 2,
  },
  {
    id: "res-3",
    image: `${HOME}/prod-pop-2-src.png`,
    price: "1 447₽",
    title: "Кромка для столешницы (с клеем)",
    category: { label: "Комплектующие", count: 31 },
    swatches: SWATCHES,
    more: "+5",
    comments: 2,
  },
  {
    id: "res-4",
    image: `${HOME}/prod-pop-3-src.png`,
    price: "3 347₽",
    title: "Плинтус для столешницы Модерн",
    category: { label: "Комплектующие", count: 31 },
    swatches: SWATCHES,
    more: "+5",
    comments: 2,
  },
  {
    id: "res-5",
    image: `${HOME}/prod-mod-1-src.png`,
    price: "450 010₽",
    title: "Кухня Фьюжн-0, МДФ, 2000 х 2170 х 600 мм",
    category: { label: "Кухни", count: 56 },
    swatches: SWATCHES,
    more: "+5",
    comments: 2,
  },
  {
    id: "res-6",
    image: `${HOME}/prod-mod-3-src.png`,
    price: "1 440₽",
    title: "Табурет CHICO (SL1)",
    category: { label: "Стулья", count: 36 },
    swatches: SWATCHES,
    more: "+5",
    comments: 4,
  },
  {
    id: "res-7",
    image: `${HOME}/prod-pop-3-src.png`,
    price: "210₽",
    oldPrice: "43 335₽",
    badges: [{ text: "- 10%", tone: "discount" }],
    title: "Универсальный гибкий уплотнитель АР-632",
    category: { label: "Уплотнитель для столешниц", count: 31 },
    swatches: SWATCHES,
    more: "+5",
    comments: 2,
  },
  {
    id: "res-8",
    image: `${HOME}/prod-pop-2-src.png`,
    price: "22 120₽",
    title: "Духовой шкаф встраиваемый Hansa BOEI68",
    category: { label: "Духовые шкафы", count: 12 },
    swatches: SWATCHES,
    more: "+5",
    comments: 7,
  },
];
