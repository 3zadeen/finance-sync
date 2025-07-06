import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { PDFParser } from "./services/pdfParser";
import { AICategorizer } from "./services/aiCategorizer";
import { GoogleSheetsService } from "./services/googleSheets";
import { insertTransactionSchema, updateTransactionSchema } from "@shared/schema";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

const pdfParser = new PDFParser();
const aiCategorizer = new AICategorizer();
const googleSheetsService = new GoogleSheetsService();

export async function registerRoutes(app: Express): Promise<Server> {
  // Get dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const userId = 1; // Default user for demo
      const stats = await storage.getTransactionStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const userId = 1; // Default user for demo
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const transactions = await storage.getTransactions(userId, limit, offset);
      const categories = await storage.getCategories(userId);
      
      // Join transaction with category data
      const transactionsWithCategory = transactions.map(transaction => {
        const category = categories.find(c => c.id === transaction.categoryId);
        return {
          ...transaction,
          category: category ? {
            name: category.name,
            color: category.color,
            icon: category.icon,
          } : null,
        };
      });
      
      res.json(transactionsWithCategory);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update transaction
  app.patch("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = updateTransactionSchema.parse(req.body);
      
      const updatedTransaction = await storage.updateTransaction(id, updates);
      res.json(updatedTransaction);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get categories
  app.get("/api/categories", async (req, res) => {
    try {
      const userId = 1; // Default user for demo
      const categories = await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get category breakdown
  app.get("/api/category-breakdown", async (req, res) => {
    try {
      const userId = 1; // Default user for demo
      const breakdown = await storage.getCategoryBreakdown(userId);
      res.json(breakdown);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Upload bank statement
  app.post("/api/upload-statement", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = 1; // Default user for demo
      
      // Create bank statement record
      const statement = await storage.createBankStatement({
        userId,
        filename: req.file.originalname,
        fileSize: req.file.size,
        processingStatus: "processing",
        transactionCount: 0,
      });

      // Process PDF in background (simulate async processing)
      setTimeout(async () => {
        try {
          // Parse PDF
          const parsedTransactions = await pdfParser.parseBankStatement(req.file!.buffer);
          
          // Get or create default categories
          const categories = await storage.getDefaultCategories(userId);
          
          // Categorize transactions with AI
          const categorizations = await aiCategorizer.categorizeTransactionsBatch(
            parsedTransactions.map(t => ({ description: t.description, amount: t.amount }))
          );

          // Create transactions in storage
          for (let i = 0; i < parsedTransactions.length; i++) {
            const parsed = parsedTransactions[i];
            const categorization = categorizations[i];
            
            const category = categories.find(c => c.name === categorization.categoryName);
            
            await storage.createTransaction({
              userId,
              description: parsed.description,
              amount: parsed.amount.toString(),
              date: new Date(parsed.date),
              categoryId: category?.id || null,
              isAutoCategorized: true,
              needsReview: categorization.confidence < 0.8,
              rawData: { 
                originalText: parsed.rawText,
                aiConfidence: categorization.confidence,
                aiReasoning: categorization.reasoning,
              },
            });
          }

          // Update statement status
          await storage.updateBankStatementStatus(statement.id, "completed", parsedTransactions.length);

          // Auto-sync to Google Sheets if configured
          const user = await storage.getUser(userId);
          if (user?.googleAccessToken && user?.googleSheetsId) {
            try {
              const allTransactions = await storage.getTransactions(userId);
              const categories = await storage.getCategories(userId);
              
              const sheetsData = allTransactions.map(t => {
                const category = categories.find(c => c.id === t.categoryId);
                return {
                  date: new Date(t.date).toLocaleDateString(),
                  description: t.description,
                  amount: t.amount,
                  category: category?.name || 'Uncategorized',
                };
              });

              await googleSheetsService.syncTransactions(
                user.googleAccessToken,
                user.googleSheetsId,
                sheetsData
              );
            } catch (syncError) {
              console.error('Auto-sync to Google Sheets failed:', syncError);
            }
          }

        } catch (error) {
          console.error('PDF processing failed:', error);
          await storage.updateBankStatementStatus(statement.id, "failed");
        }
      }, 100); // Small delay to return response immediately

      res.json({ 
        message: "File uploaded successfully", 
        statementId: statement.id,
        status: "processing" 
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get Google Sheets OAuth URL
  app.get("/api/google-auth-url", async (req, res) => {
    try {
      const authUrl = await googleSheetsService.getOAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Handle Google OAuth callback
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ message: "No authorization code provided" });
      }

      const { accessToken, refreshToken } = await googleSheetsService.exchangeCodeForTokens(code as string);
      
      const userId = 1; // Default user for demo
      await storage.updateUserGoogleTokens(userId, accessToken, refreshToken);

      // Don't create a new spreadsheet, just store the tokens
      // User will provide their existing spreadsheet ID later
      
      // Redirect back to dashboard
      res.redirect("/?google-connected=true");
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect("/?google-error=true");
    }
  });

  // Set existing spreadsheet ID
  app.post("/api/set-spreadsheet-id", async (req, res) => {
    try {
      const { spreadsheetId } = req.body;
      if (!spreadsheetId) {
        return res.status(400).json({ message: "Spreadsheet ID is required" });
      }

      const userId = 1; // Default user for demo
      const user = await storage.getUser(userId);
      
      if (!user?.googleAccessToken) {
        return res.status(400).json({ message: "Google account not connected" });
      }

      // Verify the spreadsheet exists and we have access
      try {
        await googleSheetsService.verifySpreadsheetAccess(user.googleAccessToken, spreadsheetId);
        await storage.updateUserSheetsId(userId, spreadsheetId);
        res.json({ message: "Spreadsheet connected successfully" });
      } catch (error) {
        res.status(400).json({ message: "Cannot access spreadsheet. Please check the ID and permissions." });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Sync to Google Sheets manually
  app.post("/api/sync-google-sheets", async (req, res) => {
    try {
      const userId = 1; // Default user for demo
      const user = await storage.getUser(userId);
      
      if (!user?.googleAccessToken || !user?.googleSheetsId) {
        return res.status(400).json({ message: "Google Sheets not connected" });
      }

      const transactions = await storage.getTransactions(userId);
      const categories = await storage.getCategories(userId);
      
      const sheetsData = transactions.map(t => {
        const category = categories.find(c => c.id === t.categoryId);
        return {
          date: new Date(t.date).toLocaleDateString(),
          description: t.description,
          amount: t.amount,
          category: category?.name || 'Uncategorized',
        };
      });

      await googleSheetsService.syncTransactions(
        user.googleAccessToken,
        user.googleSheetsId,
        sheetsData
      );

      res.json({ message: "Synced to Google Sheets successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Check Google Sheets connection status
  app.get("/api/google-sheets-status", async (req, res) => {
    try {
      const userId = 1; // Default user for demo
      const user = await storage.getUser(userId);
      
      res.json({
        connected: !!user?.googleAccessToken,
        spreadsheetId: user?.googleSheetsId || null,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
