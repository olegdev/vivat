import "../../styles/app.css";
import { mountCarousel, enableDragScroll } from "../../components/carousel.js";
import { initSpecTabs, initSectionNav, initStickyPrice, initPdpOrder } from "../../components/pdp.js";
import { initModuleSummary } from "../../components/pdp-module.js";
import { initCatalogMenu, setCatalogIconBase } from "../../components/catalog-menu.js";
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initSearch } from "../../components/search.js";
import { initCart } from "../../components/cart.js";
import { initSession } from "../../components/session.js";
import { initModals } from "../../components/modals.js";
import { initPhoneMask } from "../../components/phone-mask.js";
import { initConsentGate } from "../../components/consent-gate.js";
import { initCitySelect } from "../../components/city-select.js";
import { ICON } from "../../data/asset-base.js";
import { product, specs, packageRows, modules, railTitle } from "../../data/pdp-module.js";

// ---- общий chrome, та же обвязка, что у остальных страниц -------------------
setCatalogIconBase(ICON);
initCatalogMenu(document.querySelector("[data-catalog]"), {
  toggle: document.querySelector("[data-catalog-toggle]"),
});
initMobileMenu(document.querySelector("[data-mobile-menu-root]"), {
  toggle: document.querySelector("[data-mobile-menu]"),
  catalogToggle: document.querySelector("[data-mobile-catalog]"),
});
initSearch();
initCart();
initSession();

initModuleSummary(product);

// ---- Характеристики ---------------------------------------------------------
// Таблица у модуля своей копии в макете не получила (см. data/pdp-module.js).
// Ярлыков в блоке три — «Описание», «Комплектация», «Где купить». Карты
// салонов у модуля нет, но пункт «Где купить» клиент оставил (15.09) — и в
// ряду вкладок, и в якорном баре — просто без перехода.
document.querySelectorAll('a[href="#where"]').forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));
// Комплектация — фикстура «чтобы не пустая» (решение клиента 15.09): своей
// таблицы у модуля в макете нет.
initSpecTabs({ specs, package: packageRows });
enableDragScroll(document.querySelector("[data-spec-tabs]"));

// ---- рельс «Модули композиции …» ---------------------------------------------
mountCarousel(
  document.querySelector('[data-section="modules"]'),
  {
    title: railTitle,
    // Кнопка «Все модули Фьюжн» в кадре есть (`button-container` 216x44,
    // 2488:127168), но снята по решению клиента — см. BACKLOG.
    desktopAction: false,
    mobileAction: false,
    // `cards-modul` — отдельный компонент, а не размер общей карточки,
    // поэтому это `variant`, как и в кухонной PDP.
    variant: "modul",
    // Ниже md рельс — catalog-row size=M (2488:131443): у карточек видна
    // кнопка 32 и под рядом полоса прокрутки (карточек в фикстуре три).
    mobileCart: true,
    mobileDescGap: false, // 2488:128771 — контейнер заголовка 78 (три строки 26), без распорки описания
    arrowTop: 53, // тот же рельс, что и на кухонной PDP (914:103437 y=53, не центр 242-й коробки)
    id: "modules",
  },
  modules
);

// Якорный бар разрешает цели по id, а два из них рождаются рельсами выше,
// поэтому он подключается последним.
initSectionNav();

// Бар с ценой — тоже добавка клиента; ведёт себя как у кухонной PDP.
initStickyPrice(product);

initModals();
initPhoneMask();
initConsentGate();
initCitySelect();

// «Сформировать заказ»: в корзину и на оформление (LINK-MAP §4.1).
initPdpOrder(product);
