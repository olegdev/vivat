// Карточка статьи блога — клон <template data-article-card> из
// partials/article-card.html (будущий @foreach). Ширину карточке даёт
// контейнер, сюда приходит только размер варианта: "l" или "s".
//
// Обе страницы блога лежат в pages/dealer/ — общие, как остальные страницы
// раздела, — поэтому адреса относительные, без pageHref().

const tpl = () => document.querySelector("[data-article-card]");

export function articleCard(a, { size = "s" } = {}) {
  const node = tpl().content.firstElementChild.cloneNode(true);
  node.dataset.size = size;
  const img = node.querySelector("[data-article-image]");
  img.src = a.image;
  img.alt = a.title;
  const rubric = node.querySelector("[data-article-rubric]");
  rubric.textContent = a.rubric;
  rubric.href = `blog.html?rubric=${encodeURIComponent(a.rubric)}`;
  const link = node.querySelector("[data-article-link]");
  link.textContent = a.title;
  link.href = a.href || "blog-article.html";
  node.querySelector("[data-article-lead]").textContent = a.lead;
  return node;
}

// Подпись совместима с `render` у mountCarousel (carousel.js): рельс
// «Читайте также» — та же оболочка, что у товарных рельсов.
export function renderArticles(el, items, opts = {}) {
  el.replaceChildren(...items.map((a) => articleCard(a, opts)));
}
