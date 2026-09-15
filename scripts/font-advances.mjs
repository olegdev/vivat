// Начертание по ширине глифа. `derivedSymbolData` не хранит вес текста, зато
// у каждого уложенного глифа есть `advance` — ширина в долях кегля. У Onest
// «К» в Regular 0.625, в Medium 0.641, в SemiBold 0.657: по первому глифу
// строки начертание читается однозначно там, где поле `fontName` мастера
// протухло. Таблицы берутся из тех же файлов, что грузит страница
// (Google Fonts, VIVAT_SOURCES/fonts/onest-<вес>.ttf; сборка дизайнера — та
// же, см. SOLUTIONS › «Буквы в пилюле»).
import { readFileSync, existsSync } from "node:fs";

const WEIGHTS = [100, 400, 500, 600];
const fonts = new Map();

function parse(buf) {
  const num = buf.readUInt16BE(4);
  const tabs = {};
  for (let i = 0; i < num; i++) {
    const off = 12 + 16 * i;
    tabs[buf.toString("latin1", off, off + 4)] = { o: buf.readUInt32BE(off + 8), l: buf.readUInt32BE(off + 12) };
  }
  const upm = buf.readUInt16BE(tabs.head.o + 18);
  const nhm = buf.readUInt16BE(tabs.hhea.o + 34);
  const hmtx = tabs.hmtx.o;
  const adv = (g) => buf.readUInt16BE(hmtx + 4 * Math.min(g, nhm - 1));
  // cmap, формат 4
  const cmap = tabs.cmap.o;
  const n = buf.readUInt16BE(cmap + 2);
  let sub = null;
  for (let i = 0; i < n; i++) {
    const off = buf.readUInt32BE(cmap + 8 + 8 * i);
    if (buf.readUInt16BE(cmap + off) === 4) { sub = cmap + off; break; }
  }
  const segX2 = buf.readUInt16BE(sub + 6), seg = segX2 / 2;
  const ends = [], starts = [], deltas = [], ros = [];
  for (let i = 0; i < seg; i++) {
    ends.push(buf.readUInt16BE(sub + 14 + 2 * i));
    starts.push(buf.readUInt16BE(sub + 16 + segX2 + 2 * i));
    deltas.push(buf.readInt16BE(sub + 16 + 2 * segX2 + 2 * i));
    ros.push(buf.readUInt16BE(sub + 16 + 3 * segX2 + 2 * i));
  }
  const roOff = sub + 16 + 3 * segX2;
  const gid = (c) => {
    for (let i = 0; i < seg; i++) {
      if (starts[i] <= c && c <= ends[i]) {
        if (ros[i] === 0) return (c + deltas[i]) & 0xffff;
        const p = roOff + 2 * i + ros[i] + 2 * (c - starts[i]);
        const g = buf.readUInt16BE(p);
        return g ? (g + deltas[i]) & 0xffff : 0;
      }
    }
    return 0;
  };
  return (ch) => adv(gid(ch.codePointAt(0))) / upm;
}

function font(w) {
  if (!fonts.has(w)) {
    const p = `VIVAT_SOURCES/fonts/onest-${w}.ttf`;
    fonts.set(w, existsSync(p) ? parse(readFileSync(p)) : null);
  }
  return fonts.get(w);
}

/** Вес, при котором ширина первого глифа `ch` равна `advance` (доли кегля);
 *  null, если ни один не подошёл (другой шрифт, пробел, нет таблиц). */
export function weightOf(ch, advance) {
  if (!ch || advance == null || /\s/.test(ch)) return null;
  let best = null;
  for (const w of WEIGHTS) {
    const f = font(w);
    if (!f) continue;
    const d = Math.abs(f(ch) - advance);
    if (d < 0.002 && (!best || d < best.d)) best = { w, d };
  }
  return best?.w ?? null;
}
