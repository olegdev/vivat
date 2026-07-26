// Review rail unit — Figma `review-card` (766:39855). Clones the <template> in
// partials/review-card.html and fills its hooks; it never emits structure (see
// the PHP Blade note in CLAUDE.md).
//
// Signature matches renderCarousel() so it can be handed to mountCarousel() as
// `cfg.render`: the Отзывы section is the same rail shell as the product ones,
// filled with a different card.

const clone = (sel) => document.querySelector(sel).content.firstElementChild.cloneNode(true);

export function renderReviews(el, items) {
  el.replaceChildren(
    ...items.map((r) => {
      const node = clone("[data-review-card]");
      node.querySelector("[data-review-text]").textContent = r.text;
      node.querySelector("[data-review-name]").textContent = r.name;
      node.querySelector("[data-review-date]").textContent = r.date;
      return node;
    })
  );
}
