# API Endpoints Reference

Complete API documentation for the Dropshipping E-commerce Platform.

**Last Updated**: 2026-01-07

---

## Overview

The API is built with Next.js App Router API routes. All endpoints return JSON responses.

### Base URL

- Development: `http://localhost:3000/api`
- Production: `https://yourdomain.com/api`

### Authentication

Most endpoints require authentication via NextAuth.js session cookies. Admin endpoints require the `ADMIN` role.

### Response Format

**Success Response**:

```json
{
  "data": { ... },
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Error Response**:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

---

## Public Endpoints

### Products

#### GET /api/products

List products with pagination, search, and filters.

**Query Parameters**:

| Parameter | Type    | Default | Description                                                      |
| --------- | ------- | ------- | ---------------------------------------------------------------- |
| page      | number  | 1       | Page number                                                      |
| pageSize  | number  | 20      | Items per page (max 100)                                         |
| search    | string  | -       | Search in name, description, SKU                                 |
| category  | string  | -       | Filter by category slug                                          |
| minPrice  | number  | -       | Minimum price filter                                             |
| maxPrice  | number  | -       | Maximum price filter                                             |
| sort      | string  | newest  | Sort: newest, oldest, price_asc, price_desc, name_asc, name_desc |
| featured  | boolean | -       | Filter featured products only                                    |

**Response**: `200 OK`

```json
{
  "products": [
    {
      "id": "clx...",
      "name": "Product Name",
      "slug": "product-name",
      "price": "29.99",
      "comparePrice": "39.99",
      "stock": 10,
      "images": [{ "url": "...", "alt": "..." }],
      "category": { "name": "Category", "slug": "category" }
    }
  ],
  "pagination": { ... }
}
```

---

#### GET /api/products/[slug]

Get single product by slug with related products.

**Response**: `200 OK`

```json
{
  "id": "clx...",
  "name": "Product Name",
  "slug": "product-name",
  "description": "...",
  "price": "29.99",
  "comparePrice": "39.99",
  "stock": 10,
  "sku": "SKU-001",
  "images": [...],
  "variants": [...],
  "category": { ... },
  "relatedProducts": [...]
}
```

**Errors**:

- `404 Not Found`: Product not found

---

### Categories

#### GET /api/categories

List categories with optional filters.

**Query Parameters**:

| Parameter  | Type    | Default | Description                      |
| ---------- | ------- | ------- | -------------------------------- |
| parentOnly | boolean | false   | Return only top-level categories |

**Response**: `200 OK`

```json
{
  "categories": [
    {
      "id": "clx...",
      "name": "Category",
      "slug": "category",
      "image": "...",
      "productCount": 10,
      "children": [...]
    }
  ]
}
```

---

#### GET /api/categories/[slug]

Get single category by slug.

**Response**: `200 OK`

```json
{
  "id": "clx...",
  "name": "Category",
  "slug": "category",
  "description": "...",
  "image": "...",
  "parent": { ... },
  "children": [...]
}
```

---

### Cart

#### POST /api/cart/validate

Validate cart items against current stock and prices.

**Request Body**:

```json
{
  "items": [
    {
      "productId": "clx...",
      "variantId": "clx...",
      "quantity": 2
    }
  ]
}
```

**Response**: `200 OK`

```json
{
  "valid": true,
  "items": [
    {
      "productId": "clx...",
      "available": true,
      "currentPrice": "29.99",
      "availableStock": 10
    }
  ],
  "warnings": []
}
```

---

### Checkout

#### POST /api/checkout/create-payment-intent

Create Stripe PaymentIntent for checkout.

**Request Body**:

```json
{
  "items": [{ "productId": "clx...", "quantity": 2 }],
  "shippingMethod": "standard",
  "shippingAddress": {
    "name": "John Doe",
    "line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  },
  "email": "john@example.com"
}
```

**Response**: `200 OK`

```json
{
  "clientSecret": "pi_..._secret_...",
  "paymentIntentId": "pi_...",
  "totals": {
    "subtotal": "59.98",
    "shipping": "5.99",
    "tax": "5.40",
    "total": "71.37"
  }
}
```

**Errors**:

- `400 Bad Request`: Invalid items or out of stock
- `500 Internal Server Error`: Stripe error

---

#### POST /api/checkout/confirm-order

Confirm order after successful payment.

**Request Body**:

```json
{
  "paymentIntentId": "pi_...",
  "shippingAddress": { ... },
  "email": "john@example.com",
  "phone": "+1234567890",
  "customerNotes": "Please leave at door"
}
```

**Response**: `200 OK`

```json
{
  "orderId": "clx...",
  "orderNumber": "ORD-20260105-ABCD"
}
```

---

## Protected Endpoints (Authentication Required)

### Orders

#### GET /api/orders

List orders for authenticated user.

**Query Parameters**:

| Parameter | Type   | Default | Description            |
| --------- | ------ | ------- | ---------------------- |
| page      | number | 1       | Page number            |
| pageSize  | number | 10      | Items per page         |
| status    | string | -       | Filter by order status |

**Response**: `200 OK`

```json
{
  "orders": [
    {
      "id": "clx...",
      "orderNumber": "ORD-20260105-ABCD",
      "status": "PROCESSING",
      "total": "71.37",
      "createdAt": "2026-01-05T..."
    }
  ],
  "pagination": { ... }
}
```

---

#### GET /api/orders/[id]

Get single order detail.

**Response**: `200 OK`

```json
{
  "id": "clx...",
  "orderNumber": "ORD-20260105-ABCD",
  "status": "PROCESSING",
  "paymentStatus": "PAID",
  "items": [...],
  "subtotal": "59.98",
  "shippingCost": "5.99",
  "tax": "5.40",
  "total": "71.37",
  "shippingAddress": { ... },
  "trackingNumber": "...",
  "trackingUrl": "..."
}
```

---

## Admin Endpoints (Admin Role Required)

### Admin Products

#### GET /api/admin/products

List all products with admin filters.

**Query Parameters**:

| Parameter | Type   | Description           |
| --------- | ------ | --------------------- |
| page      | number | Page number           |
| pageSize  | number | Items per page        |
| search    | string | Search products       |
| category  | string | Filter by category ID |
| status    | string | active, inactive, all |
| supplier  | string | Filter by supplier ID |

---

#### POST /api/admin/products

Create new product.

**Request Body**:

```json
{
  "name": "Product Name",
  "slug": "product-name",
  "description": "...",
  "price": 29.99,
  "comparePrice": 39.99,
  "sku": "SKU-001",
  "stock": 100,
  "categoryId": "clx...",
  "isActive": true,
  "isFeatured": false
}
```

---

#### GET /api/admin/products/[id]

Get single product for editing.

---

#### PUT /api/admin/products/[id]

Update product.

---

#### DELETE /api/admin/products/[id]

Delete product.

---

#### POST /api/admin/products/import

Import products from CSV.

**Request Body**: `multipart/form-data`

- `file`: CSV file
- `updateExisting`: boolean

---

#### GET /api/admin/products/import

Download CSV template.

---

### Admin Product Images

#### GET /api/admin/products/[id]/images

List product images.

---

#### POST /api/admin/products/[id]/images

Add image to product.

---

#### PUT /api/admin/products/[id]/images

Reorder images.

---

#### DELETE /api/admin/products/[id]/images/[imageId]

Delete image.

---

### Admin Categories

#### GET /api/admin/categories

List all categories.

---

#### POST /api/admin/categories

Create category.

---

#### GET /api/admin/categories/[id]

Get category.

---

#### PUT /api/admin/categories/[id]

Update category.

---

#### DELETE /api/admin/categories/[id]

Delete category (fails if has products or children).

---

### Admin Orders

#### GET /api/admin/orders

List all orders with filters.

**Query Parameters**:

| Parameter     | Type   | Description               |
| ------------- | ------ | ------------------------- |
| page          | number | Page number               |
| pageSize      | number | Items per page            |
| search        | string | Order number, email, name |
| status        | string | Order status filter       |
| paymentStatus | string | Payment status filter     |
| fromDate      | string | Start date (ISO)          |
| toDate        | string | End date (ISO)            |
| sort          | string | Sort field                |
| sortDir       | string | asc or desc               |

---

#### GET /api/admin/orders/[id]

Get order detail with supplier orders.

---

#### PUT /api/admin/orders/[id]

Update order status, tracking info.

**Request Body**:

```json
{
  "status": "SHIPPED",
  "trackingNumber": "1Z...",
  "trackingUrl": "https://...",
  "notes": "Internal note"
}
```

---

#### GET /api/admin/orders/export

Export orders to CSV.

---

#### POST /api/admin/orders/[id]/forward

Forward order to suppliers.

---

### Admin Suppliers

#### GET /api/admin/suppliers

List suppliers.

---

#### POST /api/admin/suppliers

Create supplier.

---

#### GET /api/admin/suppliers/[id]

Get supplier with statistics.

---

#### PUT /api/admin/suppliers/[id]

Update supplier.

---

#### DELETE /api/admin/suppliers/[id]

Delete supplier (fails if has products/orders).

---

#### POST /api/admin/suppliers/[id]/test-connection

Test supplier API connection.

---

### Admin Upload

#### POST /api/admin/upload

Get presigned URL for S3 upload.

**Request Body**:

```json
{
  "filename": "image.jpg",
  "contentType": "image/jpeg"
}
```

**Response**:

```json
{
  "uploadUrl": "https://s3...",
  "fileUrl": "https://cdn..."
}
```

---

#### DELETE /api/admin/upload

Delete file from S3.

**Request Body**:

```json
{
  "fileUrl": "https://cdn..."
}
```

---

### Admin Queue

#### GET /api/admin/queue

Get background job queue statistics.

**Response**:

```json
{
  "orderForwarding": {
    "waiting": 0,
    "active": 1,
    "completed": 50,
    "failed": 2
  },
  "orderStatusSync": { ... }
}
```

---

## Authentication Endpoints

### POST /api/auth/register

Register new user.

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

---

### NextAuth.js Endpoints

- `GET/POST /api/auth/[...nextauth]` - NextAuth.js handlers
- `GET /api/auth/session` - Get current session
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out

---

## Error Codes

| Code             | HTTP Status | Description               |
| ---------------- | ----------- | ------------------------- |
| UNAUTHORIZED     | 401         | Authentication required   |
| FORBIDDEN        | 403         | Insufficient permissions  |
| NOT_FOUND        | 404         | Resource not found        |
| VALIDATION_ERROR | 400         | Invalid request body      |
| OUT_OF_STOCK     | 400         | Product out of stock      |
| PAYMENT_FAILED   | 400         | Payment processing failed |
| INTERNAL_ERROR   | 500         | Server error              |

---

_See [ARCHITECTURE.md](../ARCHITECTURE.md) for system design._
