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

## Changelog
- July 06, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.