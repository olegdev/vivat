// Ordered box diff: the HEIGHTS a Figma subtree lays out vs the heights the
// page renders. Fourth of the family, after `audit.mjs` (copy),
// `audit-spacing.mjs` (section joints) and `audit-type.mjs` (kegel).
//
//   node scripts/audit-box.mjs <page> <selector> <figma-id> [--width 1440] [--depth 4] [--click sel,sel]
//   node scripts/audit-box.mjs customer/pdp '#specs' 914:103290
//
// Why a fourth: the other three all miss the same class of defect, and it is
// the one that reads as «плывёт относительно макета».
//
//   • `audit:spacing` compares SECTION joints at the top level of a page
//     frame. Anything inside a section — a row, a card, a table — is invisible
//     to it by construction.
//   • `audit:type` compares kegel and weight of strings, not the boxes holding
//     them.
//
// The defect they miss: a frame taller than its own content. `Tab` in the specs
// block is 59 with tabs of 32 centred inside; our row hugged the button, so the
// label sat 13px closer to the photo and the whole block came out 27 short —
// and every joint around it still measured correct. That is what this catches.
//
// Both sides are reduced to a flat list of boxes in visual order, and paired by
// LCS over the heights — the same alignment `audit-spacing` uses for gaps, and
// for the same reason: no name is shared between the .fig and the markup, and
// each side legitimately carries boxes the other does not (a wrapper div here,
// a spacer instance there). A run of equal heights anchors the alignment; the
// odd row out shows as present on one side only.
//
// Sizes come from the INSTANCE, never the master: an instance's own box is
// correct in the index, and for its children `derivedSymbolData` is read (one
// `raw` call per instance, cached). Reading the master is what produced the
// phantom «Фото 24/28» in the type audit and would produce phantom heights here.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : argv[i + 1]; };
const WIDTH = Number(opt("--width", 1440));
const DEPTH = Number(opt("--depth", 4));
const MIN = Number(opt("--min", 8)); // ящики ниже этого не печатаем: иконки и линии
// Состояния: `--click sel,sel` жмёт первый ВИДИМЫЙ элемент по каждому селектору
// до замера — так сверяются открытая панель прайс-листа, ящик фильтров, шаг
// меню. Без этого аудит видит только то, что нарисовано при загрузке.
const CLICKS = opt("--click", "") ? String(opt("--click")).split(",") : [];
const SESSION = opt("--session", null); // см. audit-type: кто смотрит страницу
const pos = argv.filter((a, i) => !a.startsWith("--") && !["--width", "--depth", "--min", "--click", "--session"].includes(argv[i - 1]));
const [page, selector, figmaId] = pos;
if (!page || !selector || !figmaId) {
  console.error(
    "usage: node scripts/audit-box.mjs <page> <selector> <figma-id> [--width 1440] [--depth 4] [--min 8]\n" +
      "   e.g. node scripts/audit-box.mjs customer/pdp '#specs' 914:103290"
  );
  process.exit(1);
}

// ---- Figma side --------------------------------------------------------------
const idx = JSON.parse(readFileSync("VIVAT_SOURCES/canvas.index.json", "utf8"));
const byId = new Map(idx.nodes.filter((n) => n.id).map((n) => [n.id, n]));
const kids = new Map();
for (const n of idx.nodes) {
  if (!n.parent) continue;
  if (!kids.has(n.parent)) kids.set(n.parent, []);
  kids.get(n.parent).push(n);
}
const norm = (id) => id.replace("-", ":");
const rawCache = new Map();
const raw = (id) => {
  if (!rawCache.has(id))
    rawCache.set(id, JSON.parse(execFileSync("node", ["scripts/fig.mjs", "raw", id], { maxBuffer: 1 << 28 })));
  return rawCache.get(id);
};
const pathOf = (g) => g.guids.map((x) => `${x.sessionID}:${x.localID}`).join(".");

