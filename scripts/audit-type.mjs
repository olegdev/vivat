// Ordered typography diff: the kegel, leading and weight a Figma INSTANCE
// renders vs what the page renders. Third of the family, after
// `audit.mjs` (copy) and `audit-spacing.mjs` (vertical rhythm).
//
//   node scripts/audit-type.mjs <page> <selector> <figma-id> [--width 1440]
//   node scripts/audit-type.mjs customer/main '[data-section="popular"]' 2395:105896
//
// Why a third script rather than a flag on one of the others: the three audits
// pair different things. Spacing pairs SECTIONS, and pairs them by order.
// Copy and type pair STRINGS — and that pairing is already solved in
// `audit.mjs`: walk the master subtree in visual order, apply the instance's
// `symbolOverrides`, and a node renders when it participates in
// `derivedSymbolData`. This reuses that walk and hangs the metrics off it.
//
// Where the numbers come from, and why the instance is the only source that can
// be trusted:
//
//   • FONT SIZE comes from `derivedSymbolData` → `derivedTextData.glyphs[0]
//     .fontSize` — the size Figma actually laid the glyphs out at. The index
//     carries the MASTER's `fontSize`, and the master is routinely contradicted:
//     the socials heading is 20 in the master and 24 in the instance, which is
//     exactly the defect this audit exists to catch. Master size is used only
//     when a node is not inside an instance at all.
//
//   • LEADING is derived, not read. `derivedTextData.baselines` holds one entry
//     per rendered line, so `box height / line count` is the real line box.
//     (`baselines[].lineHeight` is the FONT's natural leading, not the styled
//     one — 30.6 where the style says 28. Do not use it.)
//
//   • WEIGHT is the master's `fontName.style`, mapped to a CSS number. Figma
//     stores no per-instance weight override in `derivedSymbolData`, so a
//     variant that changes weight is a blind spot; it is reported as `~`.
//
// Rounding: browsers report fractional line-heights (Onest at 14px gives
// 19.992px). Both sides are rounded to the nearest 0.5 before comparing, and a
// 1px gap on the line box is reported but not counted as a mismatch — that is
// hinting, not a defect. Font size is compared exactly.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const argv = process.argv.slice(2);
const opt = (n, d) => {
  const i = argv.indexOf(n);
  return i === -1 ? d : argv[i + 1];
};
const WIDTH = Number(opt("--width", 1440));
const pos = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--width");
const [page, selector, figmaId] = pos;
if (!page || !selector || !figmaId) {
  console.error(
    "usage: node scripts/audit-type.mjs <page> <selector> <figma-id> [--width 1440]\n" +
      "   e.g. node scripts/audit-type.mjs customer/main '[data-section=\"popular\"]' 2395:105896"
  );
  process.exit(1);
}

// ---- Figma side --------------------------------------------------------------
const raw = (id) =>
  JSON.parse(execFileSync("node", ["scripts/fig.mjs", "raw", id], { maxBuffer: 1 << 28 }));
const idx = JSON.parse(readFileSync("VIVAT_SOURCES/canvas.index.json", "utf8"));
const byId = new Map(idx.nodes.filter((n) => n.id).map((n) => [n.id, n]));
const kids = new Map();
for (const n of idx.nodes) {
  if (!n.parent) continue;
  if (!kids.has(n.parent)) kids.set(n.parent, []);
  kids.get(n.parent).push(n);
}
for (const a of kids.values()) a.sort((x, y) => String(x.order).localeCompare(String(y.order)));

const inst = raw(figmaId.replace("-", ":"));
if (!inst?.symbolData) {
  console.error(`${figmaId} — не INSTANCE; аудит кеглей читает derivedSymbolData`);
  process.exit(1);
}
const pathOf = (g) => g.guids.map((x) => `${x.sessionID}:${x.localID}`).join(".");

const overrides = new Map();
for (const o of inst.symbolData.symbolOverrides ?? [])
  if (o.textData?.characters) overrides.set(pathOf(o.guidPath), o.textData.characters);

// Derived layout, keyed by the same path — this is where the real metrics live.
const derived = new Map();
for (const e of inst.derivedSymbolData ?? []) derived.set(pathOf(e.guidPath), e);

const WEIGHT = { Thin: 100, ExtraLight: 200, Light: 300, Regular: 400, Medium: 500,
                 SemiBold: 600, Bold: 700, ExtraBold: 800, Black: 900 };

