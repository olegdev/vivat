import "../../styles/app.css";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initDealerPriceControls } from "../../components/price-mode.js";
import { initModals } from "../../components/modals.js";
import { ICON } from "../../data/asset-base.js";
import { dealerMenuSections } from "../../data/dealer-home.js";
import { MODELS_LIST, MODEL_SPEC, MODEL_ACTION } from "../../data/models.js";
import { mountCarousel } from "../../components/carousel.js";
import { popularItems } from "../../data/catalog.js";

// «Каталог 3D-моделей». Не контентная страница: левого меню раздела у фрейма
// нет, это каталог со своей карточкой. Фильтры и сортировка не подключены —
// шторки для этого фрейма макет не рисует (см. BACKLOG).

initDealerPriceControls();

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

// ---- сетка моделей ----------------------------------------------------------
const tpl = document.querySelector("[data-model-card]");
document.querySelector("[data-models]").replaceChildren(
  ...MODELS_LIST.map((m) => {
    const node = tpl.content.cloneNode(true).firstElementChild;
    // У двух карточек из тридцати рендера нет ни в инстансе, ни в мастере —
    // в экспорте его просто нет. Пустой src даёт битую иконку, поэтому слот
    // остаётся пустой плашкой (см. BACKLOG).
    const img = node.querySelector("[data-model-img]");
    if (m.img) {
      img.src = m.img;
      img.alt = m.title;
    } else {
      img.replaceWith(
        Object.assign(document.createElement("div"), {
          className: "aspect-[322/242] w-full bg-bg-subtle",
        })
      );
    }
    node.querySelector("[data-model-title]").textContent = m.title;
    node.querySelector("[data-model-spec]").textContent = MODEL_SPEC;
    node.querySelector("[data-model-action] span").textContent = MODEL_ACTION;
    return node;
  })
);

// ---- Популярные товары ------------------------------------------------------
// Рельс с сегментами (2338:254296) — тот же, что закрывает каталог.
mountCarousel(
  document.querySelector('[data-section="popular"]'),
  {
    title: "Популярные товары для кухни",
    desc: "Подберите полезные товары, которые идеально дополнят вашу кухню VIVAT.",
    tabs: ["Все сразу", "Столешницы", "Бытовая техника", "Системы выдвижения", "Мойки", "Смесители"],
    endpoint: "/catalog/popular",
  },
  popularItems
);

initModals();
