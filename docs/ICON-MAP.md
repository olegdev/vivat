# Карта иконок: файл → символ Figma

Мост для `npm run audit:icons`: по нему аудит узнаёт, какой символ набора
`service-icons` должен стоять за каждым нашим SVG, и сверяет с тем, что кадр
отрисовывает в блоке (`node scripts/fig.mjs icons <id>`).

Зачем карта, а не сравнение картинок: экспорт `.fig` не отдаёт геометрию
пути (`commandsBlob`), зато отдаёт ИМЯ ВАРИАНТА — `size=24 Thin, name=print,
color=secondary`. Иконка «той же» формы другой толщины — другой символ и
другой файл; печать и «поделиться» в строке «Выбрать все» так и стояли из
Bold при Thin в кадре (2029:156849/156850) — залитые кружки и обводка 2.

Один файл может закрывать несколько символов, если разница — только цвет, а
цвет даёт CSS (`opacity-60`, `brightness(0) invert(1)`): тогда в колонке
символа через пробел перечисляются все id, которые этот файл вправе изображать.

Строка добавляется, когда символ ПОДТВЕРЖДЁН: `fig.mjs icons` на блоке кадра
показал вариант, и файл выгружен именно из него. Файл без строки аудит печатает
как «не в карте» — это приглашение проверить и дописать, а не ошибка.

| файл | символ | вариант | где подтверждено |
|---|---|---|---|
| `header/icon-pin-20.svg` | 2214:190765 2214:190771 | pin 20 dark; secondary — тот же файл под `opacity-60` | «Москва» в мобильной шапке 2248:110194; бар CTA 2483:246944 |
| `header/icon-arrow-right-light.svg` | 2214:190546 | arrow-right 20 light | кнопка «Личный кабинет» в меню 2483:194640 |
| `header/icon-burger-bold.svg` | 960:37182 | burger 24 Bold dark | шапка планшета 2483:238825 |
| `header/icon-search-dark.svg` | 960:37194 | search 24 Bold dark | шапка планшета 2483:238825 |
| `header/icon-close-s.svg` | 963:37212 | close-s 24 Bold dark | шапка меню 2483:196822 |
| `header/chevron-left.svg` | 962:37188 | chevron-left 24 Bold dark | шапка меню 2483:196822 |
| `header/chevron-right-s.svg` | 961:37182 | chevron-right 24 Bold dark | строки меню 2483:194632 |
| `order/icon-print.svg` | 2225:169315 | print 24 Thin secondary | строка «Выбрать все» 2029:156848 |
| `order/icon-share.svg` | 2214:190927 | share 24 Thin secondary | строка «Выбрать все» 2029:156848 |
| `pdp/icon-warning.svg` | 980:49774 | info 16 secondary | извещение в сводке 2483:243566 |
| `header/icon-pin.svg` | 960:37188 | pin 16 dark | «Москва» в шапке планшета 2477:180973 (символ 16 — это холст 24 в окне 16, отсюда `size-6 -m-1`) |
| `header/icon-arrow-right.svg` | 961:37191 | arrow-right 16 dark | «Войти в режим дилера» 2477:180979 |
| `header/icon-profile.svg` | 1742:55344 | profile 24 Bold dark | шапка планшета 2477:181416 |
| `header/icon-burger.svg` | 585:27301 | burger 24 Bold light | «Весь каталог» в шапке 1440 2248:97192 |
| `header/icon-search.svg` | 964:37194 | search 24 Bold muted | поле поиска в шапке 1440 2248:97192 |
| `header/icon-order-dark.svg` | 960:37179 585:54882 | order 24 Bold dark; light — тот же файл под `brightness(0) invert(1)` в нажатой корзине | корзина в шапке 1440 2248:97192; страница заказа 942:110180 |
| `pdp/icon-share.svg` | 963:37182 | share 24 Bold dark | заголовок сводки 2238:153498 |
| `pdp/icon-warning-dark.svg` | 962:37179 | info 16 dark | ссылка «Получить оптовую цену» в сводке модуля ниже `xl` 2488:136072 |
| `header/arrow-right-24.svg` | 2214:190537 | arrow-right 24 Thin dark | пилюля большой плитки категорий 1003:157502 |
| `header/arrow-right-20.svg` | 2214:190549 | arrow-right 20 dark | пилюли плиток категорий 1003:157538, планшет 2477:166905 |
| `header/icon-pagination-left.svg` | 966:37194 | arrow-left 24 Bold muted | пагинация, «В начало» 758:56943 |
| `header/icon-pagination-right.svg` | 962:37191 | arrow-right 24 Bold dark | пагинация, «В конец» 758:56959 |
