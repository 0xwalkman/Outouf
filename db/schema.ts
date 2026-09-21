import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const audit = { createdAt: integer("created_at", { mode: "timestamp" }).notNull(), updatedAt: integer("updated_at", { mode: "timestamp" }).notNull() };

export const cartItems = sqliteTable("cart_items", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  productId: text("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (t) => [uniqueIndex("cart_user_product_unique").on(t.userId, t.productId)]);

export const users = sqliteTable("users", { id: text("id").primaryKey(), googleSubject: text("google_subject"), email: text("email"), walletAddress: text("wallet_address"), referralCode: text("referral_code").notNull(), ...audit }, (t) => [uniqueIndex("users_referral_code_unique").on(t.referralCode), uniqueIndex("users_google_subject_unique").on(t.googleSubject)]);
export const products = sqliteTable("products", { id: text("id").primaryKey(), title: text("title").notNull(), category: text("category").notNull(), priceUsdc: integer("price_usdc").notNull(), supplierRef: text("supplier_ref"), active: integer("active", { mode: "boolean" }).notNull().default(true), ...audit }, (t) => [index("idx_products_category_active").on(t.category, t.active)]);
export const orders = sqliteTable("orders", { id: text("id").primaryKey(), buyerId: text("buyer_id").notNull().references(() => users.id), affiliateId: text("affiliate_id").references(() => users.id), arcTxHash: text("arc_tx_hash"), amountUsdc: integer("amount_usdc").notNull(), affiliateRewardUsdc: integer("affiliate_reward_usdc").notNull().default(0), status: text("status").notNull(), ...audit }, (t) => [index("idx_orders_buyer_created").on(t.buyerId, t.createdAt), index("idx_orders_status_created").on(t.status, t.createdAt)]);
export const orderItems = sqliteTable("order_items", { id: text("id").primaryKey(), orderId: text("order_id").notNull().references(() => orders.id), productId: text("product_id").notNull().references(() => products.id), quantity: integer("quantity").notNull(), unitPriceUsdc: integer("unit_price_usdc").notNull() }, (t) => [index("idx_order_items_order_id").on(t.orderId)]);
export const affiliatePayouts = sqliteTable("affiliate_payouts", { id: text("id").primaryKey(), orderId: text("order_id").notNull().references(() => orders.id), affiliateId: text("affiliate_id").notNull().references(() => users.id), amountUsdc: integer("amount_usdc").notNull(), arcTxHash: text("arc_tx_hash"), status: text("status").notNull(), ...audit }, (t) => [index("idx_affiliate_payouts_affiliate_status").on(t.affiliateId, t.status)]);
