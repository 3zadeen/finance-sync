import { google } from 'googleapis';

export interface SheetsTransaction {
  date: string;
  description: string;
  amount: string;
  category: string;
}

export class GoogleSheetsService {
  private sheets = google.sheets('v4');
  
  async syncTransactions(accessToken: string, spreadsheetId: string, transactions: SheetsTransaction[]): Promise<void> {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      // First, check if the sheet has headers
      let hasHeaders = false;
      try {
        const existingData = await this.sheets.spreadsheets.values.get({
          auth,
          spreadsheetId,
          range: 'A1:D1',
        });
        
        if (existingData.data.values && existingData.data.values.length > 0) {
          const firstRow = existingData.data.values[0];
          hasHeaders = firstRow.includes('Date') && firstRow.includes('Description') && firstRow.includes('Amount') && firstRow.includes('Category');
        }
      } catch (error) {
        // Sheet might be empty, that's ok
      }

      // Prepare data for sheets
      let values: string[][];
      if (!hasHeaders) {
        // Add headers if they don't exist
        values = [
          ['Date', 'Description', 'Amount', 'Category'], // Header row
          ...transactions.map(t => [t.date, t.description, t.amount, t.category])
        ];
      } else {
        // Just add transaction data
        values = transactions.map(t => [t.date, t.description, t.amount, t.category]);
      }

      if (values.length === 0) return;

      // Find the next empty row to append data
      let nextRow = 1;
      if (hasHeaders) {
        try {
          const existingData = await this.sheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: 'A:A',
          });
          nextRow = (existingData.data.values?.length || 0) + 1;
        } catch (error) {
          nextRow = 2; // Start after header row
        }
      }

      const range = hasHeaders ? `A${nextRow}:D${nextRow + values.length - 1}` : 'A1:D' + values.length;

      await this.sheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });

    } catch (error) {
      console.error('Failed to sync to Google Sheets:', error);
      throw new Error(`Google Sheets sync failed: ${error.message}`);
    }
  }

  async createSpreadsheet(accessToken: string, title: string): Promise<string> {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const response = await this.sheets.spreadsheets.create({
        auth,
        requestBody: {
          properties: {
            title,
          },
          sheets: [{
            properties: {
              title: 'Transactions',
            },
          }],
        },
      });

      return response.data.spreadsheetId!;
    } catch (error) {
      console.error('Failed to create Google Sheets:', error);
      throw new Error(`Failed to create spreadsheet: ${error.message}`);
    }
  }

  async getOAuthUrl(): Promise<string> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/api/auth/google/callback`
    );

    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
  }

  async verifySpreadsheetAccess(accessToken: string, spreadsheetId: string): Promise<void> {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      // Try to read the spreadsheet properties to verify access
      await this.sheets.spreadsheets.get({
        auth,
        spreadsheetId,
      });
    } catch (error) {
      throw new Error(`Cannot access spreadsheet: ${error.message}`);
    }
  }

  async exchangeCodeForTokens(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/api/auth/google/callback`
      );

      const { tokens } = await oauth2Client.getToken(code);
      
      return {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
      };
    } catch (error) {
      console.error('Failed to exchange code for tokens:', error);
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }
}
