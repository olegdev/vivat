// Hero slider (top of customer/Main). Data-driven, so adding slides is just
// pushing to the array. Each slide's background can be a video or an image.
// Behaviour: autoplay, prev/next arrows, clickable dots, drag/swipe, keyboard
// arrows, pause on hover, and it only plays the active slide's <video>.

function slideBg(s) {
  const pos = s.objectPosition || "center";
  if (s.video) {
    return `<video
      class="absolute inset-0 size-full object-cover" style="object-position:${pos}"
      src="${s.video}" ${s.poster ? `poster="${s.poster}"` : ""}
      muted loop playsinline preload="metadata"></video>`;
  }
  return `<img class="absolute inset-0 size-full object-cover" style="object-position:${pos}"
    src="${s.image}" alt="" />`;
}

function slideCta(s) {
  if (!s.title && !s.cta) return "";
  return `
    <div class="absolute inset-y-0 left-0 flex w-[619px] flex-col justify-center gap-2 py-2 pl-[155px] pr-2">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-3">
          <h1 class="text-display-l text-text-link-highlighted">${s.title || ""}</h1>
          ${s.subtitle ? `<p class="text-body-l text-text-link-highlighted">${s.subtitle}</p>` : ""}
        </div>
        ${
          s.cta
            ? `<div>
                 <a href="${s.cta.href || "#"}" class="inline-flex h-14 items-center gap-3 rounded-[24px] bg-components-red px-6">
                   <span class="text-[20px] font-medium leading-6 text-text-inverse-primary">${s.cta.label}</span>
                   <img src="${s.cta.arrow}" alt="" class="size-6" />
                 </a>
               </div>`
            : ""
        }
      </div>
    </div>`;
}

export function initHeroSlider(root, slides, opts = {}) {
  const interval = opts.interval ?? 6000;
  const icon = opts.iconBase ?? "/assets/header";
  const multi = slides.length > 1;

  root.innerHTML = `
    <section class="relative h-[640px] w-[1440px] overflow-hidden bg-surface-default select-none">
      <div data-track class="absolute inset-0">
        ${slides
          .map(
            (s, i) => `
          <div data-slide class="absolute inset-0 transition-opacity duration-700 ${
            i === 0 ? "opacity-100" : "opacity-0 pointer-events-none"
          }">
            ${slideBg(s)}
            ${slideCta({ ...s, cta: s.cta ? { ...s.cta, arrow: `${icon}/cta-arrow.svg` } : null })}
          </div>`
          )
          .join("")}
      </div>

      <button data-prev aria-label="Назад"
        class="absolute left-6 top-1/2 z-20 flex size-12 -translate-y-1/2 items-center justify-center rounded-[24px] border border-border-default bg-components-subtle">
        <img src="${icon}/chevron-left.svg" alt="" class="size-6" />
      </button>
      <button data-next aria-label="Вперёд"
        class="absolute right-6 top-1/2 z-20 flex size-12 -translate-y-1/2 items-center justify-center rounded-[24px] border border-border-default bg-components-subtle">
        <img src="${icon}/chevron-right.svg" alt="" class="size-6" />
      </button>

      <div data-dots class="absolute inset-x-0 bottom-0 z-20 flex h-10 items-center justify-center gap-2 px-10 py-2">
        ${slides
          .map(
            (_, i) => `
          <button data-dot="${i}" aria-label="Слайд ${i + 1}" class="flex h-4 w-8 flex-col justify-center">
            <span class="h-0.5 w-full rounded-full ${i === 0 ? "bg-overlay-strong" : "bg-[rgba(20,20,20,0.35)]"}"></span>
          </button>`
          )
          .join("")}
      </div>
    </section>`;

  const slideEls = [...root.querySelectorAll("[data-slide]")];
  const dotEls = [...root.querySelectorAll("[data-dot] span")];
  const videos = slideEls.map((el) => el.querySelector("video"));
  let index = 0;
  let timer = null;

  function playActiveVideo() {
    videos.forEach((v, i) => {
      if (!v) return;
      if (i === index) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }

  function show(i) {
    index = (i + slides.length) % slides.length;
    slideEls.forEach((el, n) => {
      const active = n === index;
      el.classList.toggle("opacity-100", active);
      el.classList.toggle("opacity-0", !active);
      el.classList.toggle("pointer-events-none", !active);
    });
    dotEls.forEach((d, n) => {
      d.classList.toggle("bg-overlay-strong", n === index);
      d.classList.toggle("bg-[rgba(20,20,20,0.35)]", n !== index);
    });
    playActiveVideo();
  }

  const next = () => show(index + 1);
  const prev = () => show(index - 1);

  function startAuto() {
    if (!multi) return;
    stopAuto();
    timer = setInterval(next, interval);
  }
  function stopAuto() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  root.querySelector("[data-next]").addEventListener("click", () => {
    next();
    startAuto();
  });
  root.querySelector("[data-prev]").addEventListener("click", () => {
    prev();
    startAuto();
  });
  root.querySelectorAll("[data-dot]").forEach((btn) =>
    btn.addEventListener("click", () => {
      show(Number(btn.dataset.dot));
      startAuto();
    })
  );

  const section = root.querySelector("section");
  section.addEventListener("mouseenter", stopAuto);
  section.addEventListener("mouseleave", startAuto);
  document.addEventListener("visibilitychange", () =>
    document.hidden ? stopAuto() : startAuto()
  );

  // keyboard (when the hero is hovered/focused)
  section.tabIndex = 0;
  section.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  });

  // pointer swipe
  let startX = null;
  section.addEventListener("pointerdown", (e) => (startX = e.clientX));
  section.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 60) (dx < 0 ? next : prev)();
    startX = null;
  });

  playActiveVideo();
  startAuto();
}
