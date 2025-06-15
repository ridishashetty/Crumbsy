-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Anyone can create user accounts" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can manage own cake designs" ON cake_designs;
DROP POLICY IF EXISTS "Users can read own designs" ON cake_designs;
DROP POLICY IF EXISTS "Users can update own designs" ON cake_designs;
DROP POLICY IF EXISTS "Users can delete own designs" ON cake_designs;
DROP POLICY IF EXISTS "Users can create own designs" ON cake_designs;
DROP POLICY IF EXISTS "Anyone can view cake designs" ON cake_designs;
DROP POLICY IF EXISTS "Users can manage tiers of own designs" ON cake_tiers;
DROP POLICY IF EXISTS "Users can manage tiers for own designs" ON cake_tiers;
DROP POLICY IF EXISTS "Anyone can view cake tiers" ON cake_tiers;
DROP POLICY IF EXISTS "Buyers can manage own orders" ON orders;
DROP POLICY IF EXISTS "Buyers can create orders" ON orders;
DROP POLICY IF EXISTS "Buyers can read own orders" ON orders;
DROP POLICY IF EXISTS "Buyers can update own orders" ON orders;
DROP POLICY IF EXISTS "Bakers can view assigned orders" ON orders;
DROP POLICY IF EXISTS "Bakers can read assigned orders" ON orders;
DROP POLICY IF EXISTS "Bakers can read posted orders" ON orders;
DROP POLICY IF EXISTS "Bakers can update assigned orders" ON orders;
DROP POLICY IF EXISTS "Bakers can manage own quotes" ON quotes;
DROP POLICY IF EXISTS "Bakers can create quotes" ON quotes;
DROP POLICY IF EXISTS "Bakers can read own quotes" ON quotes;
DROP POLICY IF EXISTS "Bakers can update own quotes" ON quotes;
DROP POLICY IF EXISTS "Order owners can view quotes" ON quotes;
DROP POLICY IF EXISTS "Buyers can read quotes for own orders" ON quotes;
DROP POLICY IF EXISTS "Order participants can manage messages" ON messages;
DROP POLICY IF EXISTS "Order participants can create messages" ON messages;
DROP POLICY IF EXISTS "Order participants can read messages" ON messages;
DROP POLICY IF EXISTS "Bakers can manage own portfolio" ON portfolio_items;
DROP POLICY IF EXISTS "Anyone can view portfolio items" ON portfolio_items;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_cake_designs_updated_at ON cake_designs;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
DROP TRIGGER IF EXISTS update_portfolio_items_updated_at ON portfolio_items;

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
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'buyer',
  profile_picture TEXT,
  location TEXT,
  zip_code TEXT,
  phone TEXT,
  address TEXT,
  cancellation_days INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT users_user_type_check CHECK (user_type = ANY (ARRAY['buyer'::text, 'baker'::text, 'admin'::text]))
);

-- Create cake_designs table
CREATE TABLE IF NOT EXISTS cake_designs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shape TEXT DEFAULT 'round',
  buttercream JSONB DEFAULT '{"color": "#FFFFFF", "flavor": "vanilla"}'::jsonb,
  toppings JSONB DEFAULT '[]'::jsonb,
  top_text TEXT DEFAULT ''::text,
  preview_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT cake_designs_shape_check CHECK (shape = ANY (ARRAY['round'::text, 'square'::text]))
);

-- Create cake_tiers table
CREATE TABLE IF NOT EXISTS cake_tiers (
  id BIGSERIAL PRIMARY KEY,
  design_id BIGINT NOT NULL REFERENCES cake_designs(id) ON DELETE CASCADE,
  tier_order INTEGER NOT NULL,
  flavor TEXT NOT NULL,
  color TEXT NOT NULL,
  frosting TEXT DEFAULT 'american buttercream',
  frosting_color TEXT DEFAULT '#FFFFFF',
  top_design TEXT DEFAULT 'none',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  baker_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  design_id BIGINT NOT NULL REFERENCES cake_designs(id) ON DELETE CASCADE,
  delivery_address TEXT,
  delivery_zip_code TEXT NOT NULL,
  expected_delivery_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'posted',
  price NUMERIC(10,2),
  modification_requests TEXT,
  otp_code TEXT,
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT orders_status_check CHECK (status = ANY (ARRAY['posted'::text, 'baker-assigned'::text, 'in-progress'::text, 'out-for-delivery'::text, 'delivered'::text, 'cancelled'::text]))
);

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  baker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL,
  modification_requests TEXT,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, baker_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  price NUMERIC(10,2),
  is_quote BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT messages_sender_type_check CHECK (sender_type = ANY (ARRAY['buyer'::text, 'baker'::text]))
);

