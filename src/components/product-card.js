// Reusable product card — matches Figma UI SYSTEM "cards-kitchen".
// Supports two footer variants seen on customer/Main:
//   - colors:   color swatches (+more) + comments count   (Модульные кухни, Акции)
//   - category: underlined category link + count           (Популярные товары)

// Relative to the consuming page; set once via setIconBase() before rendering.
let ICON = "../../assets/header";
export function setIconBase(base) {
  ICON = base;
}

const BADGE_BG = {
  new: "bg-surface-accent-alt", // green  #4a9b7d
  hit: "bg-components-red", // red    #ff5546
  discount: "bg-accent-yellow-800", // orange #ef945c
};

function badge({ text, tone }) {
  return `<span class="flex h-8 items-center rounded-[24px] ${BADGE_BG[tone] || BADGE_BG.new} px-2 text-[16px] font-medium leading-[22px] text-text-inverse-primary">${text}</span>`;
}

function dots(active = 0, count = 3) {
  return Array.from({ length: count })
    .map((_, i) => {
      const line = i === active ? "bg-overlay-strong" : "bg-[rgba(20,20,20,0.35)]";
      return `<span class="flex h-4 w-8 flex-col justify-center"><span class="h-0.5 w-full rounded-full ${line}"></span></span>`;
    })
    .join("");
}

function swatch(s) {
  const inner = s.img
    ? `<img src="${s.img}" alt="" class="size-full rounded-full object-cover" />`
    : `<span class="block size-full rounded-full" style="background:${s.color}"></span>`;
  return `<span class="size-7 overflow-hidden rounded-full border border-[rgba(20,20,20,0.22)]">${inner}</span>`;
}

function footer(p) {
  if (p.category) {
    return `<a href="#" class="text-body-s text-text-secondary underline decoration-from-font underline-offset-2">${p.category.label} ${p.category.count}</a>`;
  }
  const swatches = (p.swatches || []).map(swatch).join("");
  const more = p.more ? `<span class="text-body-s text-text-secondary">${p.more}</span>` : "";
  return `
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <div class="flex items-center gap-2">${swatches}</div>
      ${more}
    </div>
    <div class="flex items-center gap-1">
      <span class="text-body-s text-text-secondary">${p.comments ?? 0}</span>
      <img src="${ICON}/icon-comment.svg" alt="" class="size-4" />
    </div>`;
}

export function productCard(p) {
  const badges = (p.badges || []).map(badge).join("");
  const oldPrice = p.oldPrice
    ? `<span class="text-body-n text-text-muted line-through">${p.oldPrice}</span>`
    : "";

  return `
  <article class="flex w-[438px] shrink-0 flex-col">
    <div class="relative w-full overflow-hidden rounded-[4px] bg-bg-subtle">
      <div class="h-[327px] w-full overflow-hidden">
        <img src="${p.image}" alt="${p.title}" class="size-full object-cover mix-blend-multiply" />
      </div>
      ${badges ? `<div class="absolute right-2 top-2 flex items-center gap-1">${badges}</div>` : ""}
      <div class="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 px-2">${dots(0)}</div>
    </div>
    <div class="flex flex-col gap-1 px-1 py-3">
      <div class="flex items-start gap-4">
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <div class="flex items-center gap-2">
            <span class="text-[16px] font-medium leading-[22px] text-text-primary">от</span>
            <span class="text-h3 font-medium text-text-primary">${p.price}</span>
            ${oldPrice}
          </div>
          <p class="line-clamp-2 max-h-12 text-body-n text-text-primary">${p.title}</p>
        </div>
        <button class="flex size-11 shrink-0 items-center justify-center rounded-[44px] bg-components-subtle">
          <img src="${ICON}/icon-order-dark.svg" alt="В корзину" class="size-6" />
        </button>
      </div>
      <div class="flex items-center gap-4 py-1">${footer(p)}</div>
    </div>
  </article>`;
}

export function renderCarousel(el, items) {
  el.innerHTML = items.map(productCard).join("");
}
