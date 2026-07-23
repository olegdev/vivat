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

const getCount = () => Number(localStorage.getItem(KEY)) || 0;

// Repaint every count badge (header + bottom-nav share `[data-cart-count]`).
function paint(n = getCount()) {
  document.querySelectorAll("[data-cart-count]").forEach((b) => {
    b.textContent = String(n);
    b.classList.toggle("hidden", n === 0);
  });
}

// THE SEAM. `id` / `qty` are the payload the server will receive.
function addToCart(id, qty = 1) {
  void id; // (the prototype doesn't need the id; the server will)
  localStorage.setItem(KEY, String(getCount() + qty));
  paint();
}

export function initCart(root = document) {
  paint();
  // One delegated listener covers every current and future add button.
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add-to-cart]");
    if (!btn) return;
    e.preventDefault();
    addToCart(btn.dataset.productId || null, 1);
  });
}
