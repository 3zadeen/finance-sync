import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  googleSheetsId: text("google_sheets_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  isAutoCategorized: boolean("is_auto_categorized").default(false),
  needsReview: boolean("needs_review").default(false),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bankStatements = pgTable("bank_statements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  filename: text("filename").notNull(),
  fileSize: integer("file_size").notNull(),
  processingStatus: text("processing_status").notNull().default("pending"), // pending, processing, completed, failed
  transactionCount: integer("transaction_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const updateTransactionSchema = createInsertSchema(transactions).pick({
  description: true,
  categoryId: true,
  amount: true,
});

export const insertBankStatementSchema = createInsertSchema(bankStatements).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;
export type BankStatement = typeof bankStatements.$inferSelect;
export type InsertBankStatement = z.infer<typeof insertBankStatementSchema>;
