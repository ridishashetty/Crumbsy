/*
  # Create Crumbsy Database Schema

  1. New Tables
    - `AccountType` - User account types (buyer, baker, admin)
    - `UserAccount` - User profile information
    - `LoginInfo` - User authentication credentials
    - `CakeFlavor` - Available cake flavors
    - `FrostingType` - Available frosting types
    - `FrostingFlavor` - Available frosting flavors
    - `ToppingType` - Available toppings
    - `CakeDesign` - User cake designs
    - `CakeTier` - Individual cake tiers
    - `CakeDesignTier` - Junction table linking designs to tiers
    - `Orders` - Customer orders

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Allow read access to reference tables (flavors, toppings, etc.)

  3. Default Data
    - Pre-populate reference tables with default options
*/

-- Create AccountType table first
CREATE TABLE IF NOT EXISTS "AccountType" (
  id_at bigint PRIMARY KEY,
  at_AccountType character varying
);

-- Create UserAccount table
CREATE TABLE IF NOT EXISTS "UserAccount" (
  id_ua bigint PRIMARY KEY,
  id_at bigint REFERENCES "AccountType"(id_at),
  ua_FullName character varying,
  ua_Email character varying UNIQUE,
  ua_ZipCode bigint,
  ua_FullAddress character varying,
  created_by bigint,
  created_at timestamp without time zone DEFAULT now()
);

-- Create LoginInfo table
CREATE TABLE IF NOT EXISTS "LoginInfo" (
  id_li bigint PRIMARY KEY,
  id_ua bigint REFERENCES "UserAccount"(id_ua),
  li_Username character varying UNIQUE,
  li_Password character varying,
  created_at timestamp without time zone DEFAULT now(),
  created_by bigint,
  updated_at timestamp without time zone,
  updated_by bigint
);

-- Create CakeFlavor table
CREATE TABLE IF NOT EXISTS "CakeFlavor" (
  id_cf bigint PRIMARY KEY,
  cf_CakeFlavor character varying,
  cf_Color json
);

-- Create FrostingType table
CREATE TABLE IF NOT EXISTS "FrostingType" (
  id_ft bigint PRIMARY KEY,
  ft_FrostingName character varying,
  ft_Color json,
  ff_ColorChangeAllowed boolean DEFAULT true
);

-- Create FrostingFlavor table
CREATE TABLE IF NOT EXISTS "FrostingFlavor" (
  id_ff bigint PRIMARY KEY,
  ff_FlavorName character varying
);

-- Create ToppingType table
CREATE TABLE IF NOT EXISTS "ToppingType" (
  id_tt bigint PRIMARY KEY,
  tt_ToppingName character varying,
  tt_Icon text
);

-- Create CakeDesign table
CREATE TABLE IF NOT EXISTS "CakeDesign" (
  id_cd bigint PRIMARY KEY,
  cd_Name text NOT NULL,
  id_ua bigint REFERENCES "UserAccount"(id_ua),
  cd_TextOnCake text,
  created_at timestamp without time zone DEFAULT now(),
  created_by bigint,
  updated_by bigint,
  updated_at timestamp without time zone DEFAULT now()
);

-- Create CakeTier table
CREATE TABLE IF NOT EXISTS "CakeTier" (
  id_ct bigint PRIMARY KEY,
  id_ua bigint REFERENCES "UserAccount"(id_ua),
  id_cf bigint REFERENCES "CakeFlavor"(id_cf),
  id_ft bigint REFERENCES "FrostingType"(id_ft),
  id_ff bigint REFERENCES "FrostingFlavor"(id_ff),
  ct_FrostingColor json,
  ct_CakeColor json,
  created_by bigint,
  created_at timestamp without time zone DEFAULT now(),
  updated_by bigint,
  updated_at timestamp without time zone DEFAULT now()
);

-- Create CakeDesignTier junction table
CREATE TABLE IF NOT EXISTS "CakeDesignTier" (
  id_cdt bigint PRIMARY KEY,
  id_cd bigint REFERENCES "CakeDesign"(id_cd),
  id_ct bigint REFERENCES "CakeTier"(id_ct),
  created_at timestamp without time zone DEFAULT now(),
  created_by bigint,
  cdt_deleted boolean DEFAULT false
);

