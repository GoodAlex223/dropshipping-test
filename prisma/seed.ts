import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 12;

async function main() {
  console.log("Starting database seed...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", SALT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { email: "admin@store.com" },
    update: {},
    create: {
      email: "admin@store.com",
      name: "Admin User",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log("Created admin user:", admin.email);

  // Create test customer
  const customerPassword = await bcrypt.hash("customer123", SALT_ROUNDS);
  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      name: "Test Customer",
      passwordHash: customerPassword,
      role: Role.CUSTOMER,
    },
  });
  console.log("Created test customer:", customer.email);

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "electronics" },
      update: {},
      create: {
        name: "Electronics",
        slug: "electronics",
        description: "Electronic devices and gadgets",
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: "clothing" },
      update: {},
      create: {
        name: "Clothing",
        slug: "clothing",
        description: "Fashion and apparel",
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: "home-garden" },
      update: {},
      create: {
        name: "Home & Garden",
        slug: "home-garden",
        description: "Home decor and garden supplies",
        isActive: true,
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: "sports" },
      update: {},
      create: {
        name: "Sports & Outdoors",
        slug: "sports",
        description: "Sports equipment and outdoor gear",
        isActive: true,
        sortOrder: 4,
      },
    }),
  ]);
  console.log("Created categories:", categories.length);

  // Create sample supplier
  const supplier = await prisma.supplier.upsert({
    where: { code: "MANUAL" },
    update: {},
    create: {
      name: "Manual Supplier",
      code: "MANUAL",
      email: "supplier@example.com",
      isActive: true,
      notes: "Default supplier for manually added products",
    },
  });
  console.log("Created supplier:", supplier.name);

  // Create sample products
  const electronicsCategory = categories.find((c) => c.slug === "electronics")!;
  const clothingCategory = categories.find((c) => c.slug === "clothing")!;
  const homeCategory = categories.find((c) => c.slug === "home-garden")!;

  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: "ELEC-001" },
      update: {},
      create: {
        name: "Wireless Bluetooth Headphones",
        slug: "wireless-bluetooth-headphones",
        description:
          "High-quality wireless headphones with active noise cancellation and 30-hour battery life.",
        shortDesc: "Premium wireless headphones with ANC",
        price: 79.99,
        comparePrice: 99.99,
        sku: "ELEC-001",
        stock: 50,
        categoryId: electronicsCategory.id,
        supplierId: supplier.id,
        isActive: true,
        isFeatured: true,
        images: {
          create: [
            {
              url: "https://placehold.co/600x600/1a1a2e/white?text=Headphones",
              alt: "Wireless Bluetooth Headphones",
              position: 0,
            },
          ],
        },
      },
    }),
    prisma.product.upsert({
      where: { sku: "ELEC-002" },
      update: {},
      create: {
        name: "Smart Watch Pro",
        slug: "smart-watch-pro",
        description:
          "Feature-packed smartwatch with heart rate monitoring, GPS, and 7-day battery life.",
        shortDesc: "Advanced smartwatch with health features",
        price: 149.99,
        comparePrice: 199.99,
        sku: "ELEC-002",
        stock: 30,
        categoryId: electronicsCategory.id,
        supplierId: supplier.id,
        isActive: true,
        isFeatured: true,
        images: {
          create: [
            {
              url: "https://placehold.co/600x600/16213e/white?text=Smart+Watch",
              alt: "Smart Watch Pro",
              position: 0,
            },
          ],
        },
      },
    }),
    prisma.product.upsert({
      where: { sku: "CLOTH-001" },
      update: {},
      create: {
        name: "Classic Cotton T-Shirt",
        slug: "classic-cotton-tshirt",
        description: "Comfortable 100% cotton t-shirt available in multiple colors and sizes.",
        shortDesc: "Premium cotton t-shirt",
        price: 24.99,
        sku: "CLOTH-001",
        stock: 100,
        categoryId: clothingCategory.id,
        supplierId: supplier.id,
        isActive: true,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x600/0f3460/white?text=T-Shirt",
              alt: "Classic Cotton T-Shirt",
              position: 0,
            },
          ],
        },
        variants: {
          create: [
            { name: "Size", value: "S", stock: 25 },
            { name: "Size", value: "M", stock: 30 },
            { name: "Size", value: "L", stock: 25 },
            { name: "Size", value: "XL", stock: 20 },
          ],
        },
      },
    }),
    prisma.product.upsert({
      where: { sku: "HOME-001" },
      update: {},
      create: {
        name: "Minimalist Desk Lamp",
        slug: "minimalist-desk-lamp",
        description: "Modern LED desk lamp with adjustable brightness and color temperature.",
        shortDesc: "Adjustable LED desk lamp",
        price: 39.99,
        comparePrice: 49.99,
        sku: "HOME-001",
        stock: 40,
        categoryId: homeCategory.id,
        supplierId: supplier.id,
        isActive: true,
        isFeatured: true,
        images: {
          create: [
            {
              url: "https://placehold.co/600x600/533483/white?text=Desk+Lamp",
              alt: "Minimalist Desk Lamp",
              position: 0,
            },
          ],
        },
      },
    }),
    prisma.product.upsert({
      where: { sku: "HOME-002" },
      update: {},
      create: {
        name: "Indoor Plant Pot Set",
        slug: "indoor-plant-pot-set",
        description: "Set of 3 ceramic plant pots in various sizes, perfect for indoor plants.",
        shortDesc: "Set of 3 ceramic pots",
        price: 34.99,
        sku: "HOME-002",
        stock: 25,
        categoryId: homeCategory.id,
        supplierId: supplier.id,
        isActive: true,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x600/2c3e50/white?text=Plant+Pots",
              alt: "Indoor Plant Pot Set",
              position: 0,
            },
          ],
        },
      },
    }),
  ]);
  console.log("Created products:", products.length);

  // Create store settings
  const settings = await Promise.all([
    prisma.setting.upsert({
      where: { key: "store_name" },
      update: {},
      create: {
        key: "store_name",
        value: "Store",
        type: "string",
      },
    }),
    prisma.setting.upsert({
      where: { key: "store_currency" },
      update: {},
      create: {
        key: "store_currency",
        value: "USD",
        type: "string",
      },
    }),
    prisma.setting.upsert({
      where: { key: "shipping_flat_rate" },
      update: {},
      create: {
        key: "shipping_flat_rate",
        value: "5.99",
        type: "number",
      },
    }),
    prisma.setting.upsert({
      where: { key: "free_shipping_threshold" },
      update: {},
      create: {
        key: "free_shipping_threshold",
        value: "50",
        type: "number",
      },
    }),
  ]);
  console.log("Created settings:", settings.length);

  console.log("\nSeed completed successfully!");
  console.log("\nTest accounts:");
  console.log("  Admin: admin@store.com / admin123");
  console.log("  Customer: customer@example.com / customer123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
