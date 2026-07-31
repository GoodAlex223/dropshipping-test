# Mirox Shop — промпты для генерации изображений

Как использовать: сгенерируйте (Midjourney / DALL-E / Ideogram / стоки) и перетащите файл прямо на нужный слот на странице — он сохранится. Один и тот же товар используется на нескольких страницах через общий id — заполняется один раз.

**Общий стиль (добавлять к каждому промпту):**

> Premium minimalist e-commerce fashion photography, dark charcoal studio background (#111), soft diffused lighting, high contrast black and white clothing, small white "Mirox" logo print on chest, no text overlays, no watermarks, 4:5 vertical crop, shot on medium format, editorial quality — in the style of Represent / Fear of God product pages.

---

## Герой (главная)

**Слот:** `hero-model` (desktop, ~640×620), `m-hero` (mobile, 390×440 — можно тот же кадр)

> Full-body/three-quarter portrait of a young male model with curly dark hair, looking down pensively, wearing an oversized black hoodie with small white Mirox chest logo, matte black studio background, moody low-key lighting from the left, cinematic, premium streetwear brand campaign. Vertical.

## Карточки товаров (каталог + главная + корзина/checkout)

Формат: продукт на невидимом манекене (ghost mannequin) или flat lay, тёмно-серый фон, товар по центру, 3:4.

- **`p-hudi-basic`** — Худі Mirox Basic (чёрное): Black heavyweight cotton hoodie, ghost mannequin, front view, small white Mirox logo on left chest, dark grey studio backdrop.
- **`p-tshirt`** — Футболка Mirox (белая): White heavyweight oversized t-shirt, ghost mannequin, small black Mirox chest logo, dark grey backdrop.
- **`p-olimp`** — Олімпійка Mirox (чёрная): Black zip-up track jacket with full front zipper, ghost mannequin, white Mirox chest logo, dark grey backdrop.
- **`p-hudi-white`** — Худі Mirox White: Off-white / cream hoodie, ghost mannequin, small black Mirox chest logo, dark grey backdrop.
- **`p-hudi-oversize`** — Худі Mirox Oversize: Oversized boxy-fit black hoodie with dropped shoulders, ghost mannequin, white Mirox logo, dark grey backdrop.
- **`p-cargo`** — Штани Mirox Cargo: Black cargo pants with side pockets, flat lay or ghost mannequin, dark grey backdrop.
- **`p-longsleeve`** — Лонгслів Mirox: Black long-sleeve fitted shirt, ghost mannequin, small white chest logo, dark grey backdrop.
- **`p-cap`** — Кепка Mirox (чёрная): Black baseball cap with small embroidered white Mirox "M" logo, product shot at slight angle, dark grey backdrop.

## Страница товара (Худі Mirox Basic)

- **`pd-main`** (главное фото, ~1:1.3 вертикальное): Black hoodie on male model torso, front view, arms relaxed, white Mirox chest logo, dark grey seamless backdrop, e-commerce hero shot. _(mobile: `m-pd` — тот же кадр)_
- **`pd-thumb-1`** — тот же кадр, что pd-main (front view)
- **`pd-thumb-2`** — back view of the same black hoodie
- **`pd-thumb-3`** — side profile view
- **`pd-thumb-4`** — close-up detail of fabric texture and white Mirox logo stitching
- **`pd-thumb-5`** — hood and drawstrings detail, macro shot

## Мобильные слоты (можно те же файлы)

`m-p1`/`m-c1` = p-hudi-basic · `m-p2`/`m-c2` = p-tshirt · `m-p3`/`m-c3` = p-olimp · `m-c4` = p-hudi-white

## Логотип

Если вырежете/апскейлите лого с макета — скиньте PNG (белый на прозрачном фоне, высота ≥128px), я заменю текущий SVG во всех шапках и футерах.