-- Create Orders table
CREATE TABLE IF NOT EXISTS "Orders" (
  id_o bigint PRIMARY KEY,
  id_cd bigint REFERENCES "CakeDesign"(id_cd),
  baker_ua bigint REFERENCES "UserAccount"(id_ua)
);

-- Insert default account types FIRST
INSERT INTO "AccountType" (id_at, at_AccountType) VALUES 
(1, 'buyer'),
(2, 'baker'),
(3, 'admin')
ON CONFLICT (id_at) DO NOTHING;

-- Insert default cake flavors
INSERT INTO "CakeFlavor" (id_cf, cf_CakeFlavor, cf_Color) VALUES 
(1, 'vanilla', '{"color": "#FFF8DC"}'),
(2, 'chocolate', '{"color": "#8B4513"}'),
(3, 'strawberry', '{"color": "#FFB6C1"}'),
(4, 'lemon', '{"color": "#FFFACD"}'),
(5, 'red velvet', '{"color": "#DC143C"}'),
(6, 'carrot', '{"color": "#FF8C00"}')
ON CONFLICT (id_cf) DO NOTHING;

-- Insert default frosting types
INSERT INTO "FrostingType" (id_ft, ft_FrostingName, ft_Color, ff_ColorChangeAllowed) VALUES 
(1, 'american buttercream', '{"color": "#FFFFFF"}', true),
(2, 'italian buttercream', '{"color": "#FFFEF7"}', true),
(3, 'french buttercream', '{"color": "#FFF8DC"}', true),
(4, 'whipped cream', '{"color": "#FFFAFA"}', true),
(5, 'ganache', '{"color": "#654321"}', false),
(6, 'cream cheese frosting', '{"color": "#F5F5DC"}', true),
(7, 'swiss meringue', '{"color": "#FFFEF7"}', true)
ON CONFLICT (id_ft) DO NOTHING;

-- Insert default frosting flavors
INSERT INTO "FrostingFlavor" (id_ff, ff_FlavorName) VALUES 
(1, 'vanilla'),
(2, 'chocolate'),
(3, 'strawberry'),
(4, 'lemon'),
(5, 'mint'),
(6, 'coffee'),
(7, 'peanut butter')
ON CONFLICT (id_ff) DO NOTHING;

-- Insert default toppings
INSERT INTO "ToppingType" (id_tt, tt_ToppingName, tt_Icon) VALUES 
(1, 'fresh berries', '🍓'),
(2, 'chocolate chips', '🍫'),
(3, 'sprinkles', '✨'),
(4, 'edible flowers', '🌸'),
(5, 'chocolate drizzle', '🍯'),
(6, 'caramel sauce', '🍮'),
(7, 'chopped nuts', '🥜'),
(8, 'candy pieces', '🍬')
ON CONFLICT (id_tt) DO NOTHING;

-- Enable Row Level Security AFTER inserting data
ALTER TABLE "AccountType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoginInfo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CakeFlavor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FrostingType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FrostingFlavor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ToppingType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CakeDesign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CakeTier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CakeDesignTier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Orders" ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- AccountType policies (read-only for all authenticated users)
CREATE POLICY "Anyone can read account types"
  ON "AccountType"
  FOR SELECT
  TO authenticated
  USING (true);

-- UserAccount policies
CREATE POLICY "Users can read own account"
  ON "UserAccount"
  FOR SELECT
  TO authenticated
  USING (id_ua = (auth.jwt() ->> 'sub')::bigint);

CREATE POLICY "Users can update own account"
  ON "UserAccount"
  FOR UPDATE
  TO authenticated
  USING (id_ua = (auth.jwt() ->> 'sub')::bigint);

CREATE POLICY "Anyone can create account"
  ON "UserAccount"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- LoginInfo policies
CREATE POLICY "Users can read own login info"
  ON "LoginInfo"
  FOR SELECT
  TO authenticated
  USING (id_ua = (auth.jwt() ->> 'sub')::bigint);