const figBoxes = [];
const hex = (col) =>
  col ? "#" + [col.r, col.g, col.b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("") : null;
// Заливка ящика: первая видимая сплошная. Внутри инстанса переопределение
// `fillPaints` (symbolOverrides по тому же пути) важнее заливки мастера.
const fillOf = (c, ovr) => {
  if (ovr?.fillPaints) {
    const f = ovr.fillPaints.find((p) => p.visible !== false && p.type === "SOLID");
    return f ? { color: hex(f.color), opacity: f.opacity ?? 1 } : null;
  }
  const f = (c.fills || []).find((p) => p.type === "SOLID" && p.color);
  return f ? { color: f.color, opacity: f.opacity ?? 1 } : null;
};
const layoutOf = (r) =>
  ({
    d: new Map((r.derivedSymbolData ?? []).map((e) => [pathOf(e.guidPath), e])),
    o: new Map((r.symbolData?.symbolOverrides ?? []).map((e) => [pathOf(e.guidPath), e])),
    // подмена варианта вложенного инстанса — см. audit-type.mjs › swapsOf
  });
const figTexts = []; // надписи auto-width: текст и x от левого края корня
const swapOf = (lay, path) => {
  const s = lay?.o.get(path)?.overriddenSymbolID;
  return s ? `${s.sessionID}:${s.localID}` : null;
};
function walkFig(nodeId, depth, derived, prefix, parentKey = "root", baseX = 0) {
  // Ящики — до --depth; глубже идём только за надписями (крошка в кадре лежит
  // на пятом уровне), и без новых `raw`: каждый заново распаковывает .fig.
  if (depth > DEPTH + 6) return;
  const deep = depth > DEPTH;
  const children = (kids.get(nodeId) ?? []).filter((c) => !c.hidden && c.h != null);
  // Визуальный порядок: сверху вниз, затем слева направо.
  children.sort((a, b) => (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0));
  for (const c of children) {
    const p = prefix ? `${prefix}.${c.id}` : c.id;
    // Геометрия из насчитанной раскладки, если мы внутри инстанса.
    const d = derived?.d.get(p);
    const ovr = derived?.o.get(p);
    const w = d?.size?.x ?? c.w;
    const h = d?.size?.y ?? c.h;
    if (derived && !d && prefix) continue; // внутри инстанса — то, чего нет в раскладке, не рендерится
    // У отражённого узла (m00 < 0 — стрелки рельса) transform.x — это ПРАВЫЙ
    // край; левый = x − ширина. Иначе стрелка «стоит» на 64, когда видна на 16.
    const m00 = d?.transform?.m00 ?? c.m?.[0] ?? 1;
    const x = (d?.transform?.m02 ?? c.x ?? 0) - (m00 < 0 ? w : 0);
    // надписи собираются до отсечки по высоте: строка 12/16 ниже MIN
    const chars = ovr?.textData?.characters ?? c.text;
    // только твёрдая копия: оверрайд или узел вне инстанса; мастерская
    // «Главная» в каждом шаге крошек каталога — заглушка, не надпись
    const firmCopy = ovr?.textData?.characters != null || !derived;
    if (firmCopy && chars?.trim() && c.font?.autoW) figTexts.push({ text: chars.replace(/\s+/g, " ").trim(), x: baseX + x });
    if (deep) {
      const symD = swapOf(derived, p) ?? c.symbol;
      if (symD && derived) walkFig(symD, depth + 1, derived, p, "", baseX + x);
      else if (!c.symbol) walkFig(c.id, depth + 1, derived, prefix, "", baseX + x);
      continue;
    }
    if (h == null || h < MIN) continue;
    const y = d?.transform?.m12 ?? c.y ?? 0;
    figBoxes.push({
      depth, name: c.name ?? c.type, w: Math.round(w), h: Math.round(h), y: Math.round(y), x: Math.round(x),
      parent: nodeId, uid: `${prefix}|${c.id}`, pkey: parentKey,
      text: c.text != null, fill: fillOf(c, ovr), stroke: c.stroke ?? null,
      opacity: c.opacity ?? 1,
    });
    if (c.symbol) {
      // Спускаемся в мастер, но геометрию берём из derivedSymbolData инстанса.
      let own = derived;
      let ownPrefix = p;
      if (!derived) {
        own = layoutOf(raw(c.id));
        ownPrefix = "";
      }
      walkFig(swapOf(derived, p) ?? c.symbol, depth + 1, own, ownPrefix, `${prefix}|${c.id}`, baseX + x);
    } else {
      walkFig(c.id, depth + 1, derived, prefix, `${prefix}|${c.id}`, baseX + x);
    }
  }
}
const root = byId.get(norm(figmaId));
if (!root) {
  console.error(`нет такого узла в экспорте: ${figmaId}`);
  process.exit(1);
}
figBoxes.push({ depth: 0, name: `${root.name} (корень)`, w: Math.round(root.w), h: Math.round(root.h),
                uid: "root", fill: fillOf(root), stroke: root.stroke ?? null, opacity: root.opacity ?? 1 });
if (root.symbol) walkFig(root.symbol, 1, layoutOf(raw(root.id)), "");
else walkFig(root.id, 1, null, "");

// ---- DOM side ----------------------------------------------------------------
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: WIDTH, height: 1000 } });
if (SESSION) await p.addInitScript((u) => localStorage.setItem("vivat:user", u), SESSION);
await p.goto(`file://${resolve("dist/pages", page)}.html`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2500);
for (const c of CLICKS) {
  await p.$$eval(c, (els) => { const v = els.find((e) => e.getClientRects().length); if (v) v.click(); });
  await p.waitForTimeout(400);
}
const domRes = await p.evaluate(
  ({ sel, depth: maxDepth, min }) => {
    const seen = (el) => {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return false;
      const r = el.getBoundingClientRect();
      return r.height >= min && r.width > 0;
    };
    const all = [...document.querySelectorAll(sel)];
    const root = all.find(seen) ?? all[0];
    if (!root) return null;
    const out = [];
    const label = (el) => {
      const ds = el.dataset && Object.keys(el.dataset)[0];
      const cls = (el.className || "").toString().split(/\s+/).filter(Boolean).slice(0, 2).join(".");
      return `${el.tagName.toLowerCase()}${ds ? "[" + ds + "]" : cls ? "." + cls : ""}`;
    };
    // Цвет и рамка — из computed style. Кольцо Tailwind и внутренняя тень —
    // это box-shadow, поэтому он тоже читается: из него берутся все цвета.
    const paint = (el) => {
      const cs = getComputedStyle(el);
      const colors = (s) => [...s.matchAll(/rgba?\([^)]*\)/g)].map((m) => m[0]);
      const sides = ["Top", "Right", "Bottom", "Left"]
        .map((k) => ({ w: parseFloat(cs[`border${k}Width`]) || 0, style: cs[`border${k}Style`], color: cs[`border${k}Color`] }))
        .filter((b) => b.w > 0 && b.style !== "none");
      return {
        bg: cs.backgroundColor,
        border: sides.length ? { colors: sides.map((b) => b.color), width: Math.max(...sides.map((b) => b.w)) } : null,
        shadow: cs.boxShadow && cs.boxShadow !== "none" ? { raw: cs.boxShadow, colors: colors(cs.boxShadow) } : null,
        opacity: parseFloat(cs.opacity),
        text: !el.children.length && !!el.textContent.trim(),
      };
    };
    const r0 = root.getBoundingClientRect();
    out.push({ depth: 0, name: label(root) + " (корень)", w: Math.round(r0.width), h: Math.round(r0.height), uid: 0, ...paint(root) });
    let uid = 0;
    const walk = (el, d, pid) => {
      if (d > maxDepth) return;
      for (const c of el.children) {
        if (!(c instanceof HTMLElement)) continue;
        // `display: contents` — обёртки без коробки (ряды плиток ниже md):
        // сквозь них идём к детям на той же глубине, иначе блок «пустой».
        if (getComputedStyle(c).display === "contents") { walk(c, d, pid); continue; }
        if (!seen(c)) continue;
        const r = c.getBoundingClientRect();
        const pr = el.getBoundingClientRect();
        const id = ++uid;
        out.push({ depth: d, name: label(c), w: Math.round(r.width), h: Math.round(r.height),
                   top: Math.round(r.top), bottom: Math.round(r.bottom), parent: pid, uid: id,
                   off: Math.round(r.top - pr.top), offX: Math.round(r.left - pr.left), ...paint(c) });
        walk(c, d + 1, id);
      }
    };
    walk(root, 1, 0);
    // Надписи: левый край самого текстового узла (Range), без глубины — ряд
    // крошек у нас плоский, а в макете каждая крошка в своём «шаге».
    const texts = [];
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n; (n = tw.nextNode()); ) {
      const t = n.textContent.replace(/\s+/g, " ").trim();
      if (!t || !n.parentElement || !seen(n.parentElement)) continue;
      const rg = document.createRange();
      rg.selectNodeContents(n);
      const rr = rg.getBoundingClientRect();
      if (rr.width) texts.push({ text: t, x: rr.left - r0.left });
    }
    return { out, texts };
  },
  { sel: selector, depth: DEPTH, min: MIN }
);
await browser.close();
const domTexts = domRes?.texts ?? [];
const domBoxes = domRes?.out ?? null;
if (domBoxes === null) {
  console.error(`селектор ничего не нашёл: ${selector}`);
  process.exit(1);
}

