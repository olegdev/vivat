// Пятый аудит: влезает ли страница в окно и не лежат ли элементы управления
// друг на друге. Фигма здесь не нужна — оба дефекта видны из самого рендера,
// и оба ловятся одинаково на всех страницах, поэтому им и место в отдельном
// проходе, а не в реестре блоков.
//
//   node scripts/audit-fit.mjs <page> [--width 1440,768,360] [--click sel,sel]
//   node scripts/audit-fit.mjs dealer/main --click '[data-price-panel-trigger]'
//   node scripts/audit-fit.mjs            # все страницы dist/pages
//
// Что проверяется.
//
// 1. ГОРИЗОНТАЛЬНАЯ ПРОКРУТКА. `documentElement.scrollWidth` больше окна —
//    значит что-то торчит за правый край и страница едет. Виновники печатаются
//    по правому краю. Живой пример: дилерская панель прайс-листа висела
//    `left-0 w-[328px]` под триггером; на 1440 триггер слева и всё хорошо, на
//    768 полоса вдвое уже, триггер уезжает на 498 из 768 — и панель выносила
//    страницу на 826.
//
//    Элементы внутри своих прокруток (рельсы карточек) не считаются: у них
//    переполнение — это и есть устройство. Поэтому виновник отбрасывается,
//    если у любого его предка `overflow-x` не `visible`.
//
// 2. ПЕРЕКРЫТОЕ УПРАВЛЕНИЕ. Элемент управления (`a`, `button`, `input`,
//    `select`, `textarea`, `[role=button]`), середину которого накрывает чужой
//    элемент, — то есть по нему нельзя щёлкнуть там, где он нарисован. Проверка
//    не геометрическая, а `elementFromPoint`: пересечение прямоугольников само
//    по себе ничего не значит (иконка внутри кнопки пересекается с ней всегда),
//    а вот «в моей середине лежит не я» значит ровно то, что видно глазом.
//    Пример: в оверлее поиска поле нарисовано фиксированными 723 по центру, а ×
//    стоит на 40 от края; на 1440 между ними 318, а на 768 поле заезжает под ×
//    и накрывает кнопку «Найти». Ни один блочный аудит этого не видит: каждый
//    элемент по отдельности совпадает с макетом, расходится их СУММА на этой
//    ширине.
//
//    Середина берётся не у всего прямоугольника, а у ВИДИМОЙ его части: всё
//    пересекается с прокрутками предков, и карточка, уехавшая за край рельса,
//    из проверки выпадает вместе со своей серединой. Иначе каждый рельс даёт
//    десяток ложных находок — уехавшие карточки «накрыты» тем, что нарисовано
//    на их месте.
//
// Скрытое не проверяется (нулевые прямоугольники), поэтому оверлеи надо
// открыть: `--click` жмёт первый ВИДИМЫЙ элемент по каждому селектору по
// очереди, с паузой на анимацию.
import { chromium } from "playwright";
import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : argv[i + 1]; };
const WIDTHS = String(opt("--width", "1440,768,360")).split(",").map(Number);
const CLICKS = opt("--click", "") ? String(opt("--click")).split(",") : [];
const pages = argv.filter((a, i) => !a.startsWith("--") && !["--width", "--click"].includes(argv[i - 1]));

function allPages() {
  const root = resolve("dist/pages");
  const out = [];
  for (const dir of readdirSync(root)) {
    for (const f of readdirSync(resolve(root, dir))) {
      if (f.endsWith(".html")) out.push(`${dir}/${f.replace(/\.html$/, "")}`);
    }
  }
  return out.sort();
}

const targets = pages.length ? pages : allPages();

