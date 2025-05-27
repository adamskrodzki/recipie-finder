import { supabase } from './supabaseClient';
import { ensureUserSession } from './authService';
import type { Recipe } from '../types/Recipe';
import type { PantryItem, CreatePantryItemRequest, UpdatePantryItemRequest } from '../types/Pantry';
import type { RecipeStorage } from './storage';

// Response types for Supabase functions
interface ToggleFavoriteResponse {
  success: boolean;
  is_favorite?: boolean;
  action?: 'added' | 'removed';
  error?: string;
}

interface SetRatingResponse {
  success: boolean;
  rating?: number;
  error?: string;
}

interface RemoveRatingResponse {
  success: boolean;
  action?: 'removed';
  error?: string;
}

interface GetPreferencesResponse {
  success: boolean;
  favorites?: string[];
  ratings?: Record<string, number>;
  error?: string;
}

// Supabase implementation of RecipeStorage
export class SupabaseRecipeStorage implements RecipeStorage {
  
  // Ensure user is authenticated before performing operations
  private async ensureAuth(): Promise<string | null> {
    console.log('=== ENSURE AUTH START ===');
    console.log('Calling ensureUserSession...');
    const session = await ensureUserSession();
    console.log('Session returned:', session);
    console.log('User ID:', session?.user?.id);
    console.log('User details:', session?.user);
    console.log('=== ENSURE AUTH END ===');
    return session?.user?.id || null;
  }

