# Карта Figma: секции `dealer` и `B2b additional`

**Что это.** Полный перечень фреймов двух b2b-секций макета с node-id, ссылками
и разбором, что из них уже свёрстано, а что нет. Составлено обходом локального
экспорта (`scripts/fig.mjs`), не на глаз.

**Зачем.** Дилерская часть — это ~50 фреймов в двух секциях, и половина из них
называется просто `catalog` или `menu`. Без карты каждая новая сессия заново
тратит время на то, чтобы понять, какой фрейм чему соответствует и где вообще
мобильная версия. Здесь это уже разобрано.

**Когда обновлять.** Снапшот `VIVAT_SOURCES/canvas.fig` от **2026-07-28**. Если
дизайнер добавил фреймы позже — переэкспортировать, `node scripts/fig.mjs index
--rebuild`, и обновить таблицы ниже. Живая Figma всегда важнее снапшота.

**Ссылки** ведут в канонический файл `t7qJcR7KNgLigitQwv3V5T` (см. CLAUDE.md).
Node-id не меняются между копиями, поэтому те же id открываются и в копии
`odPx3t2xUNTnIx09J9DpIS`, по которой ходит заказчик.

---

## Как читать секцию самому

```bash
node scripts/fig.mjs tree <section-id> 2      # фреймы секции + их блоки
node scripts/fig.mjs node <id>                # родитель, соседи, мастер-компонент
node scripts/fig.mjs raw  <id>                # symbolOverrides — реальные тексты инстанса
```

Два приёма, без которых секция не читается:

- **Пары «десктоп → мобилка» определяются по X-координате, а не по имени.**
  Дизайнер кладёт 360-фрейм справа от его 1440-родителя. Имена при этом не
  значат ничего: почти все мобильные фреймы называются `catalog` или `menu`.
  Сортировка детей секции по `x` восстанавливает пары однозначно.
- **`tree` показывает копию мастер-компонента, а не то, что видно на экране.**
  Тексты инстанса лежат в `symbolOverrides` — их достаёт только `raw`. Из-за
  этого `tree` на двух разных блоках выдаёт одинаковый текст мастера
  («Популярные товары для кухни»), и это не ошибка экспорта.

---

## Секция `dealer` — [882:90262](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=882-90262)

Полноценный параллельный b2b-сайт: те же страницы, что у покупателя, но со
своей шапкой, подвалом и ценами.

| X | Экран | 1440 | 360 |
|---|---|---|---|
| 360 | **Главная** | [882:107882](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=882-107882) | — |
| 1918 | Мега-меню каталога, 1 колонка | [953:121639](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=953-121639) | — |
| 3446 | Мега-меню каталога, 3 колонки | [953:121756](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=953-121756) | — |
| 5053 | **Каталог** | [953:121911](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=953-121911) | [2225:160540](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2225-160540) |
| 6935 | Каталог: меню (моб.) | — | [2225:163666](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2225-163666) |
| 7328 | Каталог: меню (моб.) | — | [2225:164865](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2225-164865) |
| 7889 | Каталог: все фильтры | [953:121956](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=953-121956) | — |
| 9462 | Каталог: один фильтр | [953:122063](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=953-122063) | — |
| 10997 | Каталог: выбранные параметры | [953:122135](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=953-122135) | — |
| 12484 | **PDP** | [953:122180](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=953-122180) | — |
| 13989 | PDP: панель «Модули» | [1686:59341](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1686-59341) | — |
| 15521 | PDP: панель «Документы» | [1686:59383](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1686-59383) | — |
| 17239 | **Заказ** | [1209:95219](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1209-95219) | [2225:202954](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2225-202954) |
| 18771 | **Заказ: b2b-доставка** | [1415:67609](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1415-67609) | [2225:167283](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2225-167283) |
| 20695 | Заказ: меню (моб.) | — | [2225:201034](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2225-201034) |
| 21597 | Заказ: подтверждение (моб.) | — | [2238:157458](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2238-157458) |

Мобильных фреймов **нет** у: главной, мега-меню на 1440, трёх состояний
фильтров каталога, PDP и обеих его панелей.

---

## Секция `B2b additional` — [1334:57242](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1334-57242)

Контентные страницы дилерского раздела — то, куда ведут ссылки из дилерского
подвала («Полезная информация», «Для бизнеса», «Компания»).

### Страницы

| X | Страница | 1440 | 360 |
|---|---|---|---|
| 2617 | Контакты | [1415:68377](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1415-68377) | [2225:104774](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2225-104774) |
| 4704 | Доставка | [1167:79692](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1167-79692) | [2225:132262](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2225-132262) |
| 7023 | Для интернет-магазинов | [1167:74233](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1167-74233) | [2209:104247](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2209-104247) + меню [2209:213627](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2209-213627) |
| 9808 | Как с нами работать | [1167:98333](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1167-98333) | [2241:161193](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2241-161193) |
| 12242 | Схемы сборки (свёрнуто) | [1463:60735](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1463-60735) | [2241:163440](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2241-163440) |
| 14199 | Схемы сборки (развёрнуто) | [1463:63542](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1463-63542) | [2241:164062](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2241-164062) |
| 16219 | Сертификаты | [1463:60803](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1463-60803) | [2241:164857](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2241-164857) |
| 18390 | Техническая информация | [1463:60856](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1463-60856) | **—** |
| 19894 | Методические пособия | [1488:127306](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1488-127306) | [2241:186252](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2241-186252) |
| 22091 | Методические пособия (2) | [1488:69674](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1488-69674) | [2241:187453](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2241-187453) |
| 24484 | Новости | [1463:67081](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1463-67081) | [2241:188212](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2241-188212) |
| 27210 | Каталог (вариант) | [2338:254259](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2338-254259) | [2338:254303](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2338-254303) |

