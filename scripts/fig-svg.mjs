// Выгрузка иконки из .fig без Figma: геометрия вектора лежит в `blobs` —
// `fillGeometry[].commandsBlob` это индекс, а сам блоб — команды пути:
// [op:u8][float32 LE × n]: 0 Z, 1 M(x,y), 2 L(x,y), 3 Q(2 точки), 4 C(3 точки).
// Координаты в пространстве самого VECTOR; его transform даёт сдвиг в холст
// контейнера. Проверено на pin 20 (2214:190771) против экспорта из Figma.
//
//   node scripts/fig-svg.mjs <symbol-id> > public/assets/…/icon.svg
//   node scripts/fig-svg.mjs 2214:190873 --fill #292929
import { readFileSync } from "node:fs";
import zlib from "node:zlib";
import { compileSchema, decodeBinarySchema } from "kiwi-schema";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : argv[i + 1]; };
const id = argv.find((a) => /^\d+[:-]\d+$/.test(a))?.replace("-", ":");
const FILL = opt("--fill", null);
if (!id) { console.error("usage: node scripts/fig-svg.mjs <symbol-id> [--fill #hex]"); process.exit(1); }

const buf = readFileSync("VIVAT_SOURCES/canvas.fig");
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
const blocks = []; let off = 12;
while (off + 4 <= buf.length) { const size = dv.getUint32(off, true); off += 4; blocks.push(buf.subarray(off, off + size)); off += size; }
const schema = compileSchema(decodeBinarySchema(zlib.inflateRawSync(blocks[0])));
const inflate = (b) => (b[0] === 0x28 && b[1] === 0xb5) ? zlib.zstdDecompressSync(b) : zlib.inflateRawSync(b);
const msg = schema.decodeMessage(inflate(blocks[1]));
const gid = (g) => `${g.sessionID}:${g.localID}`;
const byId = new Map(msg.nodeChanges.map((n) => [gid(n.guid), n]));
const kids = new Map();
for (const n of msg.nodeChanges) { const p = n.parentIndex?.guid && gid(n.parentIndex.guid); if (p) (kids.get(p) ?? kids.set(p, []).get(p)).push(n); }

const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
const f = (v) => +v.toFixed(3);
function path(blobIdx, dx, dy) {
  const b = Buffer.from(msg.blobs[blobIdx].bytes);
  let i = 0; const out = [];
  const pt = () => { const x = b.readFloatLE(i), y = b.readFloatLE(i + 4); i += 8; return `${f(x + dx)} ${f(y + dy)}`; };
  while (i < b.length) {
    const op = b[i++];
    if (op === 1) out.push("M" + pt());
    else if (op === 2) out.push("L" + pt());
    else if (op === 0) out.push("Z");
    else if (op === 3) out.push("Q" + pt() + " " + pt());
    else if (op === 4) out.push("C" + pt() + " " + pt() + " " + pt());
    else throw new Error(`неизвестная команда ${op} в блобе ${blobIdx}`);
  }
  return out.join("");
}
const root = byId.get(id);
if (!root) { console.error(`нет узла ${id}`); process.exit(1); }
const W = root.size.x, H = root.size.y;
const paths = [];
(function walk(n, ox, oy) {
  for (const c of kids.get(gid(n.guid)) ?? []) {
    if (c.visible === false) continue;
    const x = ox + (c.transform?.m02 ?? 0), y = oy + (c.transform?.m12 ?? 0);
    const fills = (c.fillPaints ?? []).filter((p) => p.visible !== false && p.type === "SOLID");
    if (c.type === "VECTOR" || c.type === "ELLIPSE" || c.type === "RECTANGLE" || c.type === "ROUNDED_RECTANGLE" || c.type === "BOOLEAN_OPERATION") {
      const fill = FILL ?? (fills[0] ? hex(fills[0].color) : "#000");
      for (const g of c.fillGeometry ?? []) paths.push(`<path d="${path(g.commandsBlob, x, y)}" fill="${fill}"${g.windingRule === "EVENODD" ? ' fill-rule="evenodd"' : ""}/>`);
      if (c.type === "BOOLEAN_OPERATION") continue; // геометрия результата уже взята, детей не считаем
    }
    walk(c, x, y);
  }
})(root, 0, 0);
console.log(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg">\n${paths.join("\n")}\n</svg>`);
