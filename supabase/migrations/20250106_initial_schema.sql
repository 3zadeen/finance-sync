-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_sheets_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) NOT NULL,
  icon VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bank_statements table
CREATE TABLE bank_statements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  transaction_count INTEGER DEFAULT 0,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id),
  bank_statement_id INTEGER REFERENCES bank_statements(id),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.0,
  needs_review BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default user
INSERT INTO users (username, email) VALUES ('demo', 'demo@example.com');

-- Insert default categories for the demo user
INSERT INTO categories (user_id, name, color, icon) VALUES
(1, 'Groceries', '#3B82F6', 'fas fa-shopping-cart'),
(1, 'Restaurants', '#EF4444', 'fas fa-utensils'),
(1, 'Transportation', '#10B981', 'fas fa-car'),
(1, 'Entertainment', '#8B5CF6', 'fas fa-film'),
(1, 'Utilities', '#F59E0B', 'fas fa-bolt'),
(1, 'Healthcare', '#EC4899', 'fas fa-heartbeat'),
(1, 'Shopping', '#06B6D4', 'fas fa-shopping-bag'),
(1, 'Income', '#84CC16', 'fas fa-dollar-sign'),
(1, 'Other', '#6B7280', 'fas fa-question');

-- Create indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_bank_statements_user_id ON bank_statements(user_id);