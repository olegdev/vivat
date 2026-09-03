// Конструктор мебели — встроенное приложение o3d.ru.
//
// Своего фрейма в макете нет: страницу заказал клиент под пункт «Конструктор»,
// который в дилерской шапке был с самого начала и никуда не вёл.
//
// ШОВ. Адрес приложения собирает бэкенд: `session` — токен сеанса, `region` и
// `city` — регион и город пользователя (тот же выбор, что и в шапке),
// `domainBasket` — адрес корзины, куда конструктор возвращает состав. Здесь он
// лежит целиком как фикстура; в Blade это конфиг и параметры запроса, а не
// константа — см. BACKLOG.
export const CONSTRUCTOR_SRC =
  "https://mirror.o3d.ru/app/app_vivat.php" +
  "?session=gOJkKovGCTkEUX5bBN2Hgeo3stBQy5d1hEW9uZlq" +
  "&region=d0" +
  "&city=11216a2c-550c-11ed-8bd7-00155d021f00" +
  "&domainBasket=https%3A%2F%2Fmebel.com%2Fconstructor%2Fcart";

// Оффлайн-версия конструктора — ссылка с живого сайта клиента.
export const CONSTRUCTOR_DOWNLOAD = "https://mebel.com/constructor/download?rand=9241";
