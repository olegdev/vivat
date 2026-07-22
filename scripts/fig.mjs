#!/usr/bin/env node
// Read the Figma design straight out of VIVAT_SOURCES/canvas.fig.
//
// Why this exists: the Figma MCP server needs the file shared with the
// authenticated account, and it is not (it answers "you don't have edit access"
// for every node). The .fig export in VIVAT_SOURCES/ is the same document, so
// we read it locally instead — no auth, no rate limits, no drift between what
// the tool returns and what was handed over.
//
// Format: "fig-kiwi" + uint32 version, then length-prefixed blocks. Block 0 is
// the kiwi schema (raw deflate), block 1 is the document (ZSTD — older exports
// used deflate here, which is why generic .fig parsers fail on this file).
// Node's zlib covers both, so `kiwi-schema` is the only dependency.
//
// Usage:
//   node scripts/fig.mjs find <regex> [TYPE]   search layer names
//   node scripts/fig.mjs tree <id> [depth]     dump a subtree (follows instances)
//   node scripts/fig.mjs node <id>             one node: parent, siblings, raw keys
//   node scripts/fig.mjs raw  <id> [k1,k2]     raw JSON for a node
//   node scripts/fig.mjs index --rebuild       force a cache rebuild
//
// ids accept either "1968:71551" or the "1968-71551" form Figma URLs use.

import { compileSchema, decodeBinarySchema } from "kiwi-schema";
import zlib from "node:zlib";
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIG = resolve(ROOT, "VIVAT_SOURCES/canvas.fig");
// Sits next to the .fig, so it is covered by the VIVAT_SOURCES/ gitignore.
const CACHE = resolve(ROOT, "VIVAT_SOURCES/canvas.index.json");

// ---- decode -----------------------------------------------------------------

function decodeFig() {
  const buf = readFileSync(FIG);
  const prelude = buf.subarray(0, 8).toString();
  if (prelude !== "fig-kiwi") throw new Error(`not a .fig archive: ${prelude}`);

  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const blocks = [];
  let off = 12; // prelude + version
  while (off + 4 <= buf.length) {
    const size = dv.getUint32(off, true);
    off += 4;
    blocks.push(buf.subarray(off, off + size));
    off += size;
  }

  const schema = compileSchema(decodeBinarySchema(zlib.inflateRawSync(blocks[0])));
  return schema.decodeMessage(inflateBody(blocks[1])).nodeChanges || [];
}

// ZSTD in current exports, raw deflate in older ones.
function inflateBody(block) {
  const zstd = block[0] === 0x28 && block[1] === 0xb5 && block[2] === 0x2f;
  return zstd ? zlib.zstdDecompressSync(block) : zlib.inflateRawSync(block);
}

// ---- slim index -------------------------------------------------------------
// The decoded document is ~70MB and holds far more per node than any layout
// question needs. This keeps the fields we actually read.