// ---- alignment ---------------------------------------------------------------
function align(a, b) {
  const n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      L[i][j] = a[i].h === b[j].h ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i].h === b[j].h) out.push([a[i++], b[j++]]);
    else if (L[i + 1][j] >= L[i][j + 1]) out.push([a[i++], null]);
    else out.push([null, b[j++]]);
  }
  while (i < n) out.push([a[i++], null]);
  while (j < m) out.push([null, b[j++]]);
  return out;
}

// ---- report ------------------------------------------------------------------
// Высота КОРНЯ — единственная пара, которая есть всегда, и расхождение в ней
// значит, что блок в целом другой высоты. Раньше корни разной высоты просто
// не спаривались и тонули в «м»/«с»; так панель настроек каталога на 360
// (116 против 112 — верхнее поле 12 вместо 16) прошла три прогона незамеченной.
const rootF = figBoxes[0], rootD = domBoxes[0];
const rootBad = rootF && rootD && Math.abs(rootF.h - rootD.h) > 1;
const fmt = (r) => (r ? `${r.w}×${r.h}` : "—");
const nm = (r) => (r ? "  ".repeat(Math.min(r.depth, 6)) + r.name : "—");
console.log(`\n  ══ ${page} @ ${WIDTH}  ←→  ${figmaId}   ${selector}`);
console.log(`  ${"МАКЕТ".padEnd(40)} ${"".padStart(11)}   ${"СТРАНИЦА".padEnd(34)}`);
console.log(`  ${"—".repeat(40)} ${"—".repeat(11)}   ${"—".repeat(34)}`);
let only = 0;
if (rootBad) console.log(`✗ корень: макет ${rootF.h}, страница ${rootD.h} — блок другой высоты (${rootD.h - rootF.h > 0 ? "+" : ""}${rootD.h - rootF.h})`);
for (const [f, d] of align(figBoxes, domBoxes)) {
  const flag = f && d ? "  " : f ? "м " : "с ";
  if (!f || !d) only++;
  console.log(
    `${flag}${nm(f).slice(0, 39).padEnd(40)} ${fmt(f).padStart(11)}   ${fmt(d).padStart(11)}  ${nm(d).slice(0, 30)}`
  );
}
// ---- вертикальные зазоры между соседями ---------------------------------------
// Высоты ящиков могут сходиться до пикселя, а «плыть» будет всё равно — если
// разъехались ЗАЗОРЫ между строками внутри ящика. Их не видно в списке высот,
// поэтому считаем отдельно: внутри каждого родителя берём детей по порядку и
// печатаем расстояния между ними.
const seqOf = (boxes, keyY, keyH) => {
  const byParent = new Map();
  for (const b of boxes) {
    if (b.parent == null) continue;
    if (!byParent.has(b.parent)) byParent.set(b.parent, []);
    byParent.get(b.parent).push(b);
  }
  const out = [];
  for (const list of byParent.values()) {
    if (list.length < 2) continue;
    const rows = [...list].sort((a, b) => a[keyY] - b[keyY]);
    const gaps = [];
    for (let i = 1; i < rows.length; i++) {
      const g = rows[i][keyY] - (rows[i - 1][keyY] + rows[i - 1][keyH]);
      // Колонки бок о бок дают отрицательные и нулевые «зазоры» — не они нас
      // интересуют, нужен вертикальный поток.
      if (g >= 0 && g < 200) gaps.push(g);
    }
    if (gaps.length) out.push(gaps.join(" "));
  }
  return out;
};
const figGaps = seqOf(figBoxes, "y", "h");
const domGaps = seqOf(domBoxes.map((b) => ({ ...b, y: b.top })), "y", "h");
// ---- подсказка про рамку ------------------------------------------------------
// CSS `border` прибавляется к коробке, а `strokeAlign: INSIDE` в Figma — нет:
// там паддинг отсчитывается от края рамки, и обводка ложится поверх него.
// Поэтому наш блок выходит на 2 шире/выше, а всё внутри съезжает на 1. Так
// уехала иконка шеринга в сводке PDP: ряд заголовка 362 против 364.
// Признак: пары, где высоты совпали, а ширины разошлись ровно на 2.
const borderish = align(figBoxes, domBoxes).filter(
  // Только там, где НАШ ящик на 2 уже: рамка съедает, а не добавляет. И только
  // на блоках уже 1000 — страничные фреймы в этом файле нарисованы 1442 при
  // холсте 1440 (вылет на пиксель с каждой стороны), и это не рамка.
  ([f, d]) => f && d && f.h === d.h && f.w - d.w === 2 && f.w < 1000
);
if (borderish.length) {
  console.log(
    `  ⚠ ${borderish.length} пар(ы) совпали по высоте, но разошлись по ширине ровно на 2:\n` +
      borderish.slice(0, 4).map(([f, d]) => `      ${f.name} ${f.w} ↔ ${d.name} ${d.w}`).join("\n") +
      `\n    Похоже на CSS \`border\` там, где в Figma обводка INSIDE: она не` +
      `\n    расширяет коробку. Рисовать кольцом (\`ring-1 ring-inset\`) или` +
      `\n    внутренней тенью, иначе всё внутри съедет на пиксель.`
  );
}

