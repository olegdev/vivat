// Справочная таблица — Figma `table-block` (1167:74253).
//
// Разметка живёт в partials/data-table.html двумя <template> (блок и строка) —
// будущие вложенные @foreach; этот файл только клонирует и наполняет.

const clone = (sel) => document.querySelector(sel).content.cloneNode(true);

// Строка бывает парой [элемент, описание] либо объектом { label, sub } —
// элементом с вложенной таблицей, у которой свои две колонки.
// `stripe` — сквозной счётчик строк блока: подстроки продолжают нумерацию
// родительских, поэтому фон нельзя отдать `odd:`/`even:` на контейнере.
const shade = (el, i) => {
  el.classList.add(i % 2 ? "bg-bg-subtle" : "bg-bg-page");
  return el;
};

function buildRow(r, stripe) {
  if (Array.isArray(r)) {
    const row = clone("[data-table-row]").firstElementChild;
    row.querySelector("[data-td-1]").textContent = r[0];
    row.querySelector("[data-td-2]").textContent = r[1];
    return shade(row, stripe.i++);
  }
  const row = clone("[data-table-row-nested]").firstElementChild;
  row.querySelector("[data-td-label]").textContent = r.label;
  row.querySelector("[data-td-sub]").replaceChildren(
    ...r.sub.map((s) => {
      const sub = clone("[data-table-subrow]").firstElementChild;
      sub.querySelector("[data-sub-1]").textContent = s[0];
      sub.querySelector("[data-sub-2]").textContent = s[1];
      return shade(sub, stripe.i++);
    })
  );
  return row;
}

// Один блок. `block`: { head: [string, string], rows: [[string, string], …] }
function buildBlock(block) {
  const node = clone("[data-table-block]").firstElementChild;
  node.querySelector("[data-th-1]").textContent = block.head[0];
  node.querySelector("[data-th-2]").textContent = block.head[1];
  const stripe = { i: 0 };
  node.querySelector("[data-table-rows]").replaceChildren(
    ...block.rows.map((r) => buildRow(r, stripe))
  );
  return node;
}

export function renderDataTable(el, blocks) {
  if (!el) return;
  el.replaceChildren(...blocks.map(buildBlock));
}
