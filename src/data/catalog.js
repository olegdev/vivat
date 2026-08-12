// ============================================================================
// MOCK DATA — catalog page (pages/customer/catalog.html)
//
// PORTING NOTE (PHP / Blade)
// `PRODUCTS` stands in for the paginated query the controller runs; delete it
// and drive the grid from `$products` in a @foreach. The attribute fields
// (collection / facade / form / color / style / price) are exactly the columns
// the filter drawer keys on — they are printed onto each card as data-* so the
// prototype can filter client-side. On the server that filtering happens in
// SQL and `applyFilters()` becomes a request (see SOLUTIONS.md › "Filters:
// form + request seam").
//
// `rub()` is display formatting only — in Blade this is a currency helper.
// ============================================================================
import { HOME } from "./asset-base.js";

// Each product carries the same attributes the filters key on (collection,
// facade, form, color, style, price). In the Blade build these come from the
// model and are printed onto each card as data-* — here they let applyFilters()
// demonstrate real filtering client-side. See buildCard().
export const rub = (n) => `${n.toLocaleString("ru-RU").replace(/ /g, " ")}₽`;

// Only prod-mod-1 is an actual kitchen render in the asset set; the rest are
// worktops / appliances. A kitchens catalog reuses the one kitchen image on
// every card (placeholder media) rather than show the wrong category.
const KITCHEN_IMAGES = [`${HOME}/prod-mod-1-src.png`];
// Card swatches — decorative colour chips (same shape as the home cards).
const SWATCHES = [{ img: `${HOME}/swatch-1-src.png` }, { color: "#d9d9d9" }, { color: "#ffffff" }];

// The attribute pools, keyed exactly like the drawer's field values.
const COLLECTIONS = [
  ["fusion", "Фьюжн"], ["kvadro", "Квадро"], ["evro", "Евро"], ["terra", "Терра"],
  ["skandi", "Сканди"], ["loft", "Лофт"], ["neo", "Нео"], ["shale", "Шале"],
];
const FACADES = ["ldsp", "mdf", "mdf-steklo"];
const FORMS = ["pryamaya", "uglovaya"];
const COLORS = ["belyy", "svetlo-seryy", "bezhevyy", "oreh", "chernyy", "zelenyy", "korichnevyy", "multicvet"];
const STYLES = ["klassika", "sovremennyy"];

// 24 kitchens, attributes spread round-robin so every filter value has matches.
export const PRODUCTS = Array.from({ length: 24 }, (_, i) => {
  const [collection, colLabel] = COLLECTIONS[i % COLLECTIONS.length];
  const facade = FACADES[i % FACADES.length];
  const form = FORMS[i % FORMS.length];
  const color = COLORS[i % COLORS.length];
  const style = STYLES[i % STYLES.length];
  const base = 60000 + ((i * 37) % 46) * 10000; // 60 000 … ~510 000
  const discounted = i % 3 === 0;
  const badges = [];
  if (i % 5 === 0) badges.push({ text: "new", tone: "new" });
  if (i % 4 === 1) badges.push({ text: "хит", tone: "hit" });
  if (discounted) badges.push({ text: `- ${5 + (i % 4) * 5}%`, tone: "discount" });
  return {
    id: `kitchen-${i}`, // cart-seam contract (printed as data-product-id)
    image: KITCHEN_IMAGES[i % KITCHEN_IMAGES.length],
    price: base,
    oldPrice: discounted ? Math.round(base * 1.18) : null,
    title: `Кухня ${colLabel}-${i % 9}, ${facade === "ldsp" ? "ЛДСП" : "МДФ"}, 2000 х 2170 х 600 мм`,
    badges,
    swatches: SWATCHES,
    more: "+5",
    comments: (i % 4) + 1,
    // Дилерский тумблер «Только модули» фильтрует по этому полю. Раскладка
    // через один — фикстура, а не факт из дизайна: серверного поля у него ещё
    // нет (см. BACKLOG).
    isModule: i % 2 === 0,
    collection,
    facade,
    form,
    color,
    style,
  };
});


// =============================================================================
// Популярные товары carousel (identical to the home page section)
// =============================================================================
// `tab` maps each item to a carousel tab (the tab seam filters on it — see
// carousel.js initTabs); tab-less items show only under "Все сразу".
export const popularItems = [
  { image: `${HOME}/prod-pop-1-src.png`, price: "5 991₽", title: "Столешница Hard-38 кромка с 4-х сторон Прямая", category: { label: "Столешницы", count: 31 }, tab: "Столешницы" },
  { image: `${HOME}/prod-pop-2-src.png`, price: "22 120₽", title: "Электрический духовой шкаф EDM 045 BBL", category: { label: "Духовые шкафы", count: 12 }, tab: "Бытовая техника" },
  { image: `${HOME}/prod-pop-3-src.png`, price: "210₽", oldPrice: "43 335₽", badges: [{ text: "- 10%", tone: "discount" }], title: "Табурет CHICO (SL1)", category: { label: "Табуреты", count: 31 } },
  { image: `${HOME}/prod-mod-2-src.png`, price: "8 470₽", title: "Мойка Vivat Granite GR-52, кварц, песочный", category: { label: "Мойки", count: 22 }, tab: "Мойки" },
  { image: `${HOME}/prod-mod-3-src.png`, price: "3 190₽", oldPrice: "4 100₽", badges: [{ text: "хит", tone: "hit" }], title: "Смеситель для кухни VIVAT SM-11, хром", category: { label: "Смесители", count: 18 }, tab: "Смесители" },
  { image: `${HOME}/prod-mod-4-src.png`, price: "15 640₽", title: "Система выдвижения Tandembox, полное выдвижение", category: { label: "Системы выдвижения", count: 9 }, tab: "Системы выдвижения" },
  { image: `${HOME}/prod-pop-1-src.png`, price: "7 250₽", title: "Столешница Hard-38 кромка с 2-х сторон Угловая", category: { label: "Столешницы", count: 31 }, tab: "Столешницы" },
  { image: `${HOME}/prod-pop-3-src.png`, price: "5 700₽", badges: [{ text: "new", tone: "new" }], title: "Стул VERONA, велюр, тёмно-серый", category: { label: "Стулья", count: 16 } },
  { image: `${HOME}/prod-pop-2-src.png`, price: "22 490₽", title: "Варочная панель индукционная EIP 640 BL", category: { label: "Варочные панели", count: 24 }, tab: "Бытовая техника" },
  { image: `${HOME}/prod-mod-1-src.png`, price: "1 890₽", title: "Сушилка для посуды в шкаф, нержавеющая сталь", category: { label: "Аксессуары", count: 47 } },
];