// ---- смещение внутри родителя -------------------------------------------------
// Высоты и зазоры могут совпасть, а элемент внутри строки будет стоять не там:
// точечный выносной в характеристиках сидел по центру строки, где в кадре он на
// базовой линии (28 при строке 44). Ни высоты, ни зазоры этого не видят —
// ловится только смещением от верха родителя.
// Пара должна совпасть И по высоте, И по ширине — иначе это просто два разных
// ящика, случайно равных по высоте, и смещения у них сравнивать бессмысленно.
const offPairs = align(figBoxes, domBoxes).filter(
  ([f, d]) =>
    f && d && f.y != null && d.off != null &&
    f.h === d.h && Math.abs(f.w - d.w) <= 1 && Math.abs(f.y - d.off) > 2
);
if (offPairs.length) {
  console.log(
    `  ⚠ ${offPairs.length} пар(ы) совпали по высоте, но стоят на разной высоте внутри родителя:\n` +
      offPairs.slice(0, 4).map(([f, d]) => `      ${f.name}: макет ${f.y} ↔ страница ${d.off}`).join("\n")
  );
}

// ---- x надписей -----------------------------------------------------------------
// Пары по ТЕКСТУ, а не по высоте: одна и та же надпись в кадре и на странице
// обязана начинаться в одной точке от левого края корня. Ящики тут не помогут:
// в кадре крошка — «шаг» 54 (текст 46 + 2 + точка в ящике 6), у нас ряд
// плоский, и «Акции» прилипла к глифу точки на 2px левее — высоты сошлись,
// пар не было. Только auto-width тексты: у них ящик равен самим буквам.
const usedT = new Set();
const textX = [];
for (const f of figTexts) {
  const i = domTexts.findIndex((d, k) => !usedT.has(k) && d.text === f.text);
  if (i === -1) continue;
  usedT.add(i);
  if (Math.abs(f.x - domTexts[i].x) > 1.5) textX.push(`«${f.text.slice(0, 30)}»: макет ${Math.round(f.x)} ↔ страница ${domTexts[i].x.toFixed(1)}`);
}
if (textX.length) {
  console.log(`  ✗ x надписи: ${textX.length} текст(а) начинаются не там, где в кадре (от левого края корня):\n` +
    textX.slice(0, 8).map((r) => `      ${r}`).join("\n"));
}

