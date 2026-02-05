// Re-export Prisma types
export type {
  User,
  Account,
  Session,
  Category,
  Product,
  ProductImage,
  ProductVariant,
  Supplier,
  Cart,
  CartItem,
  Order,
  OrderItem,
  SupplierOrder,
  Address,
  Setting,
  Review,
} from "@prisma/client";

export { Role, OrderStatus, PaymentStatus } from "@prisma/client";

// Custom types
export interface CartItemWithProduct {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    images: { url: string; alt: string | null }[];
  };
  variant?: {
    id: string;
    name: string;
    value: string;
    price: number | null;
    stock: number;
  } | null;
}

export interface ProductWithImages {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDesc: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: {
    id: string;
    url: string;
    alt: string | null;
    position: number;
  }[];
  variants: {
    id: string;
    name: string;
    value: string;
    price: number | null;
    stock: number;
  }[];
}

export interface OrderWithItems {
  id: string;
  orderNumber: string;
  email: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  shippingAddress: ShippingAddress;
  paymentStatus: string;
  createdAt: Date;
  items: {
    id: string;
    productName: string;
    productSku: string;
    variantInfo: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export interface ShippingAddress {
  name: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Filter types
export interface ProductFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  sortBy?: "price-asc" | "price-desc" | "newest" | "name";
}
