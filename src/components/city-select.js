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

export const isMobileCity = () => window.matchMedia("(max-width: 47.99rem)").matches;
const isMobile = isMobileCity;

// Наполнить любой контейнер строками городов. Публично, потому что этим же
// списком панель «Где купить» подменяет своё тело (Figma `type=city`
// 1859:335134), а не открывает поверх себя ещё один лист.
export function fillCityRows(box, root = document) {
  const tpl = root.querySelector("[data-city-row]");
  if (!box || !tpl) return;
  box.replaceChildren(
    ...CITIES.filter((c) => c !== getCity()).map((city) => {
      const row = tpl.content.firstElementChild.cloneNode(true);
      row.textContent = city;
      row.dataset.cityPick = city;
      return row;
    })
  );
}

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

  // Ручка листа должна тянуться, иначе она врёт: у листа нет второй высоты —
  // он ровно по содержимому, — поэтому жест один, вниз, и он его закрывает.
  // Захват указателя берём только когда перетаскивание уже началось: иначе
  // следующий `click` уходит в захвативший элемент и строки перестают
  // нажиматься (SOLUTIONS.md › Touch gestures).
  const panel = sheet?.querySelector(".modal-panel");
  const grip = sheet?.querySelector("[data-city-grip]");
  if (panel && grip) {
    let startY = null;
    let moved = false;
    grip.addEventListener("pointerdown", (e) => {
      startY = e.clientY;
      moved = false;
      panel.style.transition = "";
    });
    grip.addEventListener("pointermove", (e) => {
      if (startY == null) return;
      const dy = e.clientY - startY;
      if (!moved && Math.abs(dy) < 4) return;
      if (!moved) {
        moved = true;
        grip.setPointerCapture?.(e.pointerId);
      }
      panel.style.translate = `0 ${Math.max(0, dy)}px`;
    });
    const end = (e) => {
      if (startY == null) return;
      const dy = e.clientY - startY;
      startY = null;
      if (moved) grip.releasePointerCapture?.(e.pointerId);
      panel.style.transition = "translate 200ms cubic-bezier(0.22, 0.61, 0.36, 1)";
      panel.style.translate = "0 0";
      if (dy > 60) closeAll();
    };
    grip.addEventListener("pointerup", end);
    grip.addEventListener("pointercancel", end);
  }


  function open(trigger) {
    const menu = trigger.parentElement?.querySelector("[data-city-menu]");
    // Ниже `md` листом пользуются и те триггеры, у которых выпадашки нет вовсе
    // (мобильная полоска шапки), поэтому лист — общий запасной путь.
    // У панели «Где купить» ниже `md` список городов — её собственное тело
    // (stores-map.js), лист туда не лезет.
    if (isMobile() && trigger.hasAttribute("data-city-toggle")) return;
    if (isMobile() || !menu) {
      // Сначала спрашиваем страницу: если на ней есть блок салонов, город
      // выбирают в нём — той же картой на весь экран, что открывает «Где
      // купить». Свой лист остаётся для страниц, где блока салонов нет.
      const ask = new CustomEvent("city:request", { detail: { handled: false } });
      document.dispatchEvent(ask);
      if (ask.detail.handled) return;
      if (!sheet || !sheetList) return;
      fillCityRows(sheetList, root);
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
