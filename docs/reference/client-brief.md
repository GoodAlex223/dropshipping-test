# Mirox Shop — Client Brief

**Status**: Verbatim record. Do not edit the quoted blocks — they are the client's (or the
relaying operator's) words, transcribed exactly as they appear in the source.
**Last Updated**: 2026-07-19
**Sources**: Claude Code session transcript
`~/.claude/projects/-workspaces-dropshipping/2565949a-ffa7-4e0c-94fa-10918da7638f.jsonl`:

- Line 44 — list #1, header `ПРОМПТ ДЛЯ СОЗДАНИЯ САЙТА MIROX SHOP`, user message timestamp
  `2026-07-14T09:14:32.636Z`, 6194 chars.
- Line 654 — list #2, header `Mirox Shop — План улучшений сайта`, user message timestamp
  `2026-07-15T07:28:39.480Z`, 1790 chars (170 + 1620 across two text blocks).

**Concept screenshot**: [mirox-concept-screenshot.jpg](mirox-concept-screenshot.jpg) (moved here
from the repo root, where it sat untracked as `photo_2026-07-13_13-23-08.jpg`; it is the image
attached to the line-44 message, referenced there by that former path).

## How to cite this document

Use "client list #1, `<section header>`" or "client list #2, item `<N>`" — this matches usage
already in `docs/planning/TODO.md`, `docs/planning/BACKLOG.md`, and
`docs/superpowers/specs/2026-07-19-task-035-homepage-design.md`. List #2 item numbers are the
client's own numbering (1–20), reproduced exactly as in the source — see the numbering note before
List #2 below.

---

## List #1 — ПРОМПТ ДЛЯ СОЗДАНИЯ САЙТА MIROX SHOP (2026-07-14T09:14:32Z)

> Ниже — готовый профессиональный промпт для нейросети (Lovable, Bolt, v0, Cursor AI, Claude,
> ChatGPT). Он описывает не просто интернет-магазин, а полноценный бренд Mirox Shop с премиальным
> дизайном и высокой конверсией.
>
> ПРОМПТ ДЛЯ СОЗДАНИЯ САЙТА MIROX SHOP

_Translation_: Below is a ready-made professional prompt for a neural network (Lovable, Bolt, v0,
Cursor AI, Claude, ChatGPT). It describes not just an online store, but a complete Mirox Shop
brand with premium design and high conversion. — PROMPT FOR CREATING THE MIROX SHOP WEBSITE

### Главная задача

> Создай уникальный, современный интернет-магазин одежды Mirox Shop, который выглядит на уровне
> Nike, Zara, COS, Farfetch, Represent и Fear of God, но имеет собственный стиль и не копирует их
> дизайн.
>
> Используй логотип Mirox Shop (черный фон, белый логотип) как основу фирменного стиля.
>
> Главная цель — чтобы посетитель захотел купить товар уже в первые 10 секунд пребывания на сайте.

_Translation_: Create a unique, modern Mirox Shop clothing store that looks on par with Nike,
Zara, COS, Farfetch, Represent, and Fear of God, but has its own style and does not copy their
design. Use the Mirox Shop logo (black background, white logo) as the basis of the brand identity.
The main goal is for the visitor to want to buy a product within the first 10 seconds on the site.

### Цветовая палитра

> Основные цвета:
>
> Черный #000000
> Белый #FFFFFF
>
> Дополнительные:
>
> Темно-серый #1A1A1A
> Светло-серый #F5F5F5
>
> Акцентные элементы:
>
> Белые кнопки на темном фоне
> Черные кнопки на светлом фоне
>
> Никаких ярких цветов.
>
> Стиль должен быть минималистичным, дорогим и современным.

_Translation_: Primary colors: Black #000000, White #FFFFFF. Secondary: Dark gray #1A1A1A, Light
gray #F5F5F5. Accent elements: white buttons on a dark background, black buttons on a light
background. No bright colors. The style should be minimalist, expensive-looking, and modern.

### Дизайн

> Используй:
>
> Минимализм
> Большие качественные изображения
> Много свободного пространства
> Закругленные элементы
> Glassmorphism (умеренно)
> Плавные тени
> Современную типографику
> Анимации уровня Apple
>
> Сайт должен выглядеть дорого и премиально.

_Translation_: Use: minimalism, large high-quality images, lots of free/white space, rounded
elements, glassmorphism (moderate), soft shadows, modern typography, Apple-level animations. The
site should look expensive and premium.

### Главная страница — Первый экран

