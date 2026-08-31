import { readFileSync } from "node:fs";
import zlib from "node:zlib";
import { compileSchema, decodeBinarySchema } from "kiwi-schema";
const buf = readFileSync("VIVAT_SOURCES/canvas.fig");
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
const blocks = []; let off = 12;
while (off + 4 <= buf.length) { const size = dv.getUint32(off, true); off += 4; blocks.push(buf.subarray(off, off + size)); off += size; }
const inflateBody = (b) => (b[0] === 0x28 && b[1] === 0xb5 && b[2] === 0x2f ? zlib.zstdDecompressSync(b) : zlib.inflateRawSync(b));
const schema = compileSchema(decodeBinarySchema(zlib.inflateRawSync(blocks[0])));
const nodes = schema.decodeMessage(inflateBody(blocks[1])).nodeChanges || [];
const vals = new Map();
for (const n of nodes) {
  const h = n.hyperlink;
  if (!h) continue;
  const key = JSON.stringify(h);
  if (!vals.has(key)) vals.set(key, { n: 0, sample: n.name, text: (n.textData?.characters||"").slice(0,40) });
  vals.get(key).n++;
}
console.log("distinct hyperlink values:", vals.size);
[...vals.entries()].slice(0,40).forEach(([k,v])=>console.log(v.n, k.slice(0,200), "|", v.sample, "|", v.text));
