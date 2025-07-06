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

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserGoogleTokens(userId: number, accessToken: string, refreshToken: string): Promise<void>;
  updateUserSheetsId(userId: number, sheetsId: string): Promise<void>;

  // Category methods
  getCategories(userId: number): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  getDefaultCategories(userId: number): Promise<Category[]>;

  // Transaction methods
  getTransactions(userId: number, limit?: number, offset?: number): Promise<Transaction[]>;
  getTransactionsByCategory(userId: number, categoryId: number): Promise<Transaction[]>;
  getTransactionsPendingReview(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, updates: UpdateTransaction): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;

  // Bank statement methods
  createBankStatement(statement: InsertBankStatement): Promise<BankStatement>;
  updateBankStatementStatus(id: number, status: string, transactionCount?: number): Promise<void>;
  getBankStatements(userId: number): Promise<BankStatement[]>;

  // Stats methods
  getTransactionStats(userId: number): Promise<{
    totalTransactions: number;
    autoCategorizedPercentage: number;
    pendingReview: number;
  }>;
  getCategoryBreakdown(userId: number): Promise<Array<{
    categoryName: string;
    categoryColor: string;
    total: string;
  }>>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private transactions: Map<number, Transaction>;
  private bankStatements: Map<number, BankStatement>;
  private currentUserId: number;
  private currentCategoryId: number;
  private currentTransactionId: number;
  private currentStatementId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.transactions = new Map();
    this.bankStatements = new Map();
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentTransactionId = 1;
    this.currentStatementId = 1;
    
    // Create default user
    this.createDefaultUser();
  }

  private async createDefaultUser() {
    const user: User = {
      id: this.currentUserId++,
      username: "demo",
      password: "password",
      googleAccessToken: null,
      googleRefreshToken: null,
      googleSheetsId: null,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    
    // Create default categories
    await this.getDefaultCategories(user.id);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      googleAccessToken: null,
      googleRefreshToken: null,
      googleSheetsId: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserGoogleTokens(userId: number, accessToken: string, refreshToken: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.googleAccessToken = accessToken;
      user.googleRefreshToken = refreshToken;
    }
  }

  async updateUserSheetsId(userId: number, sheetsId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.googleSheetsId = sheetsId;
    }
  }

  async getCategories(userId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(cat => cat.userId === userId);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async getDefaultCategories(userId: number): Promise<Category[]> {
    const existing = await this.getCategories(userId);
    if (existing.length > 0) return existing;

    const defaultCategories = [
      { name: "Groceries", color: "#3B82F6", icon: "fas fa-shopping-cart", userId },
      { name: "Housing", color: "#10B981", icon: "fas fa-home", userId },
      { name: "Transportation", color: "#EF4444", icon: "fas fa-gas-pump", userId },
      { name: "Entertainment", color: "#8B5CF6", icon: "fas fa-film", userId },
      { name: "Utilities", color: "#F59E0B", icon: "fas fa-bolt", userId },
      { name: "Healthcare", color: "#EC4899", icon: "fas fa-heartbeat", userId },
      { name: "Uncategorized", color: "#F97316", icon: "fas fa-question", userId },
    ];

    const categories = [];
    for (const cat of defaultCategories) {
      categories.push(await this.createCategory(cat));
    }
    return categories;
  }

  async getTransactions(userId: number, limit = 50, offset = 0): Promise<Transaction[]> {
    const userTransactions = Array.from(this.transactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(offset, offset + limit);
    return userTransactions;
  }

  async getTransactionsByCategory(userId: number, categoryId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.userId === userId && t.categoryId === categoryId);
  }

  async getTransactionsPendingReview(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.userId === userId && t.needsReview);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const newTransaction: Transaction = {
      ...transaction,
      id,
      createdAt: new Date(),
    };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  async updateTransaction(id: number, updates: UpdateTransaction): Promise<Transaction> {
    const transaction = this.transactions.get(id);
    if (!transaction) throw new Error("Transaction not found");
    
    const updated = { ...transaction, ...updates };
    this.transactions.set(id, updated);
    return updated;
  }

  async deleteTransaction(id: number): Promise<void> {
    this.transactions.delete(id);
  }

  async createBankStatement(statement: InsertBankStatement): Promise<BankStatement> {
    const id = this.currentStatementId++;
    const newStatement: BankStatement = {
      ...statement,
      id,
      createdAt: new Date(),
    };
    this.bankStatements.set(id, newStatement);
    return newStatement;
  }

  async updateBankStatementStatus(id: number, status: string, transactionCount?: number): Promise<void> {
    const statement = this.bankStatements.get(id);
    if (statement) {
      statement.processingStatus = status;
      if (transactionCount !== undefined) {
        statement.transactionCount = transactionCount;
      }
    }
  }

  async getBankStatements(userId: number): Promise<BankStatement[]> {
    return Array.from(this.bankStatements.values()).filter(s => s.userId === userId);
  }

  async getTransactionStats(userId: number): Promise<{
    totalTransactions: number;
    autoCategorizedPercentage: number;
    pendingReview: number;
  }> {
    const userTransactions = Array.from(this.transactions.values()).filter(t => t.userId === userId);
    const totalTransactions = userTransactions.length;
    const autoCategorized = userTransactions.filter(t => t.isAutoCategorized).length;
    const pendingReview = userTransactions.filter(t => t.needsReview).length;
    
    return {
      totalTransactions,
      autoCategorizedPercentage: totalTransactions > 0 ? Math.round((autoCategorized / totalTransactions) * 100) : 0,
      pendingReview,
    };
  }

  async getCategoryBreakdown(userId: number): Promise<Array<{
    categoryName: string;
    categoryColor: string;
    total: string;
  }>> {
    const userTransactions = Array.from(this.transactions.values()).filter(t => t.userId === userId);
    const categories = await this.getCategories(userId);
    
    const breakdown = categories.map(category => {
      const categoryTransactions = userTransactions.filter(t => t.categoryId === category.id);
      const total = categoryTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
      
      return {
        categoryName: category.name,
        categoryColor: category.color,
        total: total.toFixed(2),
      };
    }).filter(item => parseFloat(item.total) > 0);
    
    return breakdown;
  }
}

// Export storage instance - switch between MemStorage and SupabaseStorage
// For production, use SupabaseStorage with DATABASE_URL
import { SupabaseStorage } from './supabaseStorage';

// Use Supabase if DATABASE_URL is available, otherwise fall back to MemStorage
export const storage = process.env.DATABASE_URL ? new SupabaseStorage() : new MemStorage();
