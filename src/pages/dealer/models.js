import "../../styles/app.css";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initSession } from "../../components/session.js";
import { initDealerPriceControls } from "../../components/price-mode.js";
import { initModals } from "../../components/modals.js";
import { initCitySelect } from "../../components/city-select.js";
import { ICON } from "../../data/asset-base.js";
import { dealerMenuSections } from "../../data/dealer-home.js";
import { MODELS_LIST, MODEL_SPEC, MODEL_ACTION } from "../../data/models.js";
import { mountCarousel } from "../../components/carousel.js";
import { popularItems } from "../../data/catalog.js";
import { initFiltersPanel } from "../../components/filters-panel.js";
import { fillGallery, initProductCards } from "../../components/product-card.js";

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
initSession();

// ---- сетка моделей ----------------------------------------------------------
const tpl = document.querySelector("[data-model-card]");
document.querySelector("[data-models]").replaceChildren(
  ...MODELS_LIST.map((m) => {
    const node = tpl.content.cloneNode(true).firstElementChild;
    // Галерея карточки — та же, что у товарной: три кадра и точки по низу.
    // У двух карточек из тридцати рендера нет ни в инстансе, ни в мастере —
    // в экспорте его просто нет, поэтому у них галерея остаётся пустой
    // плашкой (см. BACKLOG).
    if (m.img) fillGallery(node, { image: m.img, title: m.title });
    node.querySelector("[data-model-title]").textContent = m.title;
    node.querySelector("[data-model-spec]").textContent = MODEL_SPEC;
    node.querySelector("[data-model-action] span").textContent = MODEL_ACTION;
    return node;
  })
);
// Жесты и точки галереи — общий инициализатор товарных карточек.
initProductCards(document.querySelector("[data-models]"));

// ---- фильтры ----------------------------------------------------------------
// Шторка каталожная (группы совпадают с пилюлями), ряда чипсов у страницы нет.
initFiltersPanel({
  groups: ["collection", "form", "facade", "color", "style"],
  price: true,
});

// ---- Популярные товары ------------------------------------------------------
// Рельс с сегментами (2338:254296) — тот же, что закрывает каталог.
mountCarousel(
  document.querySelector('[data-section="popular"]'),
  {
    title: "Популярные товары для кухни",
    desc: "Подберите полезные товары, которые идеально дополнят вашу кухню VIVAT.",
    tabs: ["Все сразу", "Столешницы", "Бытовая техника", "Системы выдвижения", "Мойки", "Смесители"],
    endpoint: "/catalog/popular",
    // У title-block этого рельса пустой `buttons` (758:57416, 2338:254297), а
    // на 360 за карточками сразу идёт отбивка — кнопок нет ни там, ни там.
    desktopAction: false,
    mobileAction: false,
  },
  popularItems
);

initModals();
initCitySelect();
