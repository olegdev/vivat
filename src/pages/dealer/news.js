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
const tabsEl = document.querySelector("[data-news-tabs]");
tabsEl.replaceChildren(
  ...RUBRICS.map((label, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-current", String(i === 0));
    b.className =
      "shrink-0 whitespace-nowrap py-1 text-body-n text-text-secondary transition-colors " +
      "aria-[current=true]:text-text-primary aria-[current=true]:underline aria-[current=true]:underline-offset-8 " +
      "max-md:text-m-body-n";
    b.textContent = label;
    b.addEventListener("click", () => {
      for (const x of tabsEl.children) x.setAttribute("aria-current", String(x === b));
    });
    return b;
  })
);

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
    const action = node.querySelector("[data-news-action]");
    if (n.action) action.querySelector("span").textContent = n.action;
    else action.remove();
    return node;
  })
);

initModals();
