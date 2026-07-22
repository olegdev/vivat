// Hero slider (top of customer/Main). Data-driven, so adding slides is just
// pushing to the array. Each slide's background can be a video or an image.
// Behaviour: autoplay, prev/next arrows, clickable dots, drag/swipe, keyboard
// arrows, pause on hover, and it only plays the active slide's <video>.

// `frame` reproduces the Figma media box verbatim (left/top/width/height inside
// the 1440x640 banner), the same pattern the category tiles use. Without it the
// media just covers the slide.
function bgAttrs(s) {
  const f = s.frame;
  if (f) {
    return {
      cls: "hero-media",
      style: `--l:${f.left}px;--t:${f.top}px;--w:${f.width}px;--h:${f.height}px`,
    };
  }
  return {
    cls: "absolute inset-0 size-full object-cover",
    style: `object-position:${s.objectPosition || "center"}`,
  };
}

function slideBg(s) {
  const { cls, style } = bgAttrs(s);
  if (s.video) {
    // Muted is required for autoplay; sound is enabled on first user gesture
    // (see unlockSound below) so it matches the "video plays with sound" prototype.
    return `<video
      class="${cls}" style="${style}"
      src="${s.video}" ${s.poster ? `poster="${s.poster}"` : ""}
      ${s.sound ? "data-sound" : ""} muted loop playsinline preload="metadata"></video>`;
  }
  return `<img class="${cls}" style="${style}" src="${s.image}" alt="" draggable="false" />`;
}

function slideCta(s) {
  if (!s.title && !s.cta) return "";
  return `
    <div class="absolute inset-y-0 left-0 flex w-[619px] flex-col justify-center gap-2 py-2 pl-[155px] pr-2 max-md:inset-y-auto max-md:top-0 max-md:w-full max-md:justify-start max-md:px-4 max-md:pb-2 max-md:pt-8">
      <div class="flex flex-col gap-6 max-md:gap-4">
        <div class="flex flex-col gap-3 max-md:gap-1">
          <h1 class="text-display-l text-text-link-highlighted max-md:text-center max-md:text-m-display-l">${s.title || ""}</h1>
          ${s.subtitle ? `<p class="text-body-l text-text-link-highlighted max-md:text-center max-md:text-m-body-l">${s.subtitle}</p>` : ""}
        </div>
        ${
          s.cta
            ? `<div class="max-md:flex max-md:justify-center">
                 <a href="${s.cta.href || "#"}" class="btn btn-l btn-accent gap-3 max-md:h-11 max-md:gap-2 max-md:px-6 max-md:text-m-button-l">
                   <span>${s.cta.label}</span>
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
    <section class="relative h-[640px] w-[1440px] overflow-hidden bg-surface-default select-none max-md:h-[508px] max-md:w-full">
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
        class="carousel-arrow absolute left-6 top-1/2 z-20 -translate-y-1/2 max-md:hidden">
        <img src="${icon}/chevron-left.svg" alt="" class="size-6" />
      </button>
      <button data-next aria-label="Вперёд"
        class="carousel-arrow absolute right-6 top-1/2 z-20 -translate-y-1/2 max-md:hidden">
        <img src="${icon}/chevron-right.svg" alt="" class="size-6" />
      </button>

      <div data-dots class="absolute inset-x-0 bottom-0 z-20 flex h-10 items-center justify-center gap-2 px-10 py-2 max-md:bottom-2">
        ${slides
          .map(
            (_, i) => `
          <button data-dot="${i}" aria-label="Слайд ${i + 1}" class="carousel-dot" aria-current="${i === 0}"><span></span></button>`
          )
          .join("")}
      </div>
    </section>`;

  const slideEls = [...root.querySelectorAll("[data-slide]")];
  const dotEls = [...root.querySelectorAll("[data-dot]")];
  const videos = slideEls.map((el) => el.querySelector("video"));
  let index = 0;
  let timer = null;
  // Autoplay policy blocks sound until the user interacts. We flip this on the
  // first gesture, then keep the active [data-sound] video audible.
  let soundUnlocked = false;

  function applySound() {
    videos.forEach((v, i) => {
      if (!v || !v.hasAttribute("data-sound")) return;
      v.muted = !(soundUnlocked && i === index);
    });
  }

  function unlockSound() {
    if (soundUnlocked) return;
    soundUnlocked = true;
    applySound();
    const active = videos[index];
    if (active) active.play().catch(() => {});
  }
  ["pointerdown", "keydown", "touchstart"].forEach((evt) =>
    window.addEventListener(evt, unlockSound, { once: true })
  );

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
    applySound();
  }

  function show(i) {
    index = (i + slides.length) % slides.length;
    slideEls.forEach((el, n) => {
      const active = n === index;
      el.classList.toggle("opacity-100", active);
      el.classList.toggle("opacity-0", !active);
      el.classList.toggle("pointer-events-none", !active);
    });
    dotEls.forEach((d, n) => d.setAttribute("aria-current", String(n === index)));
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
