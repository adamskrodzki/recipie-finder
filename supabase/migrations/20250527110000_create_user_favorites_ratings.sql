-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_favorites table
CREATE TABLE public.user_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    -- Prevent duplicate favorites for same user/recipe combination
    UNIQUE(user_id, recipe_id)
);

-- Create user_ratings table  
CREATE TABLE public.user_ratings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    -- Prevent duplicate ratings for same user/recipe combination
    UNIQUE(user_id, recipe_id)
);

-- Add comments for documentation
COMMENT ON TABLE public.user_favorites IS 'Stores user favorite recipes with proper user association';
COMMENT ON TABLE public.user_ratings IS 'Stores user ratings for recipes (1-5 stars) with proper user association';
COMMENT ON COLUMN public.user_ratings.rating IS 'Rating value from 1 to 5 stars';

-- Create indexes for better performance
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_recipe_id ON public.user_favorites(recipe_id);
CREATE INDEX idx_user_favorites_created_at ON public.user_favorites(created_at DESC);

CREATE INDEX idx_user_ratings_user_id ON public.user_ratings(user_id);
CREATE INDEX idx_user_ratings_recipe_id ON public.user_ratings(recipe_id);
CREATE INDEX idx_user_ratings_rating ON public.user_ratings(rating);
CREATE INDEX idx_user_ratings_updated_at ON public.user_ratings(updated_at DESC);

-- Create updated_at trigger for user_ratings
CREATE TRIGGER update_user_ratings_updated_at
    BEFORE UPDATE ON public.user_ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for user_favorites table
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can only see their own favorites
CREATE POLICY "Users can view their own favorites"
    ON public.user_favorites
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only add their own favorites
CREATE POLICY "Users can insert their own favorites"
    ON public.user_favorites
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own favorites
CREATE POLICY "Users can delete their own favorites"
    ON public.user_favorites
    FOR DELETE
    USING (auth.uid() = user_id);

-- Service role can manage all favorites (for admin operations)
CREATE POLICY "Service role can manage all favorites"
    ON public.user_favorites
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- RLS Policies for user_ratings table
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own ratings
CREATE POLICY "Users can view their own ratings"
    ON public.user_ratings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only add their own ratings
CREATE POLICY "Users can insert their own ratings"
    ON public.user_ratings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own ratings
CREATE POLICY "Users can update their own ratings"
    ON public.user_ratings
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own ratings
CREATE POLICY "Users can delete their own ratings"
    ON public.user_ratings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Service role can manage all ratings (for admin operations)
CREATE POLICY "Service role can manage all ratings"
    ON public.user_ratings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant access to authenticated users
GRANT SELECT, INSERT, DELETE ON TABLE public.user_favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_ratings TO authenticated;

-- Grant full access to service role (for backend operations)
GRANT ALL ON TABLE public.user_favorites TO service_role;
GRANT ALL ON TABLE public.user_ratings TO service_role;

-- Create Supabase functions for encapsulated favorites operations
CREATE OR REPLACE FUNCTION public.toggle_favorite(recipe_uuid UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    is_favorited BOOLEAN;
    result jsonb;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not authenticated'
        );
    END IF;

    -- Check if recipe exists
    IF NOT EXISTS (SELECT 1 FROM public.recipes WHERE id = recipe_uuid) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Recipe not found'
        );
    END IF;

    -- Check if already favorited
    SELECT EXISTS (
        SELECT 1 FROM public.user_favorites 
        WHERE user_id = current_user_id AND recipe_id = recipe_uuid
    ) INTO is_favorited;

    IF is_favorited THEN
        -- Remove from favorites
        DELETE FROM public.user_favorites 
        WHERE user_id = current_user_id AND recipe_id = recipe_uuid;
        
        result := jsonb_build_object(
            'success', true,
            'is_favorite', false,
            'action', 'removed'
        );
    ELSE
        -- Add to favorites
        INSERT INTO public.user_favorites (user_id, recipe_id) 
        VALUES (current_user_id, recipe_uuid);
        
        result := jsonb_build_object(
            'success', true,
            'is_favorite', true,
            'action', 'added'
        );
    END IF;

    RETURN result;
END;
$$;

-- Create function to set/update recipe rating
CREATE OR REPLACE FUNCTION public.set_recipe_rating(recipe_uuid UUID, rating_value INTEGER)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    result jsonb;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not authenticated'
        );
    END IF;

    -- Validate rating value
    IF rating_value < 1 OR rating_value > 5 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Rating must be between 1 and 5'
        );
    END IF;

    -- Check if recipe exists
    IF NOT EXISTS (SELECT 1 FROM public.recipes WHERE id = recipe_uuid) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Recipe not found'
        );
    END IF;

    -- Upsert the rating
    INSERT INTO public.user_ratings (user_id, recipe_id, rating)
    VALUES (current_user_id, recipe_uuid, rating_value)
    ON CONFLICT (user_id, recipe_id)
    DO UPDATE SET 
        rating = rating_value,
        updated_at = now();

    RETURN jsonb_build_object(
        'success', true,
        'rating', rating_value
    );
END;
$$;

-- Create function to remove recipe rating
CREATE OR REPLACE FUNCTION public.remove_recipe_rating(recipe_uuid UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    result jsonb;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not authenticated'
        );
    END IF;

    -- Remove the rating
    DELETE FROM public.user_ratings 
    WHERE user_id = current_user_id AND recipe_id = recipe_uuid;

    RETURN jsonb_build_object(
        'success', true,
        'action', 'removed'
    );
END;
$$;

-- Create function to get user's favorites and ratings for multiple recipes
CREATE OR REPLACE FUNCTION public.get_user_recipe_preferences(recipe_uuids UUID[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    favorites_array UUID[];
    ratings_object jsonb;
    result jsonb;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not authenticated'
        );
    END IF;

    -- Get favorites
    SELECT ARRAY(
        SELECT recipe_id 
        FROM public.user_favorites 
        WHERE user_id = current_user_id 
        AND recipe_id = ANY(recipe_uuids)
    ) INTO favorites_array;

    -- Get ratings as JSON object
    SELECT jsonb_object_agg(recipe_id::text, rating)
    FROM public.user_ratings 
    WHERE user_id = current_user_id 
    AND recipe_id = ANY(recipe_uuids)
    INTO ratings_object;

    RETURN jsonb_build_object(
        'success', true,
        'favorites', COALESCE(favorites_array, ARRAY[]::UUID[]),
        'ratings', COALESCE(ratings_object, '{}'::jsonb)
    );
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.toggle_favorite(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_recipe_rating(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_recipe_rating(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_recipe_preferences(UUID[]) TO authenticated; 