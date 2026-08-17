// Плитка преимущества — Figma `benefit` 1058:177646.
//
// Разметка живёт в partials/benefit-tile.html как <template> (будущий
// @foreach); этот файл только клонирует и наполняет. Ширину задаёт контейнер.

const clone = (sel) => document.querySelector(sel).content.cloneNode(true);

// Одна плитка. `t`: { n, text }
function buildTile(t) {
  const node = clone("[data-benefit-tile]").firstElementChild;
  node.querySelector("[data-tile-n]").textContent = t.n;
  node.querySelector("[data-tile-text]").textContent = t.text;
  return node;
}

export function renderBenefitTiles(el, tiles) {
  if (!el) return;
  el.replaceChildren(...tiles.map(buildTile));
}
