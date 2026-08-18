// Извлекатель справочных таблиц из макета.
//
//   node scripts/fig-table.mjs <table-inner-container-id> <out.js> [EXPORT_NAME]
//
// Зачем: таблица «Описание формата» — 269 ячеек, и текст каждой лежит в
// оверрайде инстанса, то есть виден только через `fig.mjs inst`. Поштучно это
// час работы, потому что `raw` распаковывает .fig на каждый вызов. Здесь
// документ распаковывается один раз — те же 269 ячеек за пять секунд.
//
// Понимает обе формы строки: пару [элемент, описание] и элемент с вложенной
// таблицей (в макете `table-block` внутри `row`, первая ячейка объединена на
// всю его высоту). Ячейку без оверрайда берёт текстом мастера — именно он и
// отрисован.
import { readFileSync, writeFileSync } from "node:fs";
import zlib from "node:zlib";
import { decodeBinarySchema, compileSchema } from "kiwi-schema";

const [CONTAINER, OUT, NAME = "TABLE"] = process.argv.slice(2);
if (!CONTAINER || !OUT) {
  console.error("usage: node scripts/fig-table.mjs <container-id> <out.js> [EXPORT_NAME]");
  process.exit(1);
}

const buf = readFileSync("VIVAT_SOURCES/canvas.fig");
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
const blocks = [];
let off = 12;
while (off + 4 <= buf.length) {
  const size = dv.getUint32(off, true);
  off += 4;
  blocks.push(buf.subarray(off, off + size));
  off += size;
}
const body = (b) =>
  b[0] === 0x28 && b[1] === 0xb5 && b[2] === 0x2f ? zlib.zstdDecompressSync(b) : zlib.inflateRawSync(b);
const schema = compileSchema(decodeBinarySchema(zlib.inflateRawSync(blocks[0])));
const nodes = schema.decodeMessage(body(blocks[1])).nodeChanges || [];

const gid = (g) => (g ? `${g.sessionID}:${g.localID}` : null);
const byId = new Map();
const kids = new Map();
for (const n of nodes) {
  byId.set(gid(n.guid), n);
  const p = gid(n.parentIndex?.guid);
  if (p) {
    if (!kids.has(p)) kids.set(p, []);
    kids.get(p).push(n);
  }
}
const idx = JSON.parse(readFileSync("VIVAT_SOURCES/canvas.index.json", "utf8")).nodes;
const geom = new Map();
for (const k in idx) if (idx[k].id) geom.set(idx[k].id, idx[k]);

const childrenOf = (id) =>
  (kids.get(id) || [])
    .map((n) => ({ n, g: geom.get(gid(n.guid)) }))
    .filter((c) => c.g)
    .sort((a, b) => a.g.y - b.g.y || a.g.x - b.g.x);

const clean = (s) => s.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
const firstText = (id, seen = new Set()) => {
  if (seen.has(id)) return "";
  seen.add(id);
  for (const c of kids.get(id) || []) {
    if (c.textData?.characters) return c.textData.characters;
    const deep = firstText(gid(c.guid), seen);
    if (deep) return deep;
  }
  return "";
};
const cellText = (id) => {
  const n = byId.get(id);
  for (const o of n?.symbolData?.symbolOverrides || []) {
    if (o?.textData?.characters) return clean(o.textData.characters);
  }
  // Ячейка без оверрайда рисуется текстом мастера.
  const sym = gid(n?.symbolData?.symbolID);
  return sym ? clean(firstText(sym)) : clean(firstText(id));
};

// Первая попавшаяся ячейка-инстанс в поддереве.
function firstCell(id) {
  for (const c of childrenOf(id)) {
    if (c.g.name.includes("column-cell")) return gid(c.n.guid);
    const deep = firstCell(gid(c.n.guid));
    if (deep) return deep;
  }
  return null;
}

// Строка: две ячейки — простая. Метка рядом с вложенным table-block — строка
// с подтаблицей; вложенный блок держит `row` напрямую, без шапки.
function readRow(rowId) {
  const cs = childrenOf(rowId);
  const nested = cs.find((c) => c.g.name === "table-block");
  if (!nested) return cs.map((c) => cellText(gid(c.n.guid)));
  const labelCell = firstCell(gid(cs.find((c) => c !== nested).n.guid));
  const sub = childrenOf(gid(nested.n.guid)).map((r) =>
    childrenOf(gid(r.n.guid)).map((c) => cellText(gid(c.n.guid)))
  );
  return { label: labelCell ? cellText(labelCell) : "", sub };
}

const out = [];
for (const blk of childrenOf(CONTAINER.replace("-", ":"))) {
  const parts = childrenOf(gid(blk.n.guid));
  const head = childrenOf(gid(parts.find((p) => p.g.name === "header").n.guid)).map((c) =>
    cellText(gid(c.n.guid))
  );
  const rows = [];
  for (const db of parts.filter((p) => p.g.name === "data-block"))
    for (const grp of childrenOf(gid(db.n.guid)))
      for (const r of childrenOf(gid(grp.n.guid))) rows.push(readRow(gid(r.n.guid)));
  out.push({ head, rows });
}

const j = (v) => JSON.stringify(v, null, 0);
let src = `// Справочная таблица, вычитанная из макета целиком.
// Собрано: node scripts/fig-table.mjs ${CONTAINER} ${OUT} ${NAME}
//
// Блок — шапка из двух колонок и строки. Строка бывает парой
// [элемент, описание] либо элементом с вложенной таблицей ({ label, sub }).

export const ${NAME} = [
`;
for (const b of out) {
  src += `  {\n    head: ${j(b.head)},\n    rows: [\n`;
  for (const r of b.rows) {
    if (Array.isArray(r)) src += `      ${j(r)},\n`;
    else {
      src += `      { label: ${j(r.label)}, sub: [\n`;
      for (const s of r.sub) src += `        ${j(s)},\n`;
      src += `      ] },\n`;
    }
  }
  src += `    ],\n  },\n`;
}
src += `];\n`;
writeFileSync(OUT, src);
const simple = out.reduce((a, b) => a + b.rows.filter(Array.isArray).length, 0);
const nested = out.reduce((a, b) => a + b.rows.filter((r) => !Array.isArray(r)).length, 0);
console.log(`блоков: ${out.length} | простых строк: ${simple} | со вложенной таблицей: ${nested}`);
