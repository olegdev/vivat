import { chromium } from "playwright";
import { resolve } from "node:path";
const [name] = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
await p.goto(`file://${resolve("dist/pages/dealer/main.html")}`);
await p.waitForTimeout(300);
await p.evaluate((n) => document.querySelector(`[data-modal="${n}"]`).classList.add("is-open"), name);
const root = p.locator(`[data-modal="${name}"] [data-modal-panel]`);
const top = (await root.boundingBox()).y;
for (const sel of ["h2", "input", "button[type=submit]", "label", "p"]) {
  for (const [i, el] of (await root.locator(sel).all()).entries()) {
    const bx = await el.boundingBox();
    if (bx) console.log(`${sel}#${i}  y=${Math.round(bx.y - top)}  h=${Math.round(bx.height)}`);
  }
}
console.log("панель h =", Math.round((await root.boundingBox()).height));
await b.close();
