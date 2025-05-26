-- Add the new pantry_ingredient_id column
ALTER TABLE public.user_pantry_items
ADD COLUMN pantry_ingredient_id UUID;

-- Populate pantry_ingredient_id by inserting distinct ingredient_names into pantry_ingredients
-- and then updating user_pantry_items with the corresponding IDs.
-- This requires a temporary relaxation of RLS if service_role is not used by migrations.
-- We assume migrations run with sufficient privileges (e.g., as postgres or supabase_admin).

-- Step 1: Insert distinct ingredient names into pantry_ingredients
INSERT INTO public.pantry_ingredients (name)
SELECT DISTINCT ingredient_name
FROM public.user_pantry_items
ON CONFLICT (name) DO NOTHING;

-- Step 2: Update user_pantry_items with the new foreign keys
UPDATE public.user_pantry_items upi
SET pantry_ingredient_id = (
    SELECT pi.id
    FROM public.pantry_ingredients pi
    WHERE pi.name = upi.ingredient_name
)
WHERE upi.pantry_ingredient_id IS NULL; -- Only update if not already set (e.g. if script is rerun)

-- Add a NOT NULL constraint to pantry_ingredient_id AFTER data migration
ALTER TABLE public.user_pantry_items
ALTER COLUMN pantry_ingredient_id SET NOT NULL;

-- Add the foreign key constraint
ALTER TABLE public.user_pantry_items
ADD CONSTRAINT fk_pantry_ingredient
FOREIGN KEY (pantry_ingredient_id)
REFERENCES public.pantry_ingredients(id)
ON DELETE RESTRICT; -- Or ON DELETE CASCADE if preferred, RESTRICT is safer initially.

-- Remove the old ingredient_name column
ALTER TABLE public.user_pantry_items
DROP COLUMN ingredient_name;

-- Update RLS policies and unique constraints if necessary.
-- The existing RLS policies on user_pantry_items should still function correctly as they are user_id based.
-- However, the unique constraint needs to be updated from (user_id, ingredient_name) to (user_id, pantry_ingredient_id).

-- First, drop the old unique constraint if it exists.
-- The name of the constraint might vary. Let's try to find it or use a placeholder.
-- Assuming the constraint was named: user_pantry_items_user_id_ingredient_name_key
-- Or more generally, it might be found via information_schema.
DO $$
DECLARE
    constraint_name_var TEXT;
BEGIN
    SELECT constraint_name INTO constraint_name_var
    FROM information_schema.table_constraints
    WHERE table_name = 'user_pantry_items'
      AND constraint_type = 'UNIQUE'
      AND table_schema = 'public'
      -- And it involves user_id and the old ingredient_name. This part is tricky to generalize.
      -- For now, we assume there's only one unique constraint we care about modifying,
      -- or we know its name.
      -- If the old constraint was (user_id, ingredient_name), it might be named 'user_pantry_items_user_id_ingredient_name_key'
      -- A more robust way is to inspect the existing migration '20250526150000_create_user_pantry_items_table.sql'
      -- From that migration: ALTER TABLE public.user_pantry_items ADD CONSTRAINT user_pantry_items_user_id_ingredient_name_key UNIQUE (user_id, ingredient_name);
      AND constraint_name = 'user_pantry_items_user_id_ingredient_name_key';

    IF constraint_name_var IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.user_pantry_items DROP CONSTRAINT ' || quote_ident(constraint_name_var);
    ELSE
        RAISE NOTICE 'Old unique constraint on (user_id, ingredient_name) not found or already dropped.';
    END IF;
END $$;


-- Add the new unique constraint
ALTER TABLE public.user_pantry_items
ADD CONSTRAINT user_pantry_items_user_id_pantry_ingredient_id_key
UNIQUE (user_id, pantry_ingredient_id);

-- Recreate or update RLS policies if they referenced ingredient_name directly.
-- The existing policies from 20250526150000_create_user_pantry_items_table.sql:
-- CREATE POLICY "Users can view their own pantry items" ON public.user_pantry_items FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert their own pantry items" ON public.user_pantry_items FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can update their own pantry items" ON public.user_pantry_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can delete their own pantry items" ON public.user_pantry_items FOR DELETE USING (auth.uid() = user_id);
-- These policies do not reference 'ingredient_name', so they should remain valid.

COMMENT ON COLUMN public.user_pantry_items.pantry_ingredient_id IS 'Foreign key to the pantry_ingredients table, linking to the canonical ingredient entry.';

-- Adjust RLS policies on user_pantry_items if they were tied to 'ingredient_name' (not the case here).
-- The RLS policies from the initial migration are based on `user_id` and `auth.uid()`,
-- so they don't need changes due to the `ingredient_name` column removal.

-- Ensure triggers are updated if they referenced `ingredient_name`.
-- The initial migration creates a trigger:
-- create trigger handle_updated_at before update on public.user_pantry_items ...
-- This trigger updates `updated_at` and does not depend on `ingredient_name`, so it's fine.

-- RAISE NOTICE 'Migration to use pantry_ingredient_id in user_pantry_items completed.'; 