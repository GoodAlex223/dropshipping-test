// Product seed data — Mirox clothing catalog (UA, UAH)

export interface ProductSeed {
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDesc: string;
  price: number;
  comparePrice?: number;
  stock: number;
  isFeatured: boolean;
  categorySlug: string;
  brand: string;
  // Omitted for the whole catalog: real GTIN/MPN identifiers weren't supplied
  // by the client (TASK-056). Optional here — and in the `products` schema —
  // so the Google Shopping feed's Zod validation just drops these items
  // rather than the seed failing.
  barcode?: string;
  mpn?: string;
  images: { url: string; alt: string; position: number }[];
  variants?: { name: string; value: string; stock: number }[];
}

export const products: ProductSeed[] = [
  {
    name: "Худі Mirox Basic",
    slug: "hudi-mirox-basic",
    sku: "MRX-001",
    description:
      "Базове чорне худі Mirox з щільного футеру (400 г/м²) з начосом. Оверсайз-крій, посилені шви, капюшон з подвійним шаром та металеві люверси. Вишитий логотип на грудях. Не втрачає форму після прання.",
    shortDesc: "Базове худі з щільного футеру з начосом",
    price: 1290,
    stock: 42,
    isFeatured: true,
    categorySlug: "hudi",
    brand: "Mirox",
    images: [
      {
        url: "/images/products/p-hudi-basic.png",
        alt: "Худі Mirox Basic — вид спереду",
        position: 0,
      },
      { url: "/images/products/pd-main.png", alt: "Худі Mirox Basic — основне фото", position: 1 },
      { url: "/images/products/pd-thumb-1.png", alt: "Худі Mirox Basic — деталь 1", position: 2 },
      { url: "/images/products/pd-thumb-2.png", alt: "Худі Mirox Basic — деталь 2", position: 3 },
      { url: "/images/products/pd-thumb-3.png", alt: "Худі Mirox Basic — деталь 3", position: 4 },
      { url: "/images/products/pd-thumb-4.png", alt: "Худі Mirox Basic — деталь 4", position: 5 },
      { url: "/images/products/pd-thumb-5.png", alt: "Худі Mirox Basic — деталь 5", position: 6 },
    ],
    variants: [
      { name: "Size", value: "S", stock: 8 },
      { name: "Size", value: "M", stock: 12 },
      { name: "Size", value: "L", stock: 12 },
      { name: "Size", value: "XL", stock: 10 },
      { name: "Color", value: "Чорний", stock: 30 },
      { name: "Color", value: "Білий", stock: 12 },
    ],
  },
  {
    name: "Футболка Mirox",
    slug: "futbolka-mirox",
    sku: "MRX-002",
    description:
      "Футболка Mirox із щільної бавовни (180 г/м²) з м'якою фактурою та гладким плетінням. Пряма посадка, посилені шви на комірі, вишитий логотип на грудях. Дихаюча тканина не деформується після прання і зберігає насичений колір.",
    shortDesc: "Футболка з щільної бавовни з прямою посадкою",
    price: 590,
    comparePrice: 690,
    stock: 96,
    isFeatured: true,
    categorySlug: "futbolky",
    brand: "Mirox",
    images: [
      { url: "/images/products/p-tshirt.png", alt: "Футболка Mirox — вид спереду", position: 0 },
      { url: "/images/products/pd-main.png", alt: "Футболка Mirox — основне фото", position: 1 },
      { url: "/images/products/pd-thumb-1.png", alt: "Футболка Mirox — деталь 1", position: 2 },
      { url: "/images/products/pd-thumb-2.png", alt: "Футболка Mirox — деталь 2", position: 3 },
      { url: "/images/products/pd-thumb-3.png", alt: "Футболка Mirox — деталь 3", position: 4 },
      { url: "/images/products/pd-thumb-4.png", alt: "Футболка Mirox — деталь 4", position: 5 },
      { url: "/images/products/pd-thumb-5.png", alt: "Футболка Mirox — деталь 5", position: 6 },
    ],
    variants: [
      { name: "Size", value: "S", stock: 20 },
      { name: "Size", value: "M", stock: 28 },
      { name: "Size", value: "L", stock: 28 },
      { name: "Size", value: "XL", stock: 20 },
      { name: "Color", value: "Чорний", stock: 64 },
      { name: "Color", value: "Білий", stock: 32 },
    ],
  },
  {
    name: "Олімпійка Mirox",
    slug: "olimpiyka-mirox",
    sku: "MRX-003",
    description:
      "Олімпійка Mirox на металевій блискавці з трикотажу з начосом зсередини. Прямий крій, високий комір-стійка, кишені по боках та манжети на резинці. Вишитий логотип на грудях підкреслює лаконічний стиль.",
    shortDesc: "Олімпійка на блискавці з начосом зсередини",
    price: 1490,
    stock: 50,
    isFeatured: true,
    categorySlug: "olimpiyky",
    brand: "Mirox",
    images: [
      { url: "/images/products/p-olimp.png", alt: "Олімпійка Mirox — вид спереду", position: 0 },
      { url: "/images/products/pd-main.png", alt: "Олімпійка Mirox — основне фото", position: 1 },
      { url: "/images/products/pd-thumb-1.png", alt: "Олімпійка Mirox — деталь 1", position: 2 },
      { url: "/images/products/pd-thumb-2.png", alt: "Олімпійка Mirox — деталь 2", position: 3 },
      { url: "/images/products/pd-thumb-3.png", alt: "Олімпійка Mirox — деталь 3", position: 4 },
      { url: "/images/products/pd-thumb-4.png", alt: "Олімпійка Mirox — деталь 4", position: 5 },
      { url: "/images/products/pd-thumb-5.png", alt: "Олімпійка Mirox — деталь 5", position: 6 },
    ],
    variants: [
      { name: "Size", value: "S", stock: 10 },
      { name: "Size", value: "M", stock: 15 },
      { name: "Size", value: "L", stock: 15 },
      { name: "Size", value: "XL", stock: 10 },
      { name: "Color", value: "Чорний", stock: 50 },
    ],
  },
  {
    name: "Худі Mirox White",
    slug: "hudi-mirox-white",
    sku: "MRX-004",
    description:
      "Худі Mirox White — світла версія базової моделі з щільного футеру (400 г/м²) з начосом. Оверсайз-крій, капюшон з регульованим шнурком та кишеня-кенгуру спереду. Вишитий логотип на грудях, тканина не жовтіє після прання.",
    shortDesc: "Біле худі з щільного футеру, оверсайз-крій",
    price: 1290,
    comparePrice: 1490,
    stock: 38,
    isFeatured: true,
    categorySlug: "hudi",
    brand: "Mirox",
    images: [
      {
        url: "/images/products/p-hudi-white.png",
        alt: "Худі Mirox White — вид спереду",
        position: 0,
      },
      { url: "/images/products/pd-main.png", alt: "Худі Mirox White — основне фото", position: 1 },
      { url: "/images/products/pd-thumb-1.png", alt: "Худі Mirox White — деталь 1", position: 2 },
      { url: "/images/products/pd-thumb-2.png", alt: "Худі Mirox White — деталь 2", position: 3 },
      { url: "/images/products/pd-thumb-3.png", alt: "Худі Mirox White — деталь 3", position: 4 },
      { url: "/images/products/pd-thumb-4.png", alt: "Худі Mirox White — деталь 4", position: 5 },
      { url: "/images/products/pd-thumb-5.png", alt: "Худі Mirox White — деталь 5", position: 6 },
    ],
    variants: [
      { name: "Size", value: "S", stock: 8 },
      { name: "Size", value: "M", stock: 11 },
      { name: "Size", value: "L", stock: 11 },
      { name: "Size", value: "XL", stock: 8 },
      { name: "Color", value: "Білий", stock: 38 },
    ],
  },
  {
    name: "Худі Mirox Oversize",
    slug: "hudi-mirox-oversize",
    sku: "MRX-005",
    description:
      "Худі Mirox Oversize — вільний силует з подовженою лінією плеча та щільного футеру з начосом. Об'ємний капюшон, широкі манжети та кишеня-кенгуру. Створене для тих, хто цінує максимальний комфорт і стріт-стиль.",
    shortDesc: "Худі вільного крою з подовженою лінією плеча",
    price: 1390,
    stock: 34,
    isFeatured: false,
    categorySlug: "hudi",
    brand: "Mirox",
    images: [
      {
        url: "/images/products/p-hudi-oversize.png",
        alt: "Худі Mirox Oversize — вид спереду",
        position: 0,
      },
      {
        url: "/images/products/pd-main.png",
        alt: "Худі Mirox Oversize — основне фото",
        position: 1,
      },
      {
        url: "/images/products/pd-thumb-1.png",
        alt: "Худі Mirox Oversize — деталь 1",
        position: 2,
      },
      {
        url: "/images/products/pd-thumb-2.png",
        alt: "Худі Mirox Oversize — деталь 2",
        position: 3,
      },
      {
        url: "/images/products/pd-thumb-3.png",
        alt: "Худі Mirox Oversize — деталь 3",
        position: 4,
      },
      {
        url: "/images/products/pd-thumb-4.png",
        alt: "Худі Mirox Oversize — деталь 4",
        position: 5,
      },
      {
        url: "/images/products/pd-thumb-5.png",
        alt: "Худі Mirox Oversize — деталь 5",
        position: 6,
      },
    ],
    variants: [
      { name: "Size", value: "M", stock: 10 },
      { name: "Size", value: "L", stock: 10 },
      { name: "Size", value: "XL", stock: 9 },
      { name: "Size", value: "XXL", stock: 5 },
      { name: "Color", value: "Чорний", stock: 34 },
    ],
  },
  {
    name: "Штани Mirox Cargo",
    slug: "shtany-mirox-cargo",
    sku: "MRX-006",
    description:
      "Штани Mirox Cargo з щільної бавовняної тканини з накладними кишенями по боках. Прямий крій, регульований пояс на шнурку, манжети на резинці знизу. Практичні та зносостійкі — підходять як для щоденних образів, так і для активного відпочинку.",
    shortDesc: "Штани карго з накладними кишенями",
    price: 1190,
    stock: 27,
    isFeatured: false,
    categorySlug: "shtany",
    brand: "Mirox",
    images: [
      { url: "/images/products/p-cargo.png", alt: "Штани Mirox Cargo — вид спереду", position: 0 },
      { url: "/images/products/pd-main.png", alt: "Штани Mirox Cargo — основне фото", position: 1 },
      { url: "/images/products/pd-thumb-1.png", alt: "Штани Mirox Cargo — деталь 1", position: 2 },
      { url: "/images/products/pd-thumb-2.png", alt: "Штани Mirox Cargo — деталь 2", position: 3 },
      { url: "/images/products/pd-thumb-3.png", alt: "Штани Mirox Cargo — деталь 3", position: 4 },
      { url: "/images/products/pd-thumb-4.png", alt: "Штани Mirox Cargo — деталь 4", position: 5 },
      { url: "/images/products/pd-thumb-5.png", alt: "Штани Mirox Cargo — деталь 5", position: 6 },
    ],
    variants: [
      { name: "Size", value: "S", stock: 8 },
      { name: "Size", value: "M", stock: 10 },
      { name: "Size", value: "L", stock: 9 },
      { name: "Color", value: "Чорний", stock: 27 },
    ],
  },
  {
    name: "Лонгслів Mirox",
    slug: "longsliv-mirox",
    sku: "MRX-007",
    description:
      "Лонгслів Mirox з тонкого трикотажу щільного плетіння для прохолодної погоди. Прямий крій, манжети на резинці, вишитий логотип на грудях. Легко поєднується з худі чи олімпійкою як базовий шар.",
    shortDesc: "Лонгслів з тонкого трикотажу на прохолодну погоду",
    price: 690,
    stock: 44,
    isFeatured: false,
    categorySlug: "longslivy",
    brand: "Mirox",
    images: [
      {
        url: "/images/products/p-longsleeve.png",
        alt: "Лонгслів Mirox — вид спереду",
        position: 0,
      },
      { url: "/images/products/pd-main.png", alt: "Лонгслів Mirox — основне фото", position: 1 },
      { url: "/images/products/pd-thumb-1.png", alt: "Лонгслів Mirox — деталь 1", position: 2 },
      { url: "/images/products/pd-thumb-2.png", alt: "Лонгслів Mirox — деталь 2", position: 3 },
      { url: "/images/products/pd-thumb-3.png", alt: "Лонгслів Mirox — деталь 3", position: 4 },
      { url: "/images/products/pd-thumb-4.png", alt: "Лонгслів Mirox — деталь 4", position: 5 },
      { url: "/images/products/pd-thumb-5.png", alt: "Лонгслів Mirox — деталь 5", position: 6 },
    ],
    variants: [
      { name: "Size", value: "S", stock: 10 },
      { name: "Size", value: "M", stock: 13 },
      { name: "Size", value: "L", stock: 13 },
      { name: "Size", value: "XL", stock: 8 },
      { name: "Color", value: "Чорний", stock: 44 },
    ],
  },
  {
    name: "Кепка Mirox",
    slug: "kepka-mirox",
    sku: "MRX-008",
    description:
      "Кепка Mirox з щільного бавовняного твілу з вишитим логотипом спереду. Регульований застібок ззаду підходить під будь-який обхват голови, вигнутий козирок захищає від сонця. Універсальний аксесуар, що завершує образ.",
    shortDesc: "Кепка з вишитим логотипом і регульованим застібком",
    price: 490,
    stock: 60,
    isFeatured: false,
    categorySlug: "kepky",
    brand: "Mirox",
    images: [
      { url: "/images/products/p-cap.png", alt: "Кепка Mirox — вид спереду", position: 0 },
      { url: "/images/products/pd-main.png", alt: "Кепка Mirox — основне фото", position: 1 },
      { url: "/images/products/pd-thumb-1.png", alt: "Кепка Mirox — деталь 1", position: 2 },
      { url: "/images/products/pd-thumb-2.png", alt: "Кепка Mirox — деталь 2", position: 3 },
      { url: "/images/products/pd-thumb-3.png", alt: "Кепка Mirox — деталь 3", position: 4 },
      { url: "/images/products/pd-thumb-4.png", alt: "Кепка Mirox — деталь 4", position: 5 },
      { url: "/images/products/pd-thumb-5.png", alt: "Кепка Mirox — деталь 5", position: 6 },
    ],
    variants: [
      { name: "Size", value: "One size", stock: 60 },
      { name: "Color", value: "Чорний", stock: 60 },
    ],
  },
];