Все контентные страницы устроены одинаково: `site-header` → `breadcrumbs` →
`general-container` / `main container` → `group` (блок «Производство») →
подвал. То есть это один шаблон с разным содержимым центральной колонки.

### Модальные окна (левая колонка, X = 134)

Все четыре нарисованы поверх каталога и в дереве выглядят одинаково
(`modal-window` = страница + затемнение `#141414/0.9`). **Сама панель в
снапшоте отсутствует** — опознаны по мобильным двойникам.

| Окно | 1440 | 360 |
|---|---|---|
| «Стать дилером» — форма заявки | [1003:160435](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1003-160435) | [2209:213755](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2209-213755) |
| «Войти в режим дилера» — вход по паролю | [1003:166631](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1003-166631) | [2209:216011](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2209-216011) |
| «Подписаться на новости» | [1003:169259](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1003-169259) | [2225:96576](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2225-96576) |
| `mail` — «Сообщение директору» | [1534:65836](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=1534-65836) | [2225:97387](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2225-97387), [2225:98292](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=2225-98292) |

Десктопные панели этих окон нужно смотреть **в живой Figma** — в экспорте от
28.07.2026 их нет.

---

## Дилерская главная: разбор по блокам

[882:107882](https://www.figma.com/design/t7qJcR7KNgLigitQwv3V5T/VIVAT?node-id=882-107882), 1440×7496. Сверху вниз, с реальными текстами (из `raw`) и с тем,
что из этого уже есть в проекте.

| Y | Блок | Node | Что переиспользуем |
|---|---|---|---|
| 0 | `site-header` | 882:107883 | `partials/header.html` + **новая** тёмная дилерская полоса |
| 116 | `alert` «Обращаем внимание… 22.07.2026…» | 882:107884 | есть инлайном в `customer/main.html` → вынести в партиал |
| 156 | `banner` — герой | 882:107885 | `partials/hero.html` **как есть** (тот же мастер 607:29214, те же слайды) |
| 836 | `categor` — 7 плиток | 1968:246031 | разметка плиток из `customer/main.html` **как есть** |
| 1634 | H2 «Модульные кухни. Хиты продаж» | 882:107937 | `carousel-section` + `product-card` |
| 2262 | H2 «Популярные товары для кухни» + `segments` | 1620:83158 | `carousel-section` + **новый** сегмент-контрол |
| 2993 | «А как вам вот такое» / «Все акции» | 882:107944 | `partials/promo-card.html` |
| 3658 | `CN-container` — соцсети | 1463:67034 | блок соцсетей с главной |
| 3974 | H2 «Акции и скидки» / «В каталог» | 882:107967 | `carousel-section` |
| 4615 | H2 «Новости» / «Все новости» | 882:109467 | **новая** карточка `news-item` 436×263 |
| 5122 | `map-general` «Наши салоны» | 882:107971 | `partials/stores.html` + **новый** фон `surface-accent` `#f8bb92` |
| 6074 | `group` — «Производство» | 882:107975 | разметка с главной **как есть** |
| 6916 | подвал, `user=Dealer` | 1058:177159 | `partials/footer.html` + **новый** набор колонок |

**Мега-меню — это уже свёрстанный компонент.** Два фрейма `menu` (953:121639 и
953:121756) — не два экрана, а два состояния одного меню: открыта одна колонка
и открыты три. Структура (3 колонки по 300px + затемнение) совпадает с
`partials/catalog-menu.html`, а переключение колонок уже умеет
`components/catalog-menu.js`. Отдельной вёрстки не требуют.

**Токены под новые цвета уже есть:** `surface-accent` = `#f8bb92` (фон блока
салонов), `surface-accent-subtle` = `#ffd6b9` (полоса alert).

Итого действительно нового на этой странице пять вещей: дилерская полоса в
шапке, сегмент-контрол, карточка новости, колонки дилерского подвала и
дилерский вариант подвала/шапки как таковой. Остальное — сборка из готового.

---

## Вопросы к дизайнеру

1. **Мобильной дилерской главной нет.** 360-фрейма для 882:107882 в макете не
   существует. Все страницы проекта сделаны на двух ширинах — нужен фрейм, либо
   решение «дилерская главная только 1440».
2. **Мобильного PDP для дилера нет** (953:122180 и панели 1686:59341 /
   1686:59383) — при том, что у покупателя мобильный PDP нарисован.
3. **Нет 360 у трёх состояний фильтров каталога** (953:121956, 953:122063,
   953:122135) и у страницы «Техническая информация» (1463:60856).
4. **Тумблер «Показывать цену»** в тёмной полосе шапки (604:24654) — прототипа
   на нём нет. Должен ли он реально скрывать цены в карточках, и запоминается
   ли выбор между страницами?
5. **Десктопные панели четырёх модальных окон** не читаются из экспорта —
   подтвердить, что они есть в живом файле.
6. **Два фрейма «Методические пособия»** (1488:127306 и 1488:69674) — это два
   состояния одной страницы или две разные?
