// Category seed data with hierarchy

export const topLevelCategories = [
  {
    name: "Electronics",
    slug: "electronics",
    description: "Electronic devices, gadgets, and accessories for modern living",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80",
    sortOrder: 1,
  },
  {
    name: "Clothing & Fashion",
    slug: "clothing",
    description: "Stylish apparel and fashion accessories for every occasion",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80",
    sortOrder: 2,
  },
  {
    name: "Home & Garden",
    slug: "home-garden",
    description: "Everything for your home, from decor to garden essentials",
    image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80",
    sortOrder: 3,
  },
  {
    name: "Sports & Outdoors",
    slug: "sports",
    description: "Gear and equipment for fitness enthusiasts and outdoor adventurers",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
    sortOrder: 4,
  },
];

export const subcategories = [
  // Electronics subcategories
  {
    name: "Audio & Headphones",
    slug: "audio-headphones",
    description: "Headphones, earbuds, speakers, and audio accessories",
    parentSlug: "electronics",
    sortOrder: 1,
  },
  {
    name: "Smartphones & Accessories",
    slug: "smartphones-accessories",
    description: "Phone cases, chargers, cables, and mobile accessories",
    parentSlug: "electronics",
    sortOrder: 2,
  },
  {
    name: "Computer Accessories",
    slug: "computer-accessories",
    description: "Keyboards, mice, laptop stands, and computer peripherals",
    parentSlug: "electronics",
    sortOrder: 3,
  },
  // Clothing subcategories
  {
    name: "Men's Clothing",
    slug: "mens-clothing",
    description: "T-shirts, jeans, jackets, and casual wear for men",
    parentSlug: "clothing",
    sortOrder: 1,
  },
  {
    name: "Women's Clothing",
    slug: "womens-clothing",
    description: "Dresses, tops, activewear, and fashion for women",
    parentSlug: "clothing",
    sortOrder: 2,
  },
  {
    name: "Accessories",
    slug: "fashion-accessories",
    description: "Bags, sunglasses, watches, and fashion accessories",
    parentSlug: "clothing",
    sortOrder: 3,
  },
  // Home & Garden subcategories
  {
    name: "Furniture",
    slug: "furniture",
    description: "Chairs, tables, storage solutions, and home furniture",
    parentSlug: "home-garden",
    sortOrder: 1,
  },
  {
    name: "Decor & Lighting",
    slug: "decor-lighting",
    description: "Lamps, wall art, decorative items, and home accents",
    parentSlug: "home-garden",
    sortOrder: 2,
  },
  {
    name: "Kitchen & Dining",
    slug: "kitchen-dining",
    description: "Cookware, utensils, storage containers, and kitchen essentials",
    parentSlug: "home-garden",
    sortOrder: 3,
  },
  // Sports & Outdoors subcategories
  {
    name: "Fitness Equipment",
    slug: "fitness-equipment",
    description: "Weights, yoga mats, resistance bands, and workout gear",
    parentSlug: "sports",
    sortOrder: 1,
  },
  {
    name: "Outdoor Gear",
    slug: "outdoor-gear",
    description: "Camping equipment, hiking gear, and outdoor essentials",
    parentSlug: "sports",
    sortOrder: 2,
  },
];
