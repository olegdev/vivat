// News card — Figma `news-item` 882:110636. Used by the dealer home page's
// "Новости" row; a future news listing page reuses the same unit.
//
// The card's markup is a <template> in partials/news-card.html (the future
// Blade @foreach body); this file only clones and fills. The container sizes
// the cards, so the unit carries no width — see CLAUDE.md.

const clone = (sel) => document.querySelector(sel).content.cloneNode(true);

// One card. `n`: { title, desc, date, href }
function buildCard(n) {
  const node = clone("[data-news-card]").firstElementChild;
  const title = node.querySelector("[data-news-title]");
  title.textContent = n.title;
  if (n.href) title.href = n.href;

  node.querySelector("[data-news-desc]").textContent = n.desc;

  const date = node.querySelector("[data-news-date]");
  date.textContent = n.date;
  // `date` is dd.mm.yyyy in the design; <time> wants ISO in the attribute.
  const [d, m, y] = n.date.split(".");
  if (d && m && y) date.dateTime = `${y}-${m}-${d}`;

  return node;
}

export function renderNewsCards(el, items) {
  if (!el) return;
  el.replaceChildren(...items.map(buildCard));
}
