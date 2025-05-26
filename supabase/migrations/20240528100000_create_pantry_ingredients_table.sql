CREATE TABLE public.pantry_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pantry_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select ingredients"
ON public.pantry_ingredients FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert new ingredients"
ON public.pantry_ingredients FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Service role can update ingredients"
ON public.pantry_ingredients FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "Service role can delete ingredients"
ON public.pantry_ingredients FOR DELETE
TO service_role
USING (true);

-- Grant usage on schema to postgres and anon key, supabase_admin for migrations
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant all privileges to supabase_admin for tables in public schema
GRANT ALL PRIVILEGES ON TABLE public.pantry_ingredients TO postgres, supabase_admin;
GRANT SELECT, INSERT ON TABLE public.pantry_ingredients TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.pantry_ingredients TO service_role;
