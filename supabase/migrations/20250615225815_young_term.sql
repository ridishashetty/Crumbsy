-- Ensure we have the basic data that the application expects

-- First, let's make sure we have some test users
INSERT INTO users (email, username, password, full_name, user_type, profile_picture) VALUES
  ('test@buyer.com', 'testbuyer', 'password123', 'Test Buyer', 'buyer', 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'),
  ('test@baker.com', 'testbaker', 'password123', 'Test Baker', 'baker', 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1')
ON CONFLICT (email) DO NOTHING;

-- Make sure we have the cake flavors the code expects
INSERT INTO cake_flavors (name, color) VALUES
  ('vanilla', '#FFF8DC'),
  ('chocolate', '#8B4513'),
  ('strawberry', '#FFB6C1'),
  ('lemon', '#FFFACD'),
  ('red velvet', '#DC143C'),
  ('carrot', '#FF8C00')
ON CONFLICT (name) DO NOTHING;

-- Make sure we have the frosting types the code expects  
INSERT INTO frosting_types (name, default_color, color_customizable) VALUES
  ('american buttercream', '#FFFFFF', TRUE),
  ('italian buttercream', '#FFFEF7', TRUE),
  ('french buttercream', '#FFF8DC', TRUE),
  ('whipped cream', '#FFFAFA', TRUE),
  ('ganache', '#654321', FALSE),
  ('cream cheese frosting', '#F5F5DC', TRUE),
  ('swiss meringue', '#FFFEF7', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Make sure we have the topping types the code expects
INSERT INTO topping_types (name, icon) VALUES
  ('Fresh Berries', '🍓'),
  ('Chocolate Chips', '🍫'),
  ('Sprinkles', '✨'),
  ('Edible Flowers', '🌸'),
  ('Chocolate Drizzle', '🍯'),
  ('Caramel Sauce', '🍮'),
  ('Chopped Nuts', '🥜'),
  ('Candy Pieces', '🍬')
ON CONFLICT (name) DO NOTHING;