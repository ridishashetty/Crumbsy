/*
  # Create New Simplified Database Schema for Crumbsy

  1. New Tables
    - `users` - All user accounts (buyers, bakers, admins)
    - `cake_designs` - User cake designs
    - `cake_tiers` - Individual tiers for each design
    - `orders` - Order management
    - `quotes` - Baker quotes for orders
    - `messages` - Chat messages between users
    - `portfolio_items` - Baker portfolio items

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Secure admin access

  3. Features
    - Auto-incrementing IDs
    - Proper timestamps
    - JSON fields for complex data
    - Foreign key relationships
*/

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS "Orders" CASCADE;
DROP TABLE IF EXISTS "CakeDesignTier" CASCADE;
DROP TABLE IF EXISTS "CakeTier" CASCADE;
DROP TABLE IF EXISTS "CakeDesign" CASCADE;
DROP TABLE IF EXISTS "ToppingType" CASCADE;
DROP TABLE IF EXISTS "FrostingFlavor" CASCADE;
DROP TABLE IF EXISTS "FrostingType" CASCADE;
DROP TABLE IF EXISTS "CakeFlavor" CASCADE;
DROP TABLE IF EXISTS "LoginInfo" CASCADE;
DROP TABLE IF EXISTS "UserAccount" CASCADE;
DROP TABLE IF EXISTS "AccountType" CASCADE;

-- Create new simplified schema

-- Users table (combines UserAccount and LoginInfo)
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('buyer', 'baker', 'admin')),
  profile_picture TEXT,
  location TEXT,
  zip_code TEXT,
  phone TEXT,
  address TEXT,
  cancellation_days INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cake designs table
CREATE TABLE cake_designs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shape TEXT NOT NULL DEFAULT 'round' CHECK (shape IN ('round', 'square')),
  buttercream JSONB NOT NULL DEFAULT '{"flavor": "vanilla", "color": "#FFFFFF"}',
  toppings JSONB NOT NULL DEFAULT '[]',
  top_text TEXT DEFAULT '',
  preview_image TEXT, -- Base64 or URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cake tiers table (for each design)
CREATE TABLE cake_tiers (
  id BIGSERIAL PRIMARY KEY,
  design_id BIGINT NOT NULL REFERENCES cake_designs(id) ON DELETE CASCADE,
  tier_order INTEGER NOT NULL, -- 0 = bottom, 1 = middle, 2 = top
  flavor TEXT NOT NULL,
  color TEXT NOT NULL,
  frosting TEXT NOT NULL DEFAULT 'american buttercream',
  frosting_color TEXT NOT NULL DEFAULT '#FFFFFF',
  top_design TEXT DEFAULT 'none',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  baker_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  design_id BIGINT NOT NULL REFERENCES cake_designs(id) ON DELETE CASCADE,
  delivery_address TEXT,
  delivery_zip_code TEXT NOT NULL,
  expected_delivery_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted', 'baker-assigned', 'in-progress', 'out-for-delivery', 'delivered', 'cancelled')),
  price DECIMAL(10,2),
  modification_requests TEXT,
  otp_code TEXT,
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes table (baker quotes for orders)
CREATE TABLE quotes (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  baker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  modification_requests TEXT,
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, baker_id) -- One active quote per baker per order
);

-- Messages table (chat between buyers and bakers)
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('buyer', 'baker')),
  message TEXT NOT NULL,
  image_url TEXT,
  price DECIMAL(10,2), -- For quote messages
  is_quote BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio items table (for bakers)
CREATE TABLE portfolio_items (
  id BIGSERIAL PRIMARY KEY,
  baker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- RLS Policies

-- Users policies
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR user_type = 'admin');

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Anyone can create user account" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND user_type = 'admin'
    )
  );

-- Cake designs policies
CREATE POLICY "Users can read own designs" ON cake_designs
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create own designs" ON cake_designs
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own designs" ON cake_designs
  FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own designs" ON cake_designs
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- Cake tiers policies
CREATE POLICY "Users can manage tiers for own designs" ON cake_tiers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cake_designs 
      WHERE id = cake_tiers.design_id AND user_id::text = auth.uid()::text
    )
  );

-- Orders policies
CREATE POLICY "Buyers can read own orders" ON orders
  FOR SELECT USING (buyer_id::text = auth.uid()::text);

CREATE POLICY "Bakers can read assigned orders" ON orders
  FOR SELECT USING (baker_id::text = auth.uid()::text);

CREATE POLICY "Bakers can read posted orders" ON orders
  FOR SELECT USING (status = 'posted');

CREATE POLICY "Buyers can create orders" ON orders
  FOR INSERT WITH CHECK (buyer_id::text = auth.uid()::text);

CREATE POLICY "Buyers can update own orders" ON orders
  FOR UPDATE USING (buyer_id::text = auth.uid()::text);

CREATE POLICY "Bakers can update assigned orders" ON orders
  FOR UPDATE USING (baker_id::text = auth.uid()::text);

-- Quotes policies
CREATE POLICY "Bakers can create quotes" ON quotes
  FOR INSERT WITH CHECK (baker_id::text = auth.uid()::text);

CREATE POLICY "Bakers can read own quotes" ON quotes
  FOR SELECT USING (baker_id::text = auth.uid()::text);

CREATE POLICY "Buyers can read quotes for own orders" ON quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE id = quotes.order_id AND buyer_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Bakers can update own quotes" ON quotes
  FOR UPDATE USING (baker_id::text = auth.uid()::text);

-- Messages policies
CREATE POLICY "Order participants can read messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE id = messages.order_id 
      AND (buyer_id::text = auth.uid()::text OR baker_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "Order participants can create messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id::text = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM orders 
      WHERE id = order_id 
      AND (buyer_id::text = auth.uid()::text OR baker_id::text = auth.uid()::text)
    )
  );

-- Portfolio policies
CREATE POLICY "Bakers can manage own portfolio" ON portfolio_items
  FOR ALL USING (baker_id::text = auth.uid()::text);

CREATE POLICY "Anyone can read portfolio items" ON portfolio_items
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_cake_designs_user_id ON cake_designs(user_id);
CREATE INDEX idx_cake_tiers_design_id ON cake_tiers(design_id);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_baker_id ON orders(baker_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_quotes_order_id ON quotes(order_id);
CREATE INDEX idx_quotes_baker_id ON quotes(baker_id);
CREATE INDEX idx_messages_order_id ON messages(order_id);
CREATE INDEX idx_portfolio_baker_id ON portfolio_items(baker_id);

-- Insert default admin user
INSERT INTO users (
  email, 
  username, 
  password, 
  full_name, 
  user_type,
  profile_picture
) VALUES (
  'admin@crumbsy.com',
  'Admin',
  'admin@Crumbsy',
  'System Administrator',
  'admin',
  'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
) ON CONFLICT (email) DO NOTHING;

-- Insert test users for development
INSERT INTO users (
  email, 
  username, 
  password, 
  full_name, 
  user_type,
  location,
  zip_code,
  profile_picture
) VALUES 
(
  'buyer@test.com',
  'tBuyer',
  'test_buyer',
  'Test Buyer',
  'buyer',
  'Test City, CA',
  '12345',
  'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
),
(
  'baker@test.com',
  'tBaker',
  'test_baker',
  'Test Baker',
  'baker',
  'Baker City, CA',
  '12346',
  'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
) ON CONFLICT (email) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
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