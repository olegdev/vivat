import { chromium } from "playwright";
import { resolve } from "node:path";
const [name] = process.argv.slice(2);
const b = await chromium.launch();
for (const w of [1440, 360]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 1000 } });
  const p = await ctx.newPage();
  await p.goto(`file://${resolve("dist/pages/dealer/main.html")}`);
  await p.waitForTimeout(300);
  await p.evaluate((n) => document.querySelector(`[data-modal="${n}"]`).classList.add("is-open"), name);
  const box = await p.locator(`[data-modal="${name}"] [data-modal-panel]`).boundingBox();
  console.log(name, w, `панель ${Math.round(box.width)}×${Math.round(box.height)}`);
  await p.locator(`[data-modal="${name}"] [data-modal-panel]`).screenshot({ path: `.shots/modal-${name}-${w}.png` });
  await ctx.close();
}
await b.close();