> Большой баннер.
> Модель в современной одежде.
> Большой текст:
> STYLE.
> QUALITY.
> CONFIDENCE.
> Под ним:
> “Mirox Shop — современная одежда для тех, кто ценит качество и минимализм.”
> Кнопки:
> • Перейти в каталог
> • Смотреть новинки

_Translation_: Large banner. Model in modern clothing. Large text "STYLE. / QUALITY. /
CONFIDENCE." Below it: "Mirox Shop — modern clothing for those who value quality and
minimalism." Buttons: "Go to catalog", "See new arrivals".

### Под баннером — карточки преимуществ

> Добавить красивые карточки преимуществ.
>
> 🚚 Быстрая доставка
> 🔄 Обмен размера
> ⭐ Высокое качество
> 💬 Поддержка 24/7

_Translation_: Add attractive benefit cards: fast delivery, size exchange, high quality, 24/7
support.

### Почему выбирают нас

> Красивый современный блок.
>
> Добавить:
>
> 🛍 Более 300 успешных покупок на OLX
> 📱 Более 100 заказов через Instagram
> ⭐ Высокий рейтинг покупателей
> 🚚 Быстрая доставка по Украине
> 📦 Проверяем каждый товар перед отправкой
> 🔄 Обмен размера
> 💬 Поддержка без выходных
> 🏆 Только качественная одежда
> 🔒 Безопасная оплата
> ❤️ Нам доверяют постоянные клиенты

_Translation_: A beautiful, modern block. Add: 300+ successful purchases on OLX; 100+ orders via
Instagram; high buyer rating; fast delivery across Ukraine; we check every item before shipping;
size exchange; support with no days off; only quality clothing; secure payment; repeat customers
trust us.

**Note**: Items 1–3 (OLX sales, Instagram orders, customer rating) are the client's own claims
about their sales history, not fabricated real-time counters. TASK-035 renders them from
`site.claims`, gated on the client actually supplying a figure — see the TASK-035 design doc §5.5.

### Каталог

> Сделать максимально удобный каталог.
>
> Добавить:
>
> Поиск
>
> Фильтр по:
>
> цене
> размеру
> цвету
> бренду
> наличию
>
> Сортировка:
>
> Новинки
> Популярные
> Цена ↑
> Цена ↓

_Translation_: Make the catalog as convenient as possible. Add: search. Filter by: price, size,
color, brand, availability. Sort by: new arrivals, popular, price ascending, price descending.

### Умный поиск

> Поиск должен работать по:
>
> названию товара
> ключевым словам
> бренду
> категории
> цвету
> артикулу
>
> Даже если пользователь написал слово не полностью.
>
> Во время ввода сразу показывать:
>
> Фото товара
> Название
> Цену
> Кнопку перейти.

_Translation_: Search should work by: product name, keywords, brand, category, color, SKU — even
if the user typed the word incompletely. While typing, immediately show: product photo, name,
price, a "go to" button.

### Карточка товара

> Большая галерея изображений.
> Выбор размера.
> Выбор цвета.
> Таблица размеров.
> Отзывы.
> Рейтинг.
> Количество товара.
>
> Осталось:
>
> Например
>
> Осталось 4 шт.
>
> Похожие товары.
> С этим товаром покупают.
> Недавно просмотренные товары.

_Translation_: Large image gallery. Size selection. Color selection. Size chart. Reviews. Rating.
Stock quantity. "Remaining": e.g. "4 left in stock." Similar products. Bought together with this
item. Recently viewed products.

### Избранное

> Добавить систему избранного.
> Сердце на карточке.
> Отдельную страницу “Избранное”.
> Работу без регистрации.
> После регистрации синхронизация.

_Translation_: Add a favorites/wishlist system. Heart icon on the card. A separate "Favorites"
page. Works without registration. Syncs after registration.

### Корзина

> Красивый современный дизайн.
> Изменение количества.
> Промокод.
> Стоимость доставки.
> Итог.
> Кнопка оформления.

_Translation_: Beautiful, modern design. Quantity adjustment. Promo code. Shipping cost. Total.
Checkout button.

### После покупки

> После оформления заказа автоматически показать окно:
>
> Спасибо за покупку ❤️
>
> В течение 24 часов получите скидку 5% на второй товар.
>
> Отправить уведомление:
>
> SMS (если подключён сервис)
> Telegram
> Email

_Translation_: After the order is placed, automatically show a popup: "Thank you for your
purchase ❤️. Within 24 hours you'll receive a 5% discount on a second item." Send a notification
via: SMS (if the service is connected), Telegram, Email.

### Акции

> Создать отдельный раздел.
>
> Добавить:
>
> Новинки
> Хиты продаж
> Скидки недели
> Комплекты
> Последний шанс
> Горящие предложения
> Таймер окончания акции

