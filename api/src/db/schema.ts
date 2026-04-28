import {
  pgEnum, pgTable, uuid, text, boolean, timestamp, numeric, uniqueIndex, index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const roleEnum = pgEnum('role', ['buyer', 'seller', 'admin']);
export const orderItemStatusEnum = pgEnum('order_item_status', ['pending', 'shipped', 'delivered']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  city: text('city'),
  role: roleEnum('role').notNull(),
  bannedAt: timestamp('banned_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull().default(''),
  imageUrl: text('image_url').notNull(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
});

export const listings = pgTable('listings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  pricePerKg: numeric('price_per_kg', { precision: 10, scale: 2 }).notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  sellerProductUnique: uniqueIndex('listings_seller_product_uq').on(t.sellerId, t.productId),
  sellerIdx: index('listings_seller_idx').on(t.sellerId),
  productIdx: index('listings_product_idx').on(t.productId),
}));

export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  buyerId: uuid('buyer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  kg: numeric('kg', { precision: 10, scale: 2 }).notNull(),
}, (t) => ({
  buyerListingUnique: uniqueIndex('cart_items_buyer_listing_uq').on(t.buyerId, t.listingId),
}));

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  buyerId: uuid('buyer_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  shippingAddress: text('shipping_address').notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').references(() => listings.id, { onDelete: 'set null' }),
  sellerId: uuid('seller_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  productName: text('product_name').notNull(),
  pricePerKg: numeric('price_per_kg', { precision: 10, scale: 2 }).notNull(),
  kg: numeric('kg', { precision: 10, scale: 2 }).notNull(),
  status: orderItemStatusEnum('status').notNull().default('pending'),
});

export const productsRel = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  listings: many(listings),
}));
export const listingsRel = relations(listings, ({ one }) => ({
  seller: one(users, { fields: [listings.sellerId], references: [users.id] }),
  product: one(products, { fields: [listings.productId], references: [products.id] }),
}));
export const cartItemsRel = relations(cartItems, ({ one }) => ({
  listing: one(listings, { fields: [cartItems.listingId], references: [listings.id] }),
}));
export const ordersRel = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));
export const orderItemsRel = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));