const probe = (viewport) => {
  const INTERACTIVE = "a,button,input,select,textarea,[role=button]";
  const clip = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox && ox !== "visible") return true;
    }
    return false;
  };
  const label = (el) => {
    const id = el.id ? `#${el.id}` : "";
    const cls = (el.getAttribute("class") || "").split(/\s+/).filter(Boolean).slice(0, 3).join(".");
    const data = [...el.attributes].find((a) => a.name.startsWith("data-") && !a.value)?.name || "";
    return `${el.tagName.toLowerCase()}${id}${data ? `[${data}]` : ""}${cls ? `.${cls}` : ""}`.slice(0, 52);
  };

  // 1 — что торчит за правый край
  const over = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (r.right <= viewport + 1) continue;
    if (clip(el)) continue;
    over.push({ right: Math.round(r.right), what: label(el) });
  }
  // оставляем только самых правых: цепочка вложенных даёт одну и ту же причину
  over.sort((a, b) => b.right - a.right);
  const overflow = over.filter((o, i) => i === 0 || o.right !== over[i - 1].right).slice(0, 6);

  // 2 — перекрытое управление
  const visRect = (el) => {
    let r = el.getBoundingClientRect();
    let box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    for (let p = el.parentElement; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
      const pr = p.getBoundingClientRect();
      box = {
        left: Math.max(box.left, pr.left), top: Math.max(box.top, pr.top),
        right: Math.min(box.right, pr.right), bottom: Math.min(box.bottom, pr.bottom),
      };
    }
    box = {
      left: Math.max(box.left, 0), top: Math.max(box.top, 0),
      right: Math.min(box.right, window.innerWidth), bottom: Math.min(box.bottom, window.innerHeight),
    };
    return box.right - box.left > 4 && box.bottom - box.top > 4 ? box : null;
  };
  // Прилипшее и фиксированное не считается: тапбар, бар CTA и шапка НАРОЧНО
  // лежат поверх страницы, и то, что при прокрутке в ноль под них попал
  // очередной элемент, — не дефект, а устройство. Дефект — когда накрывает
  // что-то из обычного потока.
  const pinnedRoot = (el) => {
    for (let p = el; p; p = p.parentElement) {
      const pos = getComputedStyle(p).position;
      if (pos === "fixed" || pos === "sticky") return p;
    }
    return null;
  };
  const hits = [];
  for (const el of document.querySelectorAll(INTERACTIVE)) {
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.pointerEvents === "none") continue;
    const box = visRect(el);
    if (!box) continue;
    const cx = (box.left + box.right) / 2, cy = (box.top + box.bottom) / 2;
    const top = document.elementFromPoint(cx, cy);
    if (!top || top === el || el.contains(top) || top.contains(el)) continue;
    const pinA = pinnedRoot(el), pinB = pinnedRoot(top);
    if (pinB && pinB !== pinA) continue;
    hits.push({ a: label(el), b: label(top) });
  }

  return { scrollWidth: document.documentElement.scrollWidth, overflow, hits: hits.slice(0, 8) };
};

const browser = await chromium.launch();
let bad = 0;
for (const page of targets) {
  const file = resolve(`dist/pages/${page}.html`);
  if (!existsSync(file)) { console.error(`нет файла: ${file}`); continue; }
  for (const width of WIDTHS) {
    const p = await browser.newPage({ viewport: { width, height: 900 } });
    await p.goto(`file://${file}`, { waitUntil: "load" });
    await p.waitForTimeout(450);
    for (const c of CLICKS) {
      await p.$$eval(c, (els) => { const v = els.find((e) => e.getClientRects().length); if (v) v.click(); });
      await p.waitForTimeout(350);
    }
    const r = await p.evaluate(probe, width);
    await p.close();
    const lines = [];
    if (r.scrollWidth > width + 1) {
      lines.push(`   прокрутка ✗ страница ${r.scrollWidth} при окне ${width}`);
      for (const o of r.overflow) lines.push(`               до ${o.right}  ${o.what}`);
    }
    for (const h of r.hits) lines.push(`   перекрыт ✗ ${h.a}   ← накрыт ${h.b}`);
    if (lines.length) {
      bad += lines.length;
      console.log(`\n── ${page} @${width}`);
      console.log(lines.join("\n"));
    }
  }
}
await browser.close();
if (!bad) console.log("влезает в окно, управление не перекрыто — на всех проверенных ширинах");
process.exit(bad ? 1 : 0);
