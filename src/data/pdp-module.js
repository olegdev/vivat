// Фикстуры страницы модуля — Figma `PDP module` 2488:127146 (1440),
// 2488:136015 (768), 2488:128722 (360).
//
// Это не состояние кухонной PDP, а более короткая страница: одно фото вместо
// трёх, своя сводка без цены и ровно один рельс. Общее с кухней — шапка,
// крошки, якорный бар, блок характеристик, зелёная полоса и подвал.
//
// В Blade это запрос; здесь — файл, как и у остальных страниц (CLAUDE.md ›
// фикстуры живут в src/data/).
import { PDP, ICON } from "./asset-base.js";

export const product = {
  title: "Шкаф нижний с 2-мя дверцами Флэт",
  // «Комплектация, мм.» — сегменты 600/800 (2488:130223). Третий сегмент в
  // мастере скрыт, в инстансе его нет.
  packagingLabel: "Комплектация, мм.",
  packaging: [
    { value: "600", label: "600" },
    { value: "800", label: "800" },
  ],
  // Две группы цветов вместо одной: каркас и фасад (2488:130198 / 2488:130165).
  colorGroups: [
    {
      label: "Каркас",
      name: "Цвет Silky White/Silky Light Grey",
      colors: [
        { id: "white", img: `${PDP}/swatch-grey-src.png` },
        { id: "grey", img: `${PDP}/swatch-wood-src.png` },
        { id: "brown", img: `${PDP}/swatch-dark-src.png` },
      ],
    },
    {
      label: "Фасад",
      name: "Цвет Silky White/Silky Light Grey",
      colors: [
        { id: "cashmere", img: `${PDP}/swatch-grey-src.png` },
        { id: "grey", img: `${PDP}/swatch-wood-src.png` },
        { id: "brown", img: `${PDP}/swatch-dark-src.png` },
      ],
    },
  ],
  size: "В*Ш*Г 816 х 800 х 478 мм, материал ЛДСП",
  // Цены на этой странице нет вовсе: под кнопкой стоит ссылка «Получить
  // оптовую цену» (2488:130340).
  cta: "Сформировать заказ",
  notice: "Получить оптовую цену",
  photo: `${PDP}/module-base-2door-src.png`,
  photoAlt: "Шкаф нижний с 2-мя дверцами Флэт",
};

// Таблица характеристик своей копии в макете не получила: инстанс
// (2488:127165) переопределяет три ячейки из двадцати, остальное — филлер
// кухонной таблицы. Берём её же; вопрос записан в BACKLOG.md.
export const specs = [
  [
    { label: "Размер (В*Ш*Г), мм:", value: "2140*1100*600" },
    { label: "Цвет каркасов:", value: "Белый" },
    { label: "Материал каркасов:", value: "ЛДСП" },
    { label: "Цвет фасадов:", value: "Angel/Gallant" },
    { label: "Материал фасадов:", value: "ЛДСП" },
  ],
  [
    { label: "Толщина кромки, мм:", value: "38" },
    { label: "Масса брутто, кг:", value: "123.79" },
    { label: "Объем, куб.м:", value: "0.2131" },
  ],
];

export const alert = "Внимание! Ручка в комплект не входит.";

export const railTitle =
  "Модули композиции «Шкаф нижний с 2-мя дверцами Флэт Cashmere In 2S»";
export const railAction = "Все модули Фьюжн";

// Карточки рельса — `cards-modul` (1968:189601). Во фрейме их две: каркас с
// ценой и фасад без неё.
export const modules = [
  {
    id: "mod-frame-600",
    price: "43 335₽",
    title: "Каркас нижнего шкафа Н 600",
    spec: { label: "Размер (В*Ш*Г), мм:", value: "816*500*480" },
    image: `${PDP}/module-base-3drawer-src.png`,
  },
  {
    id: "mod-fg-70-30",
    price: "ФГ Флэт 70.30",
    title: "Фасад нижний с 1-ой дверцей Фьюжн",
    spec: { label: "Размер (В*Ш*Г), мм:", value: "816*500*480" },
    image: `${PDP}/module-wall-1door-src.png`,
  },
];

export const iconBase = ICON;
