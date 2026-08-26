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
      // как и в макете у последней строки. Стиль ссылки — «Link M dotted»,
      // то есть пунктир, а не сплошное подчёркивание; набрана она серым
      // #808080, тогда как город рядом — #292929. Строка 44 центрирует
      // содержимое, а выноска идёт по базовой линии ссылки.
      //
      // На 360 (2209:104255) колонки меняются местами: город 106 идёт первым,
      // ссылка 206 второй, строка 40, выноска нет, а сама ссылка серая 12/16 и
      // без подчёркивания. Это тот же ряд, перевёрнутый `flex-row-reverse`.
      const row = document.createElement("div");
      row.className =
        "flex min-h-11 items-center gap-4 max-md:min-h-10 max-md:flex-row-reverse";
      const left = document.createElement("span");
      left.className = "flex w-[351px] items-baseline gap-3 max-md:w-[206px] max-md:flex-none";
      const a = document.createElement("a");
      a.href = e.url.replace("/json/", `/${fmt.id}/`);
      a.className =
        "link-dotted [overflow-wrap:anywhere] text-body-n text-text-secondary " +
        "max-md:text-m-body-s max-md:no-underline";
      a.textContent = a.href;
      const lead = document.createElement("span");
      lead.className = "spec-leader flex-1 max-md:hidden";
      left.append(a, lead);
      const city = document.createElement("span");
      city.className = "w-[154px] shrink-0 text-body-n text-text-primary max-md:w-[106px] max-md:text-m-body-s";
      city.textContent = e.city;
      row.append(left, city);
      return row;
    })
  );

  document.querySelector("[data-downloads]").replaceChildren(
    ...DOWNLOADS.map((label) => {
      // «Link M dotted» кораллом (1167:74245/74246): пунктир, не сплошная.
      const a = document.createElement("a");
      a.href = "#";
      a.className =
        "link-dotted w-fit text-body-n text-text-link-highlighted max-md:text-m-body-n";
      a.textContent = label.replace("JSON", up);
      return a;
    })
  );
}

// Таб `tab` (759:86813 / mobile 1806:236442): 24/28 SemiBold в коробке 32,
// на 360 — 16/22 в коробке 26. Неактивный #808080, активный (variant
// condition=pressed 759:86815) — #292929 и нижняя граница 2px #141414 по
// ширине подписи.
//
// Текст в коробке прижат книзу (padV 4 сверху), а обводка в Figma внутренняя и
// ложится поверх этих же двух пикселей. `border-b` съел бы их у текста, поэтому
// линия — внутренняя тень: коробка остаётся 32, текст встаёт ровно как в
// макете. См. SOLUTIONS.md › «Обводка в Figma внутренняя».
const TAB_CLASS =
  "flex h-8 shrink-0 items-end whitespace-nowrap " +
  "text-h3 text-text-secondary transition-colors max-md:h-[26px] max-md:text-m-h4 " +
  "aria-[current=true]:text-text-primary " +
  "aria-[current=true]:shadow-[inset_0_-2px_0_var(--color-text-pressed)]";

const buildTabs = () => {
  const tabs = FORMATS.map((f) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.format = f.id;
    b.className = TAB_CLASS;
    b.textContent = f.label;
    b.addEventListener("click", () => applyFormat(f.id));
    return b;
  });

  // Пятый таб — «Где купить»: подпись, не переопределённая от таб-бара PDP.
  // Форматом он не является и потому не участвует в `applyFormat`; что он
  // должен делать на странице про фиды, макет не говорит — вопрос в BACKLOG.
  const link = document.createElement("button");
  link.type = "button";
  link.className = TAB_CLASS;
  link.textContent = "Где купить";
  tabs.push(link);

  return tabs;
};

for (const mount of tabMounts) mount.replaceChildren(...buildTabs());

// `list` 1167:74249 — номер в колонке 24 по правому краю, зазор 8, отбивка 12.
document.querySelector("[data-features]").replaceChildren(
  ...FEATURES.map((t, i) => {
    const li = document.createElement("li");
    li.className = "flex gap-2 pt-3";
    const num = document.createElement("span");
    num.className = "w-6 shrink-0 text-right";
    num.setAttribute("aria-hidden", "true");
    num.textContent = `${i + 1}.`;
    const span = document.createElement("span");
    span.className = "flex-1";
    span.textContent = t;
    li.append(num, span);
    return li;
  })
);

renderDataTable(document.querySelector("[data-format-table]"), FORMAT_TABLE);

applyFormat("json");

initModals();
initCitySelect();
