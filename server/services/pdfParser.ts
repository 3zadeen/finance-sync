// Dynamic import to avoid initialization issues

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  rawText: string;
}

export class PDFParser {
  async parseBankStatement(pdfBuffer: Buffer): Promise<ParsedTransaction[]> {
    try {
      const PDFParse = (await import('pdf-parse')).default;
      const data = await PDFParse(pdfBuffer);
      const text = data.text;
      
      console.log('Extracted PDF text:', text.substring(0, 500) + '...');
      
      // Parse transactions from PDF text
      const transactions = this.extractTransactions(text);
      console.log('Parsed transactions:', transactions.length);
      return transactions;
    } catch (error) {
      console.error('PDF parse error:', error);
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  private extractTransactions(text: string): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');
    
    // Common patterns for bank transactions
    const transactionPatterns = [
      // Date patterns: MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
      // Amount patterns: $123.45, -$123.45, 123.45-, (123.45)
      /[\-\$\(\)]?[\d,]+\.\d{2}[\-\)]?/,
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Look for date pattern first
      const dateMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
      if (!dateMatch) continue;

      // Look for amount pattern in the same line or next few lines
      let amountMatch: RegExpMatchArray | null = null;
      let description = '';
      let fullLine = line;

      for (let j = 0; j < 3 && (i + j) < lines.length; j++) {
        const currentLine = lines[i + j].trim();
        fullLine += ' ' + currentLine;
        
        amountMatch = currentLine.match(/[\-\$\(\)]?([\d,]+\.\d{2})[\-\)]?/);
        if (amountMatch) break;
      }

      if (amountMatch && dateMatch) {
        // Extract description (text between date and amount)
        const dateStr = dateMatch[1];
        const amountStr = amountMatch[0];
        
        // Clean up the line to extract description
        description = fullLine
          .replace(dateStr, '')
          .replace(amountStr, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Parse amount (handle negative amounts)
        let amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        if (amountStr.includes('-') || amountStr.includes('(') || amountStr.includes(')')) {
          amount = -Math.abs(amount);
        }

        // Parse date
        const dateParts = dateStr.split(/[\/\-]/);
        let parsedDate: Date;
        
        if (dateParts[0].length === 4) {
          // YYYY-MM-DD format
          parsedDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        } else {
          // MM/DD/YYYY format
          parsedDate = new Date(parseInt(dateParts[2]), parseInt(dateParts[0]) - 1, parseInt(dateParts[1]));
        }

        if (description && !isNaN(amount) && !isNaN(parsedDate.getTime())) {
          transactions.push({
            date: parsedDate.toISOString(),
            description: description.substring(0, 200), // Limit description length
            amount,
            rawText: fullLine.trim(),
          });
        }
      }
    }

    // Remove duplicates and sort by date
    const uniqueTransactions = transactions.filter((transaction, index, self) =>
      index === self.findIndex(t => 
        t.date === transaction.date && 
        t.description === transaction.description && 
        t.amount === transaction.amount
      )
    );

    return uniqueTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}
