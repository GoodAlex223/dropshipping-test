// Order seed data with various statuses

// Dates for realistic order history (backdated 1-3 months)
const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

export const orders = [
  // DELIVERED orders (for reviews)
  {
    orderNumber: "ORD-2026-0001",
    customerEmail: "customer@example.com",
    status: "DELIVERED",
    paymentStatus: "PAID",
    shippingAddress: {
      fullName: "John Smith",
      addressLine1: "123 Main Street",
      addressLine2: "Apt 4B",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "United States",
    },
    items: [
      {
        productSku: "ELEC-001",
        productName: "Wireless Bluetooth Headphones",
        quantity: 1,
        unitPrice: 89.99,
      },
      {
        productSku: "ELEC-003",
        productName: "Fast Charging USB-C Cable 2-Pack",
        quantity: 2,
        unitPrice: 19.99,
      },
    ],
    createdAt: daysAgo(45),
  },
  {
    orderNumber: "ORD-2026-0002",
    customerEmail: "sarah.wilson@example.com",
    status: "DELIVERED",
    paymentStatus: "PAID",
    shippingAddress: {
      fullName: "Sarah Wilson",
      addressLine1: "456 Oak Avenue",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90001",
      country: "United States",
    },
    items: [
      {
        productSku: "CLOTH-003",
        productName: "Floral Print Summer Dress",
        quantity: 1,
        unitPrice: 49.99,
      },
      {
        productSku: "CLOTH-005",
        productName: "Classic Leather Crossbody Bag",
        quantity: 1,
        unitPrice: 79.99,
      },
    ],
    createdAt: daysAgo(38),
  },
  {
    orderNumber: "ORD-2026-0003",
    customerEmail: "mike.johnson@example.com",
    status: "DELIVERED",
    paymentStatus: "PAID",
    shippingAddress: {
      fullName: "Mike Johnson",
      addressLine1: "789 Pine Road",
      city: "Chicago",
      state: "IL",
      postalCode: "60601",
      country: "United States",
    },
    items: [
      {
        productSku: "SPORT-001",
        productName: "Adjustable Dumbbell Set",
        quantity: 1,
        unitPrice: 299.99,
      },
      {
        productSku: "SPORT-002",
        productName: "Premium Yoga Mat with Strap",
        quantity: 1,
        unitPrice: 39.99,
      },
    ],
    createdAt: daysAgo(30),
  },
  {
    orderNumber: "ORD-2026-0004",
    customerEmail: "emily.chen@example.com",
    status: "DELIVERED",
    paymentStatus: "PAID",
    shippingAddress: {
      fullName: "Emily Chen",
      addressLine1: "321 Maple Drive",
      addressLine2: "Suite 100",
      city: "San Francisco",
      state: "CA",
      postalCode: "94102",
      country: "United States",
    },
    items: [
      {
        productSku: "HOME-001",
        productName: "Modern Accent Armchair",
        quantity: 1,
        unitPrice: 249.99,
      },
      {
        productSku: "HOME-003",
        productName: "Ceramic Plant Pot Set",
        quantity: 2,
        unitPrice: 39.99,
      },
    ],
    createdAt: daysAgo(25),
  },
  // SHIPPED order
  {
    orderNumber: "ORD-2026-0005",
    customerEmail: "customer@example.com",
    status: "SHIPPED",
    paymentStatus: "PAID",
    shippingAddress: {
      fullName: "John Smith",
      addressLine1: "123 Main Street",
      addressLine2: "Apt 4B",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "United States",
    },
    items: [
      {
        productSku: "HOME-004",
        productName: "Non-Stick Cookware Set 10-Piece",
        quantity: 1,
        unitPrice: 149.99,
      },
    ],
    createdAt: daysAgo(7),
  },
  // PROCESSING order
  {
    orderNumber: "ORD-2026-0006",
    customerEmail: "sarah.wilson@example.com",
    status: "PROCESSING",
    paymentStatus: "PAID",
    shippingAddress: {
      fullName: "Sarah Wilson",
      addressLine1: "456 Oak Avenue",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90001",
      country: "United States",
    },
    items: [
      {
        productSku: "ELEC-002",
        productName: "True Wireless Earbuds Pro",
        quantity: 1,
        unitPrice: 129.99,
      },
      {
        productSku: "ELEC-005",
        productName: "Ergonomic Laptop Stand",
        quantity: 1,
        unitPrice: 49.99,
      },
    ],
    createdAt: daysAgo(3),
  },
  // PENDING order
  {
    orderNumber: "ORD-2026-0007",
    customerEmail: "mike.johnson@example.com",
    status: "PENDING",
    paymentStatus: "PENDING",
    shippingAddress: {
      fullName: "Mike Johnson",
      addressLine1: "789 Pine Road",
      city: "Chicago",
      state: "IL",
      postalCode: "60601",
      country: "United States",
    },
    items: [
      {
        productSku: "SPORT-003",
        productName: "4-Person Camping Tent",
        quantity: 1,
        unitPrice: 129.99,
      },
      {
        productSku: "SPORT-004",
        productName: "Insulated Stainless Steel Water Bottle",
        quantity: 2,
        unitPrice: 29.99,
      },
    ],
    createdAt: daysAgo(1),
  },
];
