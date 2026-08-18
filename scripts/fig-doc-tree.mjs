// Извлекатель деревьев документов из макета.
//
//   node scripts/fig-doc-tree.mjs <documents-content-id> <out.js> <EXPORT_NAME> [--collapsed]
//
// `--collapsed` собирает всё свёрнутым. Нужен там, где содержимое нарисовано
// только в раскрытом кадре, а состояние по умолчанию задаёт свёрнутый — как у
// «Схем сборки», где списки в свёрнутом кадре пустые.
//
// Дерево в Figma рекурсивное: `list` содержит заголовок `link-list` и
// вложенный `list`, и так до четырёх уровней. Текст лежит в оверрайдах
// инстансов и виден только через `inst`, поэтому документ распаковывается один
// раз, а оверрайды сопоставляются по узлам — дата обычно не переопределена и
// берётся из мастера.

import { readFileSync, writeFileSync } from "node:fs";
import zlib from "node:zlib";
import { decodeBinarySchema, compileSchema } from "kiwi-schema";
const buf = readFileSync("VIVAT_SOURCES/canvas.fig");
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
const blocks = []; let off = 12;
while (off + 4 <= buf.length) { const s = dv.getUint32(off, true); off += 4; blocks.push(buf.subarray(off, off + s)); off += s; }
const bd = (b) => (b[0]===0x28&&b[1]===0xb5&&b[2]===0x2f ? zlib.zstdDecompressSync(b) : zlib.inflateRawSync(b));
const schema = compileSchema(decodeBinarySchema(zlib.inflateRawSync(blocks[0])));
const nodes = schema.decodeMessage(bd(blocks[1])).nodeChanges || [];
const gid = (g) => (g ? `${g.sessionID}:${g.localID}` : null);
const byId = new Map(); const kidsRaw = new Map();
for (const n of nodes) { byId.set(gid(n.guid), n); const p = gid(n.parentIndex?.guid); if (p) { if(!kidsRaw.has(p)) kidsRaw.set(p,[]); kidsRaw.get(p).push(n);} }
const texts = (id) => {
  const n = byId.get(id); const over = new Map();
  for (const o of n?.symbolData?.symbolOverrides || []) {
    const path = o?.guidPath?.guids || []; const last = gid(path[path.length-1]);
    if (last && o?.textData?.characters) over.set(last, o.textData.characters);
  }
  const out = [];
  const walk = (x, seen=new Set()) => { if(seen.has(x)) return; seen.add(x);
    for (const c of kidsRaw.get(x)||[]) { const cid=gid(c.guid); const t=over.get(cid) ?? c.textData?.characters;
      if (t) out.push(t.replace(/[\r\n]+/g," ").trim()); walk(cid, seen); } };
  walk(gid(n?.symbolData?.symbolID) || id);
  return out;
};
const idx = JSON.parse(readFileSync("VIVAT_SOURCES/canvas.index.json","utf8")).nodes;
const g = {}; for (const k in idx) { const n = idx[k]; if (n.parent) (g[n.parent] = g[n.parent] || []).push(n); }
const ch = (id) => (g[id] || []).slice().sort((a,b)=>a.y-b.y||a.x-b.x);
let leaves = 0, branches = 0, depth = 0;
// Раскрыт ли узел, видно по его высоте: свёрнутый — это только заголовок с
// отбивкой (не выше 64), раскрытый вытянут содержимым.
function readList(listId, d) {
  depth = Math.max(depth, d);
  const out = [];
  for (const c of ch(listId)) {
    if (c.name === "list") {
      const parts = ch(c.id);
      const head = parts.find((p) => p.name === "link-list");
      const inner = parts.find((p) => p.name === "list");
      if (head) {
        branches++;
        out.push({
          title: texts(head.id)[0] || "",
          open: COLLAPSED ? false : c.h > 64,
          children: inner ? readList(inner.id, d + 1) : [],
        });
      }
    } else if (c.name === "link-list") {
      const t = texts(c.id); leaves++; out.push({ title: t[0] || "", date: t[1] || "" });
    }
  }
  return out;
}
const [CONTAINER, OUT, NAME] = process.argv.slice(2);
const COLLAPSED = process.argv.includes("--collapsed");
const tree = ch(CONTAINER).map((lvl) => {
  const parts = ch(lvl.id);
  const head = parts.find((p) => p.name === "link-list");
  const list = parts.find((p) => p.name === "list");
  return { title: texts(head.id)[0] || "", open: COLLAPSED ? false : lvl.h > 64, children: list ? readList(list.id, 1) : [] };
});
writeFileSync(OUT, `// Дерево документов, вычитанное из макета (${CONTAINER}).
// Узел — либо ветка с детьми, либо документ с датой; глубина ${depth}.
// Собрано: node scripts/fig-doc-tree.mjs ${CONTAINER} ${OUT} ${NAME}

export const ${NAME} = ${JSON.stringify(tree, null, 2)};
`);
console.log("групп:", tree.length, "| веток:", branches, "| документов:", leaves, "| глубина:", depth);