  // Favorites operations using Supabase functions
  async getFavorites(): Promise<string[]> {
    try {
      const userId = await this.ensureAuth();
      if (!userId) {
        console.warn('No authenticated user, returning empty favorites');
        return [];
      }

      const { data, error } = await supabase
        .from('user_favorites')
        .select('recipe_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching favorites:', error);
        return [];
      }

      return data?.map(item => item.recipe_id) || [];
    } catch (error) {
      console.error('Error in getFavorites:', error);
      return [];
    }
  }

  async addFavorite(recipeId: string): Promise<void> {
    console.log('=== SUPABASE STORAGE ADD FAVORITE START ===');
    console.log('Recipe ID:', recipeId);
    
    try {
      console.log('Ensuring authentication...');
      const userId = await this.ensureAuth();
      console.log('User ID from auth:', userId);
      
      if (!userId) {
        console.error('No user ID returned from ensureAuth');
        throw new Error('User not authenticated');
      }

      console.log('Calling Supabase RPC toggle_favorite with recipe_uuid:', recipeId);
      const { data, error } = await supabase.rpc('toggle_favorite', {
        recipe_uuid: recipeId
      });

      console.log('Supabase RPC response - data:', data);
      console.log('Supabase RPC response - error:', error);

      if (error) {
        console.error('Supabase RPC error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      const result = data as unknown as ToggleFavoriteResponse;
      console.log('Parsed result:', result);
      
      if (!result.success) {
        console.error('Function returned success: false, error:', result.error);
        throw new Error(result.error || 'Failed to add favorite');
      }

      console.log('Function executed successfully, action:', result.action);
      
      // If it was already favorited and got removed, add it back
      if (result.action === 'removed') {
        console.log('Recipe was already favorited and got removed, calling again to add it...');
        // Call again to add it
        await this.addFavorite(recipeId);
      }
    } catch (error) {
      console.error('Error in addFavorite:', error);
      throw error;
    }
    console.log('=== SUPABASE STORAGE ADD FAVORITE END ===');
  }

  async removeFavorite(recipeId: string): Promise<void> {
    try {
      const userId = await this.ensureAuth();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('toggle_favorite', {
        recipe_uuid: recipeId
      });

      if (error) {
        console.error('Error removing favorite:', error);
        throw error;
      }

             const result = data as unknown as ToggleFavoriteResponse;
       if (!result.success) {
         throw new Error(result.error || 'Failed to remove favorite');
       }

       // If it was not favorited and got added, remove it
       if (result.action === 'added') {
         // Call again to remove it
         await this.removeFavorite(recipeId);
       }
    } catch (error) {
      console.error('Error in removeFavorite:', error);
      throw error;
    }
  }

  async isFavorite(recipeId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.includes(recipeId);
    } catch (error) {
      console.error('Error in isFavorite:', error);
      return false;
    }
  }

  // Ratings operations using Supabase functions
  async getRating(recipeId: string): Promise<number | undefined> {
    try {
      const userId = await this.ensureAuth();
      if (!userId) {
        return undefined;
      }

      const { data, error } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('user_id', userId)
        .eq('recipe_id', recipeId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rating found
          return undefined;
        }
        console.error('Error fetching rating:', error);
        return undefined;
      }

      return data?.rating;
    } catch (error) {
      console.error('Error in getRating:', error);
      return undefined;
    }
  }

  async setRating(recipeId: string, rating: number): Promise<void> {
    try {
      const userId = await this.ensureAuth();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const { data, error } = await supabase.rpc('set_recipe_rating', {
        recipe_uuid: recipeId,
        rating_value: rating
      });

      if (error) {
        console.error('Error setting rating:', error);
        throw error;
      }

             const result = data as unknown as SetRatingResponse;
      if (!result.success) {
        throw new Error(result.error || 'Failed to set rating');
      }
    } catch (error) {
      console.error('Error in setRating:', error);
      throw error;
    }
  }

  async removeRating(recipeId: string): Promise<void> {
    try {
      const userId = await this.ensureAuth();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('remove_recipe_rating', {
        recipe_uuid: recipeId
      });

      if (error) {
        console.error('Error removing rating:', error);
        throw error;
      }

      const result = data as RemoveRatingResponse;
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove rating');
      }
    } catch (error) {
      console.error('Error in removeRating:', error);
      throw error;
    }
  }

  async getAllRatings(): Promise<Record<string, number>> {
    try {
      const userId = await this.ensureAuth();
      if (!userId) {
        return {};
      }

      const { data, error } = await supabase
        .from('user_ratings')
        .select('recipe_id, rating')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching all ratings:', error);
        return {};
      }

      const ratings: Record<string, number> = {};
      data?.forEach(item => {
        ratings[item.recipe_id] = item.rating;
      });

      return ratings;
    } catch (error) {
      console.error('Error in getAllRatings:', error);
      return {};
    }
  }

  // Bulk operation for efficiency
  async getFavoritesAndRatings(): Promise<{
    favorites: string[];
    ratings: Record<string, number>;
  }> {
    try {
      const [favorites, ratings] = await Promise.all([
        this.getFavorites(),
        this.getAllRatings()
      ]);

      return { favorites, ratings };
    } catch (error) {
      console.error('Error in getFavoritesAndRatings:', error);
      return { favorites: [], ratings: {} };
    }
  }

  // Recipe data operations (read from Supabase, but these are stored by backend)
  async saveRecipe(_recipe: Recipe): Promise<void> {
    // In the Supabase implementation, recipes are primarily stored by the backend
    // This method could store to a local cache or call the backend API
    console.warn('saveRecipe not implemented in Supabase storage - recipes are stored by backend');
  }

  async getRecipe(recipeId: string): Promise<Recipe | undefined> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return undefined; // Recipe not found
        }
        console.error('Error fetching recipe:', error);
        return undefined;
      }

      if (!data) return undefined;

      // Convert database row to Recipe format
      return {
        id: data.id,
        title: data.title,
        ingredients: data.ingredients,
        steps: data.steps,
        mealType: data.meal_type || 'any'
      };
    } catch (error) {
      console.error('Error in getRecipe:', error);
      return undefined;
    }
  }

  async getAllSavedRecipes(): Promise<Recipe[]> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all recipes:', error);
        return [];
      }

      return data?.map(row => ({
        id: row.id,
        title: row.title,
        ingredients: row.ingredients,
        steps: row.steps,
        mealType: row.meal_type || 'any'
      })) || [];
    } catch (error) {
      console.error('Error in getAllSavedRecipes:', error);
      return [];
    }
  }

  async getFavoriteRecipes(): Promise<Recipe[]> {
    try {
      const userId = await this.ensureAuth();
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          recipe_id,
          recipes (
            id,
            title,
            ingredients,
            steps,
            meal_type
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching favorite recipes:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.recipes.id,
        title: item.recipes.title,
        ingredients: item.recipes.ingredients,
        steps: item.recipes.steps,
        mealType: item.recipes.meal_type || 'any'
      })) || [];
    } catch (error) {
      console.error('Error in getFavoriteRecipes:', error);
      return [];
    }
  }

  // Pantry management operations (existing Supabase integration)
  async getPantryItems(): Promise<PantryItem[]> {
    try {
      const userId = await this.ensureAuth();
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('user_pantry_items')
        .select(`
          id,
          added_at,
          pantry_ingredients (
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Error fetching pantry items:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        name: item.pantry_ingredients.name,
        addedAt: new Date(item.added_at)
      })) || [];
    } catch (error) {
      console.error('Error in getPantryItems:', error);
      return [];
    }
  }

  async addPantryItem(item: CreatePantryItemRequest): Promise<PantryItem> {
    try {
      const userId = await this.ensureAuth();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // First, get or create the pantry ingredient
      let { data: ingredientData, error: ingredientError } = await supabase
        .from('pantry_ingredients')
        .select('id')
        .eq('name', item.name.trim())
        .single();

      if (ingredientError && ingredientError.code !== 'PGRST116') {
        throw ingredientError;
      }

      if (!ingredientData) {
        // Create new ingredient
        const { data: newIngredient, error: createError } = await supabase
          .from('pantry_ingredients')
          .insert({ name: item.name.trim() })
          .select()
          .single();

        if (createError) throw createError;
        ingredientData = newIngredient;
      }

      // Add to user's pantry
      const { data: pantryItem, error: pantryError } = await supabase
        .from('user_pantry_items')
        .insert({
          user_id: userId,
          pantry_ingredient_id: ingredientData.id
        })
        .select(`
          id,
          added_at,
          pantry_ingredients (
            id,
            name
          )
        `)
        .single();

      if (pantryError) throw pantryError;

      return {
        id: pantryItem.id,
        name: pantryItem.pantry_ingredients.name,
        addedAt: new Date(pantryItem.added_at)
      };
    } catch (error) {
      console.error('Error in addPantryItem:', error);
      throw error;
    }
  }

  async updatePantryItem(id: string, updates: UpdatePantryItemRequest): Promise<PantryItem> {
    try {
      const userId = await this.ensureAuth();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!updates.name) {
        throw new Error('Name is required for update');
      }

      // Get current pantry item
      const { data: currentItem, error: getCurrentError } = await supabase
        .from('user_pantry_items')
        .select(`
          id,
          pantry_ingredient_id,
          pantry_ingredients (
            name
          )
        `)
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (getCurrentError) throw getCurrentError;

      // Get or create the new ingredient
      let { data: ingredientData, error: ingredientError } = await supabase
        .from('pantry_ingredients')
        .select('id')
        .eq('name', updates.name.trim())
        .single();

      if (ingredientError && ingredientError.code !== 'PGRST116') {
        throw ingredientError;
      }

      if (!ingredientData) {
        // Create new ingredient
        const { data: newIngredient, error: createError } = await supabase
          .from('pantry_ingredients')
          .insert({ name: updates.name.trim() })
          .select()
          .single();

        if (createError) throw createError;
        ingredientData = newIngredient;
      }

      // Update the pantry item
      const { data: updatedItem, error: updateError } = await supabase
        .from('user_pantry_items')
        .update({ pantry_ingredient_id: ingredientData.id })
        .eq('id', id)
        .eq('user_id', userId)
        .select(`
          id,
          added_at,
          pantry_ingredients (
            id,
            name
          )
        `)
        .single();

      if (updateError) throw updateError;

      return {
        id: updatedItem.id,
        name: updatedItem.pantry_ingredients.name,
        addedAt: new Date(updatedItem.added_at)
      };
    } catch (error) {
      console.error('Error in updatePantryItem:', error);
      throw error;
    }
  }

  async removePantryItem(id: string): Promise<void> {
    try {
      const userId = await this.ensureAuth();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('user_pantry_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error in removePantryItem:', error);
      throw error;
    }
  }

  async getPantryItem(id: string): Promise<PantryItem | undefined> {
    try {
      const userId = await this.ensureAuth();
      if (!userId) {
        return undefined;
      }

      const { data, error } = await supabase
        .from('user_pantry_items')
        .select(`
          id,
          added_at,
          pantry_ingredients (
            id,
            name
          )
        `)
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return undefined;
        }
        throw error;
      }

      return {
        id: data.id,
        name: data.pantry_ingredients.name,
        addedAt: new Date(data.added_at)
      };
    } catch (error) {
      console.error('Error in getPantryItem:', error);
      return undefined;
    }
  }

  // Bulk operation using Supabase function for better performance
  async getUserRecipePreferences(recipeIds: string[]): Promise<{
    favorites: string[];
    ratings: Record<string, number>;
  }> {
    try {
      const userId = await this.ensureAuth();
      if (!userId || recipeIds.length === 0) {
        return { favorites: [], ratings: {} };
      }

      const { data, error } = await supabase.rpc('get_user_recipe_preferences', {
        recipe_uuids: recipeIds
      });

      if (error) {
        console.error('Error fetching user recipe preferences:', error);
        return { favorites: [], ratings: {} };
      }

      const result = data as GetPreferencesResponse;
      if (!result.success) {
        console.error('Function returned error:', result.error);
        return { favorites: [], ratings: {} };
      }

      return {
        favorites: result.favorites || [],
        ratings: result.ratings || {}
      };
    } catch (error) {
      console.error('Error in getUserRecipePreferences:', error);
      return { favorites: [], ratings: {} };
    }
  }
}

// Factory function to create Supabase storage instance
export const createSupabaseRecipeStorage = (): RecipeStorage => {
  return new SupabaseRecipeStorage();
}; 