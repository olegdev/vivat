import { chromium } from "playwright";
import { resolve } from "node:path";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto(`file://${resolve("dist/pages/dealer/main.html")}`);
await p.waitForTimeout(400);
const vis = (n) => p.locator(`[data-modal="${n}"]`).isVisible();
const openIt = (n) => p.evaluate((x) => document.querySelector(`[data-modal="${x}"]`).classList.add("is-open"), n);

await openIt("dealer-login");
console.log("вход открыт:", await vis("dealer-login"));
await p.locator('[data-modal="dealer-login"] [data-modal-open="dealer-request"]').click();
console.log("передал управление заявке:", await vis("dealer-request"), "| вход закрыт:", !(await vis("dealer-login")));
await p.keyboard.press("Escape");
console.log("Esc закрыл:", !(await vis("dealer-request")));

await openIt("subscribe");
await p.locator('[data-modal="subscribe"] [data-modal-close]').click();
console.log("крестик закрыл:", !(await vis("subscribe")));

await openIt("director");
await p.mouse.click(30, 30);
console.log("клик мимо панели закрыл:", !(await vis("director")));

await openIt("director");
await p.locator('[data-modal="director"] [type=submit]').click();
console.log("пустая форма не закрылась:", await vis("director"));
await p.fill('[data-modal="director"] [name=name]', "Иван");
await p.fill('[data-modal="director"] [name=phone]', "+79990000000");
await p.fill('[data-modal="director"] [name=email]', "a@b.ru");
await p.locator('[data-modal="director"] [type=submit]').click();
console.log("заполненная закрылась:", !(await vis("director")));
console.log("скролл разблокирован:", !(await p.evaluate(() => document.body.classList.contains("overflow-hidden"))));
await b.close();
