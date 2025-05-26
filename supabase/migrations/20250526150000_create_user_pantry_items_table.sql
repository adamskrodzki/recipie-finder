-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_pantry_items table
CREATE TABLE public.user_pantry_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ingredient_name TEXT NOT NULL,
    added_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (user_id, ingredient_name)
);

COMMENT ON TABLE public.user_pantry_items IS 'Stores individual pantry ingredients for users, linked to their auth.users record.';

-- RLS Policies for user_pantry_items
ALTER TABLE public.user_pantry_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own pantry items" ON public.user_pantry_items;
CREATE POLICY "Users can manage their own pantry items"
    ON public.user_pantry_items
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can manage their own pantry items" ON public.user_pantry_items IS 'Ensures users can only CREATE, READ, UPDATE, and DELETE their own pantry items.';

-- Grant usage on schema public to anon and authenticated roles (if not already granted)
-- This is often needed for RLS to function correctly with auth.uid()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_namespace n
    JOIN pg_catalog.pg_roles r ON n.nspowner = r.oid
    WHERE n.nspname = 'public' AND r.rolname = 'postgres' -- Or appropriate owner
  ) THEN
    GRANT USAGE ON SCHEMA public TO anon;
    GRANT USAGE ON SCHEMA public TO authenticated;
  END IF;
END
$$;

-- Grant required permissions on the table to anon and authenticated roles
-- RLS policies will still control row access
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_pantry_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_pantry_items TO authenticated;

-- Note: The auth.users table is managed by Supabase Auth and doesn't need to be created in migrations.
-- We are referencing auth.users(id) for the user_id column. 