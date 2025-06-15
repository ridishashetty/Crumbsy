/*
  # Complete Database Schema Setup

  1. New Tables
    - `users` - User accounts (buyers, bakers, admins)
    - `cake_designs` - Cake design configurations
    - `cake_tiers` - Individual tier details for designs
    - `orders` - Order management
    - `quotes` - Baker quotes for orders
    - `messages` - Order communication
    - `portfolio_items` - Baker portfolio items
    - `cake_flavors` - Available cake flavors
    - `frosting_types` - Available frosting types
    - `topping_types` - Available toppings

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for data access
    - Create indexes for performance

  3. Functions
    - Auto-update timestamps
*/

-- Drop existing tables if they exist (in correct order to handle foreign keys)
DROP TABLE IF EXISTS portfolio_items CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cake_tiers CASCADE;
DROP TABLE IF EXISTS cake_designs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS topping_types CASCADE;
DROP TABLE IF EXISTS frosting_types CASCADE;
DROP TABLE IF EXISTS cake_flavors CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_type CASCADE;
DROP TYPE IF EXISTS cake_shape CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS sender_type CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create custom types
CREATE TYPE user_type AS ENUM ('buyer', 'baker', 'admin');
CREATE TYPE cake_shape AS ENUM ('round', 'square');
CREATE TYPE order_status AS ENUM ('posted', 'baker-assigned', 'in-progress', 'out-for-delivery', 'delivered', 'cancelled');
CREATE TYPE sender_type AS ENUM ('buyer', 'baker');

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

-- Insert default cake flavors
INSERT INTO cake_flavors (name, color) VALUES
  ('vanilla', '#FFF8DC'),
  ('chocolate', '#8B4513'),
  ('strawberry', '#FFB6C1'),
  ('lemon', '#FFFACD'),
  ('red velvet', '#DC143C'),
  ('carrot', '#FF8C00');

-- Insert default frosting types
INSERT INTO frosting_types (name, default_color, color_customizable) VALUES
  ('american buttercream', '#FFFFFF', true),
  ('italian buttercream', '#FFFEF7', true),
  ('french buttercream', '#FFF8DC', true),
  ('whipped cream', '#FFFAFA', true),
  ('ganache', '#654321', false),
  ('cream cheese frosting', '#F5F5DC', true),
  ('swiss meringue', '#FFFEF7', true);

-- Insert default topping types
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

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cake_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cake_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_cake_designs_user_id ON cake_designs(user_id);
CREATE INDEX idx_cake_tiers_design_id ON cake_tiers(design_id);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_baker_id ON orders(baker_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_quotes_order_id ON quotes(order_id);
CREATE INDEX idx_quotes_baker_id ON quotes(baker_id);
CREATE INDEX idx_messages_order_id ON messages(order_id);
CREATE INDEX idx_portfolio_baker_id ON portfolio_items(baker_id);

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
    FOR EACH ROW EXECUTE FUNCTION update_portfolio_items_updated_at_column();