// Справочная таблица — Figma `table-block` (1167:74253).
//
// Разметка живёт в partials/data-table.html двумя <template> (блок и строка) —
// будущие вложенные @foreach; этот файл только клонирует и наполняет.

const clone = (sel) => document.querySelector(sel).content.cloneNode(true);

// Строка бывает парой [элемент, описание] либо объектом { label, sub } —
// элементом с вложенной таблицей, у которой свои две колонки.
//
// `stripe` — счётчик строк блока, и **строка с вложенной таблицей считается
// одной**: её метка красится в цвет строки, подстроки продолжают чередование
// от него, а следующая строка блока идёт так, будто вложенной таблицы не было
// (1167:74289: id белая, title серая, parent_id белая, pictures серая, position
// снова белая). Отсюда и невозможность отдать фон `odd:`/`even:` контейнеру.
const shade = (el, i) => {
  el.classList.add(i % 2 ? "bg-bg-subtle" : "bg-bg-page");
  return el;
};

function buildRow(r, stripe) {
  const i = stripe.i++;

  if (Array.isArray(r)) {
    const row = clone("[data-table-row]").firstElementChild;
    row.querySelector("[data-td-1]").textContent = r[0];
    row.querySelector("[data-td-2]").textContent = r[1];
    return shade(row, i);
  }

  const row = clone("[data-table-row-nested]").firstElementChild;
  const label = row.querySelector("[data-td-label]");
  label.textContent = r.label;
  shade(label, i);
  row.querySelector("[data-td-sub]").replaceChildren(
    ...r.sub.map((s, k) => {
      const sub = clone("[data-table-subrow]").firstElementChild;
      sub.querySelector("[data-sub-1]").textContent = s[0];
      sub.querySelector("[data-sub-2]").textContent = s[1];
      return shade(sub, i + k);
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
