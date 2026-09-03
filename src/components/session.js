// Кто смотрит страницу — дилер или покупатель.
//
// Раздел «Для бизнеса» один на обе половины: клиент описал это так —
// «страницы шарятся, плашка меняется в зависимости от логина дилера».
// Поэтому одиннадцать контентных страниц раздела не проставляют `data-user` в
// разметке, а берут его из сеанса (partials/session.html); собственные экраны
// дилера — главная, каталог, PDP, заказ, конструктор — держат атрибут жёстко:
// покупатель туда не ходит.
//
// Половина решает не только плашку, но и адрес. Общая обвязка лежит в одних и
// тех же партиалах, а её ссылки относительные, и с контентной страницы
// `main.html` разрешается в дилерскую главную кому угодно. Поэтому такие
// ссылки написаны в разметке полным путём в покупательскую половину и помечены
// `data-half`; у дилера этот сегмент подменяется здесь. `../customer/…` и
// `../dealer/…` разрешаются одинаково из обеих папок — см. docs/LINK-MAP.md ›
// «Правило адресации».
//
// ШОВ. В Blade сеанса в localStorage не будет: `data-user` отрендерит сервер
// прямо в <body>, а адреса соберёт route() по той же роли. Тогда исчезнут и
// partials/session.html, и подмена ниже — разметка приедет уже верной.
const STORE_KEY = "vivat:user";

export const isDealer = () => document.body.dataset.user === "dealer";

export function signIn() {
  try {
    localStorage.setItem(STORE_KEY, "dealer");
  } catch {
    /* приватный режим — сеанс не переживёт переход, но вход сработает */
  }
}

export function signOut() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* см. signIn */
  }
}

function applyHalfLinks(root) {
  if (!isDealer()) return;
  root.querySelectorAll('a[data-half][href^="../customer/"]').forEach((a) => {
    a.setAttribute("href", a.getAttribute("href").replace("../customer/", "../dealer/"));
  });
}

export function initSession(root = document) {
  applyHalfLinks(root);

  // «Выход» есть в дилерской полоске шапки и в бургер-меню; экрана «вы вышли»
  // в макете нет, поэтому просто уводим на покупательскую главную.
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-logout]")) return;
    e.preventDefault();
    signOut();
    window.location.href = "../customer/main.html";
  });
}
