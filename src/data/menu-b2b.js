// Навигация дилерского раздела — Figma `menu-b2b` 1058:178109.
//
// Копия живёт в мастере, а не в инстансах: страница переопределяет ровно один
// пункт — активный. Поэтому подписи вычитаны из мастера (fig.mjs raw по
// menu-item), а не из инстанса на странице.
//
// Пять пунктов ведут на страницы, которых в макете нет (см. BACKLOG.md), — у
// них href="#". «Письмо директору» открывает готовую модалку, а не страницу.

export const MENU_B2B = [
  {
    title: "Помощь",
    items: [
      { label: "Как с нами работать?", href: "howto.html" },
      { label: "Доставка", href: "delivery.html" },
      { label: "Для интернет-магазинов", href: "online-shops.html" },
      { label: "Поставщикам", href: "#" },
    ],
  },
  {
    title: "Документы",
    items: [
      { label: "Сертификаты", href: "certificates.html" },
      { label: "Схемы сборки", href: "schemes.html" },
      { label: "Техническая информация", href: "tech-info.html" },
      { label: "Прайс-листы", href: "#" },
      { label: "Каталог мебели", href: "#" },
      // В макете «Каталог декторов» — опечатка, чиним (см. BACKLOG.md).
      { label: "Каталог декоров", href: "decors.html" },
      { label: "Обучающие материалы", href: "learning.html" },
      { label: "Методические пособия", href: "#" },
    ],
  },
  {
    title: "Компания",
    items: [
      { label: "Адреса", href: "contacts.html" },
      { label: "Новости", href: "news.html" },
      { label: "Письмо директору", href: "#", modal: "director" },
    ],
  },
];
