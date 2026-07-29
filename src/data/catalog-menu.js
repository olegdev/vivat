// ============================================================================
// MOCK DATA — the catalog tree behind both menus
//
// PORTING NOTE (PHP / Blade)
// One tree, two surfaces: the desktop mega-menu (components/catalog-menu.js)
// and the mobile burger drill-down (components/mobile-menu.js) render the same
// data — do not let the port grow a second copy. On the server this is the
// category model; the render becomes nested @foreach over
// partials/catalog-menu.html and partials/mobile-menu.html.
//
// Only "Кухни" is fully designed in Figma, so only it carries `sub` / `chips` /
// `collections`. Fill the other categories the same way as their designs land —
// the render/interaction layer already handles them.
// ============================================================================
export const categories = [
  {
    name: "Кухни",
    // second-column sub-tabs; the active one drives the collections column
    sub: [{ label: "Все кухни" }, { label: "Коллекции", active: true }],
    chips: [
      "Прямые кухни",
      "Угловые кухни",
      "Фрезированые фасады",
      "Плоские фасады",
      "Стекло",
      "Мультицвет",
      "Белые",
      "Недорогие",
      "Популярные",
      "Для встраивоемой техники",
      "Под дерево",
    ],
    collections: [
      "Фьюжн",
      "Фрейм",
      "Нео",
      "Флэт",
      "Сканди",
      "Лофт",
      "Шале",
      "Барселона",
      "Квадро",
      "Дублин",
      "Евро",
      "Ницца",
      "Глетчер",
      "Прага",
      "Глетчер",
    ],
  },
  { name: "Техника для кухни" },
  { name: "Столешницы и фартуки" },
  { name: "Мойки и смесители" },
  { name: "Мебельная фурнитура" },
  { name: "Аксессуары для кухонь" },
  { name: "Столы и стулья" },
  { name: "Прихожие" },
  { name: "Для продавцов" },
];
