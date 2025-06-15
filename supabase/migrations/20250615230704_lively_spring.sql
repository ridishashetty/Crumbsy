/*
  # Complete Working Database Setup
  
  This migration creates a fully working database schema that matches the application code exactly.
  
  1. Tables
     - users: User accounts with proper authentication
     - cake_flavors: Available cake flavors
     - frosting_types: Available frosting types  
     - topping_types: Available toppings
     - cake_designs: User cake designs
     - cake_tiers: Individual tiers for each design
     - orders: Cake orders
     - quotes: Baker quotes for orders
     - messages: Order messaging
     - portfolio_items: Baker portfolio
  
  2. Test Data
     - Sample users for testing
     - All required flavors, frostings, and toppings
     
  3. No RLS for simplicity
*/

-- Drop everything to start completely fresh
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Create types
CREATE TYPE user_type AS ENUM ('buyer', 'baker', 'admin');
CREATE TYPE cake_shape AS ENUM ('round', 'square');
CREATE TYPE order_status AS ENUM ('posted', 'baker-assigned', 'in-progress', 'out-for-delivery', 'delivered', 'cancelled');
CREATE TYPE sender_type AS ENUM ('buyer', 'baker');

-- Create users table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
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
  cancellation_days INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cake_flavors table
CREATE TABLE cake_flavors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create frosting_types table
CREATE TABLE frosting_types (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  default_color TEXT NOT NULL,
  color_customizable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create topping_types table
CREATE TABLE topping_types (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cake_designs table
CREATE TABLE cake_designs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shape cake_shape DEFAULT 'round',
  buttercream JSONB DEFAULT '{"color": "#FFFFFF", "flavor": "vanilla"}'::jsonb,
  toppings JSONB DEFAULT '[]'::jsonb,
  top_text TEXT DEFAULT '',
  preview_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cake_tiers table
CREATE TABLE cake_tiers (
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
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  baker_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  design_id BIGINT NOT NULL REFERENCES cake_designs(id) ON DELETE CASCADE,
  delivery_address TEXT,
  delivery_zip_code TEXT NOT NULL,
  expected_delivery_date TIMESTAMPTZ NOT NULL,
  status order_status DEFAULT 'posted',
  price NUMERIC(10,2),
  modification_requests TEXT,
  otp_code TEXT,
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quotes table
CREATE TABLE quotes (
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
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type sender_type NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  price NUMERIC(10,2),
  is_quote BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create portfolio_items table
CREATE TABLE portfolio_items (
  id BIGSERIAL PRIMARY KEY,
  baker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert cake flavors with EXACT names the code expects
INSERT INTO cake_flavors (name, color) VALUES
  ('vanilla', '#FFF8DC'),
  ('chocolate', '#8B4513'),
  ('strawberry', '#FFB6C1'),
  ('lemon', '#FFFACD'),
  ('red velvet', '#DC143C'),
  ('carrot', '#FF8C00');

-- Insert frosting types with EXACT names the code expects
INSERT INTO frosting_types (name, default_color, color_customizable) VALUES
  ('american buttercream', '#FFFFFF', TRUE),
  ('italian buttercream', '#FFFEF7', TRUE),
  ('french buttercream', '#FFF8DC', TRUE),
  ('whipped cream', '#FFFAFA', TRUE),
  ('ganache', '#654321', FALSE),
  ('cream cheese frosting', '#F5F5DC', TRUE),
  ('swiss meringue', '#FFFEF7', TRUE);

-- Insert topping types
INSERT INTO topping_types (name, icon) VALUES
  ('Fresh Berries', '🍓'),
  ('Chocolate Chips', '🍫'),
  ('Sprinkles', '✨'),
  ('Edible Flowers', '🌸'),
  ('Chocolate Drizzle', '🍯'),
  ('Caramel Sauce', '🍮'),
  ('Chopped Nuts', '🥜'),
  ('Candy Pieces', '🍬');

-- Insert test users
INSERT INTO users (email, username, password, full_name, user_type, profile_picture, location, zip_code) VALUES
  ('buyer@test.com', 'testbuyer', 'password123', 'Test Buyer', 'buyer', 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1', 'San Francisco, CA', '94102'),
  ('baker@test.com', 'testbaker', 'password123', 'Test Baker', 'baker', 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1', 'San Francisco, CA', '94103');

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_cake_designs_user_id ON cake_designs(user_id);
CREATE INDEX idx_cake_tiers_design_id ON cake_tiers(design_id);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cake_designs_updated_at BEFORE UPDATE ON cake_designs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();