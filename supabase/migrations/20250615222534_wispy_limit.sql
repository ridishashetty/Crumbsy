/*
  # Create users and cake-related tables

  1. New Tables
    - `users`
      - `id` (integer, primary key, auto-increment)
      - `email` (text, unique, not null)
      - `username` (text, unique, not null)
      - `password` (text, not null)
      - `full_name` (text, not null)
      - `user_type` (enum: buyer, baker, admin)
      - `profile_picture` (text, nullable)
      - `location` (text, nullable)
      - `zip_code` (text, nullable)
      - `phone` (text, nullable)
      - `address` (text, nullable)
      - `cancellation_days` (integer, nullable)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

    - `cake_designs`
      - `id` (integer, primary key, auto-increment)
      - `user_id` (integer, foreign key to users)
      - `name` (text, not null)
      - `shape` (enum: round, square, default round)
      - `buttercream` (jsonb, default empty object)
      - `toppings` (jsonb, default empty array)
      - `top_text` (text, nullable)
      - `preview_image` (text, nullable)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

    - `cake_tiers`
      - `id` (integer, primary key, auto-increment)
      - `design_id` (integer, foreign key to cake_designs)
      - `tier_order` (integer, not null)
      - `flavor` (text, not null)
      - `color` (text, not null)
      - `frosting` (text, default 'american buttercream')
      - `frosting_color` (text, default '#FFFFFF')
      - `top_design` (text, nullable)
      - `created_at` (timestamptz, default now)

    - `orders`
      - `id` (integer, primary key, auto-increment)
      - `buyer_id` (integer, foreign key to users)
      - `baker_id` (integer, foreign key to users, nullable)
      - `design_id` (integer, foreign key to cake_designs)
      - `delivery_address` (text, nullable)
      - `delivery_zip_code` (text, not null)
      - `expected_delivery_date` (date, not null)
      - `status` (enum: posted, baker-assigned, in-progress, out-for-delivery, delivered, cancelled)
      - `price` (decimal, nullable)
      - `modification_requests` (text, nullable)
      - `otp_code` (text, nullable)
      - `assigned_at` (timestamptz, nullable)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

    - `quotes`
      - `id` (integer, primary key, auto-increment)
      - `order_id` (integer, foreign key to orders)
      - `baker_id` (integer, foreign key to users)
      - `price` (decimal, not null)
      - `modification_requests` (text, nullable)
      - `message` (text, not null)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

    - `messages`
      - `id` (integer, primary key, auto-increment)
      - `order_id` (integer, foreign key to orders)
      - `sender_id` (integer, foreign key to users)
      - `sender_type` (enum: buyer, baker)
      - `message` (text, not null)
      - `image_url` (text, nullable)
      - `price` (decimal, nullable)
      - `is_quote` (boolean, nullable)
      - `created_at` (timestamptz, default now)

    - `portfolio_items`
      - `id` (integer, primary key, auto-increment)
      - `baker_id` (integer, foreign key to users)
      - `image_url` (text, not null)
      - `caption` (text, not null)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for bakers to view relevant orders and quotes
    - Add policies for buyers to view their orders and messages

  3. Indexes
    - Add indexes for frequently queried columns
    - Add foreign key constraints for data integrity
*/

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('buyer', 'baker', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE cake_shape AS ENUM ('round', 'square');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('posted', 'baker-assigned', 'in-progress', 'out-for-delivery', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sender_type AS ENUM ('buyer', 'baker');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  user_type user_type NOT NULL DEFAULT 'buyer',
  profile_picture TEXT,
  location TEXT,
  zip_code TEXT,
  phone TEXT,
  address TEXT,
  cancellation_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cake_designs table
CREATE TABLE IF NOT EXISTS cake_designs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shape cake_shape DEFAULT 'round',
  buttercream JSONB DEFAULT '{}',
  toppings JSONB DEFAULT '[]',
  top_text TEXT,
  preview_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cake_tiers table
CREATE TABLE IF NOT EXISTS cake_tiers (
  id SERIAL PRIMARY KEY,
  design_id INTEGER NOT NULL REFERENCES cake_designs(id) ON DELETE CASCADE,
  tier_order INTEGER NOT NULL,
  flavor TEXT NOT NULL,
  color TEXT NOT NULL,
  frosting TEXT DEFAULT 'american buttercream',
  frosting_color TEXT DEFAULT '#FFFFFF',
  top_design TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  baker_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  design_id INTEGER NOT NULL REFERENCES cake_designs(id) ON DELETE CASCADE,
  delivery_address TEXT,
  delivery_zip_code TEXT NOT NULL,
  expected_delivery_date DATE NOT NULL,
  status order_status DEFAULT 'posted',
  price DECIMAL(10,2),
  modification_requests TEXT,
  otp_code TEXT,
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  baker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  modification_requests TEXT,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type sender_type NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  price DECIMAL(10,2),
  is_quote BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create portfolio_items table
CREATE TABLE IF NOT EXISTS portfolio_items (
  id SERIAL PRIMARY KEY,
  baker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cake_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cake_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR user_type = 'admin');

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Anyone can create user accounts" ON users
  FOR INSERT WITH CHECK (true);

-- Cake designs policies
CREATE POLICY "Users can manage own cake designs" ON cake_designs
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Anyone can view cake designs" ON cake_designs
  FOR SELECT USING (true);

-- Cake tiers policies
CREATE POLICY "Users can manage tiers of own designs" ON cake_tiers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cake_designs 
      WHERE cake_designs.id = cake_tiers.design_id 
      AND cake_designs.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Anyone can view cake tiers" ON cake_tiers
  FOR SELECT USING (true);

-- Orders policies
CREATE POLICY "Buyers can manage own orders" ON orders
  FOR ALL USING (auth.uid()::text = buyer_id::text);

CREATE POLICY "Bakers can view assigned orders" ON orders
  FOR SELECT USING (auth.uid()::text = baker_id::text OR baker_id IS NULL);

CREATE POLICY "Bakers can update assigned orders" ON orders
  FOR UPDATE USING (auth.uid()::text = baker_id::text);

-- Quotes policies
CREATE POLICY "Bakers can manage own quotes" ON quotes
  FOR ALL USING (auth.uid()::text = baker_id::text);

CREATE POLICY "Order owners can view quotes" ON quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = quotes.order_id 
      AND orders.buyer_id::text = auth.uid()::text
    )
  );

-- Messages policies
CREATE POLICY "Order participants can manage messages" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = messages.order_id 
      AND (orders.buyer_id::text = auth.uid()::text OR orders.baker_id::text = auth.uid()::text)
    )
  );

-- Portfolio policies
CREATE POLICY "Bakers can manage own portfolio" ON portfolio_items
  FOR ALL USING (auth.uid()::text = baker_id::text);

CREATE POLICY "Anyone can view portfolio items" ON portfolio_items
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_cake_designs_user_id ON cake_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_cake_tiers_design_id ON cake_tiers(design_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_baker_id ON orders(baker_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_quotes_order_id ON quotes(order_id);
CREATE INDEX IF NOT EXISTS idx_quotes_baker_id ON quotes(baker_id);
CREATE INDEX IF NOT EXISTS idx_messages_order_id ON messages(order_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_baker_id ON portfolio_items(baker_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cake_designs_updated_at BEFORE UPDATE ON cake_designs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_items_updated_at BEFORE UPDATE ON portfolio_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();