_Translation_: Create a separate section. Add: new arrivals, bestsellers, deals of the week,
bundles, last chance, hot deals, promotion countdown timer.

### Отзывы

> Отзывы должны содержать:
>
> Фото покупателя
> Фото товара
> Имя
> Оценку
> Комментарий
> Размер
> Рост
> Вес

_Translation_: Reviews must contain: buyer photo, product photo, name, rating, comment, size,
height, weight.

### Галерея покупателей

> Добавить раздел
>
> Наши покупатели
>
> С фотографиями клиентов.

_Translation_: Add a "Our Customers" section with customer photos.

### Социальные сети

> Добавить красивый раздел.
>
> Instagram
> TikTok
> Telegram
>
> Подписывайтесь, чтобы первыми узнавать о новинках.

_Translation_: Add an attractive section. Instagram, TikTok, Telegram. "Follow us to be the first
to know about new arrivals."

### Подбор размера

> Добавить AI помощника.
>
> Пользователь вводит:
>
> Рост
> Вес
> Возраст
> Телосложение
> Как любит носить одежду
>
> Получает рекомендацию размера.

_Translation_: Add an AI assistant. The user enters: height, weight, age, body type, how they
like to wear clothes. Receives a size recommendation.

### Красивые анимации

> Использовать современные плавные анимации.
>
> Плавное появление блоков.
> Плавное открытие меню.
> Hover эффект карточек.
> Увеличение изображения товара.
> Плавная корзина.
> Skeleton Loader.
> Красивый Loader.
> Плавные переходы страниц.
> Анимация добавления товара в корзину.

_Translation_: Use modern, smooth animations. Smooth block reveal. Smooth menu opening. Card hover
effect. Product image zoom. Smooth cart. Skeleton loader. Beautiful loader. Smooth page
transitions. Add-to-cart animation.

### Повышение доверия

> Показывать:
>
> 🔥 Сейчас просматривают этот товар 12 человек
> 🛒 Сегодня купили 7 человек
> ⭐ Рейтинг 4.9
> 👁 Просмотров товара

_Translation_: Show: "12 people are currently viewing this product", "7 people bought it today",
"Rating 4.9", "Product views".

**⚠️ Not implemented.** These are fabricated real-time social-proof numbers with no
data source. Ruled out of scope — see TASK-051.

### Дополнительные функции

> Недавно просмотренные товары.
> Избранное.
> История поиска.
> Сравнение товаров.
> Купить в один клик.
> Быстрый заказ.
> Подарочная упаковка.
> Комплекты одежды.
> Рекомендации.
> Похожие товары.

_Translation_: Recently viewed products. Favorites. Search history. Product comparison. One-click
buy. Quick order. Gift wrapping. Clothing bundles. Recommendations. Similar products.

### SEO

> SEO URL
> Open Graph
> Schema
> Sitemap
> Robots
> Оптимизация изображений
> Google PageSpeed 95+

_Translation_: SEO-friendly URLs. Open Graph. Schema (structured data). Sitemap. Robots.txt. Image
optimization. Google PageSpeed 95+.

### Производительность

> Lazy Loading
> Code Splitting
> Оптимизация изображений
> Минификация CSS
> Минификация JS
> Очень быстрая загрузка.

_Translation_: Lazy loading. Code splitting. Image optimization. CSS minification. JS
minification. Very fast loading.

### Адаптация

> Полностью адаптивный дизайн.
>
> iPhone
> Android
> Планшеты
> Компьютеры

_Translation_: Fully responsive design. iPhone. Android. Tablets. Computers.

### Админ-панель

> Добавить:
>
> Управление товарами
> Заказами
> Категориями
> Пользователями
> Акциями
> Промокодами
> Отзывы
> Статистику
> Продажи

_Translation_: Add: management of products, orders, categories, users, promotions, promo codes,
reviews, statistics, sales.

### Финальная цель

> Сайт должен выглядеть дороже большинства украинских интернет-магазинов. Каждый элемент должен
> быть направлен на увеличение доверия, повышение среднего чека и конверсии. Дизайн должен
> создавать ощущение премиального бренда, при этом оставаться максимально простым, быстрым и
> удобным.

_Translation_: The site should look more expensive than most Ukrainian online stores. Every
element should be aimed at increasing trust, raising the average order value, and improving
conversion. The design should create the feeling of a premium brand while remaining as simple,
fast, and convenient as possible.

### ПРОМПТ ДЛЯ СОЗДАНИЯ ДИЗАЙН-МАКЕТА (ФОТО)

> Создай фотореалистичный дизайн главной страницы интернет-магазина одежды “Mirox Shop”.
> Используй приложенный логотип. Стиль — luxury minimalism, вдохновленный Apple, Zara, COS и
> Farfetch, но с уникальным дизайном. Цветовая палитра только черная, белая и оттенки серого. На
> первом экране — стильный мужчина в черном худи с логотипом Mirox Shop, крупный слоган “STYLE.
> QUALITY. CONFIDENCE.”, две кнопки “Перейти в каталог” и “Новинки”. Ниже размести блок “Почему
> выбирают нас”, карточки популярных товаров, раздел “Хиты продаж”, отзывы покупателей с
> фотографиями, блок социальных сетей (Instagram, TikTok, Telegram), современный футер. Используй
> большие изображения, плавные тени, много свободного пространства, дорогую типографику и
> премиальный UI/UX. Интерфейс должен выглядеть как готовый сайт стоимостью более 10 000 долларов,
> с высокой детализацией, реалистичными элементами и без шаблонных решений.
>
> /workspaces/dropshipping/photo_2026-07-13_13-23-08.jpg

_Translation_: Create a photorealistic design of the homepage for the "Mirox Shop" clothing
store. Use the attached logo. Style — luxury minimalism, inspired by Apple, Zara, COS, and
Farfetch, but with a unique design. Color palette limited to black, white, and shades of gray. On
the first screen — a stylish man in a black hoodie with the Mirox Shop logo, a large tagline
"STYLE. QUALITY. CONFIDENCE.", two buttons "Go to catalog" and "New arrivals". Below, place a "Why
choose us" block, popular product cards, a "Bestsellers" section, customer reviews with photos, a
social media block (Instagram, TikTok, Telegram), a modern footer. Use large images, soft shadows,
lots of free space, expensive typography, and premium UI/UX. The interface should look like a
finished website worth more than $10,000, highly detailed, with realistic elements and no
template-like solutions.

_(The final line of the message is the absolute path of the concept screenshot attached to this
message, as it existed at the time — `/workspaces/dropshipping/photo_2026-07-13_13-23-08.jpg`. That
file is now [mirox-concept-screenshot.jpg](mirox-concept-screenshot.jpg) in this directory.)_

---

## List #2 — Mirox Shop — План улучшений сайта (2026-07-15T07:28:39Z)

**Numbering note**: the 20 items below use the client's own numbering, exactly as it appears in
the source. This document's item numbers are authoritative — they match existing citations in
`docs/planning/TODO.md` (items 13, 14, 16, 18/19), `docs/planning/BACKLOG.md` (item 14), and
`docs/superpowers/specs/2026-07-19-task-035-homepage-design.md` (items 15, 19). An earlier draft
of this task's own planning brief mis-transcribed a fragment of this list, omitting item 17 (AI
size finder) and shifting items 18–19 down by one position; that draft was never committed. This
document corrects it by transcribing directly from the source transcript.

_Context — the repo owner's message introducing the list, verbatim, English, as written (the word
"whant" is a typo in the original, preserved rather than corrected):_

> I have also got a more improvements that client whant to see in project(some of them seems to be
> a duplicate of previous requests). What we can do with it?

_The client's pasted list follows, verbatim:_

> "Mirox Shop — План улучшений сайта
>
> 1. Умный поиск
>    Поиск по названию, ключевым словам, бренду, категории, цвету, артикулу; автодополнение;
>    исправление опечаток.
> 2. Избранное
>    LocalStorage, страница избранного, счетчик, анимация сердца, уведомление.
> 3. Боковая корзина
>    Выезжающая панель с фото, размером, количеством, итогом и кнопкой оформления.
> 4. Скидка на второй товар
>    После покупки показать предложение -5% на второй товар; отправить SMS/Telegram/Email при
>    наличии интеграций.
> 5. Недавно просмотренные
>    Отдельный блок с просмотренными товарами.
> 6. Социальное доказательство
>    Сейчас смотрят X человек, купили Y раз за сутки.
> 7. Онлайн-поддержка
>    Плавающие кнопки Instagram, Telegram, менеджер.
> 8. Колесо скидок
>    Попап со скидкой 5–15% через 15 секунд.
> 9. Галерея покупателей
>    Фото клиентов вместо заглушек.
> 10. Подробные отзывы
>     Фото, дата, рост, вес, размер, срок доставки.
> 11. Отслеживание заказа
>     По номеру телефона или заказа.
> 12. Остаток товара
>     Индикатор наличия.
> 13. Верхний баннер
>     Бесплатная доставка или акции.
> 14. Hero
>     Использовать реальные фото моделей вместо SVG.
> 15. Анимации
>     GSAP, плавные появления, параллакс, микроанимации.
> 16. Соцсети
>     Instagram, TikTok, Telegram со счетчиками.
> 17. AI подбор размера
>     Рост, вес, возраст, телосложение → рекомендуемый размер.
> 18. Цвета
>     Переключатели черный/белый в виде кружков.
> 19. Карточки товаров
>     Вторая фотография, быстрый просмотр, купить.
> 20. Дополнительно
>     Акции, таймер, комплекты, SEO, высокая скорость загрузки.
>     "