CREATE POLICY "Users can update own login info"
  ON "LoginInfo"
  FOR UPDATE
  TO authenticated
  USING (id_ua = (auth.jwt() ->> 'sub')::bigint);

CREATE POLICY "Anyone can create login info"
  ON "LoginInfo"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Cake-related tables (read-only for all authenticated users)
CREATE POLICY "Anyone can read cake flavors"
  ON "CakeFlavor"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read frosting types"
  ON "FrostingType"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read frosting flavors"
  ON "FrostingFlavor"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read topping types"
  ON "ToppingType"
  FOR SELECT
  TO authenticated
  USING (true);

-- CakeDesign policies
CREATE POLICY "Users can read own designs"
  ON "CakeDesign"
  FOR SELECT
  TO authenticated
  USING (id_ua = (auth.jwt() ->> 'sub')::bigint);

CREATE POLICY "Users can create own designs"
  ON "CakeDesign"
  FOR INSERT
  TO authenticated
  WITH CHECK (id_ua = (auth.jwt() ->> 'sub')::bigint);

CREATE POLICY "Users can update own designs"
  ON "CakeDesign"
  FOR UPDATE
  TO authenticated
  USING (id_ua = (auth.jwt() ->> 'sub')::bigint);

CREATE POLICY "Users can delete own designs"
  ON "CakeDesign"
  FOR DELETE
  TO authenticated
  USING (id_ua = (auth.jwt() ->> 'sub')::bigint);

-- CakeTier policies
CREATE POLICY "Users can read own tiers"
  ON "CakeTier"
  FOR SELECT
  TO authenticated
  USING (id_ua = (auth.jwt() ->> 'sub')::bigint);

CREATE POLICY "Users can create own tiers"
  ON "CakeTier"
  FOR INSERT
  TO authenticated
  WITH CHECK (id_ua = (auth.jwt() ->> 'sub')::bigint);

CREATE POLICY "Users can update own tiers"
  ON "CakeTier"
  FOR UPDATE
  TO authenticated
  USING (id_ua = (auth.jwt() ->> 'sub')::bigint);

CREATE POLICY "Users can delete own tiers"
  ON "CakeTier"
  FOR DELETE
  TO authenticated
  USING (id_ua = (auth.jwt() ->> 'sub')::bigint);

-- CakeDesignTier policies
CREATE POLICY "Users can read own design tiers"
  ON "CakeDesignTier"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "CakeDesign" 
      WHERE "CakeDesign".id_cd = "CakeDesignTier".id_cd 
      AND "CakeDesign".id_ua = (auth.jwt() ->> 'sub')::bigint
    )
  );

CREATE POLICY "Users can create own design tiers"
  ON "CakeDesignTier"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "CakeDesign" 
      WHERE "CakeDesign".id_cd = "CakeDesignTier".id_cd 
      AND "CakeDesign".id_ua = (auth.jwt() ->> 'sub')::bigint
    )
  );

CREATE POLICY "Users can update own design tiers"
  ON "CakeDesignTier"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "CakeDesign" 
      WHERE "CakeDesign".id_cd = "CakeDesignTier".id_cd 
      AND "CakeDesign".id_ua = (auth.jwt() ->> 'sub')::bigint
    )
  );

-- Orders policies
CREATE POLICY "Users can read own orders"
  ON "Orders"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "CakeDesign" 
      WHERE "CakeDesign".id_cd = "Orders".id_cd 
      AND "CakeDesign".id_ua = (auth.jwt() ->> 'sub')::bigint
    ) OR baker_ua = (auth.jwt() ->> 'sub')::bigint
  );

CREATE POLICY "Users can create orders for own designs"
  ON "Orders"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "CakeDesign" 
      WHERE "CakeDesign".id_cd = "Orders".id_cd 
      AND "CakeDesign".id_ua = (auth.jwt() ->> 'sub')::bigint
    )
  );

CREATE POLICY "Users can update own orders"
  ON "Orders"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "CakeDesign" 
      WHERE "CakeDesign".id_cd = "Orders".id_cd 
      AND "CakeDesign".id_ua = (auth.jwt() ->> 'sub')::bigint
    ) OR baker_ua = (auth.jwt() ->> 'sub')::bigint
  );