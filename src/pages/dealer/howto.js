import "../../styles/app.css";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initDealerPriceControls } from "../../components/price-mode.js";
import { initModals } from "../../components/modals.js";
import { initCitySelect } from "../../components/city-select.js";
import { renderMenuB2b } from "../../components/menu-b2b.js";
import { ICON } from "../../data/asset-base.js";
import { dealerMenuSections } from "../../data/dealer-home.js";
import { MENU_B2B } from "../../data/menu-b2b.js";
import { HOWTO, HOWTO_OUTRO } from "../../data/howto.js";

// «Как с нами работать?» — контентная страница дилерского раздела.
// Скрипт только проводка: своих швов у страницы нет.

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
renderMenuB2b(MENU_B2B, { current: "howto.html" });

// ---- содержимое -------------------------------------------------------------
// Абзац — список отрезков: строка это обычный текст, объект — ссылка. Разметку
// в фикстуре не держим, поэтому ссылку собираем здесь, как в accordion.js.
function paragraph(runs, first) {
  const p = document.createElement("p");
  // Заголовок отбивается сверху на 32, первый абзац на 16, следующие на 8
  // (в макете это paragraphSpacing внутри одного текстового блока — шаг между
  // базовыми линиями 32 против 24 внутри абзаца). На 360 отбивка первого
  // абзаца 12, текст 14/20, а **между абзацами ничего**: там все двадцать
  // базовых линий идут ровно через 20 (2241:162280).
  p.className =
    `${first ? "pt-4 max-md:pt-3" : "pt-2 max-md:pt-0"} ` +
    "text-body-n text-text-primary max-md:text-m-body-n";
  p.append(
    ...runs.map((r) => {
      if (typeof r === "string") return document.createTextNode(r);
      const a = document.createElement("a");
      a.href = r.href;
      a.textContent = r.t;
      a.className =
        r.u === "dotted"
          ? "link-dotted text-text-link-highlighted"
          : "text-text-link-highlighted underline";
      return a;
    })
  );
  return p;
}

document.querySelector("[data-howto]").replaceChildren(
  ...HOWTO.flatMap((s) => {
    const h = document.createElement("h3");
    h.className = "pt-8 text-h3 text-text-primary max-md:pt-6 max-md:text-m-h3";
    h.textContent = s.title;
    return [h, ...s.body.map((runs, i) => paragraph(runs, i === 0))];
  })
);

document.querySelector("[data-howto-outro]").textContent = HOWTO_OUTRO;

initModals();
initCitySelect();