-- Create portfolio_items table
CREATE TABLE IF NOT EXISTS portfolio_items (
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

-- Users policies
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (((auth.uid())::text = (id)::text) OR (user_type = 'admin'::text));

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING ((auth.uid())::text = (id)::text);

CREATE POLICY "Anyone can create user account" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (EXISTS ( SELECT 1
   FROM users users_1
  WHERE (((users_1.id)::text = (auth.uid())::text) AND (users_1.user_type = 'admin'::text))));

-- Cake designs policies
CREATE POLICY "Users can read own designs" ON cake_designs
  FOR SELECT USING ((auth.uid())::text = (user_id)::text);

CREATE POLICY "Users can create own designs" ON cake_designs
  FOR INSERT WITH CHECK ((auth.uid())::text = (user_id)::text);

CREATE POLICY "Users can update own designs" ON cake_designs
  FOR UPDATE USING ((auth.uid())::text = (user_id)::text);

CREATE POLICY "Users can delete own designs" ON cake_designs
  FOR DELETE USING ((auth.uid())::text = (user_id)::text);

-- Cake tiers policies
CREATE POLICY "Users can manage tiers for own designs" ON cake_tiers
  FOR ALL USING (EXISTS ( SELECT 1
   FROM cake_designs
  WHERE ((cake_designs.id = cake_tiers.design_id) AND ((cake_designs.user_id)::text = (auth.uid())::text))));

-- Orders policies
CREATE POLICY "Buyers can create orders" ON orders
  FOR INSERT WITH CHECK ((auth.uid())::text = (buyer_id)::text);

CREATE POLICY "Buyers can read own orders" ON orders
  FOR SELECT USING ((auth.uid())::text = (buyer_id)::text);

CREATE POLICY "Buyers can update own orders" ON orders
  FOR UPDATE USING ((auth.uid())::text = (buyer_id)::text);

CREATE POLICY "Bakers can read assigned orders" ON orders
  FOR SELECT USING ((auth.uid())::text = (baker_id)::text);

CREATE POLICY "Bakers can read posted orders" ON orders
  FOR SELECT USING (status = 'posted'::text);

CREATE POLICY "Bakers can update assigned orders" ON orders
  FOR UPDATE USING ((auth.uid())::text = (baker_id)::text);

-- Quotes policies
CREATE POLICY "Bakers can create quotes" ON quotes
  FOR INSERT WITH CHECK ((auth.uid())::text = (baker_id)::text);

CREATE POLICY "Bakers can read own quotes" ON quotes
  FOR SELECT USING ((auth.uid())::text = (baker_id)::text);

CREATE POLICY "Bakers can update own quotes" ON quotes
  FOR UPDATE USING ((auth.uid())::text = (baker_id)::text);

CREATE POLICY "Buyers can read quotes for own orders" ON quotes
  FOR SELECT USING (EXISTS ( SELECT 1
   FROM orders
  WHERE ((orders.id = quotes.order_id) AND ((orders.buyer_id)::text = (auth.uid())::text))));

-- Messages policies
CREATE POLICY "Order participants can create messages" ON messages
  FOR INSERT WITH CHECK (((sender_id)::text = (auth.uid())::text) AND (EXISTS ( SELECT 1
   FROM orders
  WHERE ((orders.id = messages.order_id) AND (((orders.buyer_id)::text = (auth.uid())::text) OR ((orders.baker_id)::text = (auth.uid())::text))))));

CREATE POLICY "Order participants can read messages" ON messages
  FOR SELECT USING (EXISTS ( SELECT 1
   FROM orders
  WHERE ((orders.id = messages.order_id) AND (((orders.buyer_id)::text = (auth.uid())::text) OR ((orders.baker_id)::text = (auth.uid())::text)))));

-- Portfolio policies
CREATE POLICY "Bakers can manage own portfolio" ON portfolio_items
  FOR ALL USING ((auth.uid())::text = (baker_id)::text);

CREATE POLICY "Anyone can read portfolio items" ON portfolio_items
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
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