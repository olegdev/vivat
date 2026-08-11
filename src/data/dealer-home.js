// ============================================================================
// MOCK DATA — dealer home page (Figma dealer/Main 882:107882)
//
// PORTING NOTE (PHP / Blade): replace with server data. Section titles and
// descriptions are NOT here — they are design copy and stay at the call site
// in pages/dealer/main.js, the same rule the customer pages follow.
//
// The rails, the hero and the promo tiles reuse the customer home page's
// fixtures verbatim (data/home.js) — the dealer frames show the same products,
// so a second copy would be two things to keep in step. Only what is genuinely
// dealer-specific lives here.
// ============================================================================

// ---- Новости (news-item 882:110636) ----------------------------------------
// The first card is the design's own copy; the other two are plausible stand-ins
// — all three instances in the frame carry the component's default text, so the
// design does not specify them.
export const newsItems = [
  {
    title: "Вебинар для дилеров",
    desc: "26.05.2026 с 11:00 до 12:15 Фабрика мебели VIVAT проводит вебинар на тему: «Эффективная презентация на этапе создания 3D проекта кухни»",
    date: "22.05.2026",
  },
  {
    title: "Обновление каталога декоров",
    desc: "В каталог добавлены шесть новых декоров фасадов и две столешницы. Образцы уже отгружаются со склада, обновлённые выкраски доступны к заказу.",
    date: "14.05.2026",
  },
  {
    title: "Летний график отгрузок",
    desc: "С 1 июня меняется график отгрузок со склада в Москве. Заказы, оформленные до 15:00, отгружаются в день обращения.",
    date: "30.04.2026",
  },
];

// ---- Прайс-листы (dropdown-header 607:26932) --------------------------------
// TODO(design): the dropdown draws three rows, and all three carry the
// component's default label ("Оптовая цена") — only the selected one is real.
// The other two are placeholders until the designer names them.
export const priceLists = [
  { id: "opt", label: "Оптовая цена", selected: true },
  { id: "tbd-2", label: "Прайс-лист 2" },
  { id: "tbd-3", label: "Прайс-лист 3" },
];
