import "../../styles/app.css";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initDealerPriceControls } from "../../components/price-mode.js";
import { initModals } from "../../components/modals.js";
import { renderMenuB2b } from "../../components/menu-b2b.js";
import { ICON } from "../../data/asset-base.js";
import { dealerMenuSections } from "../../data/dealer-home.js";
import { MENU_B2B } from "../../data/menu-b2b.js";
import { NEWS } from "../../data/news.js";

// «Новости» — контентная страница дилерского раздела.

// ---- dealer strip: price list + «Показать цену» -----------------------------
initDealerPriceControls();

// ---- shared chrome (header mega-menu + burger) ------------------------------
setCatalogIconBase(ICON);
initCatalogMenu(document.querySelector("[data-catalog]"), {
  toggle: document.querySelector("[data-catalog-toggle]"),
});
initMobileMenu(document.querySelector("[data-mobile-menu-root]"), {
  toggle: document.querySelector("[data-mobile-menu]"),
  catalogToggle: document.querySelector("[data-mobile-catalog]"),
  rootSections: dealerMenuSections,
});
initSearch();
initCart();

// ---- меню раздела -----------------------------------------------------------
renderMenuB2b(MENU_B2B, { current: "news.html" });

// ---- рубрики ----------------------------------------------------------------
// Единственный шов страницы: своих кадров у рубрик нет, поэтому выбор пока
// только переставляет активную. На бэке здесь будет запрос за списком.
const RUBRICS = [
  "Все новости",
  "Новинка",
  "График работы",
  "Изменение цен",
  "Обучение",
  "Распродажа",
  "Прочее",
];
// Ряд рубрик стоит в двух местах: в колонке на 1440 и в шапке раздела на 360
// (2241:188715) — как форматы выгрузки у «Для интернет-магазинов».
const tabMounts = [
  document.querySelector("[data-news-tabs]"),
  document.querySelector("[data-fbh-tabs]"),
].filter(Boolean);

const buildTabs = () =>
  RUBRICS.map((label, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-current", String(i === 0));
    // `tab` size=M (759:86905 / pressed 759:86912): 16/24 SemiBold в коробке
    // 28, текст прижат книзу, активный — #292929 и нижняя граница 2px #141414
    // по ширине подписи. Линия внутренняя, поэтому это тень, а не `border-b`
    // (иначе текст поднимается на два пикселя) — как у форматов выгрузки.
    b.className =
      "flex h-7 shrink-0 items-end whitespace-nowrap " +
      "text-h5 text-text-secondary transition-colors max-md:h-[26px] max-md:text-m-h4 " +
      "aria-[current=true]:text-text-primary " +
      "aria-[current=true]:shadow-[inset_0_-2px_0_var(--color-text-pressed)]";
    b.textContent = label;
    b.dataset.rubric = String(i);
    b.addEventListener("click", () => {
      for (const x of document.querySelectorAll("[data-rubric]")) {
        x.setAttribute("aria-current", String(x.dataset.rubric === b.dataset.rubric));
      }
    });
    return b;
  });

for (const mount of tabMounts) mount.replaceChildren(...buildTabs());

// ---- список новостей --------------------------------------------------------
const tpl = document.querySelector("[data-news-item]");
document.querySelector("[data-news]").replaceChildren(
  ...NEWS.map((n) => {
    const node = tpl.content.cloneNode(true).firstElementChild;
    node.querySelector("[data-news-title]").textContent = n.title;
    node.querySelector("[data-news-date]").textContent = n.date;
    const body = node.querySelector("[data-news-body]");
    body.replaceChildren(
      ...n.body.map((p) => {
        const el = document.createElement("p");
        el.textContent = p;
        return el;
      })
    );
    const phones = node.querySelector("[data-news-phones]");
    if (n.phones) {
      phones.hidden = false;
      phones.querySelector("[data-news-phone-list]").replaceChildren(
        ...n.phones.map((t) => {
          const el = document.createElement("span");
          el.textContent = t;
          return el;
        })
      );
    } else {
      phones.remove();
    }

    const action = node.querySelector("[data-news-action]");
    if (n.action) action.querySelector("span").textContent = n.action;
    else action.remove();
    return node;
  })
);

// Кнопка постранички считает новости, а не товары (в макете там подпись
// мастера — см. BACKLOG).
document.querySelector("[data-grid-noun]").textContent = "новостей";

initModals();