_Translation_: "Mirox Shop — Website improvement plan. 1. Smart search: search by name, keywords,
brand, category, color, SKU; autocomplete; typo correction. 2. Favorites: LocalStorage, favorites
page, counter, heart animation, notification. 3. Side cart: slide-out panel with photo, size,
quantity, total, and checkout button. 4. Second-item discount: after purchase, show a -5% offer on
a second item; send SMS/Telegram/Email if integrations are available. 5. Recently viewed: a
separate block with viewed products. 6. Social proof: "X people viewing now", "bought Y times in
the last 24 hours." 7. Online support: floating buttons for Instagram, Telegram, manager (chat). 8.
Discount wheel: popup with a 5–15% discount after 15 seconds. 9. Customer gallery: real customer
photos instead of placeholders. 10. Detailed reviews: photo, date, height, weight, size, delivery
time. 11. Order tracking: by phone number or order number. 12. Stock remaining: availability
indicator. 13. Top banner: free shipping or promotions. 14. Hero: use real model photos instead of
SVG. 15. Animations: GSAP, smooth reveals, parallax, micro-animations. 16. Social media: Instagram,
TikTok, Telegram with counters. 17. AI size finder: height, weight, age, body type → recommended
size. 18. Colors: black/white switches shown as circles. 19. Product cards: second photo, quick
view, buy. 20. Additional: promotions, timer, bundles, SEO, high loading speed."

---

## Known internal contradiction

The brief states the hero CTAs twice with different labels: the homepage section (List #1,
"Главная страница — Первый экран") says `Перейти в каталог` / `Смотреть новинки`, while the
image-generation prompt in the same message ("ПРОМПТ ДЛЯ СОЗДАНИЯ ДИЗАЙН-МАКЕТА (ФОТО)") says
`Перейти в каталог` / `Новинки`. TASK-035 treats the **homepage section** as authoritative (it
describes the page, not a mockup).

---

## Extraction & verification notes

- **Method**: read directly with a Node.js script (`JSON.parse` per JSONL line, then
  `message.content` — an array of `{type: "text", text: ...}` blocks — joined). Not eyeballed and
  not paraphrased from memory; the transcript was fully readable.
- **Line 44** (`type: "user"`) has one text block, 6194 characters. **Line 654** (`type: "user"`)
  has two text blocks, 170 + 1620 = 1790 characters. Both match this task's brief within rounding
  (~6180 / ~1791).
- **Numbering cross-check**: items 17–19 of list #2 were verified against independent, pre-existing
  citations already committed in this repo — `docs/planning/TODO.md:47` ("client list #2 items
  18/19" for color swatches + product-card hover/quick-view), `docs/planning/BACKLOG.md:340`
  ("client list #2 item 14" for the SVG-placeholder complaint), and
  `docs/superpowers/specs/2026-07-19-task-035-homepage-design.md:147,252` ("list #2 item 19" for
  ProductCard, "list #2 item 15" for GSAP). All agree with the numbering transcribed here directly
  from the source; none match a scheme where item 17 is "Цвета".
- **Screenshot path grep** (Step 4 of this task's plan) predicted hits only in
  `docs/planning/BACKLOG.md` and `docs/superpowers/specs/2026-07-14-mirox-shop-program-design.md`.
  Actual hits at commit time: `docs/superpowers/specs/2026-07-14-mirox-shop-program-design.md`
  (updated, see below); `docs/archive/plans/2026-07-14_task-033-resumption.md` (an archived,
  immutable historical record — left as-is); and this task's own plan/spec files
  (`docs/planning/plans/2026-07-19_task-035-homepage-rebrand.md`,
  `docs/superpowers/specs/2026-07-19-task-035-homepage-design.md`), which describe the old path as
  the pre-task state or as the literal `git mv` command being documented — left as-is, since
  rewriting them would erase accurate historical narrative rather than fix a broken reference.
  `docs/planning/BACKLOG.md` contains no literal occurrence of the old filename (it refers to "the
  concept screenshot" without the path), so there was nothing to update there.
