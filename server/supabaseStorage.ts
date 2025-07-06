import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, desc, and, sql } from 'drizzle-orm';
import { 
  users, 
  categories, 
  transactions, 
  bankStatements,
  type User, 
  type InsertUser, 
  type Category, 
  type InsertCategory,
  type Transaction,
  type InsertTransaction,
  type UpdateTransaction,
  type BankStatement,
  type InsertBankStatement
} from "@shared/schema";
import { IStorage } from './storage';

export class SupabaseStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    const newUser = result[0];
    
    // Create default categories for the new user
    await this.createDefaultCategories(newUser.id);
    
    return newUser;
  }

  async updateUserGoogleTokens(userId: number, accessToken: string, refreshToken: string): Promise<void> {
    await this.db.update(users)
      .set({ 
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken
      })
      .where(eq(users.id, userId));
  }

  async updateUserSheetsId(userId: number, sheetsId: string): Promise<void> {
    await this.db.update(users)
      .set({ googleSheetsId: sheetsId })
      .where(eq(users.id, userId));
  }

  // Category methods
  async getCategories(userId: number): Promise<Category[]> {
    return await this.db.select().from(categories).where(eq(categories.userId, userId));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await this.db.insert(categories).values(category).returning();
    return result[0];
  }

  async getDefaultCategories(userId: number): Promise<Category[]> {
    return await this.getCategories(userId);
  }

  private async createDefaultCategories(userId: number): Promise<void> {
    const defaultCategories = [
      { name: "Groceries", color: "#3B82F6", icon: "fas fa-shopping-cart", userId },
      { name: "Restaurants", color: "#EF4444", icon: "fas fa-utensils", userId },
      { name: "Transportation", color: "#10B981", icon: "fas fa-car", userId },
      { name: "Entertainment", color: "#8B5CF6", icon: "fas fa-film", userId },
      { name: "Utilities", color: "#F59E0B", icon: "fas fa-bolt", userId },
      { name: "Healthcare", color: "#EC4899", icon: "fas fa-heartbeat", userId },
      { name: "Shopping", color: "#06B6D4", icon: "fas fa-shopping-bag", userId },
      { name: "Income", color: "#84CC16", icon: "fas fa-dollar-sign", userId },
      { name: "Other", color: "#6B7280", icon: "fas fa-question", userId },
    ];

    await this.db.insert(categories).values(defaultCategories);
  }

  // Transaction methods
  async getTransactions(userId: number, limit = 50, offset = 0): Promise<Transaction[]> {
    return await this.db.select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset);
  }

  async getTransactionsByCategory(userId: number, categoryId: number): Promise<Transaction[]> {
    return await this.db.select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.categoryId, categoryId)
      ));
  }

  async getTransactionsPendingReview(userId: number): Promise<Transaction[]> {
    return await this.db.select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.needsReview, true)
      ));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const result = await this.db.insert(transactions).values(transaction).returning();
    return result[0];
  }

  async updateTransaction(id: number, updates: UpdateTransaction): Promise<Transaction> {
    const result = await this.db.update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return result[0];
  }

  async deleteTransaction(id: number): Promise<void> {
    await this.db.delete(transactions).where(eq(transactions.id, id));
  }

  // Bank statement methods
  async createBankStatement(statement: InsertBankStatement): Promise<BankStatement> {
    const result = await this.db.insert(bankStatements).values(statement).returning();
    return result[0];
  }

  async updateBankStatementStatus(id: number, status: string, transactionCount?: number): Promise<void> {
    const updates: any = { status };
    if (transactionCount !== undefined) {
      updates.transactionCount = transactionCount;
    }
    
    await this.db.update(bankStatements)
      .set(updates)
      .where(eq(bankStatements.id, id));
  }

  async getBankStatements(userId: number): Promise<BankStatement[]> {
    return await this.db.select()
      .from(bankStatements)
      .where(eq(bankStatements.userId, userId))
      .orderBy(desc(bankStatements.uploadedAt));
  }

  // Stats methods
  async getTransactionStats(userId: number): Promise<{
    totalTransactions: number;
    autoCategorizedPercentage: number;
    pendingReview: number;
  }> {
    const totalResult = await this.db.select({ 
      count: sql<number>`count(*)` 
    }).from(transactions).where(eq(transactions.userId, userId));
    
    const autoCategorizedResult = await this.db.select({ 
      count: sql<number>`count(*)` 
    }).from(transactions).where(and(
      eq(transactions.userId, userId),
      eq(transactions.needsReview, false)
    ));
    
    const pendingResult = await this.db.select({ 
      count: sql<number>`count(*)` 
    }).from(transactions).where(and(
      eq(transactions.userId, userId),
      eq(transactions.needsReview, true)
    ));

    const totalTransactions = totalResult[0]?.count || 0;
    const autoCategorized = autoCategorizedResult[0]?.count || 0;
    const pendingReview = pendingResult[0]?.count || 0;

    return {
      totalTransactions,
      autoCategorizedPercentage: totalTransactions > 0 ? (autoCategorized / totalTransactions) * 100 : 0,
      pendingReview,
    };
  }

  async getCategoryBreakdown(userId: number): Promise<Array<{
    categoryName: string;
    categoryColor: string;
    total: string;
  }>> {
    const result = await this.db.select({
      categoryName: categories.name,
      categoryColor: categories.color,
      total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)::text`
    })
    .from(categories)
    .leftJoin(transactions, and(
      eq(categories.id, transactions.categoryId),
      eq(transactions.userId, userId)
    ))
    .where(eq(categories.userId, userId))
    .groupBy(categories.id, categories.name, categories.color)
    .having(sql`COALESCE(SUM(${transactions.amount}), 0) > 0`);

    return result;
  }
}