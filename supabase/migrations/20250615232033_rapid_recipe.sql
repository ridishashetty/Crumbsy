/*
  # Fix table permissions for anonymous access

  1. Security Changes
    - Grant SELECT permissions to anonymous role for cake_flavors table
    - Grant SELECT permissions to anonymous role for frosting_types table  
    - Grant SELECT permissions to anonymous role for topping_types table

  These tables contain static reference data that needs to be accessible to all users
  (including anonymous users) for the cake playground functionality to work properly.
*/

-- Grant SELECT permissions to anonymous role for reference tables
GRANT SELECT ON public.cake_flavors TO anon;
GRANT SELECT ON public.frosting_types TO anon;
GRANT SELECT ON public.topping_types TO anon;