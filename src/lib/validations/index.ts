import { z } from "zod";

// Auth validations
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Product validations
export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  description: z.string().optional(),
  shortDesc: z.string().max(500).optional(),
  price: z.number().positive("Price must be positive"),
  comparePrice: z.number().positive().optional().nullable(),
  costPrice: z.number().positive().optional().nullable(),
  sku: z.string().min(1, "SKU is required"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  barcode: z.string().max(14).optional().nullable(),
  brand: z.string().max(70).optional().nullable(),
  mpn: z.string().max(70).optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

// Category validations
export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().max(255).optional(),
  description: z.string().optional().nullable(),
  image: z.string().url().optional().nullable(),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// Cart validations
export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional(),
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

// Checkout validations
export const shippingAddressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  line1: z.string().min(1, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
  phone: z.string().optional(),
});

export const checkoutSchema = z.object({
  email: z.string().email("Invalid email address"),
  shippingAddress: shippingAddressSchema,
  shippingMethod: z.string().min(1, "Shipping method is required"),
  customerNotes: z.string().max(500).optional(),
});

// Order validations
export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

// Supplier validations
export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  apiEndpoint: z.string().url().optional().nullable(),
  apiKey: z.string().optional().nullable(),
  apiType: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  notes: z.string().optional().nullable(),
});

// Google Shopping feed validations
export {
  googleShoppingItemSchema,
  validateFeedItem,
  validateFeedItemSafe,
} from "./google-shopping";
export type { GoogleShoppingItem } from "./google-shopping";

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
