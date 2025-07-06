import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface CategorySuggestion {
  categoryName: string;
  confidence: number;
  reasoning: string;
}

export class AICategorizer {
  private readonly categories = [
    "Groceries",
    "Housing", 
    "Transportation",
    "Entertainment",
    "Utilities",
    "Healthcare",
    "Uncategorized"
  ];

  async categorizeTransaction(description: string, amount: number): Promise<CategorySuggestion> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a financial transaction categorization expert. Analyze the transaction description and amount to categorize it into one of these categories: ${this.categories.join(", ")}.

Respond with JSON in this exact format:
{
  "categoryName": "category_name",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this category was chosen"
}

Guidelines:
- Choose the most appropriate category based on the description
- Confidence should be between 0.1 and 1.0
- If uncertain, use "Uncategorized" with lower confidence
- Consider common merchant names and transaction patterns
- For unclear transactions, default to "Uncategorized"`
          },
          {
            role: "user",
            content: `Categorize this transaction:
Description: "${description}"
Amount: $${Math.abs(amount).toFixed(2)}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // Low temperature for consistent categorization
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Validate response
      if (!result.categoryName || !this.categories.includes(result.categoryName)) {
        result.categoryName = "Uncategorized";
        result.confidence = 0.5;
        result.reasoning = "Could not determine appropriate category";
      }

      // Ensure confidence is within valid range
      result.confidence = Math.max(0.1, Math.min(1.0, result.confidence || 0.5));

      return {
        categoryName: result.categoryName,
        confidence: result.confidence,
        reasoning: result.reasoning || "AI categorization",
      };

    } catch (error) {
      console.error("AI categorization failed:", error);
      // Fallback to rule-based categorization
      return this.fallbackCategorization(description, amount);
    }
  }

  async categorizeTransactionsBatch(transactions: Array<{description: string, amount: number}>): Promise<CategorySuggestion[]> {
    try {
      const batchPrompt = transactions.map((t, index) => 
        `${index + 1}. Description: "${t.description}", Amount: $${Math.abs(t.amount).toFixed(2)}`
      ).join('\n');

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a financial transaction categorization expert. Categorize each transaction into one of these categories: ${this.categories.join(", ")}.

Respond with JSON array in this exact format:
[
  {
    "categoryName": "category_name",
    "confidence": 0.95,
    "reasoning": "Brief explanation"
  }
]

The array should have the same number of items as input transactions, in the same order.`
          },
          {
            role: "user",
            content: `Categorize these transactions:\n${batchPrompt}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0].message.content || "[]");
      const results = Array.isArray(result) ? result : result.categories || [];

      // Validate and fill missing results
      const validatedResults: CategorySuggestion[] = [];
      for (let i = 0; i < transactions.length; i++) {
        const suggestion = results[i];
        if (suggestion && this.categories.includes(suggestion.categoryName)) {
          validatedResults.push({
            categoryName: suggestion.categoryName,
            confidence: Math.max(0.1, Math.min(1.0, suggestion.confidence || 0.5)),
            reasoning: suggestion.reasoning || "AI categorization",
          });
        } else {
          validatedResults.push(this.fallbackCategorization(transactions[i].description, transactions[i].amount));
        }
      }

      return validatedResults;

    } catch (error) {
      console.error("Batch AI categorization failed:", error);
      // Fallback to individual categorization
      return Promise.all(transactions.map(t => this.categorizeTransaction(t.description, t.amount)));
    }
  }

  private fallbackCategorization(description: string, amount: number): CategorySuggestion {
    const desc = description.toLowerCase();
    
    // Rule-based categorization patterns
    const patterns = {
      "Groceries": ["grocery", "market", "food", "kroger", "safeway", "whole foods", "trader joe", "costco", "walmart"],
      "Transportation": ["gas", "fuel", "shell", "chevron", "uber", "lyft", "taxi", "parking", "metro"],
      "Entertainment": ["netflix", "spotify", "movie", "theater", "game", "restaurant", "bar", "coffee"],
      "Utilities": ["electric", "power", "water", "internet", "phone", "cable", "utility"],
      "Healthcare": ["pharmacy", "doctor", "medical", "hospital", "clinic", "cvs", "walgreens"],
      "Housing": ["rent", "mortgage", "insurance", "hoa"],
    };

    for (const [category, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return {
          categoryName: category,
          confidence: 0.7,
          reasoning: `Matched keyword pattern for ${category}`,
        };
      }
    }

    return {
      categoryName: "Uncategorized",
      confidence: 0.5,
      reasoning: "No clear category pattern found",
    };
  }
}