const figText = [];
(function walk(nodeId, prefix, seen) {
  for (const c of kids.get(nodeId) ?? []) {
    const path = prefix ? `${prefix}.${c.id}` : c.id;
    const d = derived.get(path);
    // Отсутствие в `derivedSymbolData` НЕ значит «не рендерится»: туда попадает
    // то, что отличается от мастера. Заголовок «Популярные товары для кухни»
    // (752:64204) совпадает с мастером — ни оверрайда, ни derived-записи, а на
    // экране он есть. `audit.mjs` может позволить себе строгое правило, потому
    // что сверяет наличие и порядок; здесь сверяются метрики, и потерять
    // строку хуже, чем показать лишнюю.
    const shown = derived.has(path) || overrides.has(path) || !c.hidden;
    const t = overrides.get(path) ?? c.text;
    if (t && t.trim() && shown) {
      const dt = d?.derivedTextData;
      const lines = dt?.baselines?.length || 1;
      const box = dt?.layoutSize?.y ?? d?.size?.y ?? c.font?.box ?? null;
      figText.push({
        text: t.replace(/\s+/g, " ").trim(),
        size: dt?.glyphs?.[0]?.fontSize ?? c.font?.size ?? null,
        lh: box != null ? +(box / lines).toFixed(1) : (c.font?.lh ?? null),
        weight: c.font?.style ? (WEIGHT[c.font.style] ?? null) : null,
        // Начертание берётся из мастера: пер-экземплярного веса Figma в
        // derivedSymbolData не хранит. Помечаем, чтобы не читалось как факт.
        weightFromMaster: true,
      });
    }
    if (c.symbol) {
      if (seen.has(c.symbol)) continue;
      walk(c.symbol, path, new Set([...seen, c.symbol]));
    } else {
      walk(c.id, prefix, seen);
    }
  }
})(
  inst.symbolData.symbolID
    ? `${inst.symbolData.symbolID.sessionID}:${inst.symbolData.symbolID.localID}`
    : figmaId,
  "",
  new Set()
);

// ---- DOM side ----------------------------------------------------------------
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: WIDTH, height: 1000 } });
await p.goto(`file://${resolve("dist/pages", page)}.html`, { waitUntil: "load" });
await p.waitForTimeout(1500);
const domText = await p.evaluate((sel) => {
  // Берём первый ВИДИМЫЙ подходящий узел, а не первый попавшийся. В разметке
  // соседствуют десктопный и мобильный варианты одного блока, и на 1440
  // `document.querySelector('footer')` отдаёт мобильный — скрытый, но со
  // своими вычисленными стилями. Обход внутрь скрытое отбрасывает, а сам
  // корень не проверял: получилась целая страница ложных находок, 32 штуки,
  // где подвал «12/16 против 16/24» на деле совпадал до пикселя.
  const seen = (el) => {
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden" && el.getBoundingClientRect().height > 0;
  };
  const all = [...document.querySelectorAll(sel)];
  const root = all.find(seen) ?? all[0];
  if (!root) return null;
  if (all.length > 1) console.warn(`селектор дал ${all.length} узлов; взят первый видимый`);
  const out = [];
  const walk = (el) => {
    for (const n of el.childNodes) {
      if (n.nodeType === 3) {
        const t = n.textContent.replace(/\s+/g, " ").trim();
        if (!t) continue;
        const cs = getComputedStyle(el);
        out.push({
          text: t,
          size: parseFloat(cs.fontSize),
          lh: cs.lineHeight === "normal" ? null : parseFloat(cs.lineHeight),
          weight: parseInt(cs.fontWeight, 10),
        });
      } else if (n.nodeType === 1) {
        const cs = getComputedStyle(n);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        walk(n);
      }
    }
  };
  walk(root);
  return out;
}, selector);
await browser.close();

if (domText === null) {
  console.error(`селектор ничего не нашёл: ${selector}`);
  process.exit(1);
}

