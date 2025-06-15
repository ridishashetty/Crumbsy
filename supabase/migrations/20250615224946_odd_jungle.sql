-- Completely disable RLS temporarily to allow direct database operations
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE cake_designs DISABLE ROW LEVEL SECURITY;
ALTER TABLE cake_tiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Anyone can create user account" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Allow all operations on cake_designs" ON cake_designs;
DROP POLICY IF EXISTS "Allow all operations on cake_tiers" ON cake_tiers;
DROP POLICY IF EXISTS "Buyers can create orders" ON orders;
DROP POLICY IF EXISTS "Buyers can read own orders" ON orders;
DROP POLICY IF EXISTS "Buyers can update own orders" ON orders;
DROP POLICY IF EXISTS "Bakers can read assigned orders" ON orders;
DROP POLICY IF EXISTS "Bakers can read posted orders" ON orders;
DROP POLICY IF EXISTS "Bakers can update assigned orders" ON orders;
DROP POLICY IF EXISTS "Bakers can create quotes" ON quotes;
DROP POLICY IF EXISTS "Bakers can read own quotes" ON quotes;
DROP POLICY IF EXISTS "Bakers can update own quotes" ON quotes;
DROP POLICY IF EXISTS "Buyers can read quotes for own orders" ON quotes;
DROP POLICY IF EXISTS "Order participants can create messages" ON messages;
DROP POLICY IF EXISTS "Order participants can read messages" ON messages;
DROP POLICY IF EXISTS "Bakers can manage own portfolio" ON portfolio_items;
DROP POLICY IF EXISTS "Anyone can read portfolio items" ON portfolio_items;

-- For now, keep RLS disabled to allow all operations
-- This is temporary while we work on proper authentication integration

-- Note: In production, you would want to re-enable RLS with proper policies
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cake_designs ENABLE ROW LEVEL SECURITY;
-- etc.