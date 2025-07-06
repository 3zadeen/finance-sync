# Supabase Deployment Guide

This guide covers deploying the financial transaction management app using Supabase PostgreSQL database and Edge Functions with Vercel frontend hosting.

## Architecture Overview

- **Frontend**: React app deployed on Vercel (static hosting only)
- **Database**: Supabase PostgreSQL with automatic migrations
- **API**: Supabase Edge Functions (Deno runtime) - no Vercel serverless functions
- **Authentication**: Supabase Auth (optional)
- **Storage**: Supabase Storage for file uploads

> **Note**: This architecture completely separates frontend and backend concerns. Vercel only serves static files, while all API logic runs on Supabase Edge Functions.

## Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Note your project URL and anon key
4. Set up environment variables in your `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Required for Edge Functions
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres

# OpenAI for AI categorization
OPENAI_API_KEY=sk-your-openai-api-key

# Google Sheets Integration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2. Database Setup

Run the initial migration to create tables:

```sql
-- Copy the contents of supabase/migrations/20250106_initial_schema.sql
-- and run in Supabase SQL Editor
```

Or use the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 3. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy api
supabase functions deploy pdf-processor
supabase functions deploy google-sheets
```

### 4. Configure Edge Function Environment Variables

In your Supabase dashboard, go to Edge Functions → Settings and add:

```
OPENAI_API_KEY=sk-your-openai-api-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### 5. Deploy Frontend to Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automatically from Git pushes

## Local Development with Supabase

### Start Supabase locally:

```bash
# Start local Supabase stack
supabase start

# This will give you local URLs:
# API URL: http://localhost:54321
# Anon key: eyJ... (copy this)
```

### Update your `.env` for local development:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
```

### Run the frontend:

```bash
npm run dev
```

## Edge Functions Overview

### 1. `api` - Main API endpoints
- `/stats` - Transaction statistics
- `/transactions` - CRUD operations for transactions
- `/categories` - Category management
- `/category-breakdown` - Spending analysis
- `/google-sheets-status` - Connection status

### 2. `pdf-processor` - PDF upload and processing
- Handles PDF file uploads
- Extracts transaction data
- AI categorization with OpenAI
- Stores processed transactions

### 3. `google-sheets` - Google Sheets integration
- OAuth authentication flow
- Spreadsheet connection
- Data synchronization

## Database Schema

### Tables:
- `users` - User accounts and Google integration tokens
- `categories` - Transaction categories with colors and icons
- `transactions` - Financial transactions with AI metadata
- `bank_statements` - Upload tracking and processing status

### Key Features:
- Row Level Security (RLS) enabled
- Automatic timestamps
- Foreign key relationships
- Performance indexes

## Troubleshooting

### Common Issues:

1. **Edge Function Timeout**: Increase timeout in `supabase/functions/[function]/index.ts`
2. **CORS Errors**: Verify CORS headers in Edge Functions
3. **Database Connection**: Check DATABASE_URL format and permissions
4. **OpenAI API**: Verify API key and account credits
5. **Google OAuth**: Ensure redirect URIs match exactly

### Logs and Monitoring:

```bash
# View Edge Function logs
supabase functions logs api
supabase functions logs pdf-processor
supabase functions logs google-sheets

# Real-time logs during development
supabase functions serve --debug
```

## Production Checklist

- [ ] Database migrations applied
- [ ] Edge Functions deployed
- [ ] Environment variables configured
- [ ] Google OAuth redirect URIs updated
- [ ] Frontend deployed to Vercel
- [ ] SSL certificates configured
- [ ] API keys secured and rotated
- [ ] Row Level Security policies in place