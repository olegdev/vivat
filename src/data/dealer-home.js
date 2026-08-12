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

// ---- Прайс-листы дилера (dropdown-header 607:26932) -------------------------
// Подписи прочитаны из инстансов мобильной шторки (2225:164853 / 2225:164854),
// а не из мастера — он у всех трёх строк один и тот же. В макете вторая строка
// подписана «Рекомендованая» с одной «н» — это опечатка, и мы её не повторяем
// (см. правило про орфографию в CLAUDE.md и строку в BACKLOG). min=50 — из
// подписи «Минимальная наценка 50%» (2225:165661).
// В Blade это @foreach по прайс-листам с сервера.
export const priceModes = [
  { id: "wholesale", label: "Оптовая цена" },
  { id: "rrp", label: "Рекомендованная цена" },
  { id: "markup", label: "Своя наценка", min: 50 },
];

// Заглушка: откуда берётся РРЦ, неизвестно (вопрос в BACKLOG). Один именованный
// коэффициент вместо выдуманных чисел по каждой карточке.
export const RRP_FACTOR = 2;

// ---- Бургер-меню дилера -----------------------------------------------------
// Фрейма на 360 у дилерской главной нет. Набор покупательский (1997:255059), но
// нижние ссылки — те же, что в дилерской полоске десктопной шапки (877:93261):
// вместо «Стать дилером» — кабинет и выход.
export const dealerMenuSections = [
  { label: "Каталог", view: "catalog" },
  { label: "Где купить", href: "#" },
  { label: "Компания", href: "#" },
  { label: "Полезная информация", href: "#" },
  { label: "Для бизнеса", href: "#" },
  { label: "Мой кабинет", href: "#" },
  { label: "Выход", href: "#" },
];
