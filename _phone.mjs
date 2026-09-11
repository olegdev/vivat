import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://127.0.0.1:8899/pages/customer/main.html');
await p.waitForTimeout(500);
await p.evaluate(() => document.querySelector("[data-modal=\"dealer-request\"]").classList.add("is-open"));
await p.waitForTimeout(300);
const inp = '[data-modal="dealer-request"] input[type=tel]';
console.log('плейсхолдер:', await p.getAttribute(inp, 'placeholder'));
for (const t of ['9', '99912', '89991234567', '+7 (912) 345-67-89', 'abc912']) {
  await p.fill(inp, '');
  await p.type(inp, t, { delay: 5 });
  console.log(JSON.stringify(t).padEnd(22), '→', JSON.stringify(await p.inputValue(inp)));
}
await b.close();
