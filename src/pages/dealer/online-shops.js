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
import { renderDataTable } from "../../components/data-table.js";
import { FORMATS, EXPORT_URLS, DOWNLOADS, FEATURES } from "../../data/online-shops.js";
import { FORMAT_TABLE } from "../../data/format-table.js";

// Для интернет-магазинов — контентная страница дилерского раздела.
// Скрипт только проводка плюс один шов: выбор формата выгрузки.

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
renderMenuB2b(MENU_B2B, { current: "online-shops.html" });

// ---- формат выгрузки --------------------------------------------------------
// Единственный шов страницы. В макете нарисовано только состояние JSON, у
// XML / YML / CSV кадров нет, поэтому смена формата пока лишь переписывает
// подписи и адреса; на бэке здесь будет запрос за содержимым формата.
// Ряд табов стоит в двух местах: в колонке на 1440 и в шапке раздела на 360
// (там он и есть та третья часть, из-за которой шапка вырастает до 150).
const tabMounts = [
  document.querySelector("[data-formats]"),
  document.querySelector("[data-fbh-tabs]"),
].filter(Boolean);

function applyFormat(id) {
  const fmt = FORMATS.find((f) => f.id === id) || FORMATS[0];

  for (const btn of document.querySelectorAll("[data-format]")) {
    btn.setAttribute("aria-current", String(btn.dataset.format === fmt.id));
  }

  const up = fmt.label;
  document.querySelector("[data-format-lead]").textContent = `Получение выгрузки ${up}`;
  document.querySelector("[data-features-title]").textContent = `Особенности ${up}`;

  document.querySelector("[data-export-urls]").replaceChildren(
    ...EXPORT_URLS.map((e) => {
      // table-decor 2036:159010 — 521 = left-side 351 (ссылка + выносок,
      // зазор 12) + 16 + right-side 154 (город). Ссылка в 351 переносится,
      // как и в макете у последней строки.
      const row = document.createElement("div");
      row.className = "flex min-h-11 items-baseline gap-4";
      const left = document.createElement("span");
      left.className = "flex w-[351px] items-baseline gap-3 max-md:w-[206px] max-md:flex-none";
      const a = document.createElement("a");
      a.href = e.url.replace("/json/", `/${fmt.id}/`);
      a.className = "[overflow-wrap:anywhere] text-body-n text-text-primary underline max-md:text-m-body-n";
      a.textContent = a.href;
      const lead = document.createElement("span");
      lead.className = "spec-leader flex-1 max-md:hidden";
      left.append(a, lead);
      const city = document.createElement("span");
      city.className = "w-[154px] shrink-0 text-body-n text-text-primary max-md:w-[106px] max-md:text-m-body-n";
      city.textContent = e.city;
      row.append(left, city);
      return row;
    })
  );

  document.querySelector("[data-downloads]").replaceChildren(
    ...DOWNLOADS.map((label) => {
      const a = document.createElement("a");
      a.href = "#";
      a.className = "w-fit text-body-n text-text-primary underline max-md:text-m-body-n";
      a.textContent = label.replace("JSON", up);
      return a;
    })
  );
}

const buildTabs = () =>
  FORMATS.map((f) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.format = f.id;
    b.className =
      "shrink-0 whitespace-nowrap px-0 py-1 text-body-n text-text-secondary transition-colors " +
      "aria-[current=true]:text-text-pressed aria-[current=true]:underline aria-[current=true]:underline-offset-8";
    b.textContent = f.label;
    b.addEventListener("click", () => applyFormat(f.id));
    return b;
  });

for (const mount of tabMounts) mount.replaceChildren(...buildTabs());

document.querySelector("[data-features]").replaceChildren(
  ...FEATURES.map((t) => {
    const li = document.createElement("li");
    li.className = "flex gap-1 pt-3";
    li.innerHTML =
      '<span class="flex size-6 shrink-0 items-center justify-center" aria-hidden="true">' +
      '<span class="size-1 rounded-full bg-text-primary"></span></span>';
    const span = document.createElement("span");
    span.textContent = t;
    li.append(span);
    return li;
  })
);

renderDataTable(document.querySelector("[data-format-table]"), FORMAT_TABLE);

applyFormat("json");

initModals();