// ---- горизонталь ---------------------------------------------------------------
// Высота, зазоры и вертикальное смещение могут сойтись, а элемент стоит не там
// по горизонтали: плашки на фото планшета сидели на 4 от края при 10 в кадре.
// Та же пара «высота + ширина совпали», но смещение от ЛЕВОГО края родителя.
// Пара «надёжная», если и РОДИТЕЛИ обеих коробок образуют пару: иначе это два
// разных ящика, случайно равных по высоте (у шапки `phone` 128x24 против нашего
// ряда 211x24), и сравнивать у них x, ширину и цвет бессмысленно.
const allPairs = align(figBoxes, domBoxes).filter(([f, d]) => f && d);
const pairKey = new Set(allPairs.map(([f, d]) => `${f.uid}→${d.uid}`));
const trusted = ([f, d]) =>
  (f.pkey == null && d.parent == null) || (f.pkey === "root" && d.parent === 0) || pairKey.has(`${f.pkey}→${d.parent}`);
const pairs = allPairs.filter(trusted);
const xPairs = pairs.filter(
  ([f, d]) => f.x != null && d.offX != null && f.h === d.h && Math.abs(f.w - d.w) <= 1 && Math.abs(f.x - d.offX) > 2
);
if (xPairs.length) {
  console.log(
    `  ⚠ ${xPairs.length} пар(ы) совпали по размеру, но стоят на разном расстоянии от левого края родителя:\n` +
      xPairs.slice(0, 6).map(([f, d]) => `      ${f.name}: макет ${f.x} ↔ страница ${d.offX}`).join("\n")
  );
}
// ---- ширина ----------------------------------------------------------------------
// Пары одной высоты с разной шириной. Текстовые ящики не считаются — их ширина
// от своих фикстур; страничные (от 1000) тоже: холст 1442 при окне 1440.
const wPairs = pairs.filter(
  ([f, d]) => f.h === d.h && !f.text && !d.text && Math.abs(f.w - d.w) > 2 && f.w < 1000 && d.w < 1000
);
if (wPairs.length) {
  console.log(
    `  ⚠ ${wPairs.length} пар(ы) совпали по высоте, но разошлись по ширине:\n` +
      wPairs.slice(0, 6).map(([f, d]) => `      ${f.name} ${f.w} ↔ ${d.name} ${d.w}`).join("\n")
  );
}
// ---- цвет ------------------------------------------------------------------------
// Заливка и обводка. Сравниваются только пары одной высоты и ширины — у двух
// разных ящиков цвета сравнивать нечего. Белая заливка кадра при прозрачном
// элементе не считается: страница и так на белом, и Figma красит белым все
// секции подряд. Обводка Figma ищется среди `border` и цветов `box-shadow`
// (кольцо и внутренняя тень — это он).
const rgb = (s) => {
  const m = s && s.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
  return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] == null ? 1 : +m[4] } : null;
};
const hx = (h) => (h ? { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) } : null);
const near = (a, b) => a && b && Math.abs(a.r - b.r) <= 3 && Math.abs(a.g - b.g) <= 3 && Math.abs(a.b - b.b) <= 3;
const show = (c) => (c ? `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("")}${c.a != null && c.a < 1 ? ` ${Math.round(c.a * 100)}%` : ""}` : "—");
const colorRows = [];
for (const [f, d] of pairs) {
  if (f.h !== d.h || Math.abs(f.w - d.w) > 1) continue;
  // заливка (у TEXT это цвет букв — его сверяет audit:type, тут пропуск)
  const fb = f.fill && !f.text ? { ...hx(f.fill.color), a: f.fill.opacity } : null;
  const db = rgb(d.bg);
  const dbSolid = db && db.a > 0.02 ? db : null;
  // Заливка сверяется в одну сторону — от кадра к странице: у нас цвет часто
  // висит на уровень ниже или выше, чем в Figma (образец цвета красит кнопку,
  // Figma — вложенный `color`), и «у Figma нет, у нас есть» почти всегда это.
  // Обратное — «в кадре есть, у нас прозрачно» — проверяется ещё и по детям
  // нашего ящика: если цвет лежит на ребёнке, это та же заливка уровнем ниже.
  if (fb && f.fill.color !== "#ffffff") {
    const kidsBg = domBoxes.filter((k) => k.parent === d.uid).map((k) => rgb(k.bg)).filter((c) => c && c.a > 0.02);
    const ok = (c) => near(fb, c) && Math.abs(fb.a - c.a) <= 0.06;
    if (!dbSolid && !kidsBg.some(ok)) colorRows.push(`${f.name}: заливка ${show(fb)} ↔ прозрачно (${d.name})`);
    else if (dbSolid && !ok(dbSolid) && !kidsBg.some(ok)) colorRows.push(`${f.name}: заливка ${show(fb)} ↔ ${show(dbSolid)} (${d.name})`);
  }
  // обводка — только с ненулевой толщиной хотя бы по одной стороне
  const sw = f.stroke && (f.stroke.sides ? Math.max(...Object.values(f.stroke.sides)) : f.stroke.weight);
  if (f.stroke && sw > 0) {
    const fs = { ...hx(f.stroke.color), a: f.stroke.opacity };
    const where = f.stroke.sides ? Object.entries(f.stroke.sides).filter(([, w]) => w > 0).map(([k]) => k).join("") : "";
    const cands = [...(d.border?.colors ?? []), ...(d.shadow?.colors ?? [])].map(rgb).filter(Boolean);
    if (!cands.length) colorRows.push(`${f.name}: обводка ${show(fs)} ${sw}${where ? " (" + where + ")" : ""} ↔ нет ни border, ни box-shadow (${d.name})`);
    else if (!cands.some((c) => near(fs, c) && Math.abs(fs.a - c.a) <= 0.06))
      colorRows.push(`${f.name}: обводка ${show(fs)} ↔ ${cands.map(show).join(" / ")} (${d.name})`);
  }
  if (Math.abs((f.opacity ?? 1) - (d.opacity ?? 1)) > 0.05) colorRows.push(`${f.name}: прозрачность ${f.opacity} ↔ ${d.opacity}`);
}
if (colorRows.length) {
  console.log(`  ⚠ ${colorRows.length} пар(ы) разошлись по цвету (заливка, обводка, прозрачность):\n` +
    colorRows.slice(0, 8).map((r) => `      ${r}`).join("\n"));
}

console.log("  зазоры между соседями, по вложенным рядам:");
console.log(`    макет:    ${figGaps.join("  |  ") || "—"}`);
console.log(`    страница: ${domGaps.join("  |  ") || "—"}`);

console.log(
  `\n  ящиков: в макете ${figBoxes.length}, на странице ${domBoxes.length}; без пары ${only}` +
    `\n  «м»/«с» — ящик есть только в макете / только на странице.` +
    `\n  Пары строятся по ВЫСОТЕ: совпавший прогон держит выравнивание,` +
    `\n  одиночная строка «м» рядом со строкой «с» — это и есть расхождение.\n`
);
process.exit(only || rootBad || textX.length ? 1 : 0);
