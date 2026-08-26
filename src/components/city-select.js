// Выбор города. Один список — две поверхности: выпадашка рядом с триггером выше
// `md` и лист снизу ниже (Figma `left-side type=city` 1859:335134).
//
// Триггеров на странице несколько — «Москва» есть в десктопной служебной строке,
// в планшетной, в мобильной полоске и в панели «Где купить», — поэтому компонент
// работает по делегированию и правит СРАЗУ ВСЕ подписи `[data-city-label]`:
// город на странице один, из какого бы места его ни выбрали.
//
// THE SEAM: setCity() — единственное место, где город уезжает наружу. Сейчас он
// живёт в localStorage, чтобы переживать переходы между страницами; в Blade его
// тело становится запросом, а список магазинов приходит уже отфильтрованным.
// Сам список салонов здесь не фильтруется: в фикстуре у точек нет города (см.
// BACKLOG.md).
import { CITIES, DEFAULT_CITY } from "../data/cities.js";

const KEY = "vivat:city";

export const getCity = () => localStorage.getItem(KEY) || DEFAULT_CITY;

function paint(city) {
  document.querySelectorAll("[data-city-label]").forEach((el) => (el.textContent = city));
}

// THE SEAM.
function setCity(city) {
  localStorage.setItem(KEY, city);
  paint(city);
  document.dispatchEvent(new CustomEvent("city:change", { detail: { city } }));
}

const isMobile = () => window.matchMedia("(max-width: 47.99rem)").matches;

export function initCitySelect(root = document) {
  const sheet = root.querySelector("[data-city-sheet]");
  const sheetList = root.querySelector("[data-city-sheet-list]");
  const rowTpl = root.querySelector("[data-city-row]");
  const optTpl = root.querySelector("[data-city-option]");
  if (!rowTpl || !optTpl) return null;

  paint(getCity());

  // Список без текущего города — во фрейме при выбранной Москве ровно четыре
  // строки, а не пять с галочкой.
  const others = () => CITIES.filter((c) => c !== getCity());

  const fill = (box, tpl) => {
    box.replaceChildren(
      ...others().map((city) => {
        const row = tpl.content.firstElementChild.cloneNode(true);
        row.textContent = city;
        row.dataset.cityPick = city;
        return row;
      })
    );
  };

  const closeAll = () => {
    sheet?.classList.remove("is-open");
    root.querySelectorAll("[data-city-menu]").forEach((m) => m.classList.add("hidden"));
    root
      .querySelectorAll("[data-city-open][aria-expanded='true']")
      .forEach((t) => t.setAttribute("aria-expanded", "false"));
  };

  function open(trigger) {
    const menu = trigger.parentElement?.querySelector("[data-city-menu]");
    // Ниже `md` листом пользуются и те триггеры, у которых выпадашки нет вовсе
    // (мобильная полоска шапки), поэтому лист — общий запасной путь.
    if (isMobile() || !menu) {
      if (!sheet || !sheetList) return;
      fill(sheetList, rowTpl);
      sheet.classList.add("is-open");
      return;
    }
    const wasOpen = !menu.classList.contains("hidden");
    closeAll();
    if (wasOpen) return;
    fill(menu, optTpl);
    menu.classList.remove("hidden");
    trigger.setAttribute("aria-expanded", "true");
  }

  document.addEventListener("click", (e) => {
    const pick = e.target.closest("[data-city-pick]");
    if (pick) {
      setCity(pick.dataset.cityPick);
      closeAll();
      return;
    }
    const trigger = e.target.closest("[data-city-open]");
    if (trigger) {
      e.preventDefault();
      open(trigger);
      return;
    }
    // Клик мимо закрывает выпадашку; лист закрывается по своей подложке.
    if (!e.target.closest("[data-city-menu]")) closeAll();
  });

  sheet?.addEventListener("click", (e) => {
    if (!e.target.closest("[data-city-sheet-list]")) closeAll();
  });
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeAll());

  return { setCity, getCity };
}
