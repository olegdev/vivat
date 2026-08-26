// Add to cart — the seam for the server cart, plus the header / bottom-nav count
// badge. Same method as the catalog filters (SOLUTIONS.md › "Filters: form +
// request seam"): the click target carries the contract (`data-product-id`) and
// one function does the write.
//
// Today addToCart() bumps a client-side count kept in localStorage — a stand-in
// for the server's session cart, so the badge survives navigation between pages.
// In the Blade build its body becomes a request and the count comes back from
// the server; nothing else here changes:
//
//     const res = await fetch("/cart", {
//       method: "POST",
//       headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": … },
//       body: JSON.stringify({ id, qty }),
//     });
//     paint((await res.json()).count);   // server owns the count
//
// Buttons are matched by delegation, so cards rendered later (carousels, the
// catalog grid) are covered without re-wiring.
const KEY = "vivat:cart-count";
// Что именно лежит в корзине — нужно карточкам: у той, чей товар уже добавлен,
// кнопка переходит в состояние «в корзине» (Figma section `active cards`
// 2462:212312). В Blade-сборке этот список приходит с сервера вместе со
// счётчиком; здесь он живёт рядом со счётчиком в localStorage.
const ITEMS = "vivat:cart-items";

const getCount = () => Number(localStorage.getItem(KEY)) || 0;

const getItems = () => {
  try {
    const v = JSON.parse(localStorage.getItem(ITEMS) || "[]");
    return new Set(Array.isArray(v) ? v.map(String) : []);
  } catch {
    return new Set();
  }
};

// Repaint every count badge (header + bottom-nav share `[data-cart-count]`).
function paint(n = getCount()) {
  document.querySelectorAll("[data-cart-count]").forEach((b) => {
    b.textContent = String(n);
    b.classList.toggle("hidden", n === 0);
  });
}

// Пометить кнопки тех товаров, что уже в корзине. Вызывается и на старте, и
// после каждой отрисовки карточек — рельсы и сетка каталога рисуются позже.
export function paintCartState(root = document) {
  const items = getItems();
  root.querySelectorAll("[data-add-to-cart]").forEach((b) => {
    const id = b.dataset.productId;
    if (id && items.has(String(id))) b.setAttribute("data-in-cart", "");
    else b.removeAttribute("data-in-cart");
  });
}

// THE SEAM. `id` / `qty` are the payload the server will receive.
function addToCart(id, qty = 1) {
  localStorage.setItem(KEY, String(getCount() + qty));
  if (id != null && id !== "") {
    const items = getItems();
    items.add(String(id));
    localStorage.setItem(ITEMS, JSON.stringify([...items]));
  }
  paint();
  paintCartState();
}

export function initCart(root = document) {
  paint();
  paintCartState(root);
  // Карточки появляются и после загрузки — рельсы, вкладки «Популярных»,
  // страницы каталога. Слушаем то же событие, что и дилерский прайс-лист.
  document.addEventListener("cards:rendered", (e) => paintCartState(e.detail?.root || document));
  // One delegated listener covers every current and future add button.
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add-to-cart]");
    if (!btn) return;
    e.preventDefault();
    addToCart(btn.dataset.productId || null, 1);
  });
}
