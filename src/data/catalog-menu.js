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
    sub: [{ label: "Все кухни" }, { label: "Коллекции", showsCollections: true }],
    // `filter` is the exact `param=value` catalog-filters.html already uses
    // for the same option elsewhere (catalog-settings.html's quickfilter
    // row) — reused here, not invented. Chips with no matching filter value
    // in the catalog's own option lists carry none and just open the category.
    chips: [
      { label: "Прямые кухни", filter: "form=pryamaya" },
      { label: "Угловые кухни", filter: "form=uglovaya" },
      { label: "Фрезированые фасады", filter: "facade=mdf" },
      { label: "Плоские фасады" },
      { label: "Стекло", filter: "facade=mdf-steklo" },
      { label: "Мультицвет", filter: "color=multicvet" },
      { label: "Белые", filter: "color=belyy" },
      { label: "Недорогие" },
      { label: "Популярные" },
      { label: "Для встраивоемой техники" },
      { label: "Под дерево" },
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