// ---- report ------------------------------------------------------------------
const key = (s) => s.toLowerCase().replace(/[«»"'`\s]/g, "");
const half = (v) => (v == null ? null : Math.round(v * 2) / 2);
const fmt = (r) =>
  r ? `${r.size ?? "?"}/${half(r.lh) ?? "?"}${r.weight ? " " + r.weight : ""}` : "—";

console.log(`\n  ══ ${page} @ ${WIDTH}  ←→  ${figmaId}   ${selector}`);
console.log(`  ${"строка".padEnd(38)} ${"МАКЕТ".padStart(12)}   ${"СТРАНИЦА".padStart(12)}`);
console.log(`  ${"—".repeat(38)} ${"—".repeat(12)}   ${"—".repeat(12)}`);

// Пары строятся ПО ТЕКСТУ, наибольшей общей подпоследовательностью. Позиционное
// сведение здесь не работает: обе стороны законно содержат строки, которых нет
// у другой — макет несёт филлер вариантов, страница несёт то, что дизайнер
// нарисовал соседним блоком. А сравнивать надо метрики одной и той же строки,
// и только их.
function align(a, b) {
  const n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      L[i][j] = key(a[i].text) === key(b[j].text) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (key(a[i].text) === key(b[j].text)) out.push([a[i++], b[j++]]);
    else if (L[i + 1][j] >= L[i][j + 1]) out.push([a[i++], null]);
    else out.push([null, b[j++]]);
  }
  while (i < n) out.push([a[i++], null]);
  while (j < m) out.push([null, b[j++]]);
  return out;
}

// Второй проход. Фикстуры у нас свои, поэтому ровно те строки, ради которых
// аудит и затевался — цена, название товара, счётчики, — по тексту не сойдутся
// никогда: в макете «148 320₽», у нас «60 000₽». После сведения по тексту
// остатки с двух сторон зипуются ПО ПОРЯДКУ и помечаются «≈»: пара
// правдоподобна, но не доказана, и читать её надо глазами. Именно так нашлась
// цена 24/32 против наших 24/28 в карточке каталожной сетки.
function pairLeftovers(rows) {
  const out = [];
  const figOnly = [];
  const domOnly = [];
  for (const [f, d] of rows) {
    if (f && d) out.push([f, d, "текст"]);
    else if (f) figOnly.push(f);
    else domOnly.push(d);
  }
  const n = Math.min(figOnly.length, domOnly.length);
  for (let i = 0; i < n; i++) out.push([figOnly[i], domOnly[i], "порядок"]);
  for (let i = n; i < figOnly.length; i++) out.push([figOnly[i], null, "—"]);
  for (let i = n; i < domOnly.length; i++) out.push([null, domOnly[i], "—"]);
  return out;
}

let bad = 0;
let soft = 0;
let only = 0;
let guessed = 0;
for (const [f, d, how] of pairLeftovers(align(figText, domText))) {
  let flag = "  ";
  if (!f || !d) {
    flag = f ? "м " : "с ";
    only++;
  } else {
    // Дефектом считаются ТОЛЬКО кегль и вес. Интерлиньяж помечается, но не
    // засчитывается: он выводится из насчитанной коробки, а коробку в макете
    // случается растянуть руками. Живой пример — «от» в карточке: узел 18x33
    // при кегле 16 (таких в файле 503 штуки), тогда как стиль говорит 16/22.
    // Считать это расхождением значит хоронить настоящие находки под шумом.
    const sizeBad = f.size != null && d.size != null && Math.abs(f.size - d.size) > 0.5;
    const wBad = f.weight != null && d.weight != null && f.weight !== d.weight;
    const lhBad = f.lh != null && d.lh != null && Math.abs(f.lh - d.lh) > 1;
    if (sizeBad || wBad) {
      flag = how === "порядок" ? "≈✗" : "✗ ";
      bad++;
    } else if (lhBad) {
      flag = "лн";
      soft++;
    } else if (how === "порядок") {
      flag = "≈ ";
    }
    if (how === "порядок") guessed++;
  }
  const label =
    how === "порядок"
      ? `${(f.text ?? "").slice(0, 16)} ⟷ ${(d.text ?? "").slice(0, 16)}`
      : (f?.text ?? d?.text ?? "").slice(0, 37);
  console.log(`${flag}${label.padEnd(38)} ${fmt(f).padStart(12)}   ${fmt(d).padStart(12)}`);
}

console.log(
  `\n  строк: в макете ${figText.length}, на странице ${domText.length};` +
    ` расхождений кегля/веса ${bad}, интерлиньяжа ${soft};` +
    ` сведено по порядку ${guessed}, без пары ${only}` +
    `\n  «✗» — разошёлся КЕГЛЬ или ВЕС. Это дефект.` +
    `\n  «лн» — разошёлся интерлиньяж. Смотреть глазами: он выведен из коробки,` +
    `\n         а коробку в макете случается растянуть руками (см. шапку скрипта).` +
    `\n  «≈» — пара найдена по ПОРЯДКУ, а не по тексту (свои фикстуры). Пара` +
    `\n        правдоподобна, но не доказана — сверять глазами.` +
    `\n  «м»/«с» — строка только в макете / только на странице; метрику не сверить.` +
    `\n  Вес берётся из мастера: вариант, меняющий начертание, аудит не увидит.\n`
);
process.exit(bad ? 1 : 0);