const gid = (g) => (g ? `${g.sessionID}:${g.localID}` : null);
const hex = (c) =>
  c
    ? "#" +
      [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")
    : null;

function slim(n) {
  const t = n.transform;
  const rotated = t && (t.m01 !== 0 || t.m10 !== 0 || t.m00 !== 1 || t.m11 !== 1);
  return {
    id: gid(n.guid),
    name: n.name ?? null,
    type: n.type ?? null,
    parent: gid(n.parentIndex?.guid),
    order: n.parentIndex?.position ?? "",
    symbol: gid(n.symbolData?.symbolID),
    w: n.size ? +n.size.x.toFixed(2) : null,
    h: n.size ? +n.size.y.toFixed(2) : null,
    x: t ? +t.m02.toFixed(2) : null,
    y: t ? +t.m12.toFixed(2) : null,
    // Only carried when it is not the identity — rotation/mirroring matters for
    // deriving motion, and most nodes have none.
    m: rotated ? [t.m00, t.m01, t.m10, t.m11].map((v) => +v.toFixed(4)) : null,
    fills: (n.fillPaints || [])
      .filter((p) => p.visible !== false)
      .map((p) => ({
        type: p.type,
        color: p.type === "SOLID" ? hex(p.color) : null,
        opacity: p.opacity != null ? +p.opacity.toFixed(3) : 1,
      })),
    radius: n.cornerRadius ?? null,
    opacity: n.opacity != null && n.opacity !== 1 ? +n.opacity.toFixed(3) : null,
    text: n.textData?.characters ?? null,
    stack: n.stackMode
      ? {
          mode: n.stackMode,
          gap: n.stackSpacing ?? 0,
          padH: n.stackHorizontalPadding ?? 0,
          padV: n.stackVerticalPadding ?? 0,
          align: n.stackPrimaryAlignItems ?? null,
        }
      : null,
  };
}

function build() {
  const nodes = decodeFig().map(slim);
  writeFileSync(CACHE, JSON.stringify({ builtFrom: statSync(FIG).mtimeMs, nodes }));
  return nodes;
}

function load({ rebuild = false } = {}) {
  if (!rebuild && existsSync(CACHE)) {
    try {
      const c = JSON.parse(readFileSync(CACHE, "utf8"));
      if (c.builtFrom === statSync(FIG).mtimeMs) return index(c.nodes);
    } catch {
      /* corrupt or stale cache — fall through and rebuild */
    }
  }
  return index(build());
}

function index(nodes) {
  const byId = new Map();
  const kids = new Map();
  for (const n of nodes) if (n.id) byId.set(n.id, n);
  for (const n of nodes) {
    if (!n.parent) continue;
    if (!kids.has(n.parent)) kids.set(n.parent, []);
    kids.get(n.parent).push(n);
  }
  for (const arr of kids.values()) arr.sort((a, b) => String(a.order).localeCompare(String(b.order)));
  return { nodes, byId, kids };
}

// ---- formatting -------------------------------------------------------------

const norm = (id) => id.replace("-", ":");

function describe(n) {
  const size = n.w != null ? `${n.w}x${n.h}` : "";
  const at = n.x != null ? ` @${n.x},${n.y}` : "";
  const rot = n.m ? ` m=[${n.m.join(" ")}]` : "";
  const fill = n.fills.length
    ? ` fill=${n.fills.map((f) => (f.color || f.type) + (f.opacity !== 1 ? `/${f.opacity}` : "")).join(",")}`
    : "";
  const r = n.radius != null ? ` r=${n.radius}` : "";
  const op = n.opacity != null ? ` opacity=${n.opacity}` : "";
  const st = n.stack
    ? ` [${n.stack.mode} gap=${n.stack.gap} padH=${n.stack.padH} padV=${n.stack.padV}${
        n.stack.align ? ` align=${n.stack.align}` : ""
      }]`
    : "";
  const tx = n.text ? ` ${JSON.stringify(n.text.slice(0, 48))}` : "";
  return `${n.id} <${n.type}> ${n.name}${size ? " " + size : ""}${at}${rot}${fill}${r}${op}${st}${tx}`;
}

// An INSTANCE has no children of its own — its content lives on the master
// component, so walking one means hopping to symbolID. `seen` stops a component
// that contains itself from recursing forever.
function walk({ byId, kids }, id, depth, maxDepth, seen) {
  const node = byId.get(id);
  let key = id;
  if (node?.symbol) {
    if (seen.has(node.symbol)) return;
    seen.add(node.symbol);
    key = node.symbol;
  }
  for (const c of kids.get(key) || []) {
    console.log("  ".repeat(depth) + describe(c));
    if (depth < maxDepth) walk({ byId, kids }, c.id, depth + 1, maxDepth, seen);
  }
}

// ---- commands ---------------------------------------------------------------

const [cmd, ...args] = process.argv.slice(2);

if (cmd === "index") {
  const { nodes } = load({ rebuild: args.includes("--rebuild") });
  console.log(`${nodes.length} nodes indexed → ${CACHE}`);
} else if (cmd === "find") {
  const { nodes, byId } = load();
  const re = new RegExp(args[0], "i");
  const type = args[1];
  let hits = 0;
  for (const n of nodes) {
    if (!n.name || !re.test(n.name)) continue;
    if (type && n.type !== type) continue;
    const p = n.parent ? byId.get(n.parent) : null;
    console.log(`${describe(n)}   ← parent "${p?.name ?? "?"}"`);
    if (++hits >= 200) {
      console.log("… truncated at 200");
      break;
    }
  }
  if (!hits) console.log("no matches");
} else if (cmd === "tree") {
  const doc = load();
  const id = norm(args[0]);
  const n = doc.byId.get(id);
  if (!n) throw new Error(`no such node: ${id}`);
  console.log(describe(n));
  walk(doc, id, 1, Number(args[1] ?? 3), new Set());
} else if (cmd === "node") {
  const { byId, kids } = load();
  const id = norm(args[0]);
  const n = byId.get(id);
  if (!n) throw new Error(`no such node: ${id}`);
  console.log(describe(n));
  const p = n.parent ? byId.get(n.parent) : null;
  console.log(`parent:  ${p ? describe(p) : "none"}`);
  if (n.symbol) console.log(`symbol:  ${describe(byId.get(n.symbol)) ?? n.symbol}`);
  if (p) {
    console.log("siblings:");
    for (const s of kids.get(p.id) || []) console.log(`  ${describe(s)}`);
  }
} else if (cmd === "raw") {
  // Full fidelity, straight from the .fig — for the rare field the index drops.
  const id = norm(args[0]);
  const want = args[1]?.split(",");
  const n = decodeFig().find((x) => gid(x.guid) === id);
  if (!n) throw new Error(`no such node: ${id}`);
  const out = want ? Object.fromEntries(want.map((k) => [k, n[k]])) : n;
  console.log(JSON.stringify(out, (k, v) => (typeof v === "bigint" ? String(v) : v), 2));
} else {
  console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 22).join("\n"));
  process.exit(cmd ? 1 : 0);
}
