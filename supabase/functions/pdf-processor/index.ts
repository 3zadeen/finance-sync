import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  rawText: string;
}

interface CategorySuggestion {
  categoryName: string;
  confidence: number;
  reasoning: string;
}

// Basic PDF text extraction (simplified for Edge Functions)
function extractTransactions(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    // Look for transaction patterns: date, description, amount
    const transactionMatch = line.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\s+(.+?)\s+([-]?\$?\d+\.?\d*)/);
    
    if (transactionMatch) {
      const [, dateStr, description, amountStr] = transactionMatch;
      
      // Parse date
      let parsedDate: Date;
      if (dateStr.includes('/')) {
        const [month, day, year] = dateStr.split('/');
        parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        parsedDate = new Date(dateStr);
      }

      // Parse amount
      const amount = parseFloat(amountStr.replace(/[\$,]/g, ''));

      if (!isNaN(amount) && !isNaN(parsedDate.getTime())) {
        transactions.push({
          date: parsedDate.toISOString().split('T')[0],
          description: description.trim(),
          amount: Math.abs(amount), // Use absolute value
          rawText: line.trim()
        });
      }
    }
  }

  return transactions;
}

// AI categorization using OpenAI
async function categorizeTransaction(description: string, amount: number): Promise<CategorySuggestion> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    // Fallback categorization
    return fallbackCategorization(description, amount);
  }

  const categories = [
    "Groceries", "Restaurants", "Transportation", "Entertainment", 
    "Utilities", "Healthcare", "Shopping", "Income", "Other"
  ];

  const prompt = `Analyze this financial transaction and categorize it:

Transaction: "${description}"
Amount: $${amount}

Available categories: ${categories.join(', ')}

Respond with JSON in this exact format:
{
  "categoryName": "exact category name from the list",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (content) {
      const parsed = JSON.parse(content);
      return {
        categoryName: parsed.categoryName,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning
      };
    }
  } catch (error) {
    console.error('OpenAI categorization failed:', error);
  }

  return fallbackCategorization(description, amount);
}

function fallbackCategorization(description: string, amount: number): CategorySuggestion {
  const desc = description.toLowerCase();
  
  if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('walmart') || desc.includes('target')) {
    return { categoryName: 'Groceries', confidence: 0.7, reasoning: 'Contains grocery-related keywords' };
  }
  if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('food') || desc.includes('pizza')) {
    return { categoryName: 'Restaurants', confidence: 0.7, reasoning: 'Contains restaurant-related keywords' };
  }
  if (desc.includes('gas') || desc.includes('fuel') || desc.includes('uber') || desc.includes('taxi')) {
    return { categoryName: 'Transportation', confidence: 0.7, reasoning: 'Contains transportation-related keywords' };
  }
  if (desc.includes('electric') || desc.includes('utility') || desc.includes('water') || desc.includes('internet')) {
    return { categoryName: 'Utilities', confidence: 0.7, reasoning: 'Contains utility-related keywords' };
  }
  if (amount < 0) {
    return { categoryName: 'Income', confidence: 0.6, reasoning: 'Negative amount suggests income' };
  }

  return { categoryName: 'Other', confidence: 0.3, reasoning: 'Could not determine specific category' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create bank statement record
    const { data: statement, error: statementError } = await supabaseClient
      .from('bank_statements')
      .insert({
        user_id: 1,
        filename: file.name,
        status: 'processing'
      })
      .select()
      .single()

    if (statementError) throw statementError

    // Extract text from file (simplified - in production you'd use a proper PDF parser)
    const text = await file.text()
    const transactions = extractTransactions(text)

    // Get categories
    const { data: categories, error: categoriesError } = await supabaseClient
      .from('categories')
      .select('*')
      .eq('user_id', 1)

    if (categoriesError) throw categoriesError

    // Process transactions with AI categorization
    const processedTransactions = []
    for (const transaction of transactions) {
      const suggestion = await categorizeTransaction(transaction.description, transaction.amount)
      
      // Find matching category
      const category = categories.find(c => 
        c.name.toLowerCase() === suggestion.categoryName.toLowerCase()
      ) || categories.find(c => c.name === 'Other')

      const { data: newTransaction, error: transactionError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: 1,
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          category_id: category?.id || categories[0].id,
          confidence: suggestion.confidence,
          needs_review: suggestion.confidence < 0.8,
          bank_statement_id: statement.id
        })
        .select()
        .single()

      if (transactionError) throw transactionError
      processedTransactions.push(newTransaction)
    }

    // Update statement status
    await supabaseClient
      .from('bank_statements')
      .update({ 
        status: 'completed',
        transaction_count: processedTransactions.length 
      })
      .eq('id', statement.id)

    return new Response(
      JSON.stringify({ 
        message: 'File processed successfully',
        transactionCount: processedTransactions.length,
        transactions: processedTransactions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Processing error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process file',
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})