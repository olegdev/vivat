// Mock dealer network — 10 points around Moscow, shared by every page that
// mounts the stores block (the home page's "Наши салоны" and the PDP's "Где
// купить"). `coords` is [lon, lat], the order ymaps3 expects; `brand: true` =
// own VIVAT store, false = dealer centre, which is what the "Только фирменные
// магазины" toggle filters on.
//
// In the Blade build this is a query, not a file — it lives here so the two
// pages read the same fixture instead of keeping two copies of it.
export const stores = [
  {
    name: "Фирменный магазин VIVAT",
    brand: true,
    address: "16-й км МКАД, 50 метров от внешней стороны, ул. Энергетиков, д. 22, корп. 3",
    metro: ["Жулебино", "Котельники"],
    coords: [37.8567, 55.6588],
    hours: "Ежедневно, 10:00 — 21:00",
    phone: "+7 (495) 120-45-01",
  },
  {
    name: "Фирменный магазин VIVAT",
    brand: true,
    address: "г. Химки, Ленинградское ш., 5, ТЦ «Гранд», 2-й этаж",
    metro: ["Планерная"],
    coords: [37.4102, 55.8792],
    hours: "Ежедневно, 10:00 — 22:00",
    phone: "+7 (495) 120-45-02",
  },
  {
    name: "Фирменный магазин VIVAT",
    brand: true,
    address: "Каширское ш., 61Г, ТЦ «Москворечье», 1-й этаж",
    metro: ["Каширская", "Кантемировская"],
    coords: [37.6510, 55.6432],
    hours: "Ежедневно, 10:00 — 21:00",
    phone: "+7 (495) 120-45-03",
  },
  {
    name: "Дилерский центр «Мебель-Град»",
    brand: false,
    address: "Дмитровское ш., 163А, ТЦ «РИО», 3-й этаж",
    metro: ["Алтуфьево"],
    coords: [37.5661, 55.8891],
    hours: "Пн — Вс, 10:00 — 22:00",
    phone: "+7 (495) 771-16-40",
  },
  {
    name: "Фирменный магазин VIVAT",
    brand: true,
    address: "Ленинградское ш., 16А, стр. 4, БЦ «Метрополис»",
    metro: ["Войковская", "Сокол"],
    coords: [37.4991, 55.8199],
    hours: "Ежедневно, 10:00 — 21:00",
    phone: "+7 (495) 120-45-05",
  },
  {
    name: "Дилерский центр «Кухни Плюс»",
    brand: false,
    address: "ул. Профсоюзная, 61А, ТЦ «Калужский», 4-й этаж",
    metro: ["Новые Черёмушки"],
    coords: [37.5405, 55.6708],
    hours: "Пн — Сб, 10:00 — 21:00 · Вс, 11:00 — 20:00",
    phone: "+7 (495) 334-72-18",
  },
  {
    name: "Фирменный магазин VIVAT",
    brand: true,
    address: "Варшавское ш., 87Б, ТЦ «Варшавский», 2-й этаж",
    metro: ["Варшавская", "Нагатинская"],
    coords: [37.6180, 55.6620],
    hours: "Ежедневно, 10:00 — 21:00",
    phone: "+7 (495) 120-45-07",
  },
  {
    name: "Дилерский центр «ДомМебель»",
    brand: false,
    address: "Рязанский пр-т, 2, корп. 2, ТЦ «Город», 1-й этаж",
    metro: ["Нижегородская"],
    coords: [37.7350, 55.7280],
    hours: "Пн — Вс, 10:00 — 22:00",
    phone: "+7 (495) 660-09-33",
  },
  {
    name: "Фирменный магазин VIVAT",
    brand: true,
    address: "Новорижское ш., 5-й км, МКЦ «Гранд», павильон 214",
    metro: ["Мякинино"],
    coords: [37.3893, 55.8258],
    hours: "Ежедневно, 10:00 — 21:00",
    phone: "+7 (495) 120-45-09",
  },
  {
    name: "Дилерский центр «Интерьер-Холл»",
    brand: false,
    address: "г. Мытищи, Осташковское ш., 1, ТЦ «Красный Кит», 3-й этаж",
    metro: ["Медведково"],
    coords: [37.7370, 55.9040],
    hours: "Пн — Вс, 10:00 — 21:00",
    phone: "+7 (495) 419-55-06",
  },
];
