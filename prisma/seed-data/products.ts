// Product seed data with Unsplash images

export const products = [
  // ============ ELECTRONICS - Audio & Headphones ============
  {
    name: "Wireless Bluetooth Headphones",
    slug: "wireless-bluetooth-headphones",
    sku: "ELEC-001",
    description:
      "Premium over-ear wireless headphones featuring active noise cancellation technology. Enjoy up to 30 hours of battery life, comfortable memory foam ear cushions, and crystal-clear audio with deep bass. Perfect for commuting, working, or relaxing at home.",
    shortDesc: "Premium wireless headphones with ANC and 30hr battery",
    price: 89.99,
    comparePrice: 119.99,
    stock: 50,
    isFeatured: true,
    categorySlug: "audio-headphones",
    brand: "SoundWave",
    barcode: "8901234567890",
    mpn: "SW-BT-500",
    images: [
      {
        url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
        alt: "Wireless headphones front view",
        position: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80",
        alt: "Wireless headphones side view",
        position: 1,
      },
    ],
    variants: [
      { name: "Color", value: "Matte Black", stock: 20 },
      { name: "Color", value: "Pearl White", stock: 15 },
      { name: "Color", value: "Navy Blue", stock: 15 },
    ],
  },
  {
    name: "True Wireless Earbuds Pro",
    slug: "true-wireless-earbuds-pro",
    sku: "ELEC-002",
    description:
      "Compact true wireless earbuds with premium sound quality and active noise cancellation. Features touch controls, wireless charging case, and IPX5 water resistance. Get up to 8 hours of playback with an additional 24 hours from the charging case.",
    shortDesc: "Compact ANC earbuds with wireless charging case",
    price: 129.99,
    comparePrice: 159.99,
    stock: 75,
    isFeatured: true,
    categorySlug: "audio-headphones",
    brand: "SoundWave",
    barcode: "8901234567891",
    mpn: "SW-TWS-200",
    images: [
      {
        url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80",
        alt: "Wireless earbuds with case",
        position: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&q=80",
        alt: "Earbuds detail view",
        position: 1,
      },
    ],
  },
  // ============ ELECTRONICS - Smartphones & Accessories ============
  {
    name: "Fast Charging USB-C Cable 2-Pack",
    slug: "fast-charging-usb-c-cable-2pack",
    sku: "ELEC-003",
    description:
      "Durable braided nylon USB-C cables with fast charging support up to 100W. Compatible with all USB-C devices including smartphones, tablets, and laptops. Includes 3ft and 6ft cables for versatility. Tested for 10,000+ bends.",
    shortDesc: "Durable 100W USB-C cables, 3ft + 6ft pack",
    price: 19.99,
    stock: 200,
    isFeatured: false,
    categorySlug: "smartphones-accessories",
    brand: "ChargeTech",
    barcode: "8901234567892",
    mpn: "CT-USBC-2PK",
    images: [
      {
        url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80",
        alt: "USB-C cables coiled",
        position: 0,
      },
    ],
  },
  {
    name: "Magnetic Phone Car Mount",
    slug: "magnetic-phone-car-mount",
    sku: "ELEC-004",
    description:
      "Strong magnetic car phone holder with 360° rotation. Features a sleek dashboard mount design with secure grip for all phone sizes. Easy one-hand operation and doesn't block air vents. Includes metal plates for phone attachment.",
    shortDesc: "360° rotating magnetic car phone holder",
    price: 24.99,
    stock: 120,
    isFeatured: false,
    categorySlug: "smartphones-accessories",
    brand: "AutoGrip",
    barcode: "8901234567893",
    mpn: "AG-MAG-360",
    images: [
      {
        url: "https://images.unsplash.com/photo-1544866092-1935c5ef2a8f?w=600&q=80",
        alt: "Phone mount in car",
        position: 0,
      },
    ],
  },
  // ============ ELECTRONICS - Computer Accessories ============
  {
    name: "Ergonomic Laptop Stand",
    slug: "ergonomic-laptop-stand",
    sku: "ELEC-005",
    description:
      "Premium aluminum laptop stand with adjustable height settings. Elevates your screen to eye level to reduce neck strain. Features ventilated design for better cooling and non-slip silicone pads. Supports laptops up to 17 inches.",
    shortDesc: 'Adjustable aluminum stand for laptops up to 17"',
    price: 49.99,
    comparePrice: 69.99,
    stock: 60,
    isFeatured: true,
    categorySlug: "computer-accessories",
    brand: "DeskPro",
    barcode: "8901234567894",
    mpn: "DP-STAND-17",
    images: [
      {
        url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
        alt: "Laptop stand with MacBook",
        position: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80",
        alt: "Laptop stand side angle",
        position: 1,
      },
    ],
  },
  {
    name: "Wireless Ergonomic Mouse",
    slug: "wireless-ergonomic-mouse",
    sku: "ELEC-006",
    description:
      "Vertical ergonomic wireless mouse designed for natural hand position and reduced wrist strain. Features adjustable DPI up to 2400, silent clicks, and 6 programmable buttons. USB receiver with 10m range and 18-month battery life.",
    shortDesc: "Vertical design mouse with silent clicks",
    price: 34.99,
    stock: 85,
    isFeatured: false,
    categorySlug: "computer-accessories",
    brand: "ErgoClick",
    barcode: "8901234567895",
    mpn: "EC-VERT-2400",
    images: [
      {
        url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
        alt: "Ergonomic mouse",
        position: 0,
      },
    ],
  },
  // ============ CLOTHING - Men's ============
  {
    name: "Classic Cotton Crew T-Shirt",
    slug: "classic-cotton-crew-tshirt",
    sku: "CLOTH-001",
    description:
      "Essential everyday t-shirt made from 100% organic cotton. Pre-shrunk fabric with reinforced shoulder seams for durability. Comfortable regular fit with a classic crew neckline. Machine washable and maintains shape after multiple washes.",
    shortDesc: "100% organic cotton everyday essential tee",
    price: 29.99,
    stock: 150,
    isFeatured: false,
    categorySlug: "mens-clothing",
    brand: "BasicWear",
    barcode: "8901234567896",
    mpn: "BW-TEE-001",
    images: [
      {
        url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
        alt: "White cotton t-shirt",
        position: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&q=80",
        alt: "T-shirt detail",
        position: 1,
      },
    ],
    variants: [
      { name: "Size", value: "S", stock: 30 },
      { name: "Size", value: "M", stock: 40 },
      { name: "Size", value: "L", stock: 45 },
      { name: "Size", value: "XL", stock: 35 },
    ],
  },
  {
    name: "Slim Fit Stretch Jeans",
    slug: "slim-fit-stretch-jeans",
    sku: "CLOTH-002",
    description:
      "Modern slim fit jeans with 2% stretch for all-day comfort. Made from premium denim with a classic 5-pocket design. Features button fly closure and belt loops. Perfect balance of style and flexibility for everyday wear.",
    shortDesc: "Comfortable stretch denim with modern slim fit",
    price: 59.99,
    comparePrice: 79.99,
    stock: 80,
    isFeatured: true,
    categorySlug: "mens-clothing",
    brand: "DenimCo",
    barcode: "8901234567897",
    mpn: "DC-SLIM-32",
    images: [
      {
        url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80",
        alt: "Blue slim jeans",
        position: 0,
      },
    ],
    variants: [
      { name: "Waist", value: "30", stock: 15 },
      { name: "Waist", value: "32", stock: 25 },
      { name: "Waist", value: "34", stock: 25 },
      { name: "Waist", value: "36", stock: 15 },
    ],
  },
  // ============ CLOTHING - Women's ============
  {
    name: "Floral Print Summer Dress",
    slug: "floral-print-summer-dress",
    sku: "CLOTH-003",
    description:
      "Light and breezy summer dress featuring a beautiful floral print. Made from soft, breathable viscose fabric with a flattering A-line silhouette. Features adjustable spaghetti straps and a sweetheart neckline. Perfect for beach days or casual outings.",
    shortDesc: "Breezy A-line dress with vibrant floral pattern",
    price: 49.99,
    stock: 65,
    isFeatured: true,
    categorySlug: "womens-clothing",
    brand: "FloraStyle",
    barcode: "8901234567898",
    mpn: "FS-DRESS-FL",
    images: [
      {
        url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80",
        alt: "Floral summer dress",
        position: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80",
        alt: "Dress back view",
        position: 1,
      },
    ],
    variants: [
      { name: "Size", value: "XS", stock: 10 },
      { name: "Size", value: "S", stock: 20 },
      { name: "Size", value: "M", stock: 20 },
      { name: "Size", value: "L", stock: 15 },
    ],
  },
  {
    name: "High-Waist Yoga Leggings",
    slug: "high-waist-yoga-leggings",
    sku: "CLOTH-004",
    description:
      "Premium yoga leggings with high-waisted design for tummy control and support. Made from buttery-soft, 4-way stretch fabric that wicks moisture. Features a hidden waistband pocket for keys or cards. Squat-proof and perfect for yoga, gym, or everyday wear.",
    shortDesc: "Buttery-soft leggings with tummy control",
    price: 44.99,
    stock: 100,
    isFeatured: false,
    categorySlug: "womens-clothing",
    brand: "FlexFit",
    barcode: "8901234567899",
    mpn: "FF-YOGA-HW",
    images: [
      {
        url: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80",
        alt: "Black yoga leggings",
        position: 0,
      },
    ],
    variants: [
      { name: "Size", value: "XS", stock: 20 },
      { name: "Size", value: "S", stock: 30 },
      { name: "Size", value: "M", stock: 30 },
      { name: "Size", value: "L", stock: 20 },
    ],
  },
  // ============ CLOTHING - Accessories ============
  {
    name: "Classic Leather Crossbody Bag",
    slug: "classic-leather-crossbody-bag",
    sku: "CLOTH-005",
    description:
      "Elegant crossbody bag crafted from genuine leather with a timeless design. Features adjustable shoulder strap, multiple interior compartments, and secure zipper closure. Spacious enough for phone, wallet, and essentials while maintaining a sleek profile.",
    shortDesc: "Genuine leather bag with adjustable strap",
    price: 79.99,
    comparePrice: 99.99,
    stock: 45,
    isFeatured: true,
    categorySlug: "fashion-accessories",
    brand: "LeatherLux",
    barcode: "8901234567900",
    mpn: "LL-CROSS-CL",
    images: [
      {
        url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
        alt: "Leather crossbody bag",
        position: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80",
        alt: "Bag interior view",
        position: 1,
      },
    ],
  },
  {
    name: "Polarized Aviator Sunglasses",
    slug: "polarized-aviator-sunglasses",
    sku: "CLOTH-006",
    description:
      "Classic aviator sunglasses with polarized lenses for superior glare reduction. Features lightweight metal frame with adjustable nose pads for comfort. UV400 protection blocks 100% of harmful rays. Includes premium carrying case and microfiber cleaning cloth.",
    shortDesc: "UV400 polarized lenses with classic metal frame",
    price: 54.99,
    stock: 70,
    isFeatured: false,
    categorySlug: "fashion-accessories",
    brand: "SunStyle",
    barcode: "8901234567901",
    mpn: "SS-AVI-POL",
    images: [
      {
        url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80",
        alt: "Aviator sunglasses",
        position: 0,
      },
    ],
  },
  // ============ HOME & GARDEN - Furniture ============
  {
    name: "Modern Accent Armchair",
    slug: "modern-accent-armchair",
    sku: "HOME-001",
    description:
      "Stylish mid-century modern accent chair with solid wood legs and premium upholstery. Features comfortable foam cushioning and ergonomic armrests. Perfect as a reading chair, living room accent, or bedroom seating. Easy assembly with all hardware included.",
    shortDesc: "Mid-century design with premium foam cushioning",
    price: 249.99,
    comparePrice: 329.99,
    stock: 25,
    isFeatured: true,
    categorySlug: "furniture",
    brand: "ModernHome",
    barcode: "8901234567902",
    mpn: "MH-ARM-MCM",
    images: [
      {
        url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
        alt: "Modern armchair front",
        position: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=80",
        alt: "Armchair in living room",
        position: 1,
      },
    ],
    variants: [
      { name: "Color", value: "Charcoal Gray", stock: 10 },
      { name: "Color", value: "Sage Green", stock: 8 },
      { name: "Color", value: "Mustard Yellow", stock: 7 },
    ],
  },
  // ============ HOME & GARDEN - Decor & Lighting ============
  {
    name: "Minimalist LED Desk Lamp",
    slug: "minimalist-led-desk-lamp",
    sku: "HOME-002",
    description:
      "Sleek LED desk lamp with touch-sensitive controls and 5 brightness levels. Features adjustable color temperature from warm to cool white. Flexible gooseneck design allows precise positioning. USB charging port on base for convenient device charging.",
    shortDesc: "Touch-control LED lamp with USB charging port",
    price: 45.99,
    comparePrice: 59.99,
    stock: 55,
    isFeatured: false,
    categorySlug: "decor-lighting",
    brand: "LightWorks",
    barcode: "8901234567903",
    mpn: "LW-DESK-LED",
    images: [
      {
        url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80",
        alt: "LED desk lamp",
        position: 0,
      },
    ],
  },
  {
    name: "Ceramic Plant Pot Set",
    slug: "ceramic-plant-pot-set",
    sku: "HOME-003",
    description:
      "Set of 3 minimalist ceramic plant pots in graduated sizes. Features drainage holes and matching saucers for healthy plant growth. Modern matte finish complements any decor style. Perfect for succulents, herbs, or small indoor plants.",
    shortDesc: "Set of 3 with drainage holes and saucers",
    price: 39.99,
    stock: 40,
    isFeatured: false,
    categorySlug: "decor-lighting",
    brand: "GreenSpace",
    barcode: "8901234567904",
    mpn: "GS-POT-3SET",
    images: [
      {
        url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80",
        alt: "Ceramic plant pots with plants",
        position: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&q=80",
        alt: "Plant pot detail",
        position: 1,
      },
    ],
  },
  // ============ HOME & GARDEN - Kitchen & Dining ============
  {
    name: "Non-Stick Cookware Set 10-Piece",
    slug: "nonstick-cookware-set-10piece",
    sku: "HOME-004",
    description:
      "Complete 10-piece cookware set featuring premium non-stick ceramic coating. Includes 2 frying pans, 2 saucepans with lids, stockpot with lid, and 2 cooking utensils. PFOA-free and suitable for all stovetops including induction. Oven safe up to 450°F.",
    shortDesc: "PFOA-free ceramic set for all stovetops",
    price: 149.99,
    comparePrice: 199.99,
    stock: 30,
    isFeatured: true,
    categorySlug: "kitchen-dining",
    brand: "ChefMaster",
    barcode: "8901234567905",
    mpn: "CM-COOK-10",
    images: [
      {
        url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
        alt: "Cookware set overview",
        position: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1584990347449-a8e8e94e0930?w=600&q=80",
        alt: "Pan close-up",
        position: 1,
      },
    ],
  },
  {
    name: "Glass Food Storage Set 18-Piece",
    slug: "glass-food-storage-set-18piece",
    sku: "HOME-005",
    description:
      "Premium borosilicate glass food storage containers with snap-lock lids. Set includes 9 containers in various sizes with matching lids. Microwave, dishwasher, and freezer safe. Leak-proof seal keeps food fresh longer. BPA-free lids.",
    shortDesc: "Leak-proof glass containers, microwave safe",
    price: 54.99,
    stock: 50,
    isFeatured: false,
    categorySlug: "kitchen-dining",
    brand: "FreshKeep",
    barcode: "8901234567906",
    mpn: "FK-GLASS-18",
    images: [
      {
        url: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&q=80",
        alt: "Glass storage containers",
        position: 0,
      },
    ],
  },
  // ============ SPORTS & OUTDOORS - Fitness Equipment ============
  {
    name: "Adjustable Dumbbell Set",
    slug: "adjustable-dumbbell-set",
    sku: "SPORT-001",
    description:
      "Space-saving adjustable dumbbells that replace 15 sets of weights. Quickly adjust from 5 to 52.5 lbs per dumbbell with the turn of a dial. Features durable construction with metal plates and comfortable grip handle. Includes storage tray.",
    shortDesc: "5-52.5 lbs per dumbbell, replaces 15 sets",
    price: 299.99,
    comparePrice: 399.99,
    stock: 20,
    isFeatured: true,
    categorySlug: "fitness-equipment",
    brand: "IronFlex",
    barcode: "8901234567907",
    mpn: "IF-ADJ-52",
    images: [
      {
        url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80",
        alt: "Adjustable dumbbells",
        position: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=80",
        alt: "Dumbbells in use",
        position: 1,
      },
    ],
  },
  {
    name: "Premium Yoga Mat with Strap",
    slug: "premium-yoga-mat-with-strap",
    sku: "SPORT-002",
    description:
      "Extra thick 6mm yoga mat for superior comfort and joint protection. Features non-slip textured surface on both sides for stability. Made from eco-friendly TPE material that's free of latex and PVC. Includes carrying strap for easy transport.",
    shortDesc: "6mm thick, eco-friendly TPE with carrying strap",
    price: 39.99,
    stock: 90,
    isFeatured: false,
    categorySlug: "fitness-equipment",
    brand: "ZenFit",
    barcode: "8901234567908",
    mpn: "ZF-MAT-6MM",
    images: [
      {
        url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
        alt: "Purple yoga mat",
        position: 0,
      },
    ],
    variants: [
      { name: "Color", value: "Deep Purple", stock: 30 },
      { name: "Color", value: "Ocean Blue", stock: 30 },
      { name: "Color", value: "Forest Green", stock: 30 },
    ],
  },
  // ============ SPORTS & OUTDOORS - Outdoor Gear ============
  {
    name: "4-Person Camping Tent",
    slug: "4-person-camping-tent",
    sku: "SPORT-003",
    description:
      "Spacious 4-person dome tent perfect for family camping. Features waterproof rainfly, mesh ventilation windows, and easy setup with color-coded poles. Includes electrical cord access port and interior storage pockets. Packs down into compact carrying bag.",
    shortDesc: "Waterproof dome tent with easy color-coded setup",
    price: 129.99,
    stock: 35,
    isFeatured: true,
    categorySlug: "outdoor-gear",
    brand: "TrailMaster",
    barcode: "8901234567909",
    mpn: "TM-TENT-4P",
    images: [
      {
        url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&q=80",
        alt: "Camping tent in nature",
        position: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=600&q=80",
        alt: "Tent at sunset",
        position: 1,
      },
    ],
  },
  {
    name: "Insulated Stainless Steel Water Bottle",
    slug: "insulated-stainless-steel-water-bottle",
    sku: "SPORT-004",
    description:
      "Double-wall vacuum insulated water bottle keeps drinks cold for 24 hours or hot for 12 hours. Made from 18/8 food-grade stainless steel with BPA-free lid. Features wide mouth for easy filling and cleaning. 32oz capacity perfect for all-day hydration.",
    shortDesc: "24hr cold, 12hr hot, 32oz capacity",
    price: 29.99,
    stock: 120,
    isFeatured: false,
    categorySlug: "outdoor-gear",
    brand: "HydroLife",
    barcode: "8901234567910",
    mpn: "HL-BOTTLE-32",
    images: [
      {
        url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80",
        alt: "Stainless water bottle",
        position: 0,
      },
    ],
    variants: [
      { name: "Color", value: "Midnight Black", stock: 40 },
      { name: "Color", value: "Arctic Blue", stock: 40 },
      { name: "Color", value: "Rose Pink", stock: 40 },
    ],
  },
];
