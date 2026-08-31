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
const gid = (g) => (g ? `${g.sessionID}:${g.localID}` : null);
const parent = new Map(), name = new Map(), type = new Map(), node = new Map();
for (const n of nodes) { const id = gid(n.guid); parent.set(id, gid(n.parentIndex?.guid)); name.set(id, n.name); type.set(id, n.type); node.set(id, n); }
const under = (id, root) => { let c = id, i=0; while (c && i++<60) { if (c === root) return true; c = parent.get(c); } return false; };
const NOTES = "2395:105830";
const sectionOf = (id) => { let c=id,i=0,prev=null; while(c&&i++<60){ if(type.get(c)==="SECTION") prev=`${name.get(c)}`; c=parent.get(c);} return prev; };
const frameTop = (id) => { let c=id,i=0,prev=null; while(c&&i++<60){ const p=parent.get(c); if(p&&type.get(p)==="SECTION") return `${name.get(c)} ${c}`; c=p;} return "?"; };
const rows=[];
for (const n of nodes) {
  const id = gid(n.guid);
  if (!/^Link/i.test(n.name||"")) continue;
  if (!under(id, NOTES)) continue;
  if (type.get(parent.get(id)) === "TEXT") continue;
  const acts = (n.prototypeInteractions||[]).flatMap(it=>(it.actions||[]).map(a=>({ev:it.event?.interactionType,nav:a.navigationType,t:gid(a.transitionNodeID)})));
  rows.push({id, name:n.name, type:n.type, sec:sectionOf(id), frame:frameTop(id), acts});
}
rows.sort((a,b)=> (a.sec||"").localeCompare(b.sec||"") || a.frame.localeCompare(b.frame));
let cur="";
for (const r of rows) {
  const key = `${r.sec} / ${r.frame}`;
  if (key!==cur){cur=key;console.log("\n=== "+key);}
  const a = r.acts.length ? r.acts.map(x=>`${x.nav} -> ${name.get(x.t)} (${x.t})`).join("; ") : "— НЕТ ПРОТОТИПА";
  console.log(`  ${r.name}  ${a}`);
}
console.log("\ntotal Link layers under Notes:", rows.length, "| with interaction:", rows.filter(r=>r.acts.length).length);
