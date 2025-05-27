import { supabaseAdmin } from '../supabaseClient';

// Response types for Supabase functions
interface FunctionResponse {
  success: boolean;
  error?: string;
  [key: string]: any;
}

/**
 * Toggle favorite status for a recipe using Supabase function
 */
export async function toggleRecipeFavorite(recipeId: string, userId: string): Promise<{
  success: boolean;
  is_favorite: boolean;
  action: 'added' | 'removed';
  error?: string;
}> {
  try {
    // Use service role to call the function on behalf of the user
    const { data, error } = await supabaseAdmin.rpc('toggle_favorite', {
      recipe_uuid: recipeId
    });

    if (error) {
      console.error('Error toggling recipe favorite:', error);
      throw error;
    }

    const result = data as FunctionResponse;
    if (!result.success) {
      throw new Error(result.error || 'Failed to toggle favorite');
    }

    return {
      success: true,
      is_favorite: result.is_favorite,
      action: result.action,
    };
  } catch (error) {
    console.error('Error in toggleRecipeFavorite:', error);
    return {
      success: false,
      is_favorite: false,
      action: 'removed',
      error: error instanceof Error ? error.message : 'Failed to toggle favorite'
    };
  }
}

/**
 * Set or update recipe rating using Supabase function
 */
export async function setRecipeRating(recipeId: string, rating: number, userId: string): Promise<{
  success: boolean;
  rating?: number;
  error?: string;
}> {
  try {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const { data, error } = await supabaseAdmin.rpc('set_recipe_rating', {
      recipe_uuid: recipeId,
      rating_value: rating
    });

    if (error) {
      console.error('Error setting recipe rating:', error);
      throw error;
    }

    const result = data as FunctionResponse;
    if (!result.success) {
      throw new Error(result.error || 'Failed to set rating');
    }

    return {
      success: true,
      rating: result.rating,
    };
  } catch (error) {
    console.error('Error in setRecipeRating:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set rating'
    };
  }
}

/**
 * Remove recipe rating using Supabase function
 */
export async function removeRecipeRating(recipeId: string, userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { data, error } = await supabaseAdmin.rpc('remove_recipe_rating', {
      recipe_uuid: recipeId
    });

    if (error) {
      console.error('Error removing recipe rating:', error);
      throw error;
    }

    const result = data as FunctionResponse;
    if (!result.success) {
      throw new Error(result.error || 'Failed to remove rating');
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error in removeRecipeRating:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove rating'
    };
  }
}

/**
 * Get user's favorites and ratings for multiple recipes using Supabase function
 */
export async function getUserRecipePreferences(recipeIds: string[], userId: string): Promise<{
  success: boolean;
  favorites: string[];
  ratings: Record<string, number>;
  error?: string;
}> {
  try {
    if (recipeIds.length === 0) {
      return {
        success: true,
        favorites: [],
        ratings: {},
      };
    }

    const { data, error } = await supabaseAdmin.rpc('get_user_recipe_preferences', {
      recipe_uuids: recipeIds
    });

    if (error) {
      console.error('Error getting user recipe preferences:', error);
      throw error;
    }

    const result = data as FunctionResponse;
    if (!result.success) {
      throw new Error(result.error || 'Failed to get user preferences');
    }

    return {
      success: true,
      favorites: result.favorites || [],
      ratings: result.ratings || {},
    };
  } catch (error) {
    console.error('Error in getUserRecipePreferences:', error);
    return {
      success: false,
      favorites: [],
      ratings: {},
      error: error instanceof Error ? error.message : 'Failed to get user preferences'
    };
  }
}

/**
 * Get all favorite recipes for a user
 */
export async function getUserFavoriteRecipes(userId: string): Promise<{
  success: boolean;
  recipes: Array<{
    id: string;
    title: string;
    ingredients: string[];
    steps: string[];
    meal_type: string;
    created_at: string;
  }>;
  error?: string;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .select(`
        recipe_id,
        recipes (
          id,
          title,
          ingredients,
          steps,
          meal_type,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user favorite recipes:', error);
      throw error;
    }

    const recipes = data?.map((item: any) => ({
      id: item.recipes.id,
      title: item.recipes.title,
      ingredients: item.recipes.ingredients,
      steps: item.recipes.steps,
      meal_type: item.recipes.meal_type,
      created_at: item.recipes.created_at,
    })) || [];

    return {
      success: true,
      recipes,
    };
  } catch (error) {
    console.error('Error in getUserFavoriteRecipes:', error);
    return {
      success: false,
      recipes: [],
      error: error instanceof Error ? error.message : 'Failed to get favorite recipes'
    };
  }
} 