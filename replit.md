# Financial Transaction Management Dashboard

## Overview

This is a full-stack financial transaction management application that automates PDF bank statement processing using AI-powered categorization. The system extracts transactions from uploaded PDF statements, automatically categorizes them using OpenAI's GPT-4, and provides dashboard analytics with Google Sheets integration.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **File Upload**: Multer for handling PDF uploads
- **PDF Processing**: pdf-parse library for text extraction

### Key Design Decisions
1. **Monorepo Structure**: Client, server, and shared code organized in separate directories with shared TypeScript types
2. **Type Safety**: Full TypeScript coverage across frontend, backend, and database schemas
3. **Modern Stack**: ESM modules, latest React patterns, and modern Node.js features
4. **Component-First UI**: Reusable component library with consistent design system

## Key Components

### Database Schema
- **Users**: Authentication and Google integration tokens
- **Categories**: User-defined transaction categories with colors and icons
- **Transactions**: Financial transactions with AI categorization metadata
- **Bank Statements**: Upload tracking and processing status

### AI Services
- **PDF Parser**: Extracts transaction data from bank statement PDFs using pattern matching
- **AI Categorizer**: Uses OpenAI GPT-4o for intelligent transaction categorization
- **Google Sheets Service**: Syncs transaction data to user's Google Sheets

### Frontend Components
- **Dashboard**: Main interface with stats grid, transaction list, and category breakdown
- **Upload System**: Drag-and-drop PDF upload with progress tracking
- **Transaction Management**: Edit transactions, review AI suggestions, manual categorization
- **Google Sheets Integration**: Connect account and sync data

## Data Flow

1. **PDF Upload**: User uploads bank statement PDF through the web interface
2. **PDF Processing**: Server extracts transaction data using pdf-parse
3. **AI Categorization**: Each transaction is analyzed by OpenAI GPT-4o for category assignment
4. **Database Storage**: Transactions saved with categorization confidence scores
5. **Dashboard Updates**: Real-time stats and transaction lists updated via React Query
6. **Google Sheets Sync**: Optional automatic sync to user's connected Google Sheets

## External Dependencies

### AI Integration
- **OpenAI GPT-4o**: Latest model for transaction categorization with high accuracy
- **Custom Prompts**: Specialized prompts for financial transaction analysis

### Google Services
- **Google Sheets API**: For exporting and syncing transaction data
- **OAuth 2.0**: Secure authentication flow for Google account integration

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL for scalable data storage
- **Drizzle ORM**: Type-safe database operations with migration support

### UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **Lucide Icons**: Consistent icon library

## Deployment Strategy

### Development
- **Vite Dev Server**: Hot module replacement for fast development
- **TypeScript Compilation**: Real-time type checking
- **Database Migrations**: Drizzle migrations for schema changes

### Production Build
- **Frontend**: Vite production build with optimization
- **Backend**: ESBuild bundling for Node.js deployment
- **Static Assets**: Served from Express with Vite middleware in development

### Environment Configuration
- **Database**: Connection via DATABASE_URL environment variable
- **OpenAI**: API key configuration for AI services
- **Google**: OAuth credentials for Sheets integration

## Recent Changes

### July 06, 2025 - Google Sheets Integration Enhancement
- Modified Google Sheets integration to work with existing spreadsheets instead of creating new ones
- Added spreadsheet ID input field in dashboard for connecting to user's existing sheets
- Updated sync functionality to append data rather than overwriting existing content
- Added verification system to ensure spreadsheet access before connection
- Implemented multi-step connection process: Google OAuth → Spreadsheet ID → Data Sync

### July 06, 2025 - Upload Modal Improvements  
- Fixed dialog accessibility issues by adding proper DialogTitle and DialogDescription
- Enhanced upload progress modal with completion states and user controls
- Added close buttons for better user experience during and after upload
- Improved modal responsiveness and prevented stuck states

## Changelog
- July 06, 2025. Initial setup

## Local Development Setup

### Prerequisites
- Node.js 18+ with npm
- Git for cloning the repository
- A PostgreSQL database (local or cloud-based like Neon)
- OpenAI API key for transaction categorization
- Google Cloud Console project for Sheets integration (optional)

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd financial-transaction-dashboard
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/finance_db
   
   # OpenAI (required for AI categorization)
   OPENAI_API_KEY=sk-your-openai-api-key-here
   
   # Google Sheets Integration (optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
   ```

4. **Database Setup**
   - Install and start PostgreSQL locally, or use a cloud provider like Neon
   - Create a database named `finance_db`
   - Run database migrations:
     ```bash
     npm run db:push
     ```

5. **Start the Application**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5000`

### How the Backend Works

**Architecture Overview:**
- **Express.js Server**: Handles HTTP requests and serves both API endpoints and static frontend files
- **In-Memory Storage**: Currently uses a MemStorage class for data persistence (can be switched to PostgreSQL)
- **PDF Processing**: Uses pdf-parse library with dynamic imports to extract transaction data
- **AI Integration**: OpenAI GPT-4o analyzes transaction descriptions and assigns categories
- **Google Sheets API**: OAuth2 flow for connecting to user's existing spreadsheets

**Key Backend Components:**
1. **Routes** (`server/routes.ts`): All API endpoints for transactions, categories, uploads, and Google Sheets
2. **Services**:
   - `PDFParser`: Extracts transactions from bank statement PDFs using regex patterns
   - `AICategorizer`: Uses OpenAI to intelligently categorize transactions
   - `GoogleSheetsService`: Handles OAuth and spreadsheet synchronization
3. **Storage** (`server/storage.ts`): Data layer with interfaces for users, transactions, categories

**Data Flow:**
1. User uploads PDF → Server processes with PDFParser
2. Extracted transactions → AI categorization via OpenAI
3. Categorized data → Stored in database/memory
4. Optional: Auto-sync to user's Google Sheets

### API Key Setup

**OpenAI API Key:**
1. Visit https://platform.openai.com/api-keys
2. Create a new API key
3. Add to your `.env` file as `OPENAI_API_KEY`

**Google Sheets Integration:**
1. Go to Google Cloud Console
2. Create a new project or select existing
3. Enable Google Sheets API and Google Drive API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Secret to your `.env` file

### Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run TypeScript type checking
npm run check

# Push database schema changes
npm run db:push
```

### Troubleshooting

**Common Issues:**
- **PDF Parse Error**: Ensure PDFs are text-based (not scanned images)
- **Database Connection**: Verify DATABASE_URL format and database is running
- **OpenAI Errors**: Check API key validity and account credits
- **Google Sheets Auth**: Verify OAuth credentials and redirect URI configuration

**Port Conflicts:**
If port 5000 is in use, the app will automatically find an available port.

### Testing with Sample Data

The app includes default categories and a demo user. Upload a bank statement PDF to see the full workflow in action.

## User Preferences

Preferred communication style: Simple, everyday language.