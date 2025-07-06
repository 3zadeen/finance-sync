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

      // Prepare data for sheets
      const values = [
        ['Date', 'Description', 'Amount', 'Category'], // Header row
        ...transactions.map(t => [t.date, t.description, t.amount, t.category])
      ];

      // Clear existing data and add new data
      await this.sheets.spreadsheets.values.clear({
        auth,
        spreadsheetId,
        range: 'Sheet1!A:D',
      });

      await this.sheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range: 'Sheet1!A1',
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